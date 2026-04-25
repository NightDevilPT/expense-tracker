// prisma/seed/db-source/budgets.ts

import { BudgetPeriod } from "@/generated/prisma/enums";
import { SEED_CONFIG } from "../config";
import { randomItem, randomBudgetAmount, randomFloat } from "../utils";
import { Category, PrismaClient } from "@/generated/prisma/client";

const PERIODS: BudgetPeriod[] = ["MONTHLY", "WEEKLY", "YEARLY", "DAILY"];

export async function seedBudgets(
  prisma: PrismaClient,
  userId: string,
  categories: Category[]
): Promise<Awaited<ReturnType<typeof prisma.budget.create>>[]> {
  const budgets: Awaited<ReturnType<typeof prisma.budget.create>>[] = [];

  // Only use EXPENSE categories for budgets
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  const count = Math.min(SEED_CONFIG.budgetsPerUser, expenseCategories.length);

  for (let i = 0; i < count; i++) {
    const category = expenseCategories[i];
    const amount = randomBudgetAmount();
    const spent = randomFloat(0, amount * 0.9);
    const period = randomItem(PERIODS);

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1); // start of current month

    const budget = await prisma.budget.create({
      data: {
        amount,
        currency: "USD",
        period,
        startDate,
        endDate: null,
        alertThreshold: randomItem([70, 75, 80, 85, 90]),
        rollover: Math.random() < 0.3,
        spent,
        remaining: parseFloat((amount - spent).toFixed(2)),
        userId,
        categoryId: category.id,
      },
    });

    budgets.push(budget);
  }

  return budgets;
}