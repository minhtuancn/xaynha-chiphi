import { z } from 'zod';

export const EstimateStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']);
export type EstimateStatus = z.infer<typeof EstimateStatusEnum>;

export const CostTypeEnum = z.enum(['MATERIAL', 'LABOR', 'EQUIPMENT', 'SUBCONTRACT', 'OTHER']);
export type CostType = z.infer<typeof CostTypeEnum>;

export const createEstimateSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1, 'Tên dự toán không được để trống').max(200),
});
export type CreateEstimateInput = z.infer<typeof createEstimateSchema>;

export const updateEstimateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  notes: z.string().optional(),
  status: EstimateStatusEnum.optional(),
});
export type UpdateEstimateInput = z.infer<typeof updateEstimateSchema>;

export const estimateItemSchema = z.object({
  id: z.string().uuid().optional(),
  estimateId: z.string().uuid(),
  stageId: z.string().uuid().nullable().optional(),
  code: z.string().min(1, 'Mã CP không được để trống').max(50),
  name: z.string().min(1, 'Tên hạng mục không được để trống').max(500),
  unit: z.string().min(1, 'Đơn vị không được để trống').max(20),
  quantity: z.number().nonnegative('Khối lượng phải >= 0'),
  unitPrice: z.number().nonnegative('Đơn giá phải >= 0'),
  amount: z.number().nonnegative().optional(),
  costType: CostTypeEnum,
  contractor: z.string().max(200).optional().nullable(),
  progressPct: z.number().int().min(0).max(100).default(0),
  actualQuantity: z.number().nonnegative().default(0),
  notes: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
});
export type EstimateItemInput = z.infer<typeof estimateItemSchema>;

export const bulkUpsertEstimateItemsSchema = z.object({
  estimateId: z.string().uuid(),
  items: z.array(estimateItemSchema).min(1, 'Phải có ít nhất 1 dòng'),
});
export type BulkUpsertEstimateItemsInput = z.infer<typeof bulkUpsertEstimateItemsSchema>;

export const compareEstimatesSchema = z.object({
  estimateId1: z.string().uuid(),
  estimateId2: z.string().uuid(),
});
export type CompareEstimatesInput = z.infer<typeof compareEstimatesSchema>;

export const importEstimateRowSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().min(1),
  quantity: z.coerce.number().nonnegative(),
  unitPrice: z.coerce.number().nonnegative(),
  costType: CostTypeEnum,
  contractor: z.string().optional(),
  stageId: z.string().uuid().optional(),
  progressPct: z.coerce.number().int().min(0).max(100).default(0),
  actualQuantity: z.coerce.number().nonnegative().default(0),
  notes: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
});
export type ImportEstimateRow = z.infer<typeof importEstimateRowSchema>;

export const importEstimateSchema = z.object({
  estimateId: z.string().uuid(),
  rows: z.array(importEstimateRowSchema).min(1),
});
export type ImportEstimateInput = z.infer<typeof importEstimateSchema>;

export const estimateDiffSchema = z.object({
  code: z.string(),
  name: z.string(),
  unit: z.string(),
  quantity1: z.number().nullable(),
  quantity2: z.number().nullable(),
  unitPrice1: z.number().nullable(),
  unitPrice2: z.number().nullable(),
  amount1: z.number().nullable(),
  amount2: z.number().nullable(),
  costType1: CostTypeEnum.nullable(),
  costType2: CostTypeEnum.nullable(),
  contractor1: z.string().nullable(),
  contractor2: z.string().nullable(),
  stageId1: z.string().nullable(),
  stageId2: z.string().nullable(),
  progressPct1: z.number().nullable(),
  progressPct2: z.number().nullable(),
  actualQuantity1: z.number().nullable(),
  actualQuantity2: z.number().nullable(),
  diffType: z.enum(['SAME', 'CHANGED', 'ADDED', 'REMOVED']),
});
export type EstimateDiff = z.infer<typeof estimateDiffSchema>;

export const compareResultSchema = z.object({
  estimate1: z.object({
    id: z.string().uuid(),
    version: z.number().int(),
    name: z.string(),
    totalAmount: z.number(),
  }),
  estimate2: z.object({
    id: z.string().uuid(),
    version: z.number().int(),
    name: z.string(),
    totalAmount: z.number(),
  }),
  diffs: z.array(estimateDiffSchema),
  summary: z.object({
    totalAdded: z.number().int(),
    totalRemoved: z.number().int(),
    totalChanged: z.number().int(),
    amountDiff: z.number(),
  }),
});
export type CompareResult = z.infer<typeof compareResultSchema>;

export const syncProgressResultSchema = z.object({
  updated: z.number().int(),
  errors: z.array(z.string()),
});
export type SyncProgressResult = z.infer<typeof syncProgressResultSchema>;

export const exportEstimateSchema = z.object({
  estimateId: z.string().uuid(),
  format: z.enum(['csv', 'pdf', 'excel']),
  groupBy: z.enum(['stage', 'costType', 'none']).default('stage'),
});
export type ExportEstimateInput = z.infer<typeof exportEstimateSchema>;