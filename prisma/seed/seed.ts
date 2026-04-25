// prisma/seed/seed.ts

import { seedUsers } from "./db-source/users";
import { seedCategories } from "./db-source/categories";
import { seedAccounts } from "./db-source/accounts";
import { seedTags } from "./db-source/tags";
import { seedBudgets } from "./db-source/budgets";
import { seedRecurringTransactions } from "./db-source/recurring-transactions";
import { seedTransactions } from "./db-source/transactions";
import { seedNotifications } from "./db-source/notifications";
import { seedAuditLogs } from "./db-source/audit-logs";
import { seedExportHistory } from "./db-source/export-history";
import { seedSavingsGoals } from "./db-source/savings-goals";
import { PrismaClient } from "@/generated/prisma/client";

const prisma = new PrismaClient();

// ─── Clear all tables in dependency order ────────────────────────────────────
async function clearDatabase() {
	console.log("🗑️  Clearing existing data...");

	// Dependent leaf tables first
	await prisma.transactionTag.deleteMany();
	await prisma.attachment.deleteMany();
	await prisma.auditLog.deleteMany();
	await prisma.exportHistory.deleteMany();
	await prisma.notification.deleteMany();
	await prisma.accountBalanceHistory.deleteMany();
	await prisma.oTPSession.deleteMany();

	// Core records
	await prisma.transaction.deleteMany();
	await prisma.recurringTransaction.deleteMany();
	await prisma.budget.deleteMany();
	await prisma.savingsGoal.deleteMany();
	await prisma.tag.deleteMany();
	await prisma.account.deleteMany();
	await prisma.category.deleteMany();

	// Root
	await prisma.user.deleteMany();

	console.log("✅ Database cleared.");
}

// ─── Main seed ────────────────────────────────────────────────────────────────
async function main() {
	console.log("🌱 Starting Unilogger seed...\n");

	await clearDatabase();

	// 1. Create all users
	console.log("👤 Seeding users...");
	const users = await seedUsers(prisma);
	console.log(`   → ${users.length} users created`);

	// 2. Per-user seeding
	for (const user of users) {
		console.log(`\n🔹 Seeding data for ${user.name} <${user.email}>`);

		// Categories
		const categories = await seedCategories(prisma, user.id);
		console.log(`   📂 ${categories.length} categories`);

		// Accounts
		const accounts = await seedAccounts(prisma, user.id);
		console.log(`   💳 ${accounts.length} accounts`);

		// Tags
		const tags = await seedTags(prisma, user.id);
		console.log(`   🏷️  ${tags.length} tags`);

		// Budgets
		const budgets = await seedBudgets(prisma, user.id, categories);
		console.log(`   📊 ${budgets.length} budgets`);

		// Savings Goals
		const goals = await seedSavingsGoals(prisma, user.id, categories);
		console.log(`   🎯 ${goals.length} savings goals`);

		// Recurring Transactions
		const recurringTxns = await seedRecurringTransactions(
			prisma,
			user.id,
			categories,
			accounts,
		);
		console.log(`   🔁 ${recurringTxns.length} recurring transactions`);

		// Transactions (bulk — iterates every day in date range)
		console.log(`   💸 Seeding transactions (this may take a moment)...`);
		await seedTransactions(
			prisma,
			user.id,
			categories,
			accounts,
			tags,
			recurringTxns,
		);
		console.log(`   💸 Transactions seeded`);

		// Notifications
		await seedNotifications(prisma, user.id);
		console.log(`   🔔 Notifications seeded`);

		// Audit Logs
		await seedAuditLogs(prisma, user.id, user.id);
		console.log(`   📋 Audit logs seeded`);

		// Export History
		await seedExportHistory(prisma, user.id);
		console.log(`   📤 Export history seeded`);
	}

	console.log("\n🎉 Seed complete!\n");
}

main()
	.catch((e) => {
		console.error("❌ Seed failed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
