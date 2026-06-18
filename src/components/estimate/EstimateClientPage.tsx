'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VersionSelector } from '@/components/estimate/VersionSelector';
import { EstimateTable } from '@/components/estimate/EstimateTable';
import { EstimateSummaryTabs } from '@/components/estimate/EstimateSummaryTabs';
import { CompareModal } from '@/components/estimate/CompareModal';
import { ImportDialog } from '@/components/estimate/ImportDialog';
import { PageSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  createEstimate,
  getEstimatesByProject,
  getEstimateWithItems,
  downloadEstimateCSV,
  exportEstimateToPDF,
  compareEstimates as compareEstimatesAction,
} from '@/actions/estimate';
import { toast } from 'sonner';
import { FileText, Plus, BarChart3 } from 'lucide-react';

interface EstimateClientPageProps {
  projectId: string;
}

export function EstimateClientPage({ projectId }: EstimateClientPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [activeEstimate, setActiveEstimate] = useState<any>(null);
  const [activeEstimateId, setActiveEstimateId] = useState<string | null>(null);
  const [tab, setTab] = useState('table');
  const [showCompare, setShowCompare] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const loadEstimates = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getEstimatesByProject(projectId);
      setEstimates(list);

      const active = list.find((e: any) => e.status === 'ACTIVE');
      const firstDraft = list.find((e: any) => e.status === 'DRAFT');
      const targetId = active?.id || firstDraft?.id || list[0]?.id;

      if (targetId) {
        setActiveEstimateId(targetId);
        const detail = await getEstimateWithItems(targetId);
        setActiveEstimate(detail);
      } else {
        setActiveEstimate(null);
        setActiveEstimateId(null);
      }
    } catch (e) {
      toast.error('Lỗi tải dữ liệu dự toán');
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadEstimates();
  }, [loadEstimates]);

  const handleVersionChange = async (estimateId: string) => {
    setActiveEstimateId(estimateId);
    const detail = await getEstimateWithItems(estimateId);
    setActiveEstimate(detail);
  };

  const handleCreateNew = async () => {
    try {
      const est = await createEstimate({
        projectId,
        name: `Điều chỉnh lần ${estimates.length + 1}`,
      });
      await loadEstimates();
      await handleVersionChange(est.id);
      toast.success('Đã tạo phiên bản mới');
    } catch {
      toast.error('Lỗi tạo phiên bản mới');
    }
  };

  const handleCompare = async (id1: string, id2: string) => {
    return compareEstimatesAction({ estimateId1: id1, estimateId2: id2 });
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!activeEstimateId) return;
    try {
      if (format === 'csv') {
        const csv = await downloadEstimateCSV(activeEstimateId);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `du-toan-${activeEstimate.version}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Đã xuất CSV');
      } else {
        const base64 = await exportEstimateToPDF(activeEstimateId);
        const byteChars = atob(base64);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteNumbers[i] = byteChars.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `du-toan-${activeEstimate.version}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Đã xuất PDF');
      }
    } catch {
      toast.error('Lỗi xuất file');
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (estimates.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dự toán</h1>
        </div>
        <Card className="border-dashed shadow-sm">
          <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in">
            <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Chưa có dự toán</h3>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
              Tạo phiên bản dự toán đầu tiên cho dự án này.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-1" /> Tạo dự toán
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const stages = activeEstimate?.items
    ? Object.entries(
        activeEstimate.items.reduce((acc: any, item: any) => {
          const key = item.stageId || '__no-stage';
          if (!acc[key]) {
            acc[key] = {
              stageId: item.stageId,
              stageName: item.stage?.name || 'Không có giai đoạn',
              estimatedAmount: 0,
              actualAmount: 0,
              itemCount: 0,
              progressPct: 0,
            };
          }
          acc[key].estimatedAmount += Number(item.amount || 0);
          acc[key].actualAmount += Number(item.actualQuantity || 0) * Number(item.unitPrice || 0);
          acc[key].itemCount += 1;
          acc[key].progressPct = item.progressPct || 0;
          return acc;
        }, {})
      ).map(([key, s]: any) => s)
    : [];

  const costTypes = activeEstimate?.items
    ? Object.entries(
        activeEstimate.items.reduce((acc: any, item: any) => {
          if (!acc[item.costType]) {
            acc[item.costType] = {
              costType: item.costType,
              estimatedAmount: 0,
              actualAmount: 0,
              itemCount: 0,
            };
          }
          acc[item.costType].estimatedAmount += Number(item.amount || 0);
          acc[item.costType].actualAmount += Number(item.actualQuantity || 0) * Number(item.unitPrice || 0);
          acc[item.costType].itemCount += 1;
          return acc;
        }, {})
      ).map(([key, ct]: any) => ct)
    : [];

  const totalEstimated = stages.reduce((s: number, st: any) => s + st.estimatedAmount, 0);
  const totalActual = stages.reduce((s: number, st: any) => s + st.actualAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dự toán</h1>
      </div>

      <VersionSelector
        estimates={estimates}
        activeEstimateId={activeEstimateId || undefined}
        projectId={projectId}
        onVersionChange={handleVersionChange}
        onCreateNew={handleCreateNew}
        onCompare={() => setShowCompare(true)}
        onImport={() => setShowImport(true)}
        onExport={handleExport}
      />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList>
          <TabsTrigger value="table">Bảng lượng</TabsTrigger>
          <TabsTrigger value="summary">Tổng hợp</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-4">
          {activeEstimate && (
            <EstimateTable
              estimateId={activeEstimateId!}
              items={activeEstimate.items.map((item: any) => ({
                ...item,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                amount: Number(item.amount),
                actualQuantity: Number(item.actualQuantity),
              }))}
              readOnly={activeEstimate.status !== 'DRAFT'}
            />
          )}
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          <EstimateSummaryTabs
            stages={stages}
            costTypes={costTypes}
            totalEstimated={totalEstimated}
            totalActual={totalActual}
          />
        </TabsContent>
      </Tabs>

      <CompareModal
        open={showCompare}
        onClose={() => setShowCompare(false)}
        estimates={estimates}
        onCompare={handleCompare}
      />

      <ImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        estimateId={activeEstimateId!}
        onSuccess={loadEstimates}
      />
    </div>
  );
}