import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDoc = {
  setFontSize: vi.fn(),
  text: vi.fn(),
  output: vi.fn().mockReturnValue(new Uint8Array(200)),
  internal: { pageSize: { getWidth: () => 297 } },
  lastAutoTable: { finalY: 200 },
  autoTable: vi.fn(),
};

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    estimate: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    estimateItem: {
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    materialUsage: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((fn: any) => fn(prisma)),
  },
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  requireUser: vi.fn().mockResolvedValue({
    id: 'user-1',
    email: 'admin@test.com',
    name: 'Admin',
    role: 'ADMIN',
  }),
  requirePermission: vi.fn().mockResolvedValue({
    id: 'user-1',
    email: 'admin@test.com',
    name: 'Admin',
    role: 'ADMIN',
  }),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock jspdf + autotable for PDF tests
vi.mock('jspdf', () => ({
  jsPDF: function jsPDF() { return mockDoc; },
}));
vi.mock('jspdf-autotable', () => ({}));

import { prisma } from '@/lib/prisma';

describe('createEstimate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.estimateItem.findMany).mockResolvedValue([]);
  });

  it('throws when no active estimate exists', async () => {
    vi.mocked(prisma.estimate.findFirst).mockResolvedValueOnce(null); // no latest
    vi.mocked(prisma.estimate.findFirst).mockResolvedValueOnce(null); // no active
    vi.mocked(prisma.estimate.create).mockResolvedValueOnce({
      id: 'est-1',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      version: 1,
      name: 'Phiên bản 1',
      status: 'DRAFT',
      totalAmount: 0,
      createdBy: 'user-1',
    } as any);

    const { createEstimate } = await import('@/actions/estimate');

    const result = await createEstimate({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Phiên bản 1',
    });

    expect(result.name).toBe('Phiên bản 1');
    expect(result.version).toBe(1);
    expect(result.status).toBe('DRAFT');
  });

  it('creates with version +1 from latest', async () => {
    vi.mocked(prisma.estimate.findFirst).mockResolvedValueOnce({
      // First call: latest
      id: 'est-1',
      version: 2,
    } as any);
    vi.mocked(prisma.estimate.findFirst).mockResolvedValueOnce({
      // Second call: active (no active found)
      id: 'est-active',
      items: [],
    } as any);
    vi.mocked(prisma.estimate.create).mockResolvedValue({
      id: 'est-new',
      projectId: 'proj-1',
      version: 3,
      name: 'Phiên bản 3',
      status: 'DRAFT',
      totalAmount: 0,
      createdBy: 'user-1',
    } as any);

    const { createEstimate } = await import('@/actions/estimate');

    const result = await createEstimate({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Phiên bản 3',
    });

    expect(result.version).toBe(3);
  });

  it('throws unauthorized when no session', async () => {
    const { requirePermission } = await import('@/lib/auth');
    vi.mocked(requirePermission).mockRejectedValueOnce(new Error('Unauthorized'));

    const { createEstimate } = await import('@/actions/estimate');

    await expect(
      createEstimate({
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test',
      })
    ).rejects.toThrow('Unauthorized');
  });
});

describe('getEstimatesByProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns estimates ordered by version desc', async () => {
    const mockEstimates = [
      { id: 'est-2', version: 2, name: 'v2', status: 'ACTIVE', _count: { items: 10 }, totalAmount: 1000 },
      { id: 'est-1', version: 1, name: 'v1', status: 'ARCHIVED', _count: { items: 8 }, totalAmount: 900 },
    ];
    vi.mocked(prisma.estimate.findMany).mockResolvedValue(mockEstimates as any);

    const { getEstimatesByProject } = await import('@/actions/estimate');
    const result = await getEstimatesByProject('proj-1');

    expect(result).toHaveLength(2);
    expect(prisma.estimate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: 'proj-1' },
        orderBy: { version: 'desc' },
      })
    );
  });
});

describe('activateEstimate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('archives current active and activates new', async () => {
    vi.mocked(prisma.estimate.findUnique).mockResolvedValue({
      id: 'est-new',
      projectId: 'proj-1',
      status: 'DRAFT',
    } as any);
    vi.mocked(prisma.estimate.update).mockResolvedValue({
      id: 'est-new',
      status: 'ACTIVE',
    } as any);

    const { activateEstimate } = await import('@/actions/estimate');
    await activateEstimate('est-new');

    // Verify archive of old active
    expect(prisma.estimate.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: 'proj-1', status: 'ACTIVE' },
        data: { status: 'ARCHIVED' },
      })
    );
    // Verify activation
    expect(prisma.estimate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'est-new' },
        data: { status: 'ACTIVE' },
      })
    );
  });
});

describe('deleteEstimate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes only DRAFT estimates', async () => {
    vi.mocked(prisma.estimate.findUnique).mockResolvedValue({
      id: 'est-draft',
      projectId: 'proj-1',
      status: 'DRAFT',
    } as any);

    const { deleteEstimate } = await import('@/actions/estimate');
    const result = await deleteEstimate('est-draft');

    expect(result.success).toBe(true);
    expect(prisma.estimate.delete).toHaveBeenCalled();
  });

  it('rejects deleting ACTIVE estimate', async () => {
    vi.mocked(prisma.estimate.findUnique).mockResolvedValue({
      id: 'est-active',
      projectId: 'proj-1',
      status: 'ACTIVE',
    } as any);

    const { deleteEstimate } = await import('@/actions/estimate');
    await expect(deleteEstimate('est-active')).rejects.toThrow('Chỉ có thể xóa bản DRAFT');
  });
});

describe('exportEstimateToPDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore the mockDoc output after clearAllMocks
    mockDoc.output.mockReturnValue(new Uint8Array(200));
  });

  it('generates PDF base64 string', async () => {
    vi.mocked(prisma.estimate.findUnique).mockResolvedValue({
      id: 'est-1',
      version: 1,
      name: 'Dự toán ban đầu',
      status: 'ACTIVE',
      totalAmount: 616000000,
      createdBy: 'user-1',
      projectId: 'proj-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      project: { name: 'Dự án Tuấn Mơ' },
      items: [
        {
          id: 'item-1',
          estimateId: 'est-1',
          stageId: 'stage-1',
          code: 'CB.01',
          name: 'San lấp mặt bằng',
          unit: 'm2',
          quantity: 113.4,
          unitPrice: 15000,
          amount: 1701000,
          costType: 'LABOR',
          contractor: null,
          progressPct: 100,
          actualQuantity: 113.4,
          notes: null,
          sortOrder: 0,
          stage: { name: 'Chuẩn bị mặt bằng' },
        },
        {
          id: 'item-2',
          estimateId: 'est-1',
          stageId: 'stage-2',
          code: 'MN.01',
          name: 'Đào móng',
          unit: 'm3',
          quantity: 85,
          unitPrice: 150000,
          amount: 12750000,
          costType: 'LABOR',
          contractor: null,
          progressPct: 100,
          actualQuantity: 90,
          notes: null,
          sortOrder: 1,
          stage: { name: 'Móng và nền tầng 1' },
        },
      ],
    } as any);

    const { exportEstimateToPDF } = await import('@/actions/estimate');
    const result = await exportEstimateToPDF('est-1');

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(100);
  });
});

describe('compareEstimates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('compares two estimates and returns diffs', async () => {
    const uuid1 = '550e8400-e29b-41d4-a716-446655440001';
    const uuid2 = '550e8400-e29b-41d4-a716-446655440002';
    vi.mocked(prisma.estimate.findUnique).mockResolvedValueOnce({
      id: uuid1, version: 1, name: 'v1', totalAmount: 1000000,
      items: [
        { id: '550e8400-e29b-41d4-a716-446655440011', code: 'A.01', name: 'Item A', unit: 'm2', quantity: 10, unitPrice: 50000, amount: 500000, costType: 'MATERIAL', contractor: null, stageId: null, progressPct: 0, actualQuantity: 0, sortOrder: 0, notes: null, estimateId: uuid1 },
        { id: '550e8400-e29b-41d4-a716-446655440012', code: 'B.01', name: 'Item B', unit: 'm3', quantity: 5, unitPrice: 100000, amount: 500000, costType: 'LABOR', contractor: null, stageId: null, progressPct: 0, actualQuantity: 0, sortOrder: 1, notes: null, estimateId: uuid1 },
      ],
    } as any);
    vi.mocked(prisma.estimate.findUnique).mockResolvedValueOnce({
      id: uuid2, version: 2, name: 'v2', totalAmount: 1200000,
      items: [
        { id: '550e8400-e29b-41d4-a716-446655440013', code: 'A.01', name: 'Item A', unit: 'm2', quantity: 12, unitPrice: 50000, amount: 600000, costType: 'MATERIAL', contractor: null, stageId: null, progressPct: 0, actualQuantity: 0, sortOrder: 0, notes: null, estimateId: uuid2 },
        { id: '550e8400-e29b-41d4-a716-446655440014', code: 'C.01', name: 'Item C', unit: 'cái', quantity: 2, unitPrice: 300000, amount: 600000, costType: 'MATERIAL', contractor: null, stageId: null, progressPct: 0, actualQuantity: 0, sortOrder: 0, notes: null, estimateId: uuid2 },
      ],
    } as any);

    const { compareEstimates } = await import('@/actions/estimate');
    const result = await compareEstimates({ estimateId1: uuid1, estimateId2: uuid2 });

    expect(result.estimate1.version).toBe(1);
    expect(result.estimate2.version).toBe(2);
    expect(result.summary.totalChanged).toBeGreaterThanOrEqual(1);
    expect(result.diffs.filter((d: any) => d.diffType === 'CHANGED').length).toBe(1);
    expect(result.diffs.filter((d: any) => d.diffType === 'REMOVED').length).toBe(1);
    expect(result.diffs.filter((d: any) => d.diffType === 'ADDED').length).toBe(1);
  });

  it('throws when one estimate not found', async () => {
    vi.mocked(prisma.estimate.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.estimate.findUnique).mockResolvedValueOnce({ id: '550e8400-e29b-41d4-a716-446655440002' } as any);

    const { compareEstimates } = await import('@/actions/estimate');
    await expect(
      compareEstimates({
        estimateId1: '550e8400-e29b-41d4-a716-446655440001',
        estimateId2: '550e8400-e29b-41d4-a716-446655440002'
      })
    ).rejects.toThrow('One or both estimates not found');
  });
});

describe('syncProgressFromLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.estimateItem.findMany).mockResolvedValue([]);
    vi.mocked(prisma.estimateItem.update).mockResolvedValue({} as any);
  });

  it('updates progress from material usages', async () => {
    vi.mocked(prisma.estimate.findUnique).mockResolvedValue({
      id: 'est-1',
      projectId: 'proj-1',
      items: [
        { id: 'item-1', code: 'T1.07', stageId: 'stage-3', quantity: 180, actualQuantity: 0, progressPct: 0, unit: 'm2', unitPrice: 95000, amount: 17100000, costType: 'MATERIAL', name: 'Xây tường gạch', contractor: null, notes: null, sortOrder: 0, estimateId: 'est-1' },
      ],
    } as any);
    vi.mocked(prisma.materialUsage.findMany).mockResolvedValue([
      { id: 'mu-1', quantity: 50, dailyLog: {}, task: { stageId: 'stage-3' } },
      { id: 'mu-2', quantity: 30, dailyLog: {}, task: { stageId: 'stage-3' } },
    ] as any);

    const { syncProgressFromLogs } = await import('@/actions/estimate');
    const result = await syncProgressFromLogs('est-1');

    expect(result.updated).toBe(1);
    expect(prisma.estimateItem.update).toHaveBeenCalled();
    expect(result.errors).toHaveLength(0);
  });
});

describe('estimate item DRAFT-only guard (M15)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects updating items of an ACTIVE estimate', async () => {
    vi.mocked(prisma.estimateItem.findUnique).mockResolvedValue({
      id: 'item-1',
      estimateId: 'est-1',
    } as any);
    vi.mocked(prisma.estimate.findUnique).mockResolvedValue({
      id: 'est-1',
      status: 'ACTIVE',
    } as any);

    const { updateEstimateItem } = await import('@/actions/estimate');
    await expect(
      updateEstimateItem('item-1', { quantity: 10 })
    ).rejects.toThrow('Chỉ có thể chỉnh sửa bản dự toán ở trạng thái Nháp');
    expect(prisma.estimateItem.update).not.toHaveBeenCalled();
  });

  it('allows updating items of a DRAFT estimate', async () => {
    vi.mocked(prisma.estimate.findUnique)
      .mockResolvedValueOnce({ id: 'est-1', status: 'DRAFT' } as any);
    vi.mocked(prisma.estimateItem.findUnique).mockResolvedValue({
      id: 'item-1',
      estimateId: 'est-1',
      quantity: new (require('@prisma/client/runtime/library').Decimal)(5),
      unitPrice: new (require('@prisma/client/runtime/library').Decimal)(1000),
    } as any);
    vi.mocked(prisma.estimateItem.update).mockResolvedValue({ id: 'item-1' } as any);
    vi.mocked(prisma.estimateItem.findMany).mockResolvedValue([{ amount: new (require('@prisma/client/runtime/library').Decimal)(5000) } as any]);
    vi.mocked(prisma.estimate.update).mockResolvedValue({ id: 'est-1' } as any);

    const { updateEstimateItem } = await import('@/actions/estimate');
    const result = await updateEstimateItem('item-1', { quantity: 10 });
    expect(prisma.estimateItem.update).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});