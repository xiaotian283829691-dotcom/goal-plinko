/**
 * Football Data API configuration.
 *
 * Token is read from VITE_FOOTBALL_API_TOKEN env variable.
 * A development fallback is provided so the app works out of the box.
 */

export const FOOTBALL_API_TOKEN: string =
  import.meta.env.VITE_FOOTBALL_API_TOKEN ?? '7da112ec90974d08b35a925bcc81b71b';

export const FOOTBALL_API_BASE = 'https://api.football-data.org/v4';

export const FOOTBALL_COMPETITION = 'WC';

/** FIFA World Cup 2026 kick-off: June 11 2026 UTC */
export const WC_START_DATE = new Date('2026-06-11T00:00:00Z');
