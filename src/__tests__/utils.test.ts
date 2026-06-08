import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../lib/utils';

describe('formatCurrency', () => {
  it('formats number correctly to VND', () => {
    const value = 1500000;
    const formatted = formatCurrency(value);
    expect(formatted).toContain('1.500.000');
    expect(formatted).toContain('₫');
  });
});