/**
 * Formats a bigint amount as USD currency
 * @param amount - The amount in USD (as bigint)
 * @returns Formatted string like "$5.00"
 */
export function formatUSD(amount: bigint | number): string {
  const numAmount = typeof amount === 'bigint' ? Number(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

/**
 * Converts a number to bigint for backend operations
 * @param amount - The amount as a number
 * @returns The amount as bigint
 */
export function toBigInt(amount: number): bigint {
  return BigInt(Math.floor(amount));
}
