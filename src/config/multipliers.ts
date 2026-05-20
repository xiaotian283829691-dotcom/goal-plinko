/**
 * Multiplier tables for Plinko game.
 *
 * Values are symmetric (same from left and right edges toward center).
 * Calibrated using binomial distribution probabilities so expected return ~ 95% (5% house edge).
 *
 * Each row count has rowCount+1 bins (slots).
 */

export type RiskLevel = 'low' | 'medium' | 'high';
export type RowCount = 8 | 12 | 16;

export const ROW_OPTIONS: RowCount[] = [8, 12, 16];
export const RISK_LEVELS: RiskLevel[] = ['low', 'medium', 'high'];
export const BET_OPTIONS = [0.05, 0.1, 0.5, 1.0];

/**
 * Multiplier payouts indexed by [rowCount][riskLevel].
 * Array length = rowCount + 1 bins, symmetric.
 *
 * Source: Stake.com / industry-standard Plinko tables, validated against
 * binomial distribution to ensure ~95% expected return.
 */
export const MULTIPLIERS: Record<RowCount, Record<RiskLevel, number[]>> = {
  8: {
    low:    [5.6, 2.1, 1.1, 0.9, 0.5, 0.9, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.1, 0.7, 0.4, 0.7, 1.1, 3, 13],
    high:   [29, 4, 1.3, 0.3, 0.2, 0.3, 1.3, 4, 29],
  },
  12: {
    low:    [10, 3, 1.8, 1.3, 1.1, 0.9, 0.5, 0.9, 1.1, 1.3, 1.8, 3, 10],
    medium: [33, 11, 3.8, 1.9, 1, 0.6, 0.3, 0.6, 1, 1.9, 3.8, 11, 33],
    high:   [170, 24, 7.7, 1.9, 0.6, 0.2, 0.2, 0.2, 0.6, 1.9, 7.7, 24, 170],
  },
  16: {
    low:    [15, 8.5, 1.9, 1.3, 1.3, 1.1, 1.1, 1, 0.4, 1, 1.1, 1.1, 1.3, 1.3, 1.9, 8.5, 15],
    medium: [105, 39, 9.5, 4.8, 2.8, 1.4, 1, 0.5, 0.2, 0.5, 1, 1.4, 2.8, 4.8, 9.5, 39, 105],
    high:   [950, 120, 25, 8.5, 3.8, 1.9, 0.2, 0.2, 0.2, 0.2, 0.2, 1.9, 3.8, 8.5, 25, 120, 950],
  },
};

/**
 * Get the color for a multiplier value.
 */
export function getMultiplierColor(value: number): string {
  if (value >= 10) return '#ff003f';   // red - jackpot
  if (value >= 5) return '#ff4d00';    // orange
  if (value >= 2) return '#ffaa00';    // gold
  if (value >= 1) return '#44cc44';    // green - break even or better
  if (value >= 0.5) return '#888888';  // gray
  return '#666666';                     // dark gray - loss
}

/**
 * Get slot background colors for a given row/risk config.
 * Returns array of CSS color strings, one per bin.
 */
export function getSlotColors(rows: RowCount, risk: RiskLevel): string[] {
  const mults = MULTIPLIERS[rows][risk];
  return mults.map(getMultiplierColor);
}
