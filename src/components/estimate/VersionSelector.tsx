'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, GitCompare, Upload, Download, ChevronDown } from 'lucide-react';
import { EstimateStatus, CostType } from '@/schemas/estimate';

interface VersionSelectorProps {
  estimates: Array<{
    id: string;
    version: number;
    name: string;
    status: EstimateStatus;
    totalAmount: number;
    _count: { items: number };
  }>;
  activeEstimateId?: string;
  projectId: string;
  onVersionChange: (estimateId: string) => void;
  onCreateNew: () => void;
  onCompare: () => void;
  onImport: () => void;
  onExport: (format: 'csv' | 'pdf') => void;
}

export function VersionSelector({
  estimates,
  activeEstimateId,
  projectId,
  onVersionChange,
  onCreateNew,
  onCompare,
  onImport,
  onExport,
}: VersionSelectorProps) {
  const [openCompare, setOpenCompare] = useState(false);

  const getStatusBadge = (status: EstimateStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Đang áp dụng</Badge>;
      case 'DRAFT':
        return <Badge className="bg-yellow-100 text-yellow-800">Nháp</Badge>;
      case 'ARCHIVED':
        return <Badge className="bg-gray-100 text-gray-800">Lưu trữ</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between w-full p-4 bg-card border border-border rounded-lg">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full sm:w-auto">
        <Select
          value={activeEstimateId || estimates[0]?.id || ''}
          onValueChange={onVersionChange}
          disabled={estimates.length === 0}
        >
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="Chọn phiên bản dự toán" />
          </SelectTrigger>
          <SelectContent>
            {estimates.map((est) => (
              <SelectItem key={est.id} value={est.id}>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">v{est.version} - {est.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {est._count.items} hạng mục • {formatCurrency(Number(est.totalAmount))}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {activeEstimateId && (
          <div className="flex items-center gap-2">
            {estimates
              .filter((e) => e.id === activeEstimateId)
              .map((est) => getStatusBadge(est.status))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
        <Button variant="outline" size="sm" onClick={onCreateNew} disabled={estimates.length === 0}>
          <Plus className="h-4 w-4 mr-1" /> Tạo bản mới
        </Button>
        <Button variant="outline" size="sm" onClick={onCompare} disabled={estimates.length < 2}>
          <GitCompare className="h-4 w-4 mr-1" /> So sánh
        </Button>
        <Button variant="outline" size="sm" onClick={onImport} disabled={!activeEstimateId}>
          <Upload className="h-4 w-4 mr-1" /> Import CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => onExport('csv')} disabled={!activeEstimateId}>
          <Download className="h-4 w-4 mr-1" /> Xuất CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => onExport('pdf')} disabled={!activeEstimateId}>
          <Download className="h-4 w-4 mr-1" /> Xuất PDF
        </Button>
      </div>
    </div>
  );
}