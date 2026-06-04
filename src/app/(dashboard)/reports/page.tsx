"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Download, TrendingUp, Wallet, Package, Users, HardHat } from "lucide-react";
import { exportToCSV } from "@/lib/csv";
import { formatCurrency, formatNumber, formatPercent, STAGE_STATUS_LABELS, WORKER_STATUS_LABELS } from "@/lib/utils";

type ProgressReport = Awaited<ReturnType<typeof import("@/actions/reports").getProgressReport>>;
type FinancialReport = Awaited<ReturnType<typeof import("@/actions/reports").getFinancialReport>>;
type MaterialReport = Awaited<ReturnType<typeof import("@/actions/reports").getMaterialUsageReport>>;
type SupplierReport = Awaited<ReturnType<typeof import("@/actions/reports").getSupplierReport>>;
type WorkerReport = Awaited<ReturnType<typeof import("@/actions/reports").getWorkerReport>>;

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function ReportsPage() {
  const [progress, setProgress] = useState<ProgressReport | null>(null);
  const [financial, setFinancial] = useState<FinancialReport | null>(null);
  const [materials, setMaterials] = useState<MaterialReport | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierReport | null>(null);
  const [workers, setWorkers] = useState<WorkerReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { getProgressReport } = await import("@/actions/reports");
        const { getFinancialReport } = await import("@/actions/reports");
        const { getMaterialUsageReport } = await import("@/actions/reports");
        const { getSupplierReport } = await import("@/actions/reports");
        const { getWorkerReport } = await import("@/actions/reports");

        const [p, f, m, s, w] = await Promise.all([
          getProgressReport(),
          getFinancialReport(),
          getMaterialUsageReport(),
          getSupplierReport(),
          getWorkerReport(),
        ]);

        setProgress(p);
        setFinancial(f);
        setMaterials(m);
        setSuppliers(s);
        setWorkers(w);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Đang tải báo cáo...</p>
      </div>
    );
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
        <TabsList>
          <TabsTrigger value="progress">
            <TrendingUp className="w-4 h-4 mr-2" />
            Tiến độ
          </TabsTrigger>
          <TabsTrigger value="financial">
            <Wallet className="w-4 h-4 mr-2" />
            Tài chính
          </TabsTrigger>
          <TabsTrigger value="materials">
            <Package className="w-4 h-4 mr-2" />
            Vật tư
          </TabsTrigger>
          <TabsTrigger value="suppliers">
            <Users className="w-4 h-4 mr-2" />
            Nhà cung cấp
          </TabsTrigger>
          <TabsTrigger value="workers">
            <HardHat className="w-4 h-4 mr-2" />
            Nhân công
          </TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          <ProgressReportTab data={progress} />
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <FinancialReportTab data={financial} />
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
  if (!data || data.stages.length === 0) {
    return <p className="text-muted-foreground">Không có dữ liệu tiến độ.</p>;
  }

  const chartData = data.stages.map((s) => ({
    name: s.name,
    progress: s.progress,
    tasks: `${s.completedTasks}/${s.totalTasks}`,
  }));

  const handleExport = () => {
    const headers = ["Giai đoạn", "Tiến độ (%)", "Trạng thái", "Task hoàn thành", "Tổng task", "Ngân sách ước tính", "Chi phí thực tế"];
    const rows = data.stages.map((s) => [
      s.name,
      s.progress,
      STAGE_STATUS_LABELS[s.status] || s.status,
      s.completedTasks,
      s.totalTasks,
      s.estimatedBudget,
      s.actualCost,
    ]);
    exportToCSV(headers, rows, "bao-cao-tien-do");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Xuất CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng giai đoạn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stages.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Task hoàn thành</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.completedTasks}/{data.totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">{formatPercent(data.taskCompletionRate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tiến độ trung bình</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(data.stages.reduce((sum, s) => sum + s.progress, 0) / data.stages.length)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tiến độ theo giai đoạn</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip formatter={(value: number, name: string) => {
                if (name === "progress") return `${value}%`;
                return value;
              }} />
              <Bar dataKey="progress" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chi tiết giai đoạn</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.stages.map((stage) => (
              <div key={stage.id} className="p-3 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{stage.name}</span>
                  <Badge variant={stage.status === "COMPLETED" ? "default" : "secondary"}>
                    {STAGE_STATUS_LABELS[stage.status] || stage.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{stage.progress}%</span>
                  <span>Tasks: {stage.completedTasks}/{stage.totalTasks}</span>
                  <span>Dự toán: {formatCurrency(stage.estimatedBudget)}</span>
                  <span>Thực tế: {formatCurrency(stage.actualCost)}</span>
                </div>
                <Progress value={stage.progress} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FinancialReportTab({ data }: { data: FinancialReport | null }) {
  if (!data || data.categories.length === 0) {
    return <p className="text-muted-foreground">Không có dữ liệu tài chính.</p>;
  }

  const pieData = data.categories.map((c, i) => ({
    name: c.name,
    value: c.total,
    fill: COLORS[i % COLORS.length],
  }));

  const handleExportCategory = () => {
    const headers = ["Danh mục", "Tổng chi phí", "Số lượng"];
    const rows = data.categories.map((c) => [c.name, c.total, c.count]);
    exportToCSV(headers, rows, "bao-cao-tai-chinh-danh-muc");
  };

  const handleExportMonthly = () => {
    const headers = ["Tháng", "Tổng chi phí"];
    const rows = data.monthlySpending.map((m) => [m.month, m.total]);
    exportToCSV(headers, rows, "bao-cao-tai-chinh-thang");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button onClick={handleExportCategory} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Xuất CSV danh mục
        </Button>
        <Button onClick={handleExportMonthly} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Xuất CSV tháng
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ngân sách</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.budgetVsActual.budget)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đã chi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(data.budgetVsActual.spent)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Còn lại</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.budgetVsActual.remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(data.budgetVsActual.remaining)}
            </div>
          </CardContent>
        </Card>
      </div>

      {data.budgetVsActual.budget > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ngân sách vs Thực tế</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tiến độ chi tiêu</span>
                <span className="font-medium">
                  {formatPercent((data.budgetVsActual.spent / data.budgetVsActual.budget) * 100)}
                </span>
              </div>
              <Progress
                value={(data.budgetVsActual.spent / data.budgetVsActual.budget) * 100}
                className="h-3"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatCurrency(data.budgetVsActual.spent)}</span>
                <span>{formatCurrency(data.budgetVsActual.budget)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chi phí theo danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name: string; percent: number }) => `${name} ${formatPercent(percent * 100)}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chi phí theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.monthlySpending}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}tr`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MaterialsReportTab({ data }: { data: MaterialReport | null }) {
  if (!data || data.materials.length === 0) {
    return <p className="text-muted-foreground">Không có dữ liệu vật tư.</p>;
  }

  const stockChartData = data.materials.slice(0, 15).map((m) => ({
    name: m.name,
    current: m.currentStock,
    min: m.minStock,
  }));

  const handleExport = () => {
    const headers = ["Vật liệu", "Danh mục", "Tồn kho", "Tối thiểu", "Đơn vị", "Đơn giá", "Cảnh báo"];
    const rows = data.materials.map((m) => [
      m.name,
      m.category,
      formatNumber(m.currentStock, 0),
      formatNumber(m.minStock, 0),
      m.unit,
      formatCurrency(m.unitCost),
      m.isLowStock ? "Thấp" : "Đủ",
    ]);
    exportToCSV(headers, rows, "bao-cao-vat-tu");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Xuất CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mức tồn kho</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stockChartData}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="current" name="Tồn kho" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="min" name="Tối thiểu" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {data.lowStock.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-red-600">Cảnh báo tồn kho thấp ({data.lowStock.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vật liệu</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Tồn kho</TableHead>
                  <TableHead>Tối thiểu</TableHead>
                  <TableHead>Đơn vị</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.lowStock.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-red-600 font-medium">{formatNumber(item.currentStock, 0)}</TableCell>
                    <TableCell>{formatNumber(item.minStock, 0)}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tất cả vật liệu</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vật liệu</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Tồn kho</TableHead>
                <TableHead>Tối thiểu</TableHead>
                <TableHead>Đơn giá</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.materials.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{m.category}</TableCell>
                  <TableCell>{formatNumber(m.currentStock, 0)}</TableCell>
                  <TableCell>{formatNumber(m.minStock, 0)}</TableCell>
                  <TableCell>{formatCurrency(m.unitCost)}</TableCell>
                  <TableCell>
                    {m.isLowStock ? (
                      <Badge variant="destructive">Thấp</Badge>
                    ) : (
                      <Badge variant="default">Đủ</Badge>
                    )}
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
  if (!data || data.length === 0) {
    return <p className="text-muted-foreground">Không có dữ liệu nhà cung cấp.</p>;
  }

  const handleExport = () => {
    const headers = ["Nhà cung cấp", "Liên hệ", "SĐT", "Email", "Số đơn hàng", "Tổng giá trị", "Nợ phải trả"];
    const rows = data.map((s) => [
      s.name,
      s.contact || "-",
      s.phone || "-",
      s.email || "-",
      s.totalOrders,
      s.totalOrderValue,
      s.outstandingDebt,
    ]);
    exportToCSV(headers, rows, "bao-cao-nha-cung-cap");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Xuất CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nhà cung cấp</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhà cung cấp</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Số đơn hàng</TableHead>
                <TableHead>Tổng giá trị</TableHead>
                <TableHead>Nợ phải trả</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{s.name}</p>
                      {s.email && <p className="text-xs text-muted-foreground">{s.email}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {s.contact && <p className="text-sm">{s.contact}</p>}
                    {s.phone && <p className="text-sm text-muted-foreground">{s.phone}</p>}
                  </TableCell>
                  <TableCell>{s.totalOrders}</TableCell>
                  <TableCell>{formatCurrency(s.totalOrderValue)}</TableCell>
                  <TableCell>
                    {s.outstandingDebt > 0 ? (
                      <span className="text-red-600 font-medium">{formatCurrency(s.outstandingDebt)}</span>
                    ) : (
                      <span className="text-green-600">0 ₫</span>
                    )}
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

function WorkersReportTab({ data }: { data: WorkerReport | null }) {
  if (!data || data.length === 0) {
    return <p className="text-muted-foreground">Không có dữ liệu nhân công.</p>;
  }

  const totalWages = data.reduce((sum, w) => sum + w.totalWages, 0);
  const avgAttendance = data.reduce((sum, w) => sum + w.attendanceRate, 0) / data.length;

  const attendanceChartData = data.slice(0, 15).map((w) => ({
    name: w.name,
    rate: w.attendanceRate,
  }));

  const handleExport = () => {
    const headers = ["Công nhân", "SĐT", "Kỹ năng", "Lương/ngày", "Số ngày công", "Tỷ lệ chuyên cần (%)", "Tổng lương"];
    const rows = data.map((w) => [
      w.name,
      w.phone || "-",
      w.skill || "-",
      w.dailyWage,
      w.presentCount,
      Math.round(w.attendanceRate),
      w.totalWages,
    ]);
    exportToCSV(headers, rows, "bao-cao-nhan-cong");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Xuất CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng công nhân</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng lương</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalWages)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chuyên cần TB</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(avgAttendance)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tỷ lệ chuyên cần</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceChartData}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
              <Tooltip formatter={(value: number) => `${formatPercent(value)}`} />
              <Bar dataKey="rate" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chi tiết nhân công</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Công nhân</TableHead>
                <TableHead>Kỹ năng</TableHead>
                <TableHead>Lương/ngày</TableHead>
                <TableHead>Ngày công</TableHead>
                <TableHead>Chuyên cần</TableHead>
                <TableHead>Tổng lương</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{w.name}</p>
                      {w.phone && <p className="text-xs text-muted-foreground">{w.phone}</p>}
                    </div>
                  </TableCell>
                  <TableCell>{w.skill || "-"}</TableCell>
                  <TableCell>{formatCurrency(w.dailyWage)}</TableCell>
                  <TableCell>{w.presentCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={w.attendanceRate} className="h-2 w-16" />
                      <span className="text-sm">{formatPercent(w.attendanceRate)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(w.totalWages)}</TableCell>
                  <TableCell>
                    <Badge variant={w.status === "ACTIVE" ? "default" : "secondary"}>
                      {WORKER_STATUS_LABELS[w.status] || w.status}
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
