
import { prisma } from "./prisma";

export async function getFinancialInsights(projectId: string) {
  const expenses = await prisma.expense.findMany({ where: { projectId } });
  // AI Logic placeholder
  return "Chi phí vật tư chiếm tỷ trọng cao nhất trong dự án này.";
}
