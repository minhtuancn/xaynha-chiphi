import { prisma } from "./prisma";

export async function logAudit(
  userId: string,
  action: "CREATE" | "UPDATE" | "DELETE",
  entity: string,
  entityId: string,
  changes: { oldValues?: Record<string, any>; newValues?: Record<string, any> }
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        changes: JSON.stringify(changes),
      },
    });
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}
