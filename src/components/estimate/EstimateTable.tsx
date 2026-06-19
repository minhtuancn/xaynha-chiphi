'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { CostType } from '@/schemas/estimate';
import { updateEstimateItem, deleteEstimateItem, createEstimateItem } from '@/actions/estimate';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { costTypeLabels, costTypeColors, formatCurrency, formatNumber } from './estimate-utils';

interface StageInfo {
  id: string;
  name: string;
  order: number;
}

interface EstimateItemData {
  id: string;
  estimateId: string;
  stageId: string | null;
  stage: StageInfo | null;
  code: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  costType: string;
  contractor: string | null;
  progressPct: number;
  actualQuantity: number;
  notes: string | null;
  sortOrder: number;
}

interface EstimateTableProps {
  estimateId: string;
  items: EstimateItemData[];
  readOnly?: boolean;
}

export function EstimateTable({ estimateId, items, readOnly = false }: EstimateTableProps) {
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ itemId: string; field: string } | null>(null);
  const [editValues, setEditValues] = useState<Record<string, Record<string, string>>>({});
  const [localItems, setLocalItems] = useState(items);

  // Group items by stage
  const groupedByStage = localItems.reduce<Record<string, { stage: StageInfo | null; items: EstimateItemData[] }>>(
    (acc, item) => {
      const key = item.stageId || '__no-stage';
      if (!acc[key]) {
        acc[key] = { stage: item.stage, items: [] };
      }
      acc[key].items.push(item);
      return acc;
    },
    {}
  );

  // Sort stages by order
  const sortedStageKeys = Object.keys(groupedByStage).sort((a, b) => {
    const stageA = groupedByStage[a].stage;
    const stageB = groupedByStage[b].stage;
    if (!stageA) return 1;
    if (!stageB) return -1;
    return stageA.order - stageB.order;
  });

  const toggleStage = (key: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleCellEdit = (itemId: string, field: string, value: string) => {
    setEditValues((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  const saveCellEdit = async (itemId: string, field: string) => {
    const value = editValues[itemId]?.[field];
    if (value === undefined) {
      setEditingCell(null);
      return;
    }

    const parsedValue = field === 'progressPct' ? parseInt(value) : parseFloat(value);

    if (isNaN(parsedValue)) return;

    try {
      await updateEstimateItem(itemId, { [field]: parsedValue });
      setLocalItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          const updated = { ...item, [field]: parsedValue };
          if (field === 'quantity' || field === 'unitPrice') {
            const qty = field === 'quantity' ? parsedValue : item.quantity;
            const price = field === 'unitPrice' ? parsedValue : item.unitPrice;
            updated.amount = qty * price;
          }
          return updated;
        })
      );
      setEditValues((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      toast.success('Đã cập nhật');
    } catch {
      toast.error('Lỗi cập nhật');
    }
    setEditingCell(null);
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteEstimateItem(itemId);
      setLocalItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.success('Đã xóa');
    } catch {
      toast.error('Lỗi xóa');
    }
  };

  const handleAddItem = async (stageId?: string | null) => {
    try {
      const newItem = await createEstimateItem({
        estimateId,
        stageId: stageId || undefined,
        code: '',
        name: '',
        unit: '',
        quantity: 0,
        unitPrice: 0,
        costType: 'MATERIAL' as const,
        contractor: null,
        progressPct: 0,
        actualQuantity: 0,
        notes: null,
        sortOrder: localItems.length,
      });
      setLocalItems((prev) => [...prev, newItem as unknown as EstimateItemData]);
    } catch {
      toast.error('Lỗi thêm mới');
    }
  };

  const renderEditableCell = (
    itemId: string,
    field: string,
    value: number | string | null,
    type: 'number' | 'text' = 'number'
  ) => {
    const isEditing = editingCell?.itemId === itemId && editingCell?.field === field;
    const displayValue = isEditing ? editValues[itemId]?.[field] ?? '' : value != null ? String(value) : '';
    const numValue = value != null ? Number(value) : 0;

    if (readOnly || !isEditing) {
      return (
        <span
          className="cursor-default"
          onDoubleClick={() => {
            if (!readOnly) {
              setEditingCell({ itemId, field });
              handleCellEdit(itemId, field, String(numValue));
            }
          }}
        >
          {type === 'number' ? formatNumber(numValue) : displayValue}
        </span>
      );
    }

    return (
      <Input
        type={type === 'number' ? 'number' : 'text'}
        className="h-7 w-full min-w-[60px]"
        value={displayValue}
        onChange={(e) => handleCellEdit(itemId, field, e.target.value)}
        onBlur={() => saveCellEdit(itemId, field)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') saveCellEdit(itemId, field);
          if (e.key === 'Escape') setEditingCell(null);
        }}
        autoFocus
      />
    );
  };

  const renderItemRow = (item: EstimateItemData) => (
    <TableRow key={item.id} className="group">
      <TableCell className="font-mono text-xs">{item.code}</TableCell>
      <TableCell className="max-w-[200px] truncate">{item.name}</TableCell>
      <TableCell>{item.unit}</TableCell>
      <TableCell className="text-right">{renderEditableCell(item.id, 'quantity', Number(item.quantity))}</TableCell>
      <TableCell className="text-right">{renderEditableCell(item.id, 'unitPrice', Number(item.unitPrice))}</TableCell>
      <TableCell className="text-right font-medium">{formatCurrency(Number(item.amount))}</TableCell>
      <TableCell>
        <Badge className={cn('text-xs', costTypeColors[item.costType] || costTypeColors.OTHER)}>
          {costTypeLabels[item.costType] || item.costType}
        </Badge>
      </TableCell>
      <TableCell className="text-xs">{item.contractor || '-'}</TableCell>
      <TableCell className="text-right">{renderEditableCell(item.id, 'progressPct', item.progressPct)}%</TableCell>
      <TableCell className="text-right">{renderEditableCell(item.id, 'actualQuantity', Number(item.actualQuantity))}</TableCell>
      <TableCell className="text-right">
        <span className={Number(item.actualQuantity) - Number(item.quantity) < 0 ? 'text-red-600' : 'text-green-600'}>
          {formatNumber(Number(item.actualQuantity) - Number(item.quantity))}
        </span>
      </TableCell>
      <TableCell className="max-w-[120px] truncate text-xs">{item.notes || ''}</TableCell>
      {!readOnly && (
        <TableCell className="p-1">
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteItem(item.id)}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </TableCell>
      )}
    </TableRow>
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Mã CP</TableHead>
            <TableHead className="min-w-[150px]">Hạng mục</TableHead>
            <TableHead className="w-[50px]">ĐVT</TableHead>
            <TableHead className="w-[100px] text-right">SL dự toán</TableHead>
            <TableHead className="w-[120px] text-right">Đơn giá</TableHead>
            <TableHead className="w-[120px] text-right">Thành tiền</TableHead>
            <TableHead className="w-[60px]">Loại</TableHead>
            <TableHead className="w-[100px]">Nhà thầu</TableHead>
            <TableHead className="w-[70px] text-right">% HT</TableHead>
            <TableHead className="w-[100px] text-right">SL thực tế</TableHead>
            <TableHead className="w-[100px] text-right">Chênh lệch</TableHead>
            <TableHead className="w-[120px]">Ghi chú</TableHead>
            {!readOnly && <TableHead className="w-[30px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedStageKeys.length === 0 ? (
            <TableRow>
              <TableCell colSpan={readOnly ? 12 : 13} className="text-center text-muted-foreground py-8">
                Chưa có hạng mục nào. {!readOnly && 'Nhấn "Thêm mới" bên dưới để bắt đầu.'}
              </TableCell>
            </TableRow>
          ) : (
            sortedStageKeys.map((key) => {
              const group = groupedByStage[key];
              const stageTotal = group.items.reduce((sum, item) => sum + Number(item.amount), 0);
              const isExpanded = expandedStages.has(key);

              return (
                <React.Fragment key={key}>
                  {/* Stage header row */}
                  <TableRow
                    className="bg-muted/50 cursor-pointer hover:bg-muted/70"
                    onClick={() => toggleStage(key)}
                  >
                    <TableCell colSpan={readOnly ? 12 : 13} className="py-2">
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <span className="font-semibold">
                          {group.stage ? group.stage.name : 'Không có giai đoạn'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({group.items.length} hạng mục)
                        </span>
                        <span className="ml-auto text-sm font-medium">
                          {formatCurrency(stageTotal)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                  {/* Items in stage */}
                  {isExpanded && group.items.map(renderItemRow)}
                </React.Fragment>
              );
            })
          )}
          {/* Grand total row */}
          {localItems.length > 0 && (
            <TableRow className="font-bold bg-muted/30">
              <TableCell colSpan={5} className="text-right">
                Tổng cộng
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(localItems.reduce((sum, item) => sum + Number(item.amount), 0))}
              </TableCell>
              <TableCell colSpan={readOnly ? 6 : 7}></TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {!readOnly && (
        <div className="flex justify-between items-center mt-4">
          <Button variant="outline" size="sm" onClick={() => handleAddItem(null)}>
            <Plus className="h-4 w-4 mr-1" /> Thêm hạng mục
          </Button>
          {sortedStageKeys.length > 0 && (
            <span className="text-sm text-muted-foreground">
              Tổng: {formatCurrency(localItems.reduce((sum, item) => sum + Number(item.amount), 0))}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
