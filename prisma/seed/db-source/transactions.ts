// prisma/seed/db-source/transactions.ts

import { Account, Category, PrismaClient, RecurringTransaction, Tag, TransactionType } from "@/generated/prisma/client";
import { SEED_CONFIG } from "../config";
import {
	randomInt,
	randomAmount,
	randomItem,
	randomItems,
	randomBool,
	eachDayFrom,
	getSeedStartDate,
	randomTimeOnDay,
	isWeekend,
} from "../utils";

const EXPENSE_DESCRIPTIONS: Record<string, string[]> = {
	"Food & Dining": [
		"Lunch at cafe",
		"Dinner with family",
		"Quick snack",
		"Restaurant bill",
		"Zomato order",
	],
	Transportation: [
		"Uber ride",
		"Metro card recharge",
		"Auto fare",
		"Cab to airport",
		"Petrol fill-up",
	],
	Shopping: [
		"Amazon order",
		"Clothing purchase",
		"Flipkart delivery",
		"Home decor item",
		"Electronics",
	],
	Housing: [
		"Rent payment",
		"Electricity bill",
		"Water bill",
		"Maintenance charge",
		"Society fee",
	],
	Healthcare: [
		"Pharmacy bill",
		"Doctor consultation",
		"Lab test",
		"Health checkup",
		"Medicine refill",
	],
	Entertainment: [
		"Movie tickets",
		"OTT subscription",
		"Concert entry",
		"Game purchase",
		"Streaming plan",
	],
	Coffee: [
		"Starbucks",
		"Chai point",
		"Blue Tokai",
		"CCD coffee",
		"Morning cappuccino",
	],
	Groceries: [
		"BigBasket order",
		"Local kirana",
		"Weekly vegetables",
		"Milk and eggs",
		"Supermarket run",
	],
	Fuel: ["Petrol station", "CNG top up", "Fuel fill-up"],
	Internet: ["JioFiber bill", "ACT broadband", "Airtel Xstream"],
	"Phone Bill": ["Jio recharge", "Airtel postpaid", "Vi monthly plan"],
	Gym: [
		"Gold's Gym membership",
		"Cult.fit session",
		"Personal trainer",
		"Yoga class",
	],
	Education: [
		"Udemy course",
		"Book purchase",
		"Online class fee",
		"Study material",
	],
};

const INCOME_DESCRIPTIONS: Record<string, string[]> = {
	Salary: ["Monthly salary", "Salary credit", "CTC credit"],
	Freelance: [
		"Freelance project",
		"Consulting fee",
		"Client payment",
		"Upwork withdrawal",
	],
	"Investment Return": [
		"Mutual fund return",
		"Stock dividend",
		"FD interest",
		"SIP gain",
	],
	"Gift Received": ["Birthday gift", "Festival bonus", "Family transfer"],
	"Rent Income": ["Tenant rent", "Property rental income"],
};

function descriptionFor(category: Category): string {
	const pool =
		category.type === "INCOME"
			? (INCOME_DESCRIPTIONS[category.name] ?? ["Income received"])
			: (EXPENSE_DESCRIPTIONS[category.name] ?? ["General expense"]);
	return randomItem(pool);
}

export async function seedTransactions(
	prisma: PrismaClient,
	userId: string,
	categories: Category[],
	accounts: Account[],
	tags: Tag[],
	recurringTxns: RecurringTransaction[],
): Promise<void> {
	const startDate = getSeedStartDate();
	const expenseCategories = categories.filter((c) => c.type === "EXPENSE");
	const incomeCategories = categories.filter((c) => c.type === "INCOME");

	for (const day of eachDayFrom(startDate)) {
		const baseCount = SEED_CONFIG.transactionsPerDay;
		const multiplier = isWeekend(day)
			? SEED_CONFIG.weekendTransactionMultiplier
			: 1;
		const txCount = Math.round(baseCount * multiplier);

		for (let t = 0; t < txCount; t++) {
			const txDate = randomTimeOnDay(day);

			// ~80% expense, ~15% income, ~5% transfer
			const roll = Math.random();
			let type: TransactionType;
			if (roll < 0.8) type = "EXPENSE";
			else if (roll < 0.95) type = "INCOME";
			else type = "TRANSFER";

			const categoryPool =
				type === "EXPENSE" ? expenseCategories : incomeCategories;
			const category =
				categoryPool.length > 0 ? randomItem(categoryPool) : null;
			const account = randomItem(accounts);

			const amount = randomAmount();

			// Optionally link to a recurring transaction with 10% chance
			const linkedRecurring =
				recurringTxns.length > 0 && randomBool(0.1)
					? randomItem(recurringTxns)
					: null;

			const transaction = await prisma.transaction.create({
				data: {
					amount,
					type,
					description: category
						? descriptionFor(category)
						: "Miscellaneous",
					date: txDate,
					notes: randomBool(0.15) ? "Added via seed" : null,
					userId,
					categoryId: category?.id ?? null,
					accountId: account.id,
					recurringTxnId: linkedRecurring?.id ?? null,
				},
			});

			// Attach 0–2 tags
			const txTags = randomItems(tags, randomInt(0, 2));
			for (const tag of txTags) {
				await prisma.transactionTag.create({
					data: {
						transactionId: transaction.id,
						tagId: tag.id,
					},
				});
			}

			// Update account balance history for each transaction
			const changeType =
				type === "INCOME"
					? "DEPOSIT"
					: type === "TRANSFER"
						? "TRANSFER"
						: "WITHDRAWAL";
			const currentAccount = await prisma.account.findUnique({
				where: { id: account.id },
			});
			if (currentAccount) {
				const newBalance =
					type === "INCOME"
						? parseFloat(
								(currentAccount.balance + amount).toFixed(2),
							)
						: parseFloat(
								(currentAccount.balance - amount).toFixed(2),
							);

				await prisma.account.update({
					where: { id: account.id },
					data: { balance: Math.max(0, newBalance) },
				});

				await prisma.accountBalanceHistory.create({
					data: {
						accountId: account.id,
						balance: Math.max(0, newBalance),
						changeAmount: type === "INCOME" ? amount : -amount,
						changeType,
						description: category
							? descriptionFor(category)
							: "Transaction",
						referenceId: transaction.id,
					},
				});
			}
		}
	}
}
