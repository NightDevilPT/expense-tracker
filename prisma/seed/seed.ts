import {
	PrismaClient,
	TransactionType,
	AccountType,
	BudgetPeriod,
	SavingsGoalStatus,
	RecurringFrequency,
	AuditAction,
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
	BUDGETS_PER_USER: 4,
	SAVINGS_GOALS_PER_USER: 3,
	RECURRING_TRANSACTIONS_PER_USER: 4,
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

// Lucide icon names (not emojis)
const EXPENSE_CATEGORIES = [
	{ name: "Food & Dining", icon: "Utensils", color: "#FF5733" },
	{ name: "Transportation", icon: "Car", color: "#33FF57" },
	{ name: "Shopping", icon: "ShoppingBag", color: "#3357FF" },
	{ name: "Entertainment", icon: "Clapperboard", color: "#FF33F5" },
	{ name: "Bills & Utilities", icon: "Lightbulb", color: "#F5FF33" },
	{ name: "Healthcare", icon: "Stethoscope", color: "#33FFF5" },
];

const INCOME_CATEGORIES = [
	{ name: "Salary", icon: "Banknote", color: "#33FF83" },
	{ name: "Freelance", icon: "Laptop", color: "#8333FF" },
	{ name: "Investment", icon: "TrendingUp", color: "#FF33A8" },
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

const CURRENCIES = ["USD", "EUR", "GBP", "INR"];

const BUDGET_NAMES = [
	"Monthly Groceries",
	"Weekend Fun",
	"Transportation",
	"Shopping",
	"Utilities",
	"Entertainment",
];

const SAVINGS_GOAL_NAMES = [
	"Emergency Fund",
	"Vacation",
	"New Car",
	"Home Down Payment",
	"Wedding",
	"Gadget Upgrade",
];

const SAVINGS_GOAL_NOTES = [
	"6 months of expenses",
	"Summer vacation to Bali",
	"Down payment for new SUV",
	"Saving for dream home",
	"Big day coming up",
	"New laptop and phone",
];

const RECURRING_TRANSACTION_NAMES = [
	"Netflix Subscription",
	"Spotify Premium",
	"Gym Membership",
	"Rent Payment",
	"Internet Bill",
	"Phone Bill",
	"Cloud Storage",
	"Insurance Premium",
];

// ==================== HELPER FUNCTIONS ====================

function getRandomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(daysBack: number): Date {
	const date = new Date();
	date.setDate(date.getDate() - getRandomInt(1, daysBack));
	return date;
}

function getFutureDate(daysAhead: number): Date {
	const date = new Date();
	date.setDate(date.getDate() + getRandomInt(30, daysAhead));
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

function calculateNextDueDate(
	startDate: Date,
	frequency: RecurringFrequency,
	interval: number,
): Date {
	const nextDate = new Date(startDate);

	switch (frequency) {
		case RecurringFrequency.DAILY:
			nextDate.setDate(nextDate.getDate() + interval);
			break;
		case RecurringFrequency.WEEKLY:
			nextDate.setDate(nextDate.getDate() + interval * 7);
			break;
		case RecurringFrequency.MONTHLY:
			nextDate.setMonth(nextDate.getMonth() + interval);
			break;
		case RecurringFrequency.YEARLY:
			nextDate.setFullYear(nextDate.getFullYear() + interval);
			break;
		case RecurringFrequency.CUSTOM:
			nextDate.setMonth(nextDate.getMonth() + interval);
			break;
	}

	return nextDate;
}

// ==================== AUDIT LOG HELPER ====================

async function createAuditLog(
	userId: string,
	action: AuditAction,
	entityType: string,
	entityId: string, // Changed from string | null to string
	oldValue: any | null,
	newValue: any | null,
	description: string,
) {
	try {
		await prisma.auditLog.create({
			data: {
				action,
				entityType,
				entityId, // Now always a string
				oldValue: oldValue
					? JSON.parse(JSON.stringify(oldValue))
					: null,
				newValue: newValue
					? JSON.parse(JSON.stringify(newValue))
					: null,
				description,
				ipAddress: "127.0.0.1",
				userAgent: "seed-script",
				userId,
			},
		});
	} catch (error) {
		console.warn(`Failed to create audit log: ${description}`, error);
	}
}

// ==================== MAIN SEED FUNCTION ====================

async function main() {
	console.log("\n🌱 Starting database seed...");
	console.log("=".repeat(60));

	// ==================== CLEAN UP ====================
	console.log("\n🧹 Cleaning up existing data...");

	const deleteOperations = [
		prisma.notification.deleteMany(),
		prisma.exportHistory.deleteMany(),
		prisma.auditLog.deleteMany(),
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
		prisma.oTPSession.deleteMany(),
		prisma.user.deleteMany(),
	];

	await prisma.$transaction(deleteOperations);

	console.log("✅ Cleanup complete");

	// ==================== CREATE USERS ====================
	console.log("\n👤 Creating users...");

	const users: User[] = [];
	for (let i = 0; i < CONFIG.USERS; i++) {
		const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
		const lastName = LAST_NAMES[i % LAST_NAMES.length];
		const user = await prisma.user.create({
			data: {
				email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`,
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

		// Audit log for user creation
		await createAuditLog(
			user.id,
			AuditAction.CREATE,
			"User",
			user.id,
			null,
			{ email: user.email, name: user.name, currency: user.currency },
			`User account created for ${user.name}`,
		);
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

			// Audit log for category creation
			await createAuditLog(
				user.id,
				AuditAction.CREATE,
				"Category",
				category.id,
				null,
				{
					name: category.name,
					type: category.type,
					icon: category.icon,
				},
				`Category "${category.name}" created`,
			);
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

			// Audit log for category creation
			await createAuditLog(
				user.id,
				AuditAction.CREATE,
				"Category",
				category.id,
				null,
				{
					name: category.name,
					type: category.type,
					icon: category.icon,
				},
				`Category "${category.name}" created`,
			);
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
						"#" +
						Math.floor(Math.random() * 16777215)
							.toString(16)
							.padStart(6, "0"),
					userId: user.id,
				},
			});
			userTags.push(tag);

			// Audit log for tag creation
			await createAuditLog(
				user.id,
				AuditAction.CREATE,
				"Tag",
				tag.id,
				null,
				{ name: tag.name, color: tag.color },
				`Tag "${tag.name}" created`,
			);
		}
		allTags.set(user.id, userTags);
		console.log(`   ✅ ${user.name}: ${userTags.length} tags created`);
	}

	// ==================== CREATE ACCOUNTS ====================
	console.log("\n💰 Creating accounts...");

	const allAccounts = new Map<string, Account[]>();

	for (const user of users) {
		const userAccounts: Account[] = [];

		const accountNames = [
			"Cash",
			"HDFC Savings",
			"ICICI Current",
			"SBI Salary",
			"Kotak Zero",
			"Axis Priority",
		];

		for (let i = 0; i < ACCOUNT_TYPES.length; i++) {
			const initialBalance = getRandomAmount(1000, 25000);
			const account = await prisma.account.create({
				data: {
					name: `${accountNames[i]} Account`,
					type: ACCOUNT_TYPES[i],
					balance: initialBalance,
					currency: user.currency,
					isDefault: i === 0,
					color:
						"#" +
						Math.floor(Math.random() * 16777215)
							.toString(16)
							.padStart(6, "0"),
					notes: i === 0 ? "Primary account" : null,
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

			// Audit log for account creation
			await createAuditLog(
				user.id,
				AuditAction.CREATE,
				"Account",
				account.id,
				null,
				{
					name: account.name,
					type: account.type,
					balance: account.balance,
					currency: account.currency,
				},
				`Account "${account.name}" created with balance ${account.balance}`,
			);
		}
		allAccounts.set(user.id, userAccounts);
		console.log(
			`   ✅ ${user.name}: ${userAccounts.length} accounts created`,
		);
	}

	// ==================== CREATE RECURRING TRANSACTIONS ====================
	console.log("\n🔄 Creating recurring transactions...");

	let totalRecurringTransactions = 0;
	const allRecurringTransactions = new Map<string, any[]>();

	for (const user of users) {
		const userCategories = allCategories.get(user.id) || [];
		const userAccounts = allAccounts.get(user.id) || [];
		const userRecurring: any[] = [];

		const expenseCategories = userCategories.filter(
			(c: Category) => c.type === TransactionType.EXPENSE,
		);
		const incomeCategories = userCategories.filter(
			(c: Category) => c.type === TransactionType.INCOME,
		);

		for (let i = 0; i < CONFIG.RECURRING_TRANSACTIONS_PER_USER; i++) {
			const isIncome = i === 0;
			const type = isIncome
				? TransactionType.INCOME
				: TransactionType.EXPENSE;
			const name = isIncome
				? "Monthly Salary"
				: RECURRING_TRANSACTION_NAMES[
						i % RECURRING_TRANSACTION_NAMES.length
					];

			const amount = isIncome
				? getRandomAmount(30000, 80000)
				: getRandomAmount(100, 2000);

			const category = isIncome
				? incomeCategories.find((c) => c.name === "Salary") ||
					getRandomElement(incomeCategories)
				: getRandomElement(expenseCategories);

			const account = getRandomElement(userAccounts);

			const frequency = isIncome
				? RecurringFrequency.MONTHLY
				: getRandomElement([
						RecurringFrequency.MONTHLY,
						RecurringFrequency.MONTHLY,
						RecurringFrequency.WEEKLY,
						RecurringFrequency.YEARLY,
					]);

			const interval = 1;
			const startDate = getRandomDate(30);
			const nextDueDate = calculateNextDueDate(
				startDate,
				frequency,
				interval,
			);

			const recurringTransaction =
				await prisma.recurringTransaction.create({
					data: {
						name,
						amount,
						type,
						frequency,
						interval,
						startDate,
						endDate:
							Math.random() < 0.2 ? getFutureDate(365) : null,
						nextDueDate,
						isActive: Math.random() < 0.9,
						description: isIncome
							? "Monthly salary credit"
							: `Monthly ${name.toLowerCase()}`,
						userId: user.id,
						categoryId: category.id,
						accountId: account.id,
					},
				});

			userRecurring.push(recurringTransaction);
			totalRecurringTransactions++;

			// Audit log for recurring transaction creation
			await createAuditLog(
				user.id,
				AuditAction.CREATE,
				"RecurringTransaction",
				recurringTransaction.id,
				null,
				{
					name,
					amount,
					type,
					frequency,
					interval,
					startDate,
					nextDueDate,
				},
				`Recurring ${type.toLowerCase()} "${name}" created with amount ${amount}`,
			);
		}

		allRecurringTransactions.set(user.id, userRecurring);
		console.log(
			`   ✅ ${user.name}: ${userRecurring.length} recurring transactions created`,
		);
	}
	console.log(
		`   📊 Total recurring transactions: ${totalRecurringTransactions}`,
	);

	// ==================== CREATE TRANSACTIONS ====================
	console.log("\n💸 Creating transactions...");

	let totalTransactions = 0;

	for (const user of users) {
		const userCategories = allCategories.get(user.id) || [];
		const userAccounts = allAccounts.get(user.id) || [];
		const userTags = allTags.get(user.id) || [];
		const userRecurring = allRecurringTransactions.get(user.id) || [];

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

			const descriptions = {
				income: [
					"Monthly Salary",
					"Freelance Project",
					"Performance Bonus",
					"Tax Refund",
					"Dividend Payment",
				],
				expense: [
					"Grocery Shopping",
					"Uber Ride",
					"Netflix Subscription",
					"Amazon Purchase",
					"Restaurant Dinner",
					"Coffee Shop",
					"Phone Bill",
					"Gym Membership",
				],
			};

			const description = isIncome
				? getRandomElement(descriptions.income)
				: getRandomElement(descriptions.expense);

			const balanceChange =
				type === TransactionType.INCOME ? amount : -amount;

			const updatedAccount = await prisma.account.update({
				where: { id: account.id },
				data: { balance: { increment: balanceChange } },
			});

			const linkedRecurringId =
				Math.random() < 0.1 && userRecurring.length > 0
					? getRandomElement(userRecurring).id
					: null;

			const transaction = await prisma.transaction.create({
				data: {
					amount,
					type,
					description,
					date,
					notes:
						Math.random() < 0.2
							? "Need to track this better"
							: null,
					userId: user.id,
					categoryId: category.id,
					accountId: account.id,
					recurringTxnId: linkedRecurringId,
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

			// Audit log for transaction creation (sample every 10th transaction to avoid too many logs)
			if (i % 10 === 0) {
				await createAuditLog(
					user.id,
					AuditAction.CREATE,
					"Transaction",
					transaction.id,
					null,
					{
						amount,
						type,
						description,
						date,
						categoryId: category.id,
					},
					`${type === TransactionType.INCOME ? "Income" : "Expense"} of ${amount} created: ${description}`,
				);
			}
		}
		console.log(
			`   ✅ ${user.name}: ${CONFIG.TRANSACTIONS_PER_USER} transactions created`,
		);
	}
	console.log(`   📊 Total transactions: ${totalTransactions}`);

	// ==================== CREATE BUDGETS ====================
	console.log("\n📊 Creating budgets...");

	let totalBudgets = 0;

	for (const user of users) {
		const userCategories = allCategories.get(user.id) || [];
		const expenseCategories = userCategories.filter(
			(c: Category) => c.type === TransactionType.EXPENSE,
		);

		for (let i = 0; i < CONFIG.BUDGETS_PER_USER; i++) {
			const category = getRandomElement(expenseCategories);
			const budgetName = BUDGET_NAMES[i % BUDGET_NAMES.length];
			const period = getRandomElement([
				BudgetPeriod.MONTHLY,
				BudgetPeriod.WEEKLY,
				BudgetPeriod.MONTHLY,
			]);

			const amount =
				period === BudgetPeriod.MONTHLY
					? getRandomAmount(2000, 15000)
					: getRandomAmount(500, 3000);

			const startDate = new Date();
			startDate.setDate(1);

			const budget = await prisma.budget.create({
				data: {
					amount,
					period,
					startDate,
					endDate: null,
					alertThreshold: getRandomInt(70, 90),
					rollover: Math.random() < 0.3,
					spent: getRandomAmount(amount * 0.2, amount * 0.9),
					remaining: 0,
					userId: user.id,
					categoryId: category.id,
				},
			});

			// Update remaining
			await prisma.budget.update({
				where: { id: budget.id },
				data: { remaining: budget.amount - budget.spent },
			});

			totalBudgets++;

			// Audit log for budget creation
			await createAuditLog(
				user.id,
				AuditAction.CREATE,
				"Budget",
				budget.id,
				null,
				{
					amount,
					period,
					categoryId: category.id,
					alertThreshold: budget.alertThreshold,
				},
				`Budget created for ${category.name} with amount ${amount} (${period})`,
			);

			// Check if budget alert threshold is reached
			const percentage = (budget.spent / budget.amount) * 100;
			if (percentage >= budget.alertThreshold) {
				await createAuditLog(
					user.id,
					AuditAction.BUDGET_ALERT,
					"Budget",
					budget.id,
					{ amount: budget.amount, spent: budget.spent, percentage },
					{
						threshold: budget.alertThreshold,
						severity: percentage >= 100 ? "CRITICAL" : "WARNING",
					},
					`Budget alert: ${percentage.toFixed(1)}% of ${period} budget used for ${category.name}`,
				);
			}
		}
		console.log(
			`   ✅ ${user.name}: ${CONFIG.BUDGETS_PER_USER} budgets created`,
		);
	}
	console.log(`   📊 Total budgets: ${totalBudgets}`);

	// ==================== CREATE SAVINGS GOALS ====================
	console.log("\n🎯 Creating savings goals...");

	let totalSavingsGoals = 0;

	for (const user of users) {
		const userCategories = allCategories.get(user.id) || [];

		for (let i = 0; i < CONFIG.SAVINGS_GOALS_PER_USER; i++) {
			const goalName = SAVINGS_GOAL_NAMES[i % SAVINGS_GOAL_NAMES.length];
			const targetAmount = getRandomAmount(10000, 200000);
			const currentAmount = getRandomAmount(
				targetAmount * 0.1,
				targetAmount * 0.8,
			);
			const deadline = getFutureDate(365);
			const status =
				currentAmount >= targetAmount
					? SavingsGoalStatus.COMPLETED
					: SavingsGoalStatus.ACTIVE;

			const progress = (currentAmount / targetAmount) * 100;
			const daysRemaining = Math.max(
				0,
				Math.ceil(
					(deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
				),
			);

			const savingsGoal = await prisma.savingsGoal.create({
				data: {
					name: goalName,
					targetAmount,
					currentAmount,
					deadline,
					status,
					notes: SAVINGS_GOAL_NOTES[i % SAVINGS_GOAL_NOTES.length],
					progress,
					daysRemaining,
					userId: user.id,
					linkedCategoryId:
						Math.random() < 0.5
							? getRandomElement(userCategories).id
							: null,
				},
			});

			totalSavingsGoals++;

			// Audit log for savings goal creation
			await createAuditLog(
				user.id,
				AuditAction.CREATE,
				"SavingsGoal",
				savingsGoal.id,
				null,
				{
					name: goalName,
					targetAmount,
					currentAmount,
					deadline,
					status,
					progress,
				},
				`Savings goal "${goalName}" created with target ${targetAmount}`,
			);

			// Check for milestone achievements
			const milestones = [25, 50, 75, 100];
			for (const milestone of milestones) {
				if (progress >= milestone) {
					await createAuditLog(
						user.id,
						AuditAction.GOAL_MILESTONE,
						"SavingsGoal",
						savingsGoal.id,
						{ progress: progress - milestone, targetAmount },
						{
							milestone: `${milestone}%`,
							currentAmount,
							targetAmount,
						},
						`Savings goal "${goalName}" reached ${milestone}% milestone!`,
					);
					break;
				}
			}
		}
		console.log(
			`   ✅ ${user.name}: ${CONFIG.SAVINGS_GOALS_PER_USER} savings goals created`,
		);
	}
	console.log(`   📊 Total savings goals: ${totalSavingsGoals}`);

	// ==================== ADD LOGIN/LOGOUT AUDIT LOGS ====================
	console.log("\n🔐 Adding login/logout audit logs...");

	for (const user of users) {
		// Login audit logs
		await createAuditLog(
			user.id,
			AuditAction.LOGIN,
			"User",
			user.id,
			null,
			{ loginMethod: "OTP", timestamp: new Date().toISOString() },
			`User ${user.email} logged in`,
		);

		// Settings change audit logs
		await createAuditLog(
			user.id,
			AuditAction.SETTINGS_CHANGE,
			"Settings",
			user.id,
			{ theme: "light", currency: "USD" },
			{ theme: user.theme, currency: user.currency },
			`User settings updated: theme=${user.theme}, currency=${user.currency}`,
		);
	}
	console.log(
		`   ✅ Added login/logout audit logs for ${users.length} users`,
	);

	// ==================== FINAL SUMMARY ====================
	console.log("\n" + "=".repeat(60));
	console.log("📊 SEED COMPLETE SUMMARY");
	console.log("=".repeat(60));
	console.log(`👤 Users: ${await prisma.user.count()}`);
	console.log(`📂 Categories: ${await prisma.category.count()}`);
	console.log(`🏷️ Tags: ${await prisma.tag.count()}`);
	console.log(`💰 Accounts: ${await prisma.account.count()}`);
	console.log(
		`🔄 Recurring Transactions: ${await prisma.recurringTransaction.count()}`,
	);
	console.log(`💸 Transactions: ${await prisma.transaction.count()}`);
	console.log(`📊 Budgets: ${await prisma.budget.count()}`);
	console.log(`🎯 Savings Goals: ${await prisma.savingsGoal.count()}`);
	console.log(`🔗 Transaction Tags: ${await prisma.transactionTag.count()}`);
	console.log(`📝 Audit Logs: ${await prisma.auditLog.count()}`);
	console.log("=".repeat(60));

	console.log("\n🔑 Test Users (use these IDs for API testing):");
	console.log("-".repeat(60));
	for (const user of users) {
		console.log(`   📧 ${user.email}`);
		console.log(`   🆔 ${user.id}`);
		console.log("");
	}

	console.log("\n📝 Audit Logs API Test URLs:");
	console.log("-".repeat(60));
	console.log(`   GET /api/audit-logs - Get all audit logs`);
	console.log(`   GET /api/audit-logs/:id - Get specific audit log`);
	console.log(`   GET /api/audit-logs?export=json - Export as JSON`);
	console.log(`   GET /api/audit-logs?export=csv - Export as CSV`);
	console.log(`   GET /api/audit-logs?action=CREATE - Filter by action`);
	console.log(
		`   GET /api/audit-logs?entityType=Transaction - Filter by entity`,
	);

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
