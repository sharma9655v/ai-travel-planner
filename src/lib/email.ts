import nodemailer from 'nodemailer';
import type { TravelItinerary } from '@/types/itinerary';
import { createLogger } from '@/lib/logger';

const log = createLogger('email');

// ============================================================
// SMTP Transport — configured from environment variables
// ============================================================

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      'Email is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.'
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

// ============================================================
// HTML Email Template — renders the itinerary into a polished email
// ============================================================

function renderItineraryEmail(
  itinerary: TravelItinerary,
  destination: string
): string {
  const { tripSummary, dailyItinerary, restaurants, accommodations } = itinerary;

  // Day-by-day HTML blocks
  const daysHtml = dailyItinerary
    .map(
      (day) => `
      <div style="margin-bottom: 24px; padding: 20px; background: #13151C; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06);">
        <h3 style="color: #27F2FF; font-size: 16px; margin: 0 0 4px;">Day ${day.day}: ${day.title}</h3>
        <p style="color: #8B8FA3; font-size: 13px; margin: 0 0 16px;">${day.date} — ${day.summary}</p>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${day.activities
            .map(
              (act) => `
            <li style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04);">
              <div style="display: flex; gap: 8px; align-items: baseline;">
                <span style="color: #B16DFF; font-size: 13px; font-weight: 600; min-width: 50px;">${act.time}</span>
                <div>
                  <span style="color: #E8E9ED; font-weight: 600; font-size: 14px;">${act.name}</span>
                  <p style="color: #8B8FA3; font-size: 12px; margin: 4px 0 0;">${act.description}</p>
                  ${act.location ? `<p style="color: #6B6F82; font-size: 11px; margin: 2px 0 0;">📍 ${act.location}</p>` : ''}
                </div>
              </div>
            </li>`
            )
            .join('')}
        </ul>
      </div>`
    )
    .join('');

  // Accommodations block
  const accommodationsHtml =
    accommodations.length > 0
      ? `
    <h2 style="color: #E8E9ED; font-size: 18px; margin: 32px 0 16px;">🏨 Accommodations</h2>
    ${accommodations
      .map(
        (acc) => `
      <div style="padding: 12px 16px; background: #13151C; border-radius: 10px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.06);">
        <strong style="color: #E8E9ED;">${acc.name}</strong>
        <span style="color: #8B8FA3; font-size: 12px;"> — ${acc.type} ⭐ ${acc.rating}</span>
        <p style="color: #6B6F82; font-size: 12px; margin: 4px 0 0;">${acc.description}</p>
      </div>`
      )
      .join('')}`
      : '';

  // Restaurants block
  const restaurantsHtml =
    restaurants.length > 0
      ? `
    <h2 style="color: #E8E9ED; font-size: 18px; margin: 32px 0 16px;">🍽️ Recommended Restaurants</h2>
    ${restaurants
      .map(
        (r) => `
      <div style="padding: 12px 16px; background: #13151C; border-radius: 10px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.06);">
        <strong style="color: #E8E9ED;">${r.name}</strong>
        <span style="color: #8B8FA3; font-size: 12px;"> — ${r.cuisine} ${r.priceRange}</span>
        ${r.mustTry.length > 0 ? `<p style="color: #3DDC84; font-size: 12px; margin: 4px 0 0;">Must try: ${r.mustTry.join(', ')}</p>` : ''}
      </div>`
      )
      .join('')}`
      : '';

  // Travel tips
  const tipsHtml =
    itinerary.travelTips.length > 0
      ? `
    <h2 style="color: #E8E9ED; font-size: 18px; margin: 32px 0 16px;">💡 Travel Tips</h2>
    <ul style="padding-left: 20px;">
      ${itinerary.travelTips.map((tip) => `<li style="color: #8B8FA3; font-size: 13px; margin-bottom: 6px;">${tip}</li>`).join('')}
    </ul>`
      : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Travel Itinerary — ${destination}</title>
</head>
<body style="margin: 0; padding: 0; background: #090B10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 640px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; padding: 6px 16px; background: rgba(39, 242, 255, 0.08); border: 1px solid rgba(39, 242, 255, 0.15); border-radius: 100px; font-size: 12px; font-weight: 600; color: #27F2FF; margin-bottom: 16px;">
        ✨ AI-Generated Itinerary
      </div>
      <h1 style="color: #E8E9ED; font-size: 28px; margin: 0 0 8px;">Your Trip to ${destination}</h1>
      <p style="color: #8B8FA3; font-size: 14px; margin: 0;">
        ${tripSummary.startDate} → ${tripSummary.endDate} · ${tripSummary.totalDays} days · ${tripSummary.travelStyle}
      </p>
    </div>

    <!-- Trip Overview -->
    <div style="padding: 20px; background: linear-gradient(135deg, rgba(39, 242, 255, 0.06), rgba(177, 109, 255, 0.06)); border-radius: 12px; margin-bottom: 24px; border: 1px solid rgba(39, 242, 255, 0.12);">
      <h2 style="color: #27F2FF; font-size: 16px; margin: 0 0 8px;">Trip Overview</h2>
      <p style="color: #C0C2CC; font-size: 14px; margin: 0 0 12px; line-height: 1.6;">${tripSummary.coverDescription}</p>
      ${
        tripSummary.highlights.length > 0
          ? `<div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${tripSummary.highlights
                .map(
                  (h) =>
                    `<span style="display: inline-block; padding: 4px 10px; background: rgba(177, 109, 255, 0.1); border-radius: 100px; font-size: 11px; color: #B16DFF; font-weight: 600;">${h}</span>`
                )
                .join('')}
            </div>`
          : ''
      }
    </div>

    <!-- Daily Itinerary -->
    <h2 style="color: #E8E9ED; font-size: 18px; margin: 0 0 16px;">📅 Day-by-Day Itinerary</h2>
    ${daysHtml}

    ${accommodationsHtml}
    ${restaurantsHtml}
    ${tipsHtml}

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.06);">
      <p style="color: #6B6F82; font-size: 12px; margin: 0;">
        Generated by AI Travel Planner · Powered by AI
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================
// Send Itinerary Email
// ============================================================

export async function sendItineraryEmail(
  to: string,
  itinerary: TravelItinerary,
  destination: string
): Promise<void> {
  const startedAt = Date.now();
  log.info('email.send.start', { to: to.replace(/(.{2}).*(@.*)/, '$1***$2') });

  const transport = createTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@aitravelplanner.app';

  const html = renderItineraryEmail(itinerary, destination);

  await transport.sendMail({
    from,
    to,
    subject: `Your travel itinerary for ${destination}`,
    html,
  });

  log.info('email.send.end', { durationMs: Date.now() - startedAt });
}

// Check whether email is configured (used by the client to show/hide the button)
export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );
}
