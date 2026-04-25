// prisma/seed/config.ts

export const SEED_CONFIG = {
	// Users
	userCount: 5,
	emailDomain: "@gmail.com",

	// Date range
	yearsBack: 1,
	monthsBack: 0,
	daysBack: 0,

	// Transactions
	transactionsPerDay: 3,
	weekendTransactionMultiplier: 0.7,
	minTransactionAmount: 5,
	maxTransactionAmount: 500,

	// Accounts
	accountsPerUser: 3,
	minAccountBalance: 1000,
	maxAccountBalance: 50000,

	// Categories
	categoriesPerUser: 8,

	// Budgets
	budgetsPerUser: 5,
	minBudgetAmount: 500,
	maxBudgetAmount: 5000,

	// Recurring transactions
	recurringTransactionsPerUser: 3,

	// Tags
	tagsPerUser: 10,

	// Savings Goals
	savingsGoalsPerUser: 2,
	minSavingsGoalAmount: 1000,
	maxSavingsGoalAmount: 20000,
};
