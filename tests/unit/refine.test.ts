import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mergePreserving, refineItinerary } from '@/lib/ai/refine';
import type { TravelItinerary } from '@/types/itinerary';
import { tokyoItinerary } from '../fixtures';

// Only the network call is mocked — the real merge logic runs.
vi.mock('@/lib/ai/nvidia', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai/nvidia')>();
  return { ...actual, callNvidiaChat: vi.fn() };
});

import { callNvidiaChat } from '@/lib/ai/nvidia';

const callNvidiaChatMock = vi.mocked(callNvidiaChat);

describe('mergePreserving', () => {
  it('restores sections the candidate omitted', () => {
    const dropped = { ...tokyoItinerary } as Partial<TravelItinerary>;
    delete dropped.restaurants;
    const merged = mergePreserving(tokyoItinerary, dropped as unknown as Record<string, unknown>);
    expect(merged.restaurants).toEqual(tokyoItinerary.restaurants);
  });

  it('restores malformed sections', () => {
    const candidate = {
      ...tokyoItinerary,
      restaurants: 'oops',
      tripSummary: 'oops',
      budgetBreakdown: null,
    } as unknown as Record<string, unknown>;
    const merged = mergePreserving(tokyoItinerary, candidate);
    expect(merged.restaurants).toEqual(tokyoItinerary.restaurants);
    expect(merged.tripSummary).toEqual(tokyoItinerary.tripSummary);
    expect(merged.budgetBreakdown).toEqual(tokyoItinerary.budgetBreakdown);
  });

  it('re-appends dropped days in original order', () => {
    const candidate = { ...tokyoItinerary, dailyItinerary: [tokyoItinerary.dailyItinerary[0]] };
    const merged = mergePreserving(tokyoItinerary, candidate);
    expect(merged.dailyItinerary.map((d) => d.day)).toEqual([1, 2]);
    expect(merged.dailyItinerary[1].title).toBe(tokyoItinerary.dailyItinerary[1].title);
  });

  it('keeps original day order even if the candidate reorders', () => {
    const [day1, day2] = tokyoItinerary.dailyItinerary;
    const candidate = { ...tokyoItinerary, dailyItinerary: [day2, day1] };
    const merged = mergePreserving(tokyoItinerary, candidate);
    expect(merged.dailyItinerary.map((d) => d.day)).toEqual([1, 2]);
  });

  it('applies real edits from the candidate', () => {
    const edited: TravelItinerary = {
      ...tokyoItinerary,
      dailyItinerary: [
        { ...tokyoItinerary.dailyItinerary[0], title: 'Edited arrival day' },
        tokyoItinerary.dailyItinerary[1],
      ],
    };
    const merged = mergePreserving(tokyoItinerary, edited as unknown as Record<string, unknown>);
    expect(merged.dailyItinerary[0].title).toBe('Edited arrival day');
  });

  it('ignores brand-new days the candidate invented', () => {
    const candidate = {
      ...tokyoItinerary,
      dailyItinerary: [
        ...tokyoItinerary.dailyItinerary,
        { day: 99, date: '2026-10-09', title: 'Invented', summary: '', activities: [], totalCost: 0 },
      ],
    };
    const merged = mergePreserving(tokyoItinerary, candidate);
    expect(merged.dailyItinerary.map((d) => d.day)).toEqual([1, 2]);
  });
});

describe('refineItinerary', () => {
  beforeEach(() => callNvidiaChatMock.mockReset());

  it('parses the wrapper, applies edits and reports changes', async () => {
    const edited: TravelItinerary = {
      ...tokyoItinerary,
      dailyItinerary: [
        tokyoItinerary.dailyItinerary[0],
        { ...tokyoItinerary.dailyItinerary[1], title: 'Museum Day' },
      ],
    };
    callNvidiaChatMock.mockResolvedValue(
      JSON.stringify({ summary: 'Day 2 updated.', itinerary: edited })
    );

    const result = await refineItinerary(tokyoItinerary, 'Replace Day 2');
    expect(result.summary).toBe('Day 2 updated.');
    expect(result.changed).toBe(true);
    expect(result.itinerary.dailyItinerary[1].title).toBe('Museum Day');
    expect(result.itinerary.dailyItinerary).toHaveLength(2);
  });

  it('tolerates a bare itinerary without a wrapper', async () => {
    callNvidiaChatMock.mockResolvedValue(JSON.stringify(tokyoItinerary));
    const result = await refineItinerary(tokyoItinerary, 'No changes please');
    expect(result.changed).toBe(false);
    expect(result.summary).toBe('Your itinerary has been updated.');
  });

  it('keeps the default summary for a bare object response', async () => {
    callNvidiaChatMock.mockResolvedValue(JSON.stringify({ summary: 'All good!' }));
    const result = await refineItinerary(tokyoItinerary, 'Whatever');
    expect(result.summary).toBe('Your itinerary has been updated.');
    expect(result.changed).toBe(false);
  });

  it('throws when the response is not an itinerary object', async () => {
    callNvidiaChatMock.mockResolvedValue(JSON.stringify([1, 2, 3]));
    await expect(refineItinerary(tokyoItinerary, 'Whatever')).rejects.toThrow(/did not contain/);
  });
});
