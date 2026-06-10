import { expect, test } from 'vitest';
import { formatCurrency } from '../lib/utils';

function normalizeCurrencySpacing(value: string) {
  return value.replace(/\s/g, " ");
}

test('formatCurrency should return formatted VND string', () => {
  expect(normalizeCurrencySpacing(formatCurrency(1000000))).toBe('1.000.000 ₫');
  expect(normalizeCurrencySpacing(formatCurrency(0))).toBe('0 ₫');
});
