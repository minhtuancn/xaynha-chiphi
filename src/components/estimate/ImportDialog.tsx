'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { importEstimateFromCSV } from '@/actions/estimate';
import { importEstimateSchema } from '@/schemas/estimate';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { costTypeLabels, costTypeColors } from './estimate-utils';
import type { CostType } from '@/schemas/estimate';

interface ImportRow {
  row: number;
  code: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  costType: string;
  valid: boolean;
  errors: string[];
}

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  estimateId: string;
  onSuccess: () => void;
}

export function ImportDialog({ open, onClose, estimateId, onSuccess }: ImportDialogProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload');
  const [csvText, setCsvText] = useState('');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('upload');
    setCsvText('');
    setRows([]);
    setError('');
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter((l) => l.trim());
    if (lines.length < 2) {
      setError('File CSV phải có header + ít nhất 1 dòng dữ liệu');
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const colMap: Record<string, number> = {};
    headers.forEach((h, i) => {
      const key = h.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
      if (key === 'ma cp' || key === 'code') colMap['code'] = i;
      if (key === 'hang muc' || key === 'name') colMap['name'] = i;
      if (key === 'don vi' || key === 'dvt' || key === 'unit') colMap['unit'] = i;
      if (key === 'so luong' || key === 'sl' || key === 'sl du toan' || key === 'quantity') colMap['quantity'] = i;
      if (key === 'don gia' || key === 'unitprice') colMap['unitPrice'] = i;
      if (key === 'loai cp' || key === 'loai' || key === 'costtype') colMap['costType'] = i;
    });

    if (!colMap['code'] || !colMap['name'] || !colMap['unit'] || !colMap['quantity'] || !colMap['unitPrice']) {
      setError('Thiếu cột bắt buộc: Mã CP, Hạng mục, ĐVT, SL dự toán, Đơn giá. Các cột phân cách bằng dấu phẩy (,)');
      return;
    }

    const parsed: ImportRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const errors: string[] = [];
      const rowNum = i + 1;

      const code = values[colMap['code']] || '';
      const name = values[colMap['name']] || '';
      const unit = values[colMap['unit']] || '';
      const parseVNNumber = (s: string): number => {
        if (!s) return NaN;
        // Vietnamese format: 1.500,5 -> 1500.5
        // Remove thousand separators (.) then replace decimal comma (,) with dot (.)
        const normalized = s.replace(/\./g, '').replace(',', '.');
        return parseFloat(normalized);
      };
      const quantity = parseVNNumber(values[colMap['quantity']] || '0');
      const unitPrice = parseVNNumber(values[colMap['unitPrice']] || '0');
      const costType = values[colMap['costType']]?.toUpperCase() || 'MATERIAL';

      if (!code) errors.push('Thiếu mã CP');
      if (!name) errors.push('Thiếu tên hạng mục');
      if (!unit) errors.push('Thiếu đơn vị');
      if (isNaN(quantity)) errors.push('SL không hợp lệ');
      if (isNaN(unitPrice)) errors.push('Đơn giá không hợp lệ');
      if (!['MATERIAL', 'LABOR', 'EQUIPMENT', 'SUBCONTRACT', 'OTHER'].includes(costType)) {
        errors.push('Loại CP không hợp lệ (VT/NC/TT/NTP/Khác)');
      }

      parsed.push({
        row: rowNum,
        code,
        name,
        unit,
        quantity,
        unitPrice,
        costType,
        valid: errors.length === 0,
        errors,
      });
    }

    if (parsed.length === 0) {
      setError('Không có dữ liệu hợp lệ trong file');
      return;
    }

    setRows(parsed);
    setStep('preview');
    setError('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setCsvText(text);
    parseCSV(text);
  };

  const handleTextPaste = () => {
    if (!csvText.trim()) {
      setError('Vui lòng dán nội dung CSV');
      return;
    }
    parseCSV(csvText);
  };

  const handleImport = async () => {
    const validRows = rows.filter((r) => r.valid);
    if (validRows.length === 0) {
      toast.error('Không có dòng dữ liệu hợp lệ');
      return;
    }

    setStep('importing');
    try {
      const importData: Parameters<typeof importEstimateFromCSV>[0] = {
        estimateId,
        rows: validRows.map((r) => ({
          code: r.code,
          name: r.name,
          unit: r.unit,
          quantity: r.quantity,
          unitPrice: r.unitPrice,
          costType: r.costType as CostType,
          progressPct: 0,
          actualQuantity: 0,
          sortOrder: 0,
        })),
      };

      await importEstimateFromCSV(importData);
      setStep('done');
      toast.success(`Đã import ${validRows.length} dòng`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi import');
      setStep('preview');
    }
  };

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.length - validCount;

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) { reset(); onClose(); }
      }}
    >
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import dữ liệu từ CSV</DialogTitle>
          <DialogDescription>
            Upload file CSV hoặc dán nội dung. Cột bắt buộc: Mã CP, Hạng mục, ĐVT, SL dự toán, Đơn giá, Loại CP
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 py-4">
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Nhấn để chọn file CSV</p>
              <p className="text-xs text-muted-foreground mt-1">
                File mẫu: <span className="font-mono">Mã CP,Hạng mục,ĐVT,SL dự toán,Đơn giá,Loại CP</span>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Hoặc dán nội dung</span>
              </div>
            </div>

            <textarea
              className="w-full h-[120px] p-3 border border-border rounded-lg text-sm font-mono"
              placeholder={`Mã CP,Hạng mục,ĐVT,SL dự toán,Đơn giá,Loại CP
MT.01,Xi măng PCB40,Tấn,500,1800000,MATERIAL
NC.01,Đào móng tay,m3,200,150000,LABOR`}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button onClick={handleTextPaste} disabled={!csvText.trim()}>
                Xem trước
              </Button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}
          </div>
        )}

        {step === 'preview' && (
          <div className="flex-1 overflow-auto space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <span className={cn('font-medium', validCount > 0 ? 'text-green-600' : 'text-destructive')}>
                {validCount} dòng hợp lệ
              </span>
              {invalidCount > 0 && (
                <span className="text-destructive">
                  , {invalidCount} dòng lỗi
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Mã CP</TableHead>
                    <TableHead>Hạng mục</TableHead>
                    <TableHead>ĐVT</TableHead>
                    <TableHead className="text-right">SL</TableHead>
                    <TableHead className="text-right">Đơn giá</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead className="w-[120px]">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.row} className={!row.valid ? 'bg-red-50' : ''}>
                      <TableCell className="text-xs text-muted-foreground">{row.row}</TableCell>
                      <TableCell className="font-mono text-xs">{row.code}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{row.name}</TableCell>
                      <TableCell>{row.unit}</TableCell>
                      <TableCell className="text-right">{row.quantity}</TableCell>
                      <TableCell className="text-right">{row.unitPrice.toLocaleString('vi-VN')}</TableCell>
                      <TableCell>{costTypeLabels[row.costType] || row.costType}</TableCell>
                      <TableCell>
                        {row.valid ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs">
                            <CheckCircle2 className="h-3 w-3" /> OK
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-destructive text-xs" title={row.errors.join('; ')}>
                            <AlertCircle className="h-3 w-3" /> {row.errors[0]}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Quay lại
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Import {validCount} dòng
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Đang import dữ liệu...</p>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
            <p className="text-lg font-medium">Import thành công!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Đã import {validCount} dòng vào bảng dự toán
            </p>
            <DialogFooter className="mt-6">
              <Button
                onClick={() => {
                  reset();
                  onClose();
                  onSuccess();
                }}
              >
                Hoàn tất
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
