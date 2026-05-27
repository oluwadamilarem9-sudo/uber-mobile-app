/** Static demo FX rates from USD (fixed — prices do not randomly change). */
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rateFromUsd: 1 },
  { code: 'EUR', symbol: '€', name: 'Euro', rateFromUsd: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rateFromUsd: 0.79 },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rateFromUsd: 1550 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rateFromUsd: 1.36 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateFromUsd: 1.52 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateFromUsd: 83.2 },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

export function getCurrency(code: string) {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

/** Convert a USD amount to the selected currency (2 decimal places for most). */
export function convertFromUsd(amountUsd: number, currencyCode: string): number {
  const c = getCurrency(currencyCode);
  const raw = amountUsd * c.rateFromUsd;
  if (c.code === 'NGN' || c.code === 'INR') {
    return Math.round(raw);
  }
  return Math.round(raw * 100) / 100;
}

export function formatMoney(amountUsd: number, currencyCode: string): string {
  const c = getCurrency(currencyCode);
  const value = convertFromUsd(amountUsd, currencyCode);
  if (c.code === 'NGN' || c.code === 'INR') {
    return `${c.symbol}${value.toLocaleString()}`;
  }
  return `${c.symbol}${value.toFixed(2)}`;
}
