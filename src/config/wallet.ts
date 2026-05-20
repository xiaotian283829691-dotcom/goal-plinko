export const DEVELOPER_WALLET = 'UQAfc4xcbADaxg3m7Sy1uDyYjn9cULCqI-JI8ayQurJ9gx9A';

const NANOTON_PER_TON = 1_000_000_000;

export const TIP_OPTIONS = [
  { label: '0.5 TON', amount: 0.5 },
  { label: '1 TON', amount: 1 },
  { label: '5 TON', amount: 5 },
] as const;

/**
 * Generate a Tonkeeper deep link for tipping.
 * Falls back to ton:// protocol for native wallet apps.
 */
export function getTipUrl(
  amountTON: number,
  message = 'GoalPlinko Tip',
): { tonkeeper: string; native: string } {
  const nanoton = Math.round(amountTON * NANOTON_PER_TON);
  const encodedMsg = encodeURIComponent(message);

  const params = `amount=${nanoton}&text=${encodedMsg}`;

  return {
    tonkeeper: `https://app.tonkeeper.com/transfer/${DEVELOPER_WALLET}?${params}`,
    native: `ton://transfer/${DEVELOPER_WALLET}?${params}`,
  };
}
