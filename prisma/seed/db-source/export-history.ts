// prisma/seed/db-source/export-history.ts

import { PrismaClient } from "@/generated/prisma/client";
import { randomItem } from "../utils";

const FORMATS = ["CSV", "PDF", "XLSX"];

export async function seedExportHistory(
  prisma: PrismaClient,
  userId: string
): Promise<void> {
  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  for (let i = 0; i < 3; i++) {
    await prisma.exportHistory.create({
      data: {
        format: randomItem(FORMATS),
        dateRange: {
          from: oneMonthAgo.toISOString(),
          to: now.toISOString(),
        },
        filters: { type: randomItem(["EXPENSE", "INCOME", null]) },
        fileUrl: null,
        fileSize: null,
        userId,
      },
    });
  }
}