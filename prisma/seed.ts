import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Đang tạo dữ liệu mẫu...");

  // Xóa dữ liệu cũ
  await prisma.notification.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.checklist.deleteMany();
  await prisma.materialUsage.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.document.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.debt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.workerAttendance.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.material.deleteMany();
  await prisma.materialCategory.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.constructionTask.deleteMany();
  await prisma.stageBudget.deleteMany();
  await prisma.constructionStage.deleteMany();
  await prisma.dailyLog.deleteMany();
  await prisma.weatherRecord.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Tạo tài khoản
  const adminHash = await bcrypt.hash("admin123", 10);
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

  const user = await prisma.user.create({
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

  // Tạo dự án: Nhà ở 2 tầng
  const project = await prisma.project.create({
    data: {
      name: "Nhà ở 2 tầng - Đường Nguyễn Văn Linh",
      address: "45 Nguyễn Văn Linh, Phường Tân Phong, Quận 7, TP.HCM",
      budget: 1500000000,
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-08-30"),
      status: "ACTIVE",
      progress: 35,
      description:
        "Nhà ở riêng lẻ 2 tầng, mỗi tầng 100m², tổng diện tích sàn 200m². Dự toán tổng chi phí 1,5 tỷ đồng.",
    },
  });

  console.log("✅ Dự án đã tạo");

  // Tạo ngân sách
  await prisma.budget.create({
    data: {
      projectId: project.id,
      totalBudget: 1500000000,
      allocated: 900000000,
      spent: 525000000,
      remaining: 975000000,
    },
  });

  // Tạo giai đoạn thi công
  const stagesData = [
    {
      name: "Chuẩn bị mặt bằng",
      order: 1,
      progress: 100,
      estimatedBudget: 30000000,
      status: "COMPLETED",
    },
    {
      name: "Móng và nền",
      order: 2,
      progress: 100,
      estimatedBudget: 200000000,
      status: "COMPLETED",
    },
    {
      name: "Tầng 1 - Khung và tường",
      order: 3,
      progress: 80,
      estimatedBudget: 350000000,
      status: "IN_PROGRESS",
    },
    {
      name: "Tầng 2 - Khung và tường",
      order: 4,
      progress: 15,
      estimatedBudget: 380000000,
      status: "IN_PROGRESS",
    },
    {
      name: "Mái nhà",
      order: 5,
      progress: 0,
      estimatedBudget: 120000000,
      status: "NOT_STARTED",
    },
    {
      name: "Hệ thống điện",
      order: 6,
      progress: 0,
      estimatedBudget: 80000000,
      status: "NOT_STARTED",
    },
    {
      name: "Hệ thống nước",
      order: 7,
      progress: 0,
      estimatedBudget: 70000000,
      status: "NOT_STARTED",
    },
    {
      name: "Hoàn thiện nội thất",
      order: 8,
      progress: 0,
      estimatedBudget: 200000000,
      status: "NOT_STARTED",
    },
    {
      name: "Sơn và trang trí",
      order: 9,
      progress: 0,
      estimatedBudget: 50000000,
      status: "NOT_STARTED",
    },
    {
      name: "Kiểm tra và bàn giao",
      order: 10,
      progress: 0,
      estimatedBudget: 20000000,
      status: "NOT_STARTED",
    },
  ];

  const stages = [];
  for (const sd of stagesData) {
    const stage = await prisma.constructionStage.create({
      data: {
        projectId: project.id,
        name: sd.name,
        order: sd.order,
        progress: sd.progress,
        estimatedBudget: sd.estimatedBudget,
        actualCost: Math.round(sd.estimatedBudget * (sd.progress / 100) * 1.05),
        status: sd.status as any,
      },
    });
    stages.push(stage);
  }

  console.log("✅ Các giai đoạn thi công đã tạo");

  // Tạo tasks cho các giai đoạn
  const tasksData: Record<string, { name: string; status: string; progress: number }[]> = {
    "Chuẩn bị mặt bằng": [
      { name: "Đo đạc và cấp phép", status: "COMPLETED", progress: 100 },
      { name: "Phá dỡ công trình cũ", status: "COMPLETED", progress: 100 },
      { name: "San lấp mặt bằng", status: "COMPLETED", progress: 100 },
      { name: "Lắp hàng rào tạm", status: "COMPLETED", progress: 100 },
    ],
    "Móng và nền": [
      { name: "Đào móng", status: "COMPLETED", progress: 100 },
      { name: "Ép cọc bê tông", status: "COMPLETED", progress: 100 },
      { name: "Đổ bê tông móng", status: "COMPLETED", progress: 100 },
      { name: "Xây tường móng", status: "COMPLETED", progress: 100 },
      { name: "Đổ nền tầng 1", status: "COMPLETED", progress: 100 },
    ],
    "Tầng 1 - Khung và tường": [
      { name: "Đổ cột tầng 1", status: "COMPLETED", progress: 100 },
      { name: "Đổ dầm tầng 1", status: "COMPLETED", progress: 100 },
      { name: "Xây tường vách tầng 1", status: "IN_PROGRESS", progress: 80 },
      { name: "Lắp khung cửa tầng 1", status: "IN_PROGRESS", progress: 60 },
      { name: "Đổ sàn tầng 1", status: "PENDING", progress: 0 },
    ],
    "Tầng 2 - Khung và tường": [
      { name: "Đổ cột tầng 2", status: "IN_PROGRESS", progress: 30 },
      { name: "Đổ dầm tầng 2", status: "PENDING", progress: 0 },
      { name: "Xây tường vách tầng 2", status: "PENDING", progress: 0 },
    ],
  };

  for (const [stageName, tasks] of Object.entries(tasksData)) {
    const stage = stages.find((s) => s.name === stageName);
    if (!stage) continue;

    for (const td of tasks) {
      await prisma.constructionTask.create({
        data: {
          stageId: stage.id,
          name: td.name,
          status: td.status as any,
          progress: td.progress,
        },
      });
    }
  }

  console.log("✅ Các công việc đã tạo");

  // Tạo danh mục vật liệu
  const categories = [
    { name: "Xi măng và bê tông", description: "Xi măng, cát, đá, bê tông tươi" },
    { name: "Sắt thép", description: "Các loại sắt thép xây dựng" },
    { name: "Gạch và ceramic", description: "Gạch xây, gạch ốp lát, ceramic" },
    { name: "Cửa và khung", description: "Cửa gỗ, cửa nhôm, khung cửa" },
    { name: "Hệ thống điện", description: "Dây điện, ổ capse, CB, đèn" },
    { name: "Hệ thống nước", description: "Ống nước, van, vòi, thiết bị vệ sinh" },
    { name: "Sơn và hoàn thiện", description: "Sơn nước, sơn dầu, vật liệu hoàn thiện" },
    { name: "Mái che", description: "Tôn mái, ngói, xà gồ" },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const c = await prisma.materialCategory.create({ data: cat });
    createdCategories.push(c);
  }

  console.log("✅ Danh mục vật liệu đã tạo");

  // Tạo vật liệu mẫu đầy đủ
  const materials = [
    { categoryId: createdCategories[0].id, name: "Xi măng PCB40", unit: "bao 50kg", currentStock: 200, minStock: 50, unitCost: 85000 },
    { categoryId: createdCategories[0].id, name: "Xi măng PCBS30", unit: "bao 50kg", currentStock: 100, minStock: 30, unitCost: 72000 },
    { categoryId: createdCategories[0].id, name: "Cát xây dựng", unit: "m3", currentStock: 30, minStock: 10, unitCost: 280000 },
    { categoryId: createdCategories[0].id, name: "Cát san lấp", unit: "m3", currentStock: 50, minStock: 20, unitCost: 180000 },
    { categoryId: createdCategories[0].id, name: "Đá 1x2", unit: "m3", currentStock: 20, minStock: 8, unitCost: 380000 },
    { categoryId: createdCategories[0].id, name: "Đá 2x4", unit: "m3", currentStock: 15, minStock: 5, unitCost: 420000 },
    { categoryId: createdCategories[0].id, name: "Bê tông tươi C25", unit: "m3", currentStock: 0, minStock: 0, unitCost: 1200000 },
    { categoryId: createdCategories[1].id, name: "Sắt Φ10", unit: "cây 12m", currentStock: 300, minStock: 100, unitCost: 115000 },
    { categoryId: createdCategories[1].id, name: "Sắt Φ12", unit: "cây 12m", currentStock: 250, minStock: 80, unitCost: 165000 },
    { categoryId: createdCategories[1].id, name: "Sắt Φ14", unit: "cây 12m", currentStock: 200, minStock: 60, unitCost: 225000 },
    { categoryId: createdCategories[1].id, name: "Sắt Φ16", unit: "cây 12m", currentStock: 150, minStock: 50, unitCost: 295000 },
    { categoryId: createdCategories[1].id, name: "Sắt Φ18", unit: "cây 12m", currentStock: 100, minStock: 30, unitCost: 375000 },
    { categoryId: createdCategories[1].id, name: "Sắt Φ20", unit: "cây 12m", currentStock: 80, minStock: 20, unitCost: 465000 },
    { categoryId: createdCategories[1].id, name: "Sắt D6", unit: "cây 12m", currentStock: 50, minStock: 20, unitCost: 28000 },
    { categoryId: createdCategories[2].id, name: "Gạch ống 4 holes", unit: "viên", currentStock: 8000, minStock: 3000, unitCost: 1200 },
    { categoryId: createdCategories[2].id, name: "Gạch đặc", unit: "viên", currentStock: 5000, minStock: 2000, unitCost: 1500 },
    { categoryId: createdCategories[2].id, name: "Gạch ốp tường 20x25", unit: "viên", currentStock: 2000, minStock: 500, unitCost: 35000 },
    { categoryId: createdCategories[2].id, name: "Gạch lát nền 60x60", unit: "viên", currentStock: 1500, minStock: 500, unitCost: 85000 },
    { categoryId: createdCategories[2].id, name: "Gạch lát sân 40x40", unit: "viên", currentStock: 800, minStock: 300, unitCost: 45000 },
    { categoryId: createdCategories[3].id, name: "Cửa gỗ công nghiệp", unit: "bộ", currentStock: 8, minStock: 0, unitCost: 1800000 },
    { categoryId: createdCategories[3].id, name: "Cửa nhôm Xingfa", unit: "m2", currentStock: 25, minStock: 0, unitCost: 1200000 },
    { categoryId: createdCategories[3].id, name: "Khung cửa thép", unit: "bộ", currentStock: 12, minStock: 0, unitCost: 450000 },
    { categoryId: createdCategories[4].id, name: "Dây điện 2.5mm²", unit: "cuộn 100m", currentStock: 15, minStock: 5, unitCost: 850000 },
    { categoryId: createdCategories[4].id, name: "Dây điện 4mm²", unit: "cuộn 100m", currentStock: 10, minStock: 3, unitCost: 1200000 },
    { categoryId: createdCategories[4].id, name: "Dây điện 6mm²", unit: "cuộn 100m", currentStock: 5, minStock: 2, unitCost: 1650000 },
    { categoryId: createdCategories[4].id, name: "Ổ capse đơn", unit: "cái", currentStock: 50, minStock: 20, unitCost: 35000 },
    { categoryId: createdCategories[4].id, name: "Ổ capse đôi", unit: "cái", currentStock: 30, minStock: 10, unitCost: 55000 },
    { categoryId: createdCategories[4].id, name: "CB 2 pha 32A", unit: "cái", currentStock: 10, minStock: 5, unitCost: 180000 },
    { categoryId: createdCategories[4].id, name: "CB 1 pha 20A", unit: "cái", currentStock: 20, minStock: 8, unitCost: 85000 },
    { categoryId: createdCategories[4].id, name: "Đèn LED downlight", unit: "cái", currentStock: 20, minStock: 10, unitCost: 120000 },
    { categoryId: createdCategories[5].id, name: "Ống PVC Φ21", unit: "cây 4m", currentStock: 50, minStock: 20, unitCost: 32000 },
    { categoryId: createdCategories[5].id, name: "Ống PVC Φ27", unit: "cây 4m", currentStock: 40, minStock: 15, unitCost: 42000 },
    { categoryId: createdCategories[5].id, name: "Ống PVC Φ34", unit: "cây 4m", currentStock: 30, minStock: 10, unitCost: 58000 },
    { categoryId: createdCategories[5].id, name: "Ống PVC Φ42", unit: "cây 4m", currentStock: 20, minStock: 8, unitCost: 78000 },
    { categoryId: createdCategories[5].id, name: "Ống PPR Φ20", unit: "cây 4m", currentStock: 30, minStock: 10, unitCost: 85000 },
    { categoryId: createdCategories[5].id, name: "Ống PPR Φ25", unit: "cây 4m", currentStock: 25, minStock: 8, unitCost: 110000 },
    { categoryId: createdCategories[5].id, name: "Van nước Φ21", unit: "cái", currentStock: 15, minStock: 5, unitCost: 65000 },
    { categoryId: createdCategories[5].id, name: "Bồn cầu Inax", unit: "cái", currentStock: 3, minStock: 0, unitCost: 2500000 },
    { categoryId: createdCategories[5].id, name: "Chậu rửa Inax", unit: "cái", currentStock: 3, minStock: 0, unitCost: 1200000 },
    { categoryId: createdCategories[6].id, name: "Sơn Dulux nội thất 5L", unit: "thùng", currentStock: 15, minStock: 5, unitCost: 850000 },
    { categoryId: createdCategories[6].id, name: "Sơn Dulux ngoại thất 5L", unit: "thùng", currentStock: 10, minStock: 3, unitCost: 950000 },
    { categoryId: createdCategories[6].id, name: "Sơn lót chống kiềm 5L", unit: "thùng", currentStock: 8, minStock: 3, unitCost: 450000 },
    { categoryId: createdCategories[6].id, name: "Bột trét tường", unit: "bao 20kg", currentStock: 30, minStock: 10, unitCost: 85000 },
    { categoryId: createdCategories[6].id, name: "Keo chà ron", unit: "kg", currentStock: 20, minStock: 5, unitCost: 120000 },
    { categoryId: createdCategories[6].id, name: "Phụ gia chống thấm", unit: "thùng 5kg", currentStock: 5, minStock: 2, unitCost: 350000 },
    { categoryId: createdCategories[7].id, name: "Tôn Bluescope 4 lớp", unit: "tấm 3.6m", currentStock: 30, minStock: 10, unitCost: 450000 },
    { categoryId: createdCategories[7].id, name: "Xà gồ C75", unit: "cây 6m", currentStock: 40, minStock: 15, unitCost: 180000 },
    { categoryId: createdCategories[7].id, name: "Ngói ?", unit: "viên", currentStock: 0, minStock: 0, unitCost: 15000 },
  ];

  for (const mat of materials) {
    await prisma.material.create({ data: mat });
  }

  console.log("✅ Vật liệu đã tạo");

  const suppliers = [
    { name: "Vật Liệu Xây Dựng Minh Tuấn", contact: "Nguyễn Minh Tuấn", phone: "0901234567", email: "tuan.vlxd@gmail.com", address: "123 Lý Thường Kiệt, Quận 10, TP.HCM", debtBalance: 25000000 },
    { name: "Sắt Thép Hòa Phát", contact: "Trần Văn Hùng", phone: "0912345678", email: "hung.hoaphat@gmail.com", address: "456 Cộng Hòa, Quận Tân Bình, TP.HCM", debtBalance: 0 },
    { name: "Xi Măng Hà Tiên", contact: "Lê Thị Mai", phone: "0923456789", email: "mai.hatien@gmail.com", address: "789 Trường Chinh, Quận Tân Phú, TP.HCM", debtBalance: 12000000 },
    { name: "Cửa Nhôm Xingfa Việt Nam", contact: "Phạm Đức Trọng", phone: "0934567890", email: "trong.xingfa@gmail.com", address: "321 Nguyễn Oanh, Quận Gò Vấp, TP.HCM", debtBalance: 8000000 },
    { name: "Điện Nước Sài Gòn", contact: "Hoàng Thị Lan", phone: "0945678901", email: "lan.diennuoc@gmail.com", address: "654 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM", debtBalance: 0 },
  ];

  for (const sup of suppliers) {
    await prisma.supplier.create({ data: sup });
  }

  console.log("✅ Nhà cung cấp đã tạo");

  const workers = [
    { name: "Nguyễn Văn An", phone: "0901111111", skill: "Thợ hồ chính", dailyWage: 400000 },
    { name: "Trần Văn Bình", phone: "0902222222", skill: "Thợ hồ chính", dailyWage: 400000 },
    { name: "Lê Hoàng Cường", phone: "0903333333", skill: "Thợ điện", dailyWage: 450000 },
    { name: "Phạm Thị Dung", phone: "0904444444", skill: "Thợ sơn", dailyWage: 350000 },
    { name: "Hoàng Văn Em", phone: "0905555555", skill: "Phụ hồ", dailyWage: 280000 },
    { name: "Đỗ Thị Giang", phone: "0906666666", skill: "Thợ ống nước", dailyWage: 420000 },
    { name: "Ngô Văn Hùng", phone: "0907777777", skill: "Thợ mộc", dailyWage: 380000 },
    { name: "Bùi Văn Khanh", phone: "0908888888", skill: "Thợ hồ", dailyWage: 350000 },
  ];

  for (const w of workers) {
    await prisma.worker.create({ data: w });
  }

  console.log("✅ Công nhân đã tạo");

  await prisma.account.create({
    data: { name: "Tiền mặt dự án", type: "CASH", balance: 350000000 },
  });
  await prisma.account.create({
    data: { name: "Vietcombank - Chủ đầu tư", type: "BANK", balance: 800000000 },
  });
  await prisma.account.create({
    data: { name: "Techcombank - Dự phòng", type: "BANK", balance: 350000000 },
  });

  console.log("✅ Tài khoản đã tạo");

  const expenseCats = [
    { name: "Vật liệu xây dựng", budget: 800000000 },
    { name: "Nhân công", budget: 350000000 },
    { name: "Thiết bị và công cụ", budget: 100000000 },
    { name: "Phí và giấy phép", budget: 50000000 },
    { name: "Chi phí khác", budget: 200000000 },
  ];

  for (const ec of expenseCats) {
    await prisma.expenseCategory.create({ data: ec });
  }

  console.log("✅ Danh mục chi phí đã tạo");

  const today = new Date();
  const weatherConditions = ["nắng", "nắng nhiều", "có mây", "mưa nhỏ", "nắng", "nhiều mây", "nắng"];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    await prisma.dailyLog.create({
      data: {
        projectId: project.id,
        date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        weather: JSON.stringify({
          condition: weatherConditions[6 - i],
          temperature: 29 + (i % 5),
          humidity: 68 + (i % 12),
          windSpeed: 8 + (i % 6),
        }),
        temperature: 29 + (i % 5),
        notes: `Ngày thi công thứ ${7 - i}. ${
          i % 2 === 0
            ? "Đang thi công tầng 1, tiến độ đúng kế hoạch."
            : "Thi công tầng 2, hoàn thành phần khung."
        }`,
        issues: i === 3 ? "Mưa lớn不得不 tạm nghỉ trưa" : null,
        workerCount: 6 + (i % 3),
      },
    });
  }

  console.log("✅ Nhật ký đã tạo");

  const expenseCatList = await prisma.expenseCategory.findMany();
  const expCatMap = expenseCatList.reduce((map, c) => {
    map[c.name] = c.id;
    return map;
  }, {} as Record<string, string>);

  const expenses = [
    { catName: "Vật liệu xây dựng", amount: 17000000, description: "Mua 200 bao xi măng PCB40", date: -2 },
    { catName: "Vật liệu xây dựng", amount: 58000000, description: "Mua 500 cây sắt Φ12 + Φ14", date: -5 },
    { catName: "Nhân công", amount: 28000000, description: "Lương thợ hồ tuần 1", date: -7 },
    { catName: "Nhân công", amount: 28000000, description: "Lương thợ hồ tuần 2", date: 0 },
    { catName: "Vật liệu xây dựng", amount: 8400000, description: "Mua gạch ống 7000 viên", date: -4 },
    { catName: "Phí và giấy phép", amount: 15000000, description: "Phí cấp phép xây dựng", date: -10 },
    { catName: "Thiết bị và công cụ", amount: 5500000, description: "Mua dụng cụ thi công", date: -8 },
  ];

  for (const exp of expenses) {
    const d = new Date(today);
    d.setDate(d.getDate() + exp.date);
    await prisma.expense.create({
      data: {
        projectId: project.id,
        categoryId: expCatMap[exp.catName] || expenseCatList[0].id,
        amount: exp.amount,
        date: d,
        description: exp.description,
        status: "APPROVED",
        createdBy: admin.id,
      },
    });
  }

  console.log("✅ Chi phí đã tạo");

  const supplierList = await prisma.supplier.findMany();
  const materialList = await prisma.material.findMany();

  if (supplierList.length > 0 && materialList.length > 0) {
    const po1 = await prisma.purchaseOrder.create({
      data: {
        projectId: project.id,
        supplierId: supplierList[0].id,
        orderDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5),
        status: "RECEIVED",
        notes: "Đơn hàng vật liệu cho tầng 1",
      },
    });

    const ironMaterials = materialList.filter((m) => m.name.includes("Sắt"));
    let po1Total = 0;
    for (const mat of ironMaterials.slice(0, 3)) {
      const itemTotal = Number(mat.unitCost) * 100;
      po1Total += itemTotal;
      await prisma.purchaseOrderItem.create({
        data: {
          orderId: po1.id,
          materialId: mat.id,
          quantity: 100,
          unitPrice: Number(mat.unitCost),
          total: itemTotal,
        },
      });
    }
    await prisma.purchaseOrder.update({
      where: { id: po1.id },
      data: { totalAmount: po1Total },
    });

    const po2 = await prisma.purchaseOrder.create({
      data: {
        projectId: project.id,
        supplierId: supplierList[0].id,
        orderDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2),
        status: "SENT",
        notes: "Đơn hàng gạch và ceramic",
      },
    });

    const brickMaterials = materialList.filter((m) => m.name.includes("Gạch"));
    let po2Total = 0;
    for (const mat of brickMaterials.slice(0, 2)) {
      const itemTotal = Number(mat.unitCost) * 500;
      po2Total += itemTotal;
      await prisma.purchaseOrderItem.create({
        data: {
          orderId: po2.id,
          materialId: mat.id,
          quantity: 500,
          unitPrice: Number(mat.unitCost),
          total: itemTotal,
        },
      });
    }
    await prisma.purchaseOrder.update({
      where: { id: po2.id },
      data: { totalAmount: po2Total },
    });
  }

  console.log("✅ Đơn đặt hàng đã tạo");

  if (supplierList.length > 0) {
    await prisma.debt.create({
      data: {
        supplierId: supplierList[0].id,
        type: "PAYABLE",
        amount: 25000000,
        paidAmount: 10000000,
        status: "PARTIAL",
        dueDate: new Date(today.getFullYear(), today.getMonth() + 1, 15),
        notes: "Nợ tiền vật liệu tháng trước",
      },
    });

    await prisma.debt.create({
      data: {
        supplierId: supplierList[2].id,
        type: "PAYABLE",
        amount: 12000000,
        paidAmount: 0,
        status: "UNPAID",
        dueDate: new Date(today.getFullYear(), today.getMonth() + 1, 20),
        notes: "Nợ tiền xi măng",
      },
    });
  }

  console.log("✅ Công nợ đã tạo");

  const stageForChecklist = stages[2];
  if (stageForChecklist) {
    const cl1 = await prisma.checklist.create({
      data: { stageId: stageForChecklist.id, name: "Kiểm tra kết cấu tầng 1", order: 0 },
    });
    const cl1Items = [
      "Kiểm tra móng cột",
      "Đo kích thước dầm",
      "Kiểm tra mác bê tông",
      "Kiểm tra chiều cao tầng",
    ];
    for (let i = 0; i < cl1Items.length; i++) {
      await prisma.checklistItem.create({
        data: { checklistId: cl1.id, name: cl1Items[i], completed: i < 2, order: i },
      });
    }

    const cl2 = await prisma.checklist.create({
      data: { stageId: stageForChecklist.id, name: "Kiểm tra hệ thống điện tầng 1", order: 1 },
    });
    const cl2Items = ["Đo dây điện", "Kiểm tra ổ capse", "Kiểm tra CB", "Test hệ thống đèn"];
    for (let i = 0; i < cl2Items.length; i++) {
      await prisma.checklistItem.create({
        data: { checklistId: cl2.id, name: cl2Items[i], completed: i === 0, order: i },
      });
    }
  }

  console.log("✅ Checklist đã tạo");

  await prisma.setting.create({ data: { key: "project.defaultLat", value: "10.7769" } });
  await prisma.setting.create({ data: { key: "project.defaultLon", value: "106.7009" } });

  console.log("✅ Cài đặt đã tạo");

  console.log("🎉 Tạo dữ liệu mẫu hoàn tất!");
  console.log("📋 Đăng nhập: admin@local.com / admin123");
  console.log("📋 Đăng nhập: user@local.com / user123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
