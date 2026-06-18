import { describe, it, expect } from 'vitest';
import {
  createEstimateSchema,
  updateEstimateSchema,
  estimateItemSchema,
  bulkUpsertEstimateItemsSchema,
  compareEstimatesSchema,
  importEstimateRowSchema,
  importEstimateSchema,
} from '@/schemas/estimate';

describe('createEstimateSchema', () => {
  it('accepts valid input', () => {
    const result = createEstimateSchema.parse({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Dự toán ban đầu',
    });
    expect(result.name).toBe('Dự toán ban đầu');
  });

  it('rejects empty name', () => {
    expect(() =>
      createEstimateSchema.parse({
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        name: '',
      })
    ).toThrow();
  });

  it('rejects invalid UUID', () => {
    expect(() =>
      createEstimateSchema.parse({
        projectId: 'not-a-uuid',
        name: 'Test',
      })
    ).toThrow();
  });
});

describe('estimateItemSchema', () => {
  const validItem = {
    estimateId: '550e8400-e29b-41d4-a716-446655440000',
    code: 'VT.01',
    name: 'Xi măng PCB40',
    unit: 'bao',
    quantity: 100,
    unitPrice: 85000,
    costType: 'MATERIAL' as const,
    progressPct: 50,
    actualQuantity: 60,
  };

  it('accepts valid item', () => {
    const result = estimateItemSchema.parse(validItem);
    expect(result.amount).toBeUndefined(); // auto-calc on server
    expect(result.quantity).toBe(100);
    expect(result.costType).toBe('MATERIAL');
  });

  it('rejects negative quantity', () => {
    expect(() =>
      estimateItemSchema.parse({ ...validItem, quantity: -1 })
    ).toThrow();
  });

  it('rejects invalid costType', () => {
    expect(() =>
      estimateItemSchema.parse({ ...validItem, costType: 'INVALID' })
    ).toThrow();
  });

  it('rejects progressPct > 100', () => {
    expect(() =>
      estimateItemSchema.parse({ ...validItem, progressPct: 150 })
    ).toThrow();
  });

  it('accepts nullable fields', () => {
    const result = estimateItemSchema.parse({
      ...validItem,
      contractor: null,
      stageId: null,
      notes: null,
    });
    expect(result.contractor).toBeNull();
    expect(result.notes).toBeNull();
  });

  it('applies defaults', () => {
    const result = estimateItemSchema.parse({
      estimateId: '550e8400-e29b-41d4-a716-446655440000',
      code: 'VT.01',
      name: 'Test',
      unit: 'cái',
      quantity: 1,
      unitPrice: 1000,
      costType: 'OTHER' as const,
    });
    expect(result.progressPct).toBe(0);
    expect(result.actualQuantity).toBe(0);
    expect(result.sortOrder).toBe(0);
  });
});

describe('bulkUpsertEstimateItemsSchema', () => {
  it('accepts array of items', () => {
    const result = bulkUpsertEstimateItemsSchema.parse({
      estimateId: '550e8400-e29b-41d4-a716-446655440000',
      items: [
        {
          estimateId: '550e8400-e29b-41d4-a716-446655440000',
          code: 'A.01',
          name: 'Item 1',
          unit: 'cái',
          quantity: 10,
          unitPrice: 1000,
          costType: 'MATERIAL' as const,
        },
        {
          estimateId: '550e8400-e29b-41d4-a716-446655440000',
          code: 'A.02',
          name: 'Item 2',
          unit: 'cái',
          quantity: 20,
          unitPrice: 2000,
          costType: 'LABOR' as const,
        },
      ],
    });
    expect(result.items).toHaveLength(2);
  });

  it('rejects empty items array', () => {
    expect(() =>
      bulkUpsertEstimateItemsSchema.parse({
        estimateId: '550e8400-e29b-41d4-a716-446655440000',
        items: [],
      })
    ).toThrow();
  });
});

describe('importEstimateRowSchema', () => {
  it('coerces string numbers to numbers', () => {
    const result = importEstimateRowSchema.parse({
      code: 'VT.01',
      name: 'Test',
      unit: 'cái',
      quantity: '100',
      unitPrice: '50000',
      costType: 'MATERIAL',
    });
    expect(result.quantity).toBe(100);
    expect(result.unitPrice).toBe(50000);
  });

  it('provides defaults', () => {
    const result = importEstimateRowSchema.parse({
      code: 'VT.01',
      name: 'Test',
      unit: 'cái',
      quantity: 10,
      unitPrice: 5000,
      costType: 'LABOR',
    });
    expect(result.progressPct).toBe(0);
    expect(result.actualQuantity).toBe(0);
    expect(result.sortOrder).toBe(0);
  });
});

describe('compareEstimatesSchema', () => {
  it('accepts valid UUIDs', () => {
    const result = compareEstimatesSchema.parse({
      estimateId1: '550e8400-e29b-41d4-a716-446655440000',
      estimateId2: '550e8400-e29b-41d4-a716-446655440001',
    });
    expect(result.estimateId1).toBeDefined();
  });

  it('rejects missing fields', () => {
    expect(() =>
      compareEstimatesSchema.parse({ estimateId1: 'abc' })
    ).toThrow();
  });
});