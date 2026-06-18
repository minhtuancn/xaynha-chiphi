'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { costTypeLabels, costTypeColors, costTypeFullNames, formatCurrency } from './estimate-utils';

interface StageSummary {
  stageId: string | null;
  stageName: string;
  estimatedAmount: number;
  actualAmount: number;
  itemCount: number;
  progressPct: number;
}

interface CostTypeSummary {
  costType: string;
  estimatedAmount: number;
  actualAmount: number;
  itemCount: number;
}

interface EstimateSummaryTabsProps {
  stages: StageSummary[];
  costTypes: CostTypeSummary[];
  totalEstimated: number;
  totalActual: number;
}

export function EstimateSummaryTabs({
  stages,
  costTypes,
  totalEstimated,
  totalActual,
}: EstimateSummaryTabsProps) {
  return (
    <Tabs defaultValue="stage" className="w-full">
      <TabsList>
        <TabsTrigger value="stage">Tổng hợp theo giai đoạn</TabsTrigger>
        <TabsTrigger value="costType">Tổng hợp theo loại CP</TabsTrigger>
      </TabsList>

      <TabsContent value="stage" className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Giai đoạn</TableHead>
              <TableHead className="text-right">Dự toán</TableHead>
              <TableHead className="text-right">Thực tế</TableHead>
              <TableHead className="text-right">Chênh lệch</TableHead>
              <TableHead className="text-right">%</TableHead>
              <TableHead className="text-center">Hạng mục</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stages.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            )}
            {stages.map((s) => {
              const diff = Number(s.actualAmount) - Number(s.estimatedAmount);
              return (
                <TableRow key={s.stageId || 'no-stage'}>
                  <TableCell className="font-medium">{s.stageName}</TableCell>
                  <TableCell className="text-right">{formatCurrency(s.estimatedAmount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(s.actualAmount)}</TableCell>
                  <TableCell className={`text-right ${diff > 0 ? 'text-red-600' : diff < 0 ? 'text-green-600' : ''}`}>
                    {formatCurrency(diff)}
                  </TableCell>
                  <TableCell className="text-right font-medium">{s.progressPct}%</TableCell>
                  <TableCell className="text-center">{s.itemCount}</TableCell>
                </TableRow>
              );
            })}
            <TableRow className="font-bold">
              <TableCell>Tổng cộng</TableCell>
              <TableCell className="text-right">{formatCurrency(totalEstimated)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totalActual)}</TableCell>
              <TableCell className={`text-right ${(Number(totalActual) - Number(totalEstimated)) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(Number(totalActual) - Number(totalEstimated))}
              </TableCell>
              <TableCell className="text-right">
                {totalEstimated > 0
                  ? Math.round((Number(totalActual) / Number(totalEstimated)) * 100)
                  : 0}%
              </TableCell>
              <TableCell className="text-center">{stages.reduce((s, st) => s + st.itemCount, 0)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TabsContent>

      <TabsContent value="costType" className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loại chi phí</TableHead>
              <TableHead className="text-right">Dự toán</TableHead>
              <TableHead className="text-right">Thực tế</TableHead>
              <TableHead className="text-right">Chênh lệch</TableHead>
              <TableHead className="text-right">%</TableHead>
              <TableHead className="text-center">Hạng mục</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {costTypes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            )}
            {costTypes.map((ct) => {
              const diff = Number(ct.actualAmount) - Number(ct.estimatedAmount);
              return (
                <TableRow key={ct.costType}>
                  <TableCell>
                    <Badge className={costTypeColors[ct.costType] || costTypeColors.OTHER}>
                      {costTypeFullNames[ct.costType] || ct.costType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(ct.estimatedAmount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(ct.actualAmount)}</TableCell>
                  <TableCell className={`text-right ${diff > 0 ? 'text-red-600' : diff < 0 ? 'text-green-600' : ''}`}>
                    {formatCurrency(diff)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {ct.estimatedAmount > 0
                      ? Math.round((Number(ct.actualAmount) / Number(ct.estimatedAmount)) * 100)
                      : 0}%
                  </TableCell>
                  <TableCell className="text-center">{ct.itemCount}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  );
}