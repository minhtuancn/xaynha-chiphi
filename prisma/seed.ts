import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create users
  const adminHash = await bcrypt.hash("admin123", 10);
  const userHash = await bcrypt.hash("user123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@local.com" },
    update: {},
    create: {
      email: "admin@local.com",
      passwordHash: adminHash,
      name: "Admin",
      role: "ADMIN",
      permissions: "{}",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@local.com" },
    update: {},
    create: {
      email: "user@local.com",
      passwordHash: userHash,
      name: "User",
      role: "USER",
      permissions: JSON.stringify({
        dashboard: ["view"],
        stages: ["view"],
        dailyLogs: ["view", "create", "edit"],
        materials: ["view"],
        inventory: ["view"],
        photos: ["view"],
      }),
    },
  });

  console.log("✅ Users created");

  // Create project
  const project = await prisma.project.create({
    data: {
      name: "Nhà Thờ Tổ",
      address: "123 Đường ABC, Quận 1, TP.HCM",
      budget: 3500000000,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      status: "ACTIVE",
      progress: 45,
      description: "Xây nhà 2 tầng, diện tích 100m²",
    },
  });

  console.log("✅ Project created");

  // Create budget
  await prisma.budget.create({
    data: {
      projectId: project.id,
      totalBudget: 3500000000,
      allocated: 2100000000,
      spent: 1850000000,
      remaining: 1650000000,
    },
  });

  console.log("✅ Budget created");

  // Create construction stages
  const stagesData = [
    { name: "Preparation", order: 1, progress: 100, estimatedBudget: 50000000, status: "COMPLETED" },
    { name: "Foundation", order: 2, progress: 100, estimatedBudget: 350000000, status: "COMPLETED" },
    { name: "Ground Floor", order: 3, progress: 75, estimatedBudget: 500000000, status: "IN_PROGRESS" },
    { name: "Second Floor", order: 4, progress: 20, estimatedBudget: 550000000, status: "IN_PROGRESS" },
    { name: "Roof", order: 5, progress: 0, estimatedBudget: 300000000, status: "NOT_STARTED" },
    { name: "Electrical", order: 6, progress: 0, estimatedBudget: 150000000, status: "NOT_STARTED" },
    { name: "Water System", order: 7, progress: 0, estimatedBudget: 100000000, status: "NOT_STARTED" },
    { name: "Interior", order: 8, progress: 0, estimatedBudget: 600000000, status: "NOT_STARTED" },
    { name: "Painting", order: 9, progress: 0, estimatedBudget: 150000000, status: "NOT_STARTED" },
    { name: "Final Inspection", order: 10, progress: 0, estimatedBudget: 50000000, status: "NOT_STARTED" },
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
        actualCost: Math.round(sd.estimatedBudget * (sd.progress / 100) * 1.1),
        status: sd.status,
      },
    });
    stages.push(stage);
  }

  console.log("✅ Stages created");

  // Create tasks for first few stages
  const tasksData: Record<string, { name: string; status: string; progress: number }[]> = {
    "Preparation": [
      { name: "Giải phóng mặt bằng", status: "COMPLETED", progress: 100 },
      { name: "San lấp mặt bằng", status: "COMPLETED", progress: 100 },
      { name: "Làm hàng rào tạm", status: "COMPLETED", progress: 100 },
    ],
    "Foundation": [
      { name: "Ép cọc bê tông", status: "COMPLETED", progress: 100 },
      { name: "Đào móng", status: "COMPLETED", progress: 100 },
      { name: "Đổ móng", status: "COMPLETED", progress: 100 },
      { name: "Xây móng brick", status: "COMPLETED", progress: 100 },
    ],
    "Ground Floor": [
      { name: "Xây tường phòng khách", status: "IN_PROGRESS", progress: 80 },
      { name: "Xây tường phòng bếp", status: "IN_PROGRESS", progress: 60 },
      { name: "Đổ sàn phòng khách", status: "COMPLETED", progress: 100 },
      { name: "Lắp cửa chính", status: "PENDING", progress: 0 },
    ],
    "Second Floor": [
      { name: "Đổ sàn tầng 2", status: "IN_PROGRESS", progress: 40 },
      { name: "Xây tường phòng ngủ 1", status: "PENDING", progress: 0 },
      { name: "Xây tường phòng ngủ 2", status: "PENDING", progress: 0 },
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
          status: td.status,
          progress: td.progress,
        },
      });
    }
  }

  console.log("✅ Tasks created");

  // Create material categories
  const categories = [
    { name: "Xi măng", description: "Các loại xi măng" },
    { name: "Sắt thép", description: "Sắt thép các loại" },
    { name: "Cát đá", description: "Cát, đá xây dựng" },
    { name: "Gạch", description: "Gạch các loại" },
    { name: "Sơn", description: "Sơn nội ngoại thất" },
    { name: "Điện nước", description: "Vật tư điện nước" },
    { name: "Hoàn thiện", description: "Vật liệu hoàn thiện" },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const c = await prisma.materialCategory.create({ data: cat });
    createdCategories.push(c);
  }

  console.log("✅ Material categories created");

  // Create materials
  const materials = [
    { categoryId: createdCategories[0].id, name: "Xi măng PCB40", unit: "bao", currentStock: 150, minStock: 50, unitCost: 85000 },
    { categoryId: createdCategories[1].id, name: "Sắt Φ10", unit: "cay", currentStock: 200, minStock: 100, unitCost: 45000 },
    { categoryId: createdCategories[1].id, name: "Sắt Φ12", unit: "cay", currentStock: 150, minStock: 80, unitCost: 55000 },
    { categoryId: createdCategories[2].id, name: "Cát xây dựng", unit: "m3", currentStock: 25, minStock: 10, unitCost: 250000 },
    { categoryId: createdCategories[2].id, name: "Đá 1x2", unit: "m3", currentStock: 15, minStock: 5, unitCost: 350000 },
    { categoryId: createdCategories[3].id, name: "Gạch ống", unit: "vien", currentStock: 5000, minStock: 2000, unitCost: 1200 },
    { categoryId: createdCategories[4].id, name: "Sơn Dulux nội thất", unit: "thang", currentStock: 10, minStock: 5, unitCost: 850000 },
    { categoryId: createdCategories[5].id, name: "Ống PVC Φ27", unit: "cay", currentStock: 100, minStock: 30, unitCost: 25000 },
    { categoryId: createdCategories[5].id, name: "Dây điện 2.5mm", unit: "cuon", currentStock: 20, minStock: 10, unitCost: 450000 },
  ];

  for (const mat of materials) {
    await prisma.material.create({ data: mat });
  }

  console.log("✅ Materials created");

  // Create suppliers
  const suppliers = [
    { name: "VLXD Minh Tuấn", contact: "Nguyễn Văn A", phone: "0901234567", email: "tuan@vlxd.com", address: "456 Đường XYZ, Quận 5", debtBalance: 15000000 },
    { name: "Sắt thép Hòa Phát", contact: "Trần Thị B", phone: "0912345678", email: "hoa@phat.com", address: "789 Đường DEF, Quận 7", debtBalance: 0 },
    { name: "Xi măng Hà Tiên", contact: "Lê Văn C", phone: "0923456789", email: "hatien@cement.com", address: "321 Đường GHI, Quận 12", debtBalance: 8500000 },
  ];

  for (const sup of suppliers) {
    await prisma.supplier.create({ data: sup });
  }

  console.log("✅ Suppliers created");

  // Create workers
  const workers = [
    { name: "Nguyễn Văn An", phone: "0901111111", skill: "Thợ hồ", dailyWage: 350000 },
    { name: "Trần Văn Bình", phone: "0902222222", skill: "Thợ hồ", dailyWage: 350000 },
    { name: "Lê Hoàng Cường", phone: "0903333333", skill: "Thợ điện", dailyWage: 400000 },
    { name: "Phạm Thị Dung", phone: "0904444444", skill: "Thợ sơn", dailyWage: 300000 },
    { name: "Hoàng Văn Em", phone: "0905555555", skill: "Phụ hồ", dailyWage: 250000 },
  ];

  for (const w of workers) {
    await prisma.worker.create({ data: w });
  }

  console.log("✅ Workers created");

  // Create accounts
  await prisma.account.create({ data: { name: "Tiền mặt", type: "CASH", balance: 500000000 } });
  await prisma.account.create({ data: { name: "Vietcombank", type: "BANK", balance: 1200000000 } });

  console.log("✅ Accounts created");

  // Create expense categories
  const expenseCats = [
    { name: "Vật liệu", budget: 1500000000 },
    { name: "Nhân công", budget: 800000000 },
    { name: "Thiết bị", budget: 300000000 },
    { name: "Hoàn thiện", budget: 500000000 },
    { name: "Khác", budget: 100000000 },
  ];

  for (const ec of expenseCats) {
    await prisma.expenseCategory.create({ data: ec });
  }

  console.log("✅ Expense categories created");

  // Create daily logs for last 7 days
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    await prisma.dailyLog.create({
      data: {
        projectId: project.id,
        date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        weather: JSON.stringify({ condition: ["sunny", "cloudy", "rainy"][i % 3], temperature: 30 + (i % 5), humidity: 70 + (i % 10), windSpeed: 10 + (i % 5) }),
        temperature: 30 + (i % 5),
        notes: `Ngày thi công thứ ${7 - i}. Tiến độ tốt.`,
        workerCount: 5 + (i % 3),
      },
    });
  }

  console.log("✅ Daily logs created");

  // Create sample expenses
  const expenseCat = await prisma.expenseCategory.findFirst();
  if (expenseCat) {
    const expenses = [
      { amount: 5000000, description: "Mua xi măng", date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2) },
      { amount: 12000000, description: "Mua sắt Φ10", date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4) },
      { amount: 3500000, description: "Tiền công thợ tuần 1", date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7) },
    ];

    for (const exp of expenses) {
      await prisma.expense.create({
        data: {
          projectId: project.id,
          categoryId: expenseCat.id,
          amount: exp.amount,
          date: exp.date,
          description: exp.description,
          status: "APPROVED",
          createdBy: admin.id,
        },
      });
    }
  }

  console.log("✅ Expenses created");

  // Create settings
  await prisma.setting.create({
    data: {
      key: "project.defaultLat",
      value: "10.8231",
    },
  });
  await prisma.setting.create({
    data: {
      key: "project.defaultLon",
      value: "106.6297",
    },
  });

  console.log("✅ Settings created");

  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
