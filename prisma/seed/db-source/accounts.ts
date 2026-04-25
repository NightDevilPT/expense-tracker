// prisma/seed/db-source/accounts.ts

import { AccountType, PrismaClient } from "@/generated/prisma/client";
import { SEED_CONFIG } from "../config";
import { randomItem, randomBalance } from "../utils";

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
];

interface AccountTemplate {
  name: string;
  type: AccountType;
}

const ACCOUNT_TEMPLATES: AccountTemplate[] = [
  { name: "Cash Wallet",        type: "CASH" },
  { name: "HDFC Savings",       type: "SAVINGS_ACCOUNT" },
  { name: "SBI Current",        type: "BANK_ACCOUNT" },
  { name: "ICICI Credit Card",  type: "CREDIT_CARD" },
  { name: "Paytm Wallet",       type: "DIGITAL_WALLET" },
  { name: "Emergency Fund",     type: "SAVINGS_ACCOUNT" },
  { name: "Travel Account",     type: "BANK_ACCOUNT" },
];

export async function seedAccounts(
  prisma: PrismaClient,
  userId: string
): Promise<Awaited<ReturnType<typeof prisma.account.create>>[]> {
  const accounts: Awaited<ReturnType<typeof prisma.account.create>>[] = [];
  const count = Math.min(SEED_CONFIG.accountsPerUser, ACCOUNT_TEMPLATES.length);

  for (let i = 0; i < count; i++) {
    const tmpl = ACCOUNT_TEMPLATES[i];
    const balance = randomBalance();

    const account = await prisma.account.create({
      data: {
        name: tmpl.name,
        type: tmpl.type,
        balance,
        currency: "USD",
        isDefault: i === 0,
        color: randomItem(COLORS),
        notes: i === 0 ? "Primary account" : null,
        userId,
      },
    });

    // Seed the initial balance history entry
    await prisma.accountBalanceHistory.create({
      data: {
        accountId: account.id,
        balance,
        changeAmount: balance,
        changeType: "ADJUSTMENT",
        description: "Initial seed balance",
      },
    });

    accounts.push(account);
  }

  return accounts;
}