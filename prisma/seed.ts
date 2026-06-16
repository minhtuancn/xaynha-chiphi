import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Đang tạo dữ liệu mẫu...");

  // Xóa dữ liệu cũ — theo thứ tự khoá ngoại
  const tables = [
    "notification", "checklistItem", "checklist", "materialUsage",
    "purchaseOrderItem", "purchaseOrder", "inventoryTransaction",
    "photo", "document", "expense", "expenseCategory", "debt", "payment",
    "transaction", "account", "workerAttendance", "worker",
    "dailyLogPhoto", "dailyLog", "material", "materialCategory",
    "supplier", "constructionTask", "stageBudget", "constructionStage",
    "weatherRecord", "budget", "project", "setting", "auditLog", "session",
    "authAccount", "user",
  ];
  for (const t of tables) {
    await (prisma as any)[t].deleteMany();
  }

  // ===================== TÀI KHOẢN =====================
  const adminHash = await bcrypt.hash("Vkn@1234561", 10);
  const userHash = await bcrypt.hash("user123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@local.com",
      passwordHash: adminHash,
      name: "Nguyễn Văn Admin",
      role: "ADMIN",
      permissions: "{}",
    },
  });

  await prisma.user.create({
    data: {
      email: "user@local.com",
      passwordHash: userHash,
      name: "Trần Thị User",
      role: "USER",
      permissions: JSON.stringify({
        dashboard: ["view"],
        projects: ["view"],
        stages: ["view"],
        dailyLogs: ["view", "create", "edit"],
        materials: ["view"],
        inventory: ["view"],
        photos: ["view"],
      }),
    },
  });
  console.log("✅ Tài khoản đã tạo");

  // ===================== DỰ ÁN: TUẤN MƠ =====================
  const project = await prisma.project.create({
    data: {
      name: "Nhà anh chị Tuấn Mơ - 2 Tầng (8,1m x 14m)",
      address: "Xã Hồng Phong, Huyện Hoa Lư, Tỉnh Ninh Bình",
      budget: 1200000000,
      startDate: new Date("2026-04-08"),
      endDate: new Date("2028-08-08"),
      status: "ACTIVE",
      progress: 35,
      description:
        "Nhà ở 2 tầng 8,1x14m. Khởi công 08/04/2026. Hoàn thành móng & tầng 1: 15/06/2026. Còn lại: tầng 2, mái, điện nước, nội thất, sơn bả.",
    },
  });
  console.log("✅ Dự án Tuấn Mơ đã tạo");

  // Ngân sách
  await prisma.budget.create({
    data: {
      projectId: project.id,
      totalBudget: 1200000000,
      allocated: 850000000,
      spent: 562000000,
      remaining: 638000000,
    },
  });
  console.log("✅ Ngân sách đã tạo");

  // ===================== GIAI ĐOẠN THI CÔNG =====================
  const stageRaw = [
    { name: "Chuẩn bị mặt bằng",       order: 1,  status: "COMPLETED",   progress: 100, budget: 30000000,  actual: 31500000,  start: "2026-04-08",  end: "2026-04-23" },
    { name: "Móng và nền tầng 1",      order: 2,  status: "COMPLETED",   progress: 100, budget: 200000000, actual: 210000000, start: "2026-04-24",  end: "2026-05-18" },
    { name: "Tầng 1 - Khung, tường",   order: 3,  status: "COMPLETED",   progress: 100, budget: 350000000, actual: 294000000, start: "2026-05-19",  end: "2026-06-15" },
    { name: "Tầng 2 - Khung và tường", order: 4,  status: "IN_PROGRESS", progress: 15,  budget: 380000000, actual: 59850000,  start: null,       end: null },
    { name: "Mái nhà",                 order: 5,  status: "NOT_STARTED", progress: 0,   budget: 120000000, actual: 0,         start: null,       end: null },
    { name: "Hệ thống điện",           order: 6,  status: "NOT_STARTED", progress: 0,   budget: 80000000,  actual: 0,         start: null,       end: null },
    { name: "Hệ thống nước",           order: 7,  status: "NOT_STARTED", progress: 0,   budget: 70000000,  actual: 0,         start: null,       end: null },
    { name: "Hoàn thiện nội thất",     order: 8,  status: "NOT_STARTED", progress: 0,   budget: 200000000, actual: 0,         start: null,       end: null },
    { name: "Sơn và trang trí",        order: 9,  status: "NOT_STARTED", progress: 0,   budget: 50000000,  actual: 0,         start: null,       end: null },
    { name: "Kiểm tra và bàn giao",    order: 10, status: "NOT_STARTED", progress: 0,   budget: 20000000,  actual: 0,         start: null,       end: null },
  ];

  const stages: any[] = [];
  for (const s of stageRaw) {
    const stage = await prisma.constructionStage.create({
      data: {
        projectId: project.id,
        name: s.name,
        order: s.order,
        status: s.status as any,
        progress: s.progress,
        estimatedBudget: s.budget,
        actualCost: s.actual,
        startDate: s.start ? new Date(s.start) : null,
        endDate: s.end ? new Date(s.end) : null,
      },
    });
    stages.push(stage);
  }
  console.log("✅ Giai đoạn thi công đã tạo");

  // Tasks gắn với stage name
  const stageNameMap = Object.fromEntries(stages.map((s) => [s.name, s.id]));
  const taskDefs: [string, string, string, number][] = [
    ["Chuẩn bị mặt bằng",       "Đo đạc và cấp phép",          "COMPLETED", 100],
    ["Chuẩn bị mặt bằng",       "Phá dỡ công trình cũ",       "COMPLETED", 100],
    ["Chuẩn bị mặt bằng",       "San lấp mặt bằng",           "COMPLETED", 100],
    ["Chuẩn bị mặt bằng",       "Lắp hàng rào tạm",           "COMPLETED", 100],
    ["Móng và nền tầng 1",      "Đào móng",                   "COMPLETED", 100],
    ["Móng và nền tầng 1",      "Ép cọc bê tông",             "COMPLETED", 100],
    ["Móng và nền tầng 1",      "Đổ bê tông móng",            "COMPLETED", 100],
    ["Móng và nền tầng 1",      "Xây tường móng",             "COMPLETED", 100],
    ["Móng và nền tầng 1",      "Đổ nền tầng 1",              "COMPLETED", 100],
    ["Tầng 1 - Khung, tường",   "Đổ cột tầng 1",              "COMPLETED", 100],
    ["Tầng 1 - Khung, tường",   "Đổ dầm tầng 1",              "COMPLETED", 100],
    ["Tầng 1 - Khung, tường",   "Xây tường vách tầng 1",      "COMPLETED", 100],
    ["Tầng 1 - Khung, tường",   "Lắp khung cửa tầng 1",       "COMPLETED", 100],
    ["Tầng 1 - Khung, tường",   "Đổ sàn tầng 1",              "COMPLETED", 100],
    ["Tầng 2 - Khung và tường", "Đổ cột tầng 2",              "IN_PROGRESS", 30],
    ["Tầng 2 - Khung và tường", "Đổ dầm tầng 2",              "PENDING", 0],
    ["Tầng 2 - Khung và tường", "Xây tường vách tầng 2",      "PENDING", 0],
  ];

  for (const [stageName, taskName, status, progress] of taskDefs) {
    const sid = stageNameMap[stageName];
    if (!sid) continue;
    await prisma.constructionTask.create({
      data: { stageId: sid, name: String(taskName), status: status as any, progress: Number(progress) },
    });
  }
  console.log("✅ Công việc đã tạo");

  // ===================== DANH MỤC & VẬT LIỆU =====================
  const catDefs = [
    "Xi măng và bê tông", "Sắt thép", "Gạch và ceramic", "Cửa và khung",
    "Hệ thống điện", "Hệ thống nước", "Sơn và hoàn thiện", "Mái che",
  ];
  const cats: any[] = [];
  for (const name of catDefs) {
    cats.push(await prisma.materialCategory.create({ data: { name, description: "" } }));
  }

  const materialDefs: [number, string, string, number, number, number][] = [
    [0, "Xi măng PCB40",     "bao 50kg", 200, 50, 85000],
    [0, "Xi măng PCB30",     "bao 50kg", 100, 30, 72000],
    [0, "Cát xây dựng",      "m3",        30, 10, 280000],
    [0, "Cát san lấp",       "m3",        50, 20, 180000],
    [0, "Đá 1x2",            "m3",        20,  8, 380000],
    [0, "Đá 2x4",            "m3",        15,  5, 420000],
    [0, "Bê tông tươi C25",  "m3",         0,  0, 1200000],
    [1, "Sắt Φ10",           "cây 12m",  300,100, 115000],
    [1, "Sắt Φ12",           "cây 12m",  250, 80, 165000],
    [1, "Sắt Φ14",           "cây 12m",  200, 60, 225000],
    [1, "Sắt Φ16",           "cây 12m",  150, 50, 295000],
    [1, "Sắt Φ18",           "cây 12m",  100, 30, 375000],
    [1, "Sắt Φ20",           "cây 12m",   80, 20, 465000],
    [1, "Sắt D6",            "cây 12m",   50, 20, 28000],
    [2, "Gạch ống 4 holes",  "viên",    8000,3000, 1200],
    [2, "Gạch đặc",          "viên",    5000,2000, 1500],
    [2, "Gạch ốp tường 20x25","viên",  2000, 500, 35000],
    [2, "Gạch lát nền 60x60","viên",   1500, 500, 85000],
    [2, "Gạch lát sân 40x40","viên",    800, 300, 45000],
    [3, "Cửa gỗ công nghiệp","bộ",        8,   0, 1800000],
    [3, "Cửa nhôm Xingfa",   "m2",       25,   0, 1200000],
    [3, "Khung cửa thép",    "bộ",       12,   0, 450000],
    [4, "Dây điện 2.5mm²",   "cuộn 100m",15,   5, 850000],
    [4, "Dây điện 4mm²",     "cuộn 100m",10,   3, 1200000],
    [4, "Dây điện 6mm²",     "cuộn 100m", 5,   2, 1650000],
    [4, "Ổ cắm đơn",         "cái",      50,  20, 35000],
    [4, "Ổ cắm đôi",         "cái",      30,  10, 55000],
    [4, "CB 2 pha 32A",      "cái",      10,   5, 180000],
    [4, "CB 1 pha 20A",      "cái",      20,   8, 85000],
    [4, "Đèn LED downlight", "cái",      20,  10, 120000],
    [5, "Ống PVC Φ21",       "cây 4m",   50,  20, 32000],
    [5, "Ống PVC Φ27",       "cây 4m",   40,  15, 42000],
    [5, "Ống PVC Φ34",       "cây 4m",   30,  10, 58000],
    [5, "Ống PVC Φ42",       "cây 4m",   20,   8, 78000],
    [5, "Ống PPR Φ20",       "cây 4m",   30,  10, 85000],
    [5, "Ống PPR Φ25",       "cây 4m",   25,   8, 110000],
    [5, "Van nước Φ21",      "cái",      15,   5, 65000],
    [5, "Bồn cầu Inax",      "cái",       3,   0, 2500000],
    [5, "Chậu rửa Inax",     "cái",       3,   0, 1200000],
    [6, "Sơn Dulux nội thất 5L",  "thùng", 15,  5, 850000],
    [6, "Sơn Dulux ngoại thất 5L","thùng",10,  3, 950000],
    [6, "Sơn lót chống kiềm 5L",  "thùng", 8,  3, 450000],
    [6, "Bột trét tường",    "bao 20kg", 30,  10, 85000],
    [6, "Keo chà ron",       "kg",       20,   5, 120000],
    [6, "Phụ gia chống thấm","thùng 5kg", 5,   2, 350000],
    [7, "Tôn Bluescope 4 lớp","tấm 3.6m",30,  10, 450000],
    [7, "Xà gồ C75",         "cây 6m",   40,  15, 180000],
    [7, "Ngói lợp",          "viên",      0,   0, 15000],
  ];
  for (const [ci, name, unit, stock, min, cost] of materialDefs) {
    await prisma.material.create({
      data: { categoryId: cats[ci].id, name, unit, currentStock: stock, minStock: min, unitCost: cost },
    });
  }
  console.log("✅ Vật liệu đã tạo");

  // ===================== NHÀ CUNG CẤP =====================
  const supplierDefs = [
    { name: "Vật Liệu Xây Dựng Minh Tuấn", contact: "Nguyễn Minh Tuấn", phone: "0901234567", email: "tuan.vlxd@gmail.com", address: "123 Lý Thường Kiệt, Quận 10, TP.HCM", debtBalance: 25000000 },
    { name: "Sắt Thép Hòa Phát",           contact: "Trần Văn Hùng",    phone: "0912345678", email: "hung.hoaphat@gmail.com",  address: "456 Cộng Hòa, Quận Tân Bình, TP.HCM", debtBalance: 0 },
    { name: "Xi Măng Hà Tiên",              contact: "Lê Thị Mai",       phone: "0923456789", email: "mai.hatien@gmail.com",    address: "789 Trường Chinh, Quận Tân Phú, TP.HCM", debtBalance: 12000000 },
    { name: "Cửa Nhôm Xingfa Việt Nam",     contact: "Phạm Đức Trọng",  phone: "0934567890", email: "trong.xingfa@gmail.com",   address: "321 Nguyễn Oanh, Quận Gò Vấp, TP.HCM", debtBalance: 8000000 },
    { name: "Điện Nước Sài Gòn",            contact: "Hoàng Thị Lan",    phone: "0945678901", email: "lan.diennuoc@gmail.com",   address: "654 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM", debtBalance: 0 },
  ];
  const suppliers: any[] = [];
  for (const s of supplierDefs) {
    suppliers.push(await prisma.supplier.create({ data: s }));
  }
  console.log("✅ Nhà cung cấp đã tạo");

  // ===================== CÔNG NHÂN =====================
  const workerDefs = [
    { name: "Nguyễn Văn An",   phone: "0901111111", skill: "Thợ hồ chính",   dailyWage: 400000 },
    { name: "Trần Văn Bình",   phone: "0902222222", skill: "Thợ hồ chính",   dailyWage: 400000 },
    { name: "Lê Hoàng Cường",  phone: "0903333333", skill: "Thợ điện",       dailyWage: 450000 },
    { name: "Phạm Thị Dung",   phone: "0904444444", skill: "Thợ sơn",        dailyWage: 350000 },
    { name: "Hoàng Văn Em",    phone: "0905555555", skill: "Phụ hồ",         dailyWage: 280000 },
    { name: "Đỗ Thị Giang",    phone: "0906666666", skill: "Thợ ống nước",   dailyWage: 420000 },
    { name: "Ngô Văn Hùng",    phone: "0907777777", skill: "Thợ mộc",        dailyWage: 380000 },
    { name: "Bùi Văn Khanh",   phone: "0908888888", skill: "Thợ hồ",         dailyWage: 350000 },
  ];
  for (const w of workerDefs) {
    await prisma.worker.create({ data: w });
  }
  console.log("✅ Công nhân đã tạo");

  // ===================== TÀI KHOẢN NGÂN HÀNG =====================
  await prisma.account.create({ data: { name: "Tiền mặt dự án",            type: "CASH", balance: 350000000 } });
  await prisma.account.create({ data: { name: "Vietcombank - Chủ đầu tư",  type: "BANK", balance: 800000000 } });
  await prisma.account.create({ data: { name: "Techcombank - Dự phòng",    type: "BANK", balance: 350000000 } });
  console.log("✅ Tài khoản ngân hàng đã tạo");

  // ===================== DANH MỤC CHI PHÍ =====================
  const expCatDefs = [
    { name: "Vật liệu xây dựng", budget: 800000000 },
    { name: "Nhân công",         budget: 350000000 },
    { name: "Thiết bị và công cụ",budget: 100000000 },
    { name: "Phí và giấy phép",  budget: 50000000 },
    { name: "Chi phí khác",      budget: 200000000 },
  ];
  for (const ec of expCatDefs) {
    await prisma.expenseCategory.create({ data: ec });
  }
  console.log("✅ Danh mục chi phí đã tạo");

  // ===================== NHẬT KÝ THI CÔNG =====================
  // Dùng ngày fix: 09/06 - 15/06/2026
  const logDefs: { dateStr: string; condition: string; temp: number; humidity: number; wind: number; note: string; workers: number; issues?: string }[] = [
    { dateStr: "2026-06-09", condition: "sunny",  temp: 30, humidity: 74, wind: 8,  note: "Ngày thi công thứ 1. Đang thi công tầng 1, tiến độ đúng kế hoạch.", workers: 6 },
    { dateStr: "2026-06-10", condition: "cloudy", temp: 29, humidity: 73, wind: 13, note: "Ngày thi công thứ 2. Thi công tầng 2, hoàn thành phần khung.", workers: 8 },
    { dateStr: "2026-06-11", condition: "rainy",  temp: 33, humidity: 72, wind: 12, note: "Ngày thi công thứ 3. Đang thi công tầng 1, tiến độ đúng kế hoạch.", workers: 7 },
    { dateStr: "2026-06-12", condition: "cloudy", temp: 32, humidity: 71, wind: 11, note: "Ngày thi công thứ 4. Thi công tầng 2, hoàn thành phần khung.", workers: 6, issues: "Mưa lớn nên tạm nghỉ trưa" },
    { dateStr: "2026-06-13", condition: "sunny",  temp: 31, humidity: 70, wind: 10, note: "Ngày thi công thứ 5. Đang thi công tầng 1, tiến độ đúng kế hoạch.", workers: 8 },
    { dateStr: "2026-06-14", condition: "windy",  temp: 30, humidity: 68, wind: 15, note: "Ngày thi công thứ 6. Thi công tầng 2, hoàn thành phần khung.", workers: 7 },
    { dateStr: "2026-06-15", condition: "stormy", temp: 29, humidity: 82, wind: 20, note: "Ngày thi công thứ 7. Đang thi công tầng 1, tiến độ đúng kế hoạch.", workers: 5 },
  ];
  for (const d of logDefs) {
    await prisma.dailyLog.create({
      data: {
        projectId: project.id,
        date: new Date(d.dateStr),
        weather: JSON.stringify({
          condition: d.condition, temperature: d.temp, humidity: d.humidity, windSpeed: d.wind,
        }),
        temperature: d.temp,
        notes: d.note,
        issues: d.issues || null,
        workerCount: d.workers,
      },
    });
  }
  console.log("✅ Nhật ký thi công đã tạo");

  // ===================== CHI PHÍ =====================
  const expenseCatList = await prisma.expenseCategory.findMany();
  const expCatMap = Object.fromEntries(expenseCatList.map((c) => [c.name, c.id]));

  const expenseDefs: [string, number, string, string][] = [
    ["Vật liệu xây dựng", 58000000,  "2026-06-10", "Mua 500 cây sắt Φ12 + Φ14"],
    ["Vật liệu xây dựng", 17000000,  "2026-06-13", "Mua 200 bao xi măng PCB40"],
    ["Vật liệu xây dựng", 8400000,   "2026-06-11", "Mua gạch ống 7000 viên"],
    ["Nhân công",         28000000,  "2026-06-08", "Lương thợ hồ tuần 1"],
    ["Nhân công",         28000000,  "2026-06-15", "Lương thợ hồ tuần 2"],
    ["Thiết bị và công cụ",5500000,  "2026-06-07", "Mua dụng cụ thi công"],
    ["Phí và giấy phép",  15000000,  "2026-06-05", "Phí cấp phép xây dựng"],
  ];
  for (const [cat, amount, dateStr, desc] of expenseDefs) {
    await prisma.expense.create({
      data: {
        projectId: project.id,
        categoryId: expCatMap[cat],
        amount,
        date: new Date(dateStr),
        description: desc,
        status: "APPROVED",
        createdBy: admin.id,
      },
    });
  }
  console.log("✅ Chi phí đã tạo");

  // ===================== CÔNG NỢ =====================
  await prisma.debt.create({
    data: {
      supplierId: suppliers[0].id,
      type: "PAYABLE",
      amount: 25000000,
      paidAmount: 10000000,
      dueDate: new Date("2026-07-15"),
      status: "PARTIAL",
      notes: "Nợ tiền vật liệu tháng trước",
    },
  });
  await prisma.debt.create({
    data: {
      supplierId: suppliers[2].id,
      type: "PAYABLE",
      amount: 12000000,
      paidAmount: 0,
      dueDate: new Date("2026-07-20"),
      status: "UNPAID",
      notes: "Nợ tiền xi măng",
    },
  });
  console.log("✅ Công nợ đã tạo");

  // ===================== CHECKLIST =====================
  const stage3id = stageNameMap["Tầng 1 - Khung, tường"];
  const cl1 = await prisma.checklist.create({
    data: { stageId: stage3id, name: "Kiểm tra kết cấu tầng 1", order: 0 },
  });
  await prisma.checklistItem.create({ data: { checklistId: cl1.id, name: "Kiểm tra móng cột", completed: true, order: 0 } });
  await prisma.checklistItem.create({ data: { checklistId: cl1.id, name: "Đo kích thước dầm", completed: true, order: 1 } });
  await prisma.checklistItem.create({ data: { checklistId: cl1.id, name: "Kiểm tra mác bê tông", completed: false, order: 2 } });
  await prisma.checklistItem.create({ data: { checklistId: cl1.id, name: "Kiểm tra chiều cao tầng", completed: false, order: 3 } });

  const cl2 = await prisma.checklist.create({
    data: { stageId: stage3id, name: "Kiểm tra hệ thống điện tầng 1", order: 1 },
  });
  await prisma.checklistItem.create({ data: { checklistId: cl2.id, name: "Đo dây điện", completed: true, order: 0 } });
  await prisma.checklistItem.create({ data: { checklistId: cl2.id, name: "Kiểm tra CB", completed: true, order: 1 } });
  await prisma.checklistItem.create({ data: { checklistId: cl2.id, name: "Kiểm tra ổ cắm", completed: false, order: 2 } });
  await prisma.checklistItem.create({ data: { checklistId: cl2.id, name: "Kiểm tra đèn", completed: false, order: 3 } });
  console.log("✅ Checklist đã tạo");

  // ===================== ĐẶT HÀNG MUA =====================
  const allMaterials = await prisma.material.findMany();
  const ironMats = allMaterials.filter((m) => m.name.startsWith("Sắt Φ"));
  if (ironMats.length >= 3 && suppliers.length > 0) {
    const po1 = await prisma.purchaseOrder.create({
      data: {
        projectId: project.id,
        supplierId: suppliers[0].id,
        orderDate: new Date("2026-06-10"),
        status: "RECEIVED",
        notes: "Đơn hàng vật liệu cho tầng 1",
      },
    });
    let po1Total = 0;
    for (const mat of ironMats.slice(0, 3)) {
      const itemTotal = Number(mat.unitCost) * 100;
      po1Total += itemTotal;
      await prisma.purchaseOrderItem.create({
        data: { orderId: po1.id, materialId: mat.id, quantity: 100, unitPrice: Number(mat.unitCost), total: itemTotal },
      });
    }
    await prisma.purchaseOrder.update({ where: { id: po1.id }, data: { totalAmount: po1Total } });
  }

  const brickMats = allMaterials.filter((m) => m.name.startsWith("Gạch"));
  if (brickMats.length >= 2 && suppliers.length > 0) {
    const po2 = await prisma.purchaseOrder.create({
      data: {
        projectId: project.id,
        supplierId: suppliers[0].id,
        orderDate: new Date("2026-06-13"),
        status: "SENT",
        notes: "Đơn hàng gạch và ceramic",
      },
    });
    let po2Total = 0;
    for (const mat of brickMats.slice(0, 2)) {
      const itemTotal = Number(mat.unitCost) * 500;
      po2Total += itemTotal;
      await prisma.purchaseOrderItem.create({
        data: { orderId: po2.id, materialId: mat.id, quantity: 500, unitPrice: Number(mat.unitCost), total: itemTotal },
      });
    }
    await prisma.purchaseOrder.update({ where: { id: po2.id }, data: { totalAmount: po2Total } });
  }
  console.log("✅ Đặt hàng đã tạo");

  // ===================== ĐIỂM DANH CÔNG NHÂN =====================
  const workers = await prisma.worker.findMany({ orderBy: { name: "asc" } });
  const projectId = project.id;
  const attDates = ["2026-06-09", "2026-06-10", "2026-06-11", "2026-06-12", "2026-06-13", "2026-06-14", "2026-06-15"];
  const statuses = ["PRESENT", "PRESENT", "PRESENT", "LATE", "PRESENT", "ABSENT", "PRESENT"];
  for (const dateStr of attDates) {
    const date = new Date(dateStr);
    for (let i = 0; i < workers.length; i++) {
      const wStatus = dateStr === "2026-06-14" && i >= 2 ? "ABSENT" : statuses[attDates.indexOf(dateStr)];
      await prisma.workerAttendance.create({
        data: {
          workerId: workers[i].id,
          date,
          status: wStatus as any,
          checkIn: new Date(`${dateStr}T07:30:00`),
          checkOut: new Date(`${dateStr}T17:00:00`),
        },
      });
    }
  }
  console.log("✅ Điểm danh công nhân đã tạo");

  // ===================== GIAO DỊCH TÀI CHÍNH =====================
  const accounts = await prisma.account.findMany();
  const cashAcc = accounts.find((a) => a.type === "CASH");

  // Thu tiền từ chủ đầu tư
  await prisma.transaction.create({
    data: { accountId: accounts[1].id, userId: admin.id, type: "INCOME", amount: 200000000, date: new Date("2026-04-08"), description: "Chuyển khoản đợt 1 - Giai đoạn chuẩn bị mặt bằng" },
  });
  await prisma.transaction.create({
    data: { accountId: accounts[1].id, userId: admin.id, type: "INCOME", amount: 500000000, date: new Date("2026-04-25"), description: "Chuyển khoản đợt 2 - Móng và nền tầng 1" },
  });
  await prisma.transaction.create({
    data: { accountId: accounts[1].id, userId: admin.id, type: "INCOME", amount: 300000000, date: new Date("2026-05-20"), description: "Chuyển khoản đợt 3 - Tầng 1 hoàn thành" },
  });

  // Chi tiền mua vật liệu
  await prisma.transaction.create({
    data: { accountId: accounts[1].id, userId: admin.id, type: "EXPENSE", amount: 58000000, date: new Date("2026-06-10"), description: "Thanh toán sắt Φ12 + Φ14 cho VLXD Minh Tuấn" },
  });
  await prisma.transaction.create({
    data: { accountId: cashAcc!.id, userId: admin.id, type: "EXPENSE", amount: 17000000, date: new Date("2026-06-13"), description: "Thanh toán xi măng PCB40 cho Xi Măng Hà Tiên" },
  });
  await prisma.transaction.create({
    data: { accountId: cashAcc!.id, userId: admin.id, type: "EXPENSE", amount: 8400000, date: new Date("2026-06-11"), description: "Mua gạch ống cho tầng 1" },
  });
  await prisma.transaction.create({
    data: { accountId: accounts[1].id, userId: admin.id, type: "EXPENSE", amount: 28000000, date: new Date("2026-06-08"), description: "Chi lương thợ hồ tuần 1" },
  });
  await prisma.transaction.create({
    data: { accountId: accounts[1].id, userId: admin.id, type: "EXPENSE", amount: 28000000, date: new Date("2026-06-15"), description: "Chi lương thợ hồ tuần 2" },
  });
  console.log("✅ Giao dịch tài chính đã tạo");

  // ===================== GIAO DỊCH VẬT TƯ =====================
  const materials = await prisma.material.findMany();
  const cementMat = materials.find((m) => m.name === "Xi măng PCB40");
  const iron12Mat = materials.find((m) => m.name === "Sắt Φ12");
  const iron14Mat = materials.find((m) => m.name === "Sắt Φ14");
  const brickMat = materials.find((m) => m.name === "Gạch ống 4 holes");

  if (cementMat) {
    await prisma.inventoryTransaction.create({
      data: { projectId, materialId: cementMat.id, type: "IN", quantity: 200, date: new Date("2026-06-13"), reference: "PO-001", notes: "Nhập kho xi măng PCB40" },
    });
    await prisma.inventoryTransaction.create({
      data: { projectId, materialId: cementMat.id, type: "OUT", quantity: 50, date: new Date("2026-06-14"), reference: "DL-001", notes: "Sử dụng tầng 1" },
    });
  }
  if (iron12Mat) {
    await prisma.inventoryTransaction.create({
      data: { projectId, materialId: iron12Mat.id, type: "IN", quantity: 100, date: new Date("2026-06-10"), reference: "PO-001", notes: "Nhập kho sắt Φ12" },
    });
  }
  if (iron14Mat) {
    await prisma.inventoryTransaction.create({
      data: { projectId, materialId: iron14Mat.id, type: "IN", quantity: 80, date: new Date("2026-06-10"), reference: "PO-001", notes: "Nhập kho sắt Φ14" },
    });
  }
  if (brickMat) {
    await prisma.inventoryTransaction.create({
      data: { projectId, materialId: brickMat.id, type: "IN", quantity: 7000, date: new Date("2026-06-11"), reference: "PO-002", notes: "Nhập kho gạch ống" },
    });
  }
  console.log("✅ Giao dịch vật tư đã tạo");

  // ===================== THANH TOÁN =====================
  const debtsForPay = await prisma.debt.findMany({ take: 1 });
  const payAcc = accounts.find((a) => a.type === "CASH") || accounts[0];
  if (debtsForPay.length > 0) {
    await prisma.payment.create({
      data: {
        debtId: debtsForPay[0].id,
        accountId: payAcc.id,
        amount: 10000000,
        date: new Date("2026-06-01"),
        method: "CASH",
        notes: "Thanh toán 1 phần nợ VLXD Minh Tuấn",
      },
    });
    console.log("✅ Thanh toán đã tạo");
  }

  // ===================== CÀI ĐẶT =====================
  await prisma.setting.create({ data: { key: "project.defaultLat", value: "10.7769" } });
  await prisma.setting.create({ data: { key: "project.defaultLon", value: "106.7009" } });
  console.log("✅ Cài đặt đã tạo");

  console.log("\n🎉 Dữ liệu mẫu đã được tạo hoàn tất!");
  console.log(`   Dự án: Nhà anh chị Tuấn Mơ - 2 Tầng (8,1m x 14m)`);
  console.log(`   Địa chỉ: Xã Hồng Phong, Huyện Hoa Lư, Tỉnh Ninh Bình`);
  console.log(`   Ngân sách: 1.200.000.000₫`);
  console.log(`   Admin: admin@local.com / Vkn@1234561`);
  console.log(`   User:  user@local.com / user123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
