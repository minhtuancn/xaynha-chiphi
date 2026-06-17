import { prisma } from "./prisma";

export async function logAudit(
  userId: string,
  action: "CREATE" | "UPDATE" | "DELETE",
  entity: string,
  entityId: string,
  changes: { oldValues?: Record<string, unknown>; newValues?: Record<string, unknown> }
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
  } catch (err: unknown) {
    console.error("Audit log failed:", err);
  }
}
