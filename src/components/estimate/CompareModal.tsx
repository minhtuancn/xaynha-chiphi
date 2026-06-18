'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, ArrowUp, ArrowDown, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CostType } from '@/schemas/estimate';

interface EstimateSummary {
  id: string;
  version: number;
  name: string;
  totalAmount: number;
}

interface DiffItem {
  code: string;
  name: string;
  unit: string;
  quantity1: number | null;
  quantity2: number | null;
  unitPrice1: number | null;
  unitPrice2: number | null;
  amount1: number | null;
  amount2: number | null;
  costType1: string | null;
  costType2: string | null;
  contractor1: string | null;
  contractor2: string | null;
  stageId1: string | null;
  stageId2: string | null;
  progressPct1: number | null;
  progressPct2: number | null;
  actualQuantity1: number | null;
  actualQuantity2: number | null;
  diffType: 'SAME' | 'CHANGED' | 'ADDED' | 'REMOVED';
}

interface CompareResult {
  estimate1: EstimateSummary;
  estimate2: EstimateSummary;
  diffs: DiffItem[];
  summary: {
    totalAdded: number;
    totalRemoved: number;
    totalChanged: number;
    amountDiff: number;
  };
}

interface CompareModalProps {
  open: boolean;
  onClose: () => void;
  estimates: Array<{
    id: string;
    version: number;
    name: string;
    status: string;
    totalAmount: number;
  }>;
  onCompare: (id1: string, id2: string) => Promise<CompareResult>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value);
}

const diffRowClass: Record<string, string> = {
  SAME: '',
  CHANGED: 'bg-yellow-50',
  ADDED: 'bg-green-50',
  REMOVED: 'bg-red-50',
};

const diffDot = {
  SAME: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  CHANGED: <AlertCircle className="h-4 w-4 text-yellow-600" />,
  ADDED: <Plus className="h-4 w-4 text-green-600" />,
  REMOVED: <Minus className="h-4 w-4 text-red-600" />,
};

function DiffCell({ v1, v2 }: { v1: number | null; v2: number | null }) {
  if (v1 === null && v2 === null) return <span>-</span>;
  if (v1 === null && v2 !== null) return <span className="text-green-600 font-medium">{formatNumber(v2)}</span>;
  if (v1 !== null && v2 === null) return <span className="text-red-600 font-medium">{formatNumber(v1)}</span>;
  if (v1 === v2) return <span>{formatNumber(v1!)}</span>;

  const diff = v2! - v1!;
  return (
    <div className="flex flex-col">
      <span className="text-gray-500 line-through text-xs">{formatNumber(v1!)}</span>
      <span className="font-medium">{formatNumber(v2!)}</span>
      <span className={cn('text-xs', diff > 0 ? 'text-green-600' : 'text-red-600')}>
        {diff > 0 ? '+' : ''}{formatNumber(diff)}
      </span>
    </div>
  );
}

export function CompareModal({ open, onClose, estimates, onCompare }: CompareModalProps) {
  const [id1, setId1] = useState('');
  const [id2, setId2] = useState('');
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredEst1 = estimates; // all
  const filteredEst2 = estimates.filter((e) => e.id !== id1);

  const handleCompare = async () => {
    if (!id1 || !id2) return;
    setLoading(true);
    setError('');
    try {
      const res = await onCompare(id1, id2);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi so sánh');
    }
    setLoading(false);
  };

  const reset = () => {
    setId1('');
    setId2('');
    setResult(null);
    setError('');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) { reset(); onClose(); }
      }}
    >
      <DialogContent className="max-w-5xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>So sánh phiên bản dự toán</DialogTitle>
          <DialogDescription>
            Chọn 2 phiên bản để so sánh sự khác biệt
          </DialogDescription>
        </DialogHeader>

        {!result && (
          <div className="flex items-end gap-4 py-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Phiên bản 1 (gốc)</label>
              <Select value={id1} onValueChange={setId1}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phiên bản" />
                </SelectTrigger>
                <SelectContent>
                  {filteredEst1.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      v{e.version} - {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Phiên bản 2 (mới)</label>
              <Select value={id2} onValueChange={setId2} disabled={!id1}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phiên bản" />
                </SelectTrigger>
                <SelectContent>
                  {filteredEst2.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      v{e.version} - {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCompare} disabled={!id1 || !id2 || loading}>
              {loading ? 'Đang so sánh...' : 'So sánh'}
            </Button>
          </div>
        )}

        {error && (
          <div className="text-destructive text-sm">{error}</div>
        )}

        {result && (
          <div className="flex-1 overflow-auto">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-xs text-green-700">Thêm mới</div>
                <div className="text-2xl font-bold text-green-700">{result.summary.totalAdded}</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-xs text-red-700">Xóa</div>
                <div className="text-2xl font-bold text-red-700">{result.summary.totalRemoved}</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="text-xs text-yellow-700">Thay đổi</div>
                <div className="text-2xl font-bold text-yellow-700">{result.summary.totalChanged}</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-xs text-blue-700">Chênh lệch</div>
                <div className={cn('text-2xl font-bold', result.summary.amountDiff >= 0 ? 'text-green-700' : 'text-red-700')}>
                  {formatCurrency(result.summary.amountDiff)}
                </div>
              </div>
            </div>

            {/* Diff table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="w-[70px]">Mã CP</TableHead>
                  <TableHead>Hạng mục</TableHead>
                  <TableHead className="text-right w-[100px]">SL (v1 → v2)</TableHead>
                  <TableHead className="text-right w-[120px]">Đơn giá (v1 → v2)</TableHead>
                  <TableHead className="text-right w-[120px]">Thành tiền (v1 → v2)</TableHead>
                  <TableHead className="w-[60px]">Loại</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.diffs
                  .filter((d) => d.diffType !== 'SAME')
                  .map((d) => (
                    <TableRow key={d.code + d.diffType} className={diffRowClass[d.diffType]}>
                      <TableCell>{diffDot[d.diffType]}</TableCell>
                      <TableCell className="font-mono text-xs">{d.code}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{d.name}</TableCell>
                      <TableCell className="text-right">
                        <DiffCell v1={d.quantity1} v2={d.quantity2} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DiffCell v1={d.unitPrice1} v2={d.unitPrice2} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DiffCell v1={d.amount1} v2={d.amount2} />
                      </TableCell>
                      <TableCell className="text-xs">{d.costType2 || d.costType1 || '-'}</TableCell>
                    </TableRow>
                  ))}
                {result.diffs.filter((d) => d.diffType !== 'SAME').length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Không có sự khác biệt giữa 2 phiên bản
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {result.diffs.filter((d) => d.diffType === 'CHANGED').length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Hiện tất cả dòng giống nhau ({result.diffs.filter((d) => d.diffType === 'SAME').length} dòng)
                </summary>
                <Table className="mt-2">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã CP</TableHead>
                      <TableHead>Hạng mục</TableHead>
                      <TableHead className="text-right">SL</TableHead>
                      <TableHead className="text-right">Đơn giá</TableHead>
                      <TableHead className="text-right">Thành tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.diffs.filter((d) => d.diffType === 'SAME').map((d) => (
                      <TableRow key={d.code + 'same'}>
                        <TableCell className="font-mono text-xs">{d.code}</TableCell>
                        <TableCell>{d.name}</TableCell>
                        <TableCell className="text-right">{formatNumber(d.quantity1!)}</TableCell>
                        <TableCell className="text-right">{formatNumber(d.unitPrice1!)}</TableCell>
                        <TableCell className="text-right">{formatNumber(d.amount1!)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </details>
            )}

            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={reset}>
                So sánh lại
              </Button>
              <div className="text-sm text-muted-foreground">
                v{result.estimate1.version}: {formatCurrency(result.estimate1.totalAmount)} → v{result.estimate2.version}: {formatCurrency(result.estimate2.totalAmount)}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}