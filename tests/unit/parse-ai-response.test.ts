import { describe, expect, it } from 'vitest';
import { parseAIResponse } from '@/lib/ai/nvidia';

describe('parseAIResponse', () => {
  it('parses direct JSON', () => {
    expect(parseAIResponse('{"destination":"Tokyo"}')).toEqual({ destination: 'Tokyo' });
  });

  it('extracts JSON from json code fences', () => {
    const content = 'Here is your plan:\n```json\n{"destination":"Tokyo"}\n```\nEnjoy!';
    expect(parseAIResponse(content)).toEqual({ destination: 'Tokyo' });
  });

  it('extracts JSON from plain code fences', () => {
    const content = '```\n{"destination":"Tokyo"}\n```';
    expect(parseAIResponse(content)).toEqual({ destination: 'Tokyo' });
  });

  it('brace-matches through nested objects and strings', () => {
    const content = 'ok so {"items":[{"name":"a}b"},{"name":"c"}],"n":2} done';
    expect(parseAIResponse(content)).toEqual({ items: [{ name: 'a}b' }, { name: 'c' }], n: 2 });
  });

  it('extracts JSON from uppercase JSON code fences', () => {
    const content = '```JSON\n{"destination":"Tokyo"}\n```';
    expect(parseAIResponse(content)).toEqual({ destination: 'Tokyo' });
  });

  it('skips a malformed object and parses the next real object', () => {
    const content = '{"bad": } then {"destination":"Kyoto"}';
    expect(parseAIResponse(content)).toEqual({ destination: 'Kyoto' });
  });

  it('extracts the real object when prose contains a stray opening brace', () => {
    const content = 'The plan {is} here: {"destination":"Osaka"}';
    expect(parseAIResponse(content)).toEqual({ destination: 'Osaka' });
  });

  it('parses prose, fences, and trailing text after the JSON object', () => {
    const content = 'Sure thing!\n```json\n{"destination":"Nagoya"}\n```\nEnjoy your trip!';
    expect(parseAIResponse(content)).toEqual({ destination: 'Nagoya' });
  });

  it('throws for non-JSON output', () => {
    expect(() => parseAIResponse('Sorry, I could not generate a plan.')).toThrow(/invalid JSON/);
  });
});
