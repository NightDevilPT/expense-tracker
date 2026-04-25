// prisma/seed/db-source/recurring-transactions.ts

import { RecurringFrequency, TransactionType } from "@/generated/prisma/enums";
import { SEED_CONFIG } from "../config";
import { randomItem, randomAmount, addDays, addMonths } from "../utils";
import { Account, Category, PrismaClient } from "@/generated/prisma/client";

interface RecurringTemplate {
  name: string;
  type: TransactionType;
  frequency: RecurringFrequency;
  interval: number;
  amountMin: number;
  amountMax: number;
  description: string;
}

const TEMPLATES: RecurringTemplate[] = [
  { name: "Netflix Subscription", type: "EXPENSE", frequency: "MONTHLY", interval: 1, amountMin: 200, amountMax: 800, description: "Monthly streaming subscription" },
  { name: "Gym Membership",       type: "EXPENSE", frequency: "MONTHLY", interval: 1, amountMin: 500, amountMax: 2000, description: "Monthly gym fee" },
  { name: "Internet Bill",        type: "EXPENSE", frequency: "MONTHLY", interval: 1, amountMin: 500, amountMax: 1500, description: "Monthly broadband" },
  { name: "Phone Bill",           type: "EXPENSE", frequency: "MONTHLY", interval: 1, amountMin: 300, amountMax: 1000, description: "Mobile plan" },
  { name: "Salary",               type: "INCOME",  frequency: "MONTHLY", interval: 1, amountMin: 30000, amountMax: 100000, description: "Monthly salary credit" },
  { name: "Weekly Groceries",     type: "EXPENSE", frequency: "WEEKLY",  interval: 1, amountMin: 1000, amountMax: 3000, description: "Weekly grocery run" },
  { name: "Daily Coffee",         type: "EXPENSE", frequency: "DAILY",   interval: 1, amountMin: 50, amountMax: 200, description: "Morning coffee" },
];

export async function seedRecurringTransactions(
  prisma: PrismaClient,
  userId: string,
  categories: Category[],
  accounts: Account[]
): Promise<Awaited<ReturnType<typeof prisma.recurringTransaction.create>>[]> {
  const records: Awaited<ReturnType<typeof prisma.recurringTransaction.create>>[] = [];
  const count = Math.min(SEED_CONFIG.recurringTransactionsPerUser, TEMPLATES.length);
  const templates = TEMPLATES.slice(0, count);

  const now = new Date();

  for (const tmpl of templates) {
    const amount = randomAmount(tmpl.amountMin, tmpl.amountMax);
    const matchingCats = categories.filter((c) => c.type === tmpl.type);
    const category = matchingCats.length > 0 ? randomItem(matchingCats) : null;
    const account = randomItem(accounts);

    // Calculate next due date based on frequency
    let nextDueDate: Date;
    if (tmpl.frequency === "DAILY") {
      nextDueDate = addDays(now, 1);
    } else if (tmpl.frequency === "WEEKLY") {
      nextDueDate = addDays(now, 7);
    } else if (tmpl.frequency === "MONTHLY") {
      nextDueDate = addMonths(now, 1);
    } else {
      nextDueDate = addDays(now, 365);
    }

    const rec = await prisma.recurringTransaction.create({
      data: {
        name: tmpl.name,
        amount,
        type: tmpl.type,
        frequency: tmpl.frequency,
        interval: tmpl.interval,
        startDate: new Date(),
        endDate: null,
        nextDueDate,
        isActive: true,
        description: tmpl.description,
        userId,
        categoryId: category?.id ?? null,
        accountId: account.id,
      },
    });

    records.push(rec);
  }

  return records;
}