/*
  Warnings:

  - You are about to drop the column `dailyLogId` on the `Photo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DailyLog" ADD COLUMN "timeOfDay" TEXT;
ALTER TABLE "DailyLog" ADD COLUMN "weatherCondition" TEXT;
ALTER TABLE "DailyLog" ADD COLUMN "weatherSource" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "latitude" REAL;
ALTER TABLE "Project" ADD COLUMN "longitude" REAL;

-- CreateTable
CREATE TABLE "UserSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'vi',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "dateFormat" TEXT NOT NULL DEFAULT 'dd/MM/yyyy',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "currencyDec" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyLogPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dailyLogId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "takenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "DailyLogPhoto_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "DailyLog" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaterialPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialId" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "source" TEXT NOT NULL,
    "purchaseOrderId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaterialPrice_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaterialPrice_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaterialUsagePhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialUsageId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "takenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "MaterialUsagePhoto_materialUsageId_fkey" FOREIGN KEY ("materialUsageId") REFERENCES "MaterialUsage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InventoryTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "date" DATETIME NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "purchaseOrderId" TEXT,
    "projectId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryTransaction_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InventoryTransaction_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryTransaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_InventoryTransaction" ("createdAt", "date", "id", "materialId", "notes", "quantity", "reference", "type", "updatedAt") SELECT "createdAt", "date", "id", "materialId", "notes", "quantity", "reference", "type", "updatedAt" FROM "InventoryTransaction";
DROP TABLE "InventoryTransaction";
ALTER TABLE "new_InventoryTransaction" RENAME TO "InventoryTransaction";
CREATE INDEX "InventoryTransaction_materialId_idx" ON "InventoryTransaction"("materialId");
CREATE INDEX "InventoryTransaction_date_idx" ON "InventoryTransaction"("date");
CREATE INDEX "InventoryTransaction_purchaseOrderId_idx" ON "InventoryTransaction"("purchaseOrderId");
CREATE INDEX "InventoryTransaction_projectId_idx" ON "InventoryTransaction"("projectId");
CREATE TABLE "new_MaterialUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialId" TEXT NOT NULL,
    "dailyLogId" TEXT,
    "taskId" TEXT,
    "projectId" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "date" DATETIME NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaterialUsage_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaterialUsage_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "DailyLog" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaterialUsage_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ConstructionTask" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaterialUsage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MaterialUsage" ("createdAt", "dailyLogId", "date", "id", "materialId", "notes", "projectId", "quantity", "taskId") SELECT "createdAt", "dailyLogId", "date", "id", "materialId", "notes", "projectId", "quantity", "taskId" FROM "MaterialUsage";
DROP TABLE "MaterialUsage";
ALTER TABLE "new_MaterialUsage" RENAME TO "MaterialUsage";
CREATE INDEX "MaterialUsage_materialId_idx" ON "MaterialUsage"("materialId");
CREATE INDEX "MaterialUsage_dailyLogId_idx" ON "MaterialUsage"("dailyLogId");
CREATE INDEX "MaterialUsage_projectId_idx" ON "MaterialUsage"("projectId");
CREATE INDEX "MaterialUsage_date_idx" ON "MaterialUsage"("date");
CREATE TABLE "new_Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "caption" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "takenAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Photo_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Photo" ("caption", "createdAt", "deletedAt", "id", "projectId", "tags", "takenAt", "thumbnail", "updatedAt", "url") SELECT "caption", "createdAt", "deletedAt", "id", "projectId", "tags", "takenAt", "thumbnail", "updatedAt", "url" FROM "Photo";
DROP TABLE "Photo";
ALTER TABLE "new_Photo" RENAME TO "Photo";
CREATE INDEX "Photo_projectId_idx" ON "Photo"("projectId");
CREATE INDEX "Photo_takenAt_idx" ON "Photo"("takenAt");
CREATE INDEX "Photo_deletedAt_idx" ON "Photo"("deletedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "UserSetting_userId_key" ON "UserSetting"("userId");

-- CreateIndex
CREATE INDEX "UserSetting_userId_idx" ON "UserSetting"("userId");

-- CreateIndex
CREATE INDEX "DailyLogPhoto_dailyLogId_idx" ON "DailyLogPhoto"("dailyLogId");

-- CreateIndex
CREATE INDEX "MaterialPrice_materialId_idx" ON "MaterialPrice"("materialId");

-- CreateIndex
CREATE INDEX "MaterialPrice_purchaseOrderId_idx" ON "MaterialPrice"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "MaterialPrice_createdAt_idx" ON "MaterialPrice"("createdAt");

-- CreateIndex
CREATE INDEX "MaterialUsagePhoto_materialUsageId_idx" ON "MaterialUsagePhoto"("materialUsageId");
