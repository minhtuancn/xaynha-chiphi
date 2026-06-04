"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getUsers,
  createUser,
  updateUser,
  updateUserPermissions,
  toggleUserActive,
} from "@/actions/settings";
import {
  type Permissions,
  type ModuleName,
  type ModulePermission,
  parsePermissions,
} from "@/lib/utils";
import { Plus, Pencil, Power } from "lucide-react";
import { formatDate } from "@/lib/utils";

const MODULES: ModuleName[] = [
  "dashboard",
  "projects",
  "stages",
  "dailyLogs",
  "materials",
  "inventory",
  "purchaseOrders",
  "suppliers",
  "workers",
  "attendance",
  "expenses",
  "accounts",
  "debts",
  "photos",
  "documents",
  "reports",
  "settings",
];

const PERMISSIONS: ModulePermission[] = ["view", "create", "edit", "delete"];

const MODULE_LABELS: Record<ModuleName, string> = {
  dashboard: "Tổng quan",
  projects: "Dự án",
  stages: "Giai đoạn",
  dailyLogs: "Nhật ký",
  materials: "Vật liệu",
  inventory: "Tồn kho",
  purchaseOrders: "Đặt hàng",
  suppliers: "Nhà cung cấp",
  workers: "Công nhân",
  attendance: "Chấm công",
  expenses: "Chi phí",
  accounts: "Tài khoản",
  debts: "Công nợ",
  photos: "Hình ảnh",
  documents: "Tài liệu",
  materialUsage: "Vật tư sử dụng",
  checklists: "Checklist",
  notifications: "Thông báo",
  reports: "Báo cáo",
  settings: "Cài đặt",
};

const PERMISSION_LABELS: Record<ModulePermission, string> = {
  view: "Xem",
  create: "Tạo",
  edit: "Sửa",
  delete: "Xóa",
};

type UserRow = Awaited<ReturnType<typeof getUsers>>[number];

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "USER" as "ADMIN" | "USER",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "USER" as "ADMIN" | "USER",
  });

  const [editPermissions, setEditPermissions] = useState<Permissions>({});

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      toast({ title: "Không thể tải danh sách user", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!createForm.email || !createForm.password || !createForm.name) {
      toast({ title: "Vui lòng điền đầy đủ thông tin", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await createUser(createForm);
      toast({ title: "Đã tạo user" });
      setShowCreate(false);
      setCreateForm({ email: "", password: "", name: "", role: "USER" });
      await loadUsers();
    } catch (e: unknown) {
      toast({
        title: "Lỗi khi tạo user",
        description: e instanceof Error ? e.message : "Lỗi không xác định",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  function openEdit(user: UserRow) {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role });
    setEditPermissions(parsePermissions(user.permissions));
  }

  async function handleSaveEdit() {
    if (!editingUser) return;
    setSaving(true);
    try {
      await updateUser(editingUser.id, {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
      });
      await updateUserPermissions(editingUser.id, editPermissions);
      toast({ title: "Đã cập nhật user" });
      setEditingUser(null);
      await loadUsers();
    } catch (e: unknown) {
      toast({
        title: "Lỗi khi cập nhật",
        description: e instanceof Error ? e.message : "Lỗi không xác định",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      await toggleUserActive(id);
      await loadUsers();
    } catch (e: unknown) {
      toast({
        title: "Lỗi",
        description: e instanceof Error ? e.message : "Lỗi không xác định",
        variant: "destructive",
      });
    }
  }

  function togglePermission(module: ModuleName, action: ModulePermission) {
    setEditPermissions((prev) => {
      const current = prev[module] ?? [];
      const updated = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action];
      return { ...prev, [module]: updated };
    });
  }

  if (loading) {
    return <div className="p-6">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo người dùng
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Đăng nhập cuối</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.role === "ADMIN" ? "destructive" : "secondary"}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.isActive ? "default" : "outline"}>
                  {user.isActive ? "Hoạt động" : "Ngưng"}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(user)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant={user.isActive ? "destructive" : "default"}
                  size="sm"
                  onClick={() => handleToggle(user.id)}
                >
                  <Power className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo người dùng mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Tên</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                placeholder="Nhập tên"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm({ ...createForm, email: e.target.value })
                }
                placeholder="Nhập email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Mật khẩu</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm({ ...createForm, password: e.target.value })
                }
                placeholder="Nhập mật khẩu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Vai trò</Label>
              <Select
                value={createForm.role}
                onValueChange={(v: "ADMIN" | "USER") =>
                  setCreateForm({ ...createForm, role: v })
                }
              >
                <SelectTrigger id="create-role">
                  <SelectValue />
                </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Người dùng</SelectItem>
                    <SelectItem value="ADMIN">Quản trị</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? "Đang tạo..." : "Tạo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Tên</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vai trò</Label>
                  <Select
                    value={editForm.role}
                    onValueChange={(v: "ADMIN" | "USER") =>
                      setEditForm({ ...editForm, role: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Người dùng</SelectItem>
                      <SelectItem value="ADMIN">Quản trị</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Ma trận phân quyền</h3>
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48">Module</TableHead>
                      {PERMISSIONS.map((p) => (
                        <TableHead key={p} className="text-center">
                          {PERMISSION_LABELS[p]}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MODULES.map((mod) => (
                      <TableRow key={mod}>
                        <TableCell className="font-medium">
                          {MODULE_LABELS[mod]}
                        </TableCell>
                        {PERMISSIONS.map((perm) => {
                          const checked =
                            editPermissions[mod]?.includes(perm) ?? false;
                          return (
                            <TableCell key={perm} className="text-center">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() =>
                                  togglePermission(mod, perm)
                                }
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Hủy
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
