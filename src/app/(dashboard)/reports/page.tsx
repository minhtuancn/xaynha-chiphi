"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FinancialDonutChart } from "@/components/reports/financial-donut-chart";
import { PageSkeleton } from "@/components/ui/loading-skeleton";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  STAGE_STATUS_LABELS,
  WORKER_STATUS_LABELS,
} from "@/lib/utils";
import { HardHat, Package, TrendingUp, Users, Wallet } from "lucide-react";

type ProgressReport = Awaited<ReturnType<typeof import("@/actions/reports").getProgressReport>>;
type FinancialReport = Awaited<ReturnType<typeof import("@/actions/reports").getFinancialReport>>;
type MaterialReport = Awaited<ReturnType<typeof import("@/actions/reports").getMaterialUsageReport>>;
type SupplierReport = Awaited<ReturnType<typeof import("@/actions/reports").getSupplierReport>>;
type WorkerReport = Awaited<ReturnType<typeof import("@/actions/reports").getWorkerReport>>;

const COLORS = ["#475569", "#64748b", "#94a3b8", "#cbd5e1", "#10b981", "#34d399", "#059669", "#047857"];

export default function ReportsPage() {
  const [progress, setProgress] = useState<ProgressReport | null>(null);
  const [financial, setFinancial] = useState<FinancialReport | null>(null);
  const [materials, setMaterials] = useState<MaterialReport | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierReport | null>(null);
  const [workers, setWorkers] = useState<WorkerReport | null>(null);
  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        const {
          getProgressReport,
          getFinancialReport,
          getMaterialUsageReport,
          getSupplierReport,
          getWorkerReport,
        } = await import("@/actions/reports");

        const [progressData, financialData, materialsData, suppliersData, workersData] = await Promise.all([
          getProgressReport(),
          getFinancialReport(),
          getMaterialUsageReport(),
          getSupplierReport(),
          getWorkerReport(),
        ]);

        if (!active) return;

        setProgress(progressData);
        setFinancial(financialData);
        setMaterials(materialsData);
        setSuppliers(suppliersData);
        setWorkers(workersData);

        const spent = financialData.budgetVsActual.spent;
        const budget = financialData.budgetVsActual.budget;
        const usageRate = budget > 0 ? (spent / budget) * 100 : 0;
        const topCategory = financialData.categories[0];
        const note = [
          budget > 0
            ? `Đã sử dụng ${formatPercent(usageRate)} ngân sách.`
            : "Chưa có ngân sách để đối chiếu.",
          topCategory ? `Danh mục chi nhiều nhất: ${topCategory.name}.` : "Chưa có dữ liệu danh mục chi phí.",
          financialData.monthlySpending.length > 0
            ? `Có ${financialData.monthlySpending.length} mốc chi tiêu theo tháng.`
            : "Chưa có dữ liệu chi tiêu theo tháng.",
        ].join("\n");

        setInsights(note);
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchData();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Báo cáo</h1>
          <p className="text-muted-foreground">Tổng quan tiến độ, tài chính, vật tư, nhà cung cấp, nhân công</p>
        </div>
      </div>

      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList className="flex flex-wrap justify-start gap-2">
          <TabsTrigger value="progress">
            <TrendingUp className="mr-2 h-4 w-4" />
            Tiến độ
          </TabsTrigger>
          <TabsTrigger value="financial">
            <Wallet className="mr-2 h-4 w-4" />
            Tài chính
          </TabsTrigger>
          <TabsTrigger value="materials">
            <Package className="mr-2 h-4 w-4" />
            Vật tư
          </TabsTrigger>
          <TabsTrigger value="suppliers">
            <Users className="mr-2 h-4 w-4" />
            Nhà cung cấp
          </TabsTrigger>
          <TabsTrigger value="workers">
            <HardHat className="mr-2 h-4 w-4" />
            Nhân công
          </TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          <ProgressReportTab data={progress} />
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <FinancialReportTab data={financial} insights={insights} />
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <MaterialsReportTab data={materials} />
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <SuppliersReportTab data={suppliers} />
        </TabsContent>

        <TabsContent value="workers" className="space-y-4">
          <WorkersReportTab data={workers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProgressReportTab({ data }: { data: ProgressReport | null }) {
  if (!data) {
    return <EmptyState title="Không có dữ liệu tiến độ." />;
  }

  if (data.stages.length === 0) {
    return <EmptyState title="Chưa có giai đoạn nào để báo cáo." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Tổng giai đoạn" value={formatNumber(data.stages.length, 0)} helper="Các giai đoạn đang theo dõi" />
        <StatCard label="Tổng công việc" value={formatNumber(data.totalTasks, 0)} helper="Công việc trong toàn bộ dự án" />
        <StatCard label="Tỷ lệ hoàn thành" value={formatPercent(data.taskCompletionRate)} helper="So với tổng công việc" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết giai đoạn</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Tiến độ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Công việc</TableHead>
                <TableHead>Ngân sách</TableHead>
                <TableHead>Thực tế</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.stages.map((stage) => (
                <TableRow key={stage.id}>
                  <TableCell className="font-medium">{stage.name}</TableCell>
                  <TableCell className="min-w-40">
                    <div className="space-y-2">
                      <Progress value={stage.progress} />
                      <p className="text-xs text-muted-foreground">{formatPercent(stage.progress)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={stage.status === "COMPLETED" ? "default" : stage.status === "ON_HOLD" ? "destructive" : "secondary"}>
                      {STAGE_STATUS_LABELS[stage.status] ?? stage.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {stage.completedTasks}/{stage.totalTasks}
                  </TableCell>
                  <TableCell>{formatCurrency(stage.estimatedBudget)}</TableCell>
                  <TableCell>{formatCurrency(stage.actualCost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function FinancialReportTab({ data, insights }: { data: FinancialReport | null; insights: string }) {
  if (!data) {
    return <EmptyState title="Không có dữ liệu tài chính." />;
  }

  if (data.categories.length === 0 && data.monthlySpending.length === 0) {
    return <EmptyState title="Chưa có dữ liệu tài chính để hiển thị." />;
  }

  const pieData = data.categories.map((category, index) => ({
    name: category.name,
    value: category.total,
    fill: COLORS[index % COLORS.length],
  }));
  const usageRate = data.budgetVsActual.budget > 0 ? (data.budgetVsActual.spent / data.budgetVsActual.budget) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Ngân sách" value={formatCurrency(data.budgetVsActual.budget)} helper="Tổng ngân sách dự án" />
        <StatCard label="Đã chi" value={formatCurrency(data.budgetVsActual.spent)} helper="Tổng chi phí đã ghi nhận" />
        <StatCard label="Còn lại" value={formatCurrency(data.budgetVsActual.remaining)} helper="Ngân sách chưa dùng" />
        <StatCard label="Tỷ lệ chi" value={formatPercent(usageRate)} helper="So với ngân sách" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nhận xét nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line text-sm text-muted-foreground">{insights}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Phân bổ chi phí</CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialDonutChart data={pieData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chi tiêu theo tháng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.monthlySpending.length > 0 ? (
              data.monthlySpending.map((item) => (
                <div key={item.month} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{item.month}</p>
                    <p className="text-xs text-muted-foreground">Chi tiêu tháng</p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.total)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu theo tháng.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chi phí theo danh mục</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Danh mục</TableHead>
                <TableHead>Số lần</TableHead>
                <TableHead>Tổng tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.categories.map((category) => (
                <TableRow key={category.name}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{formatNumber(category.count, 0)}</TableCell>
                  <TableCell>{formatCurrency(category.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function MaterialsReportTab({ data }: { data: MaterialReport | null }) {
  if (!data) {
    return <EmptyState title="Không có dữ liệu vật tư." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Tổng vật tư" value={formatNumber(data.materials.length, 0)} helper="Các vật tư đang quản lý" />
        <StatCard label="Nhóm vật tư" value={formatNumber(data.categories.length, 0)} helper="Theo danh mục" />
        <StatCard label="Cảnh báo tồn thấp" value={formatNumber(data.lowStock.length, 0)} helper="Dưới mức tối thiểu" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vật tư tồn thấp</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Tồn hiện tại</TableHead>
                <TableHead>Tối thiểu</TableHead>
                <TableHead>Đơn vị</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>{material.category}</TableCell>
                  <TableCell>{formatNumber(material.currentStock, 0)}</TableCell>
                  <TableCell>{formatNumber(material.minStock, 0)}</TableCell>
                  <TableCell>{material.unit}</TableCell>
                  <TableCell>
                    <Badge variant={material.isLowStock ? "destructive" : "secondary"}>
                      {material.isLowStock ? "Tồn thấp" : "Bình thường"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function SuppliersReportTab({ data }: { data: SupplierReport | null }) {
  if (!data) {
    return <EmptyState title="Không có dữ liệu nhà cung cấp." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Nhà cung cấp" value={formatNumber(data.length, 0)} helper="Danh sách đang theo dõi" />
        <StatCard label="Đơn mua" value={formatNumber(data.reduce((sum, supplier) => sum + supplier.totalOrders, 0), 0)} helper="Tổng số đơn hàng" />
        <StatCard label="Công nợ" value={formatCurrency(data.reduce((sum, supplier) => sum + supplier.outstandingDebt, 0))} helper="Tổng công nợ hiện tại" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách nhà cung cấp</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Đơn hàng</TableHead>
                <TableHead>Tổng giá trị</TableHead>
                <TableHead>Dư nợ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p>{supplier.contact || "-"}</p>
                      <p className="text-xs text-muted-foreground">{supplier.phone || supplier.email || "-"}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatNumber(supplier.totalOrders, 0)}</TableCell>
                  <TableCell>{formatCurrency(supplier.totalOrderValue)}</TableCell>
                  <TableCell>{formatCurrency(supplier.outstandingDebt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function WorkersReportTab({ data }: { data: WorkerReport | null }) {
  if (!data) {
    return <EmptyState title="Không có dữ liệu nhân công." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Nhân công" value={formatNumber(data.length, 0)} helper="Danh sách đang theo dõi" />
        <StatCard label="Công ngày" value={formatNumber(data.reduce((sum, worker) => sum + worker.totalAttendance, 0), 0)} helper="Số lần chấm công" />
        <StatCard label="Tiền lương" value={formatCurrency(data.reduce((sum, worker) => sum + worker.totalWages, 0))} helper="Tổng lương ước tính" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách nhân công</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Kỹ năng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Tỷ lệ đi làm</TableHead>
                <TableHead>Đơn giá</TableHead>
                <TableHead>Tổng lương</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell className="font-medium">{worker.name}</TableCell>
                  <TableCell>{worker.skill || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={worker.status === "ACTIVE" ? "default" : "secondary"}>
                      {WORKER_STATUS_LABELS[worker.status] ?? worker.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatPercent(worker.attendanceRate)}</TableCell>
                  <TableCell>{formatCurrency(worker.dailyWage)}</TableCell>
                  <TableCell>{formatCurrency(worker.totalWages)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <Card>
      <CardContent className="py-10 text-center text-sm text-muted-foreground">{title}</CardContent>
    </Card>
  );
}
