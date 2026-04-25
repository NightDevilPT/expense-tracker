// prisma/seed/db-source/savings-goals.ts

import { SavingsGoalStatus } from "@/generated/prisma/enums";
import { SEED_CONFIG } from "../config";
import { randomItem, randomGoalAmount, randomFloat, addMonths } from "../utils";
import { Category, PrismaClient } from "@/generated/prisma/client";

const GOAL_TEMPLATES = [
  { name: "Emergency Fund",      notes: "6 months of expenses" },
  { name: "New Laptop",          notes: "For work and freelancing" },
  { name: "Vacation to Goa",     notes: "Summer vacation" },
  { name: "Home Down Payment",   notes: "Save for house purchase" },
  { name: "New Car",             notes: "Upgrade vehicle" },
  { name: "Wedding Fund",        notes: "Wedding planning savings" },
  { name: "Investment Corpus",   notes: "Long term wealth building" },
];

const STATUSES: SavingsGoalStatus[] = ["ACTIVE", "ACTIVE", "ACTIVE", "COMPLETED", "FAILED"];

export async function seedSavingsGoals(
  prisma: PrismaClient,
  userId: string,
  categories: Category[]
): Promise<Awaited<ReturnType<typeof prisma.savingsGoal.create>>[]> {
  const goals: Awaited<ReturnType<typeof prisma.savingsGoal.create>>[] = [];
  const count = Math.min(SEED_CONFIG.savingsGoalsPerUser, GOAL_TEMPLATES.length);

  for (let i = 0; i < count; i++) {
    const tmpl = GOAL_TEMPLATES[i];
    const targetAmount = randomGoalAmount();
    const status = randomItem(STATUSES);

    let currentAmount: number;
    if (status === "COMPLETED") {
      currentAmount = targetAmount;
    } else if (status === "FAILED") {
      currentAmount = randomFloat(0, targetAmount * 0.4);
    } else {
      currentAmount = randomFloat(0, targetAmount * 0.8);
    }

    const progress = parseFloat(((currentAmount / targetAmount) * 100).toFixed(2));
    const deadline = addMonths(new Date(), randomItem([3, 6, 9, 12, 18, 24]));
    const now = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Optionally link to an EXPENSE category
    const linkedCategory = randomItem([...categories.filter((c) => c.type === "EXPENSE"), null]);

    const goal = await prisma.savingsGoal.create({
      data: {
        name: tmpl.name,
        targetAmount,
        currentAmount: parseFloat(currentAmount.toFixed(2)),
        deadline,
        status,
        notes: tmpl.notes,
        progress,
        daysRemaining,
        userId,
        linkedCategoryId: linkedCategory?.id ?? null,
      },
    });

    goals.push(goal);
  }

  return goals;
}