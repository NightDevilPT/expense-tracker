// prisma/seed.ts

import {
	PrismaClient,
	TransactionType,
	AccountType,
	BudgetPeriod,
	SavingsGoalStatus,
	RecurringFrequency,
	type User,
	type Category,
	type Tag,
	type Account,
} from "@/generated/prisma/client";

const prisma = new PrismaClient();

// ==================== CONFIGURATION ====================
const CONFIG = {
	USERS: 3,
	TRANSACTIONS_PER_USER: 50,
};

// ==================== STATIC DATA ====================

const FIRST_NAMES = [
	"John",
	"Jane",
	"Mike",
	"Sarah",
	"David",
	"Emma",
	"Chris",
	"Lisa",
];
const LAST_NAMES = [
	"Smith",
	"Johnson",
	"Williams",
	"Brown",
	"Jones",
	"Garcia",
	"Miller",
	"Davis",
];

const EXPENSE_CATEGORIES = [
	{ name: "Food & Dining", icon: "🍔", color: "#FF5733" },
	{ name: "Transportation", icon: "🚗", color: "#33FF57" },
	{ name: "Shopping", icon: "🛍️", color: "#3357FF" },
	{ name: "Entertainment", icon: "🎬", color: "#FF33F5" },
	{ name: "Bills & Utilities", icon: "💡", color: "#F5FF33" },
	{ name: "Healthcare", icon: "🏥", color: "#33FFF5" },
];

const INCOME_CATEGORIES = [
	{ name: "Salary", icon: "💰", color: "#33FF83" },
	{ name: "Freelance", icon: "💻", color: "#8333FF" },
	{ name: "Investment", icon: "📈", color: "#FF33A8" },
];

const TAG_NAMES = [
	"Urgent",
	"Important",
	"Work",
	"Personal",
	"Family",
	"Business",
];

const ACCOUNT_TYPES: AccountType[] = [
	AccountType.CASH,
	AccountType.BANK_ACCOUNT,
	AccountType.SAVINGS_ACCOUNT,
	AccountType.CREDIT_CARD,
];

const CURRENCIES = ["USD", "EUR", "GBP"];

// ==================== HELPER FUNCTIONS ====================

function getRandomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(daysBack: number): Date {
	const date = new Date();
	date.setDate(date.getDate() - getRandomInt(1, daysBack));
	return date;
}

function getRandomAmount(min: number, max: number): number {
	return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function getRandomElement<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled.slice(0, count);
}

// ==================== MAIN SEED FUNCTION ====================

async function main() {
	console.log("\n🌱 Starting database seed...");
	console.log("=".repeat(50));

	// ==================== CLEAN UP ====================
	console.log("\n🧹 Cleaning up existing data...");

	await prisma.$transaction([
		prisma.attachment.deleteMany(),
		prisma.transactionTag.deleteMany(),
		prisma.transaction.deleteMany(),
		prisma.accountBalanceHistory.deleteMany(),
		prisma.recurringTransaction.deleteMany(),
		prisma.savingsGoal.deleteMany(),
		prisma.budget.deleteMany(),
		prisma.account.deleteMany(),
		prisma.tag.deleteMany(),
		prisma.category.deleteMany(),
		prisma.user.deleteMany(),
	]);

	console.log("✅ Cleanup complete");

	// ==================== CREATE USERS ====================
	console.log("\n👤 Creating users...");

	const users: User[] = [];
	for (let i = 0; i < CONFIG.USERS; i++) {
		const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
		const lastName = LAST_NAMES[i % LAST_NAMES.length];
		const user = await prisma.user.create({
			data: {
				email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
				passwordHash: "hashed_password_123",
				name: `${firstName} ${lastName}`,
				avatar: null,
				currency: getRandomElement(CURRENCIES),
				theme: "light",
				firstDayOfWeek: 0,
				dateFormat: "MM/DD/YYYY",
				numberFormat: "1,000.00",
				emailNotifications: true,
			},
		});
		users.push(user);
		console.log(`   ✅ Created: ${user.name} (${user.email})`);
	}

	// ==================== CREATE CATEGORIES ====================
	console.log("\n📂 Creating categories...");

	const allCategories = new Map<string, Category[]>();

	for (const user of users) {
		const userCategories: Category[] = [];

		// Create expense categories
		for (let i = 0; i < EXPENSE_CATEGORIES.length; i++) {
			const cat = EXPENSE_CATEGORIES[i];
			const category = await prisma.category.create({
				data: {
					name: cat.name,
					type: TransactionType.EXPENSE,
					icon: cat.icon,
					color: cat.color,
					isDefault: false,
					order: i,
					userId: user.id,
				},
			});
			userCategories.push(category);
		}

		// Create income categories
		for (let i = 0; i < INCOME_CATEGORIES.length; i++) {
			const cat = INCOME_CATEGORIES[i];
			const category = await prisma.category.create({
				data: {
					name: cat.name,
					type: TransactionType.INCOME,
					icon: cat.icon,
					color: cat.color,
					isDefault: false,
					order: i + 10,
					userId: user.id,
				},
			});
			userCategories.push(category);
		}

		allCategories.set(user.id, userCategories);
		console.log(
			`   ✅ ${user.name}: ${userCategories.length} categories created`,
		);
	}

	// ==================== CREATE TAGS ====================
	console.log("\n🏷️ Creating tags...");

	const allTags = new Map<string, Tag[]>();

	for (const user of users) {
		const userTags: Tag[] = [];
		for (let i = 0; i < TAG_NAMES.length; i++) {
			const tag = await prisma.tag.create({
				data: {
					name: TAG_NAMES[i],
					color:
						"#" + Math.floor(Math.random() * 16777215).toString(16),
					userId: user.id,
				},
			});
			userTags.push(tag);
		}
		allTags.set(user.id, userTags);
		console.log(`   ✅ ${user.name}: ${userTags.length} tags created`);
	}

	// ==================== CREATE ACCOUNTS ====================
	console.log("\n💰 Creating accounts...");

	const allAccounts = new Map<string, Account[]>();

	for (const user of users) {
		const userAccounts: Account[] = [];
		for (let i = 0; i < ACCOUNT_TYPES.length; i++) {
			const initialBalance = getRandomAmount(100, 5000);
			const account = await prisma.account.create({
				data: {
					name: `${ACCOUNT_TYPES[i]} Account`,
					type: ACCOUNT_TYPES[i],
					balance: initialBalance,
					currency: user.currency,
					isDefault: i === 0,
					color:
						"#" + Math.floor(Math.random() * 16777215).toString(16),
					notes: null,
					userId: user.id,
				},
			});

			await prisma.accountBalanceHistory.create({
				data: {
					accountId: account.id,
					balance: initialBalance,
					changeAmount: initialBalance,
					changeType: "INITIAL",
					description: "Initial account balance",
				},
			});

			userAccounts.push(account);
		}
		allAccounts.set(user.id, userAccounts);
		console.log(
			`   ✅ ${user.name}: ${userAccounts.length} accounts created`,
		);
	}

	// ==================== CREATE TRANSACTIONS ====================
	console.log("\n💸 Creating transactions...");

	let totalTransactions = 0;

	for (const user of users) {
		const userCategories = allCategories.get(user.id) || [];
		const userAccounts = allAccounts.get(user.id) || [];
		const userTags = allTags.get(user.id) || [];

		const expenseCategories = userCategories.filter(
			(c: Category) => c.type === TransactionType.EXPENSE,
		);
		const incomeCategories = userCategories.filter(
			(c: Category) => c.type === TransactionType.INCOME,
		);

		for (let i = 0; i < CONFIG.TRANSACTIONS_PER_USER; i++) {
			const isIncome = Math.random() < 0.3;
			const type = isIncome
				? TransactionType.INCOME
				: TransactionType.EXPENSE;
			const amount = isIncome
				? getRandomAmount(500, 5000)
				: getRandomAmount(10, 500);
			const category = isIncome
				? getRandomElement(incomeCategories)
				: getRandomElement(expenseCategories);
			const account = getRandomElement(userAccounts);
			const date = getRandomDate(90);
			const description = isIncome
				? ["Salary", "Freelance", "Bonus", "Refund"][
						Math.floor(Math.random() * 4)
					]
				: ["Groceries", "Uber", "Netflix", "Shopping", "Restaurant"][
						Math.floor(Math.random() * 5)
					];

			const balanceChange =
				type === TransactionType.INCOME ? amount : -amount;

			const updatedAccount = await prisma.account.update({
				where: { id: account.id },
				data: { balance: { increment: balanceChange } },
			});

			const transaction = await prisma.transaction.create({
				data: {
					amount,
					type,
					description,
					date,
					notes: null,
					userId: user.id,
					categoryId: category.id,
					accountId: account.id,
				},
			});

			await prisma.accountBalanceHistory.create({
				data: {
					accountId: account.id,
					balance: updatedAccount.balance,
					changeAmount: balanceChange,
					changeType:
						type === TransactionType.INCOME
							? "DEPOSIT"
							: "WITHDRAWAL",
					description: `Transaction: ${description}`,
					referenceId: transaction.id,
				},
			});

			// Add random tags (0-2 tags per transaction)
			const numTags = Math.floor(Math.random() * 3);
			if (numTags > 0 && userTags.length > 0) {
				const selectedTags = getRandomElements(
					userTags,
					Math.min(numTags, userTags.length),
				);
				for (const tag of selectedTags) {
					await prisma.transactionTag.create({
						data: {
							transactionId: transaction.id,
							tagId: tag.id,
						},
					});
				}
			}

			totalTransactions++;
		}
		console.log(
			`   ✅ ${user.name}: ${CONFIG.TRANSACTIONS_PER_USER} transactions created`,
		);
	}
	console.log(`   📊 Total transactions: ${totalTransactions}`);

	// ==================== FINAL SUMMARY ====================
	console.log("\n" + "=".repeat(50));
	console.log("📊 SEED COMPLETE SUMMARY");
	console.log("=".repeat(50));
	console.log(`👤 Users: ${await prisma.user.count()}`);
	console.log(`📂 Categories: ${await prisma.category.count()}`);
	console.log(`🏷️ Tags: ${await prisma.tag.count()}`);
	console.log(`💰 Accounts: ${await prisma.account.count()}`);
	console.log(`💸 Transactions: ${await prisma.transaction.count()}`);
	console.log(`🔗 Transaction Tags: ${await prisma.transactionTag.count()}`);
	console.log("=".repeat(50));

	console.log("\n🔑 Test Users:");
	console.log("-".repeat(50));
	for (const user of users) {
		console.log(`   📧 ${user.email}`);
		console.log(`   🆔 User ID: ${user.id}`);
		console.log("");
	}

	console.log("\n✅ Seeding completed successfully!");
}

main()
	.catch((e) => {
		console.error("\n❌ Seeding failed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
