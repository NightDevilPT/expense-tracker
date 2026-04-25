// lib/dashboard-service/types.ts

export interface PeriodRange {
	startDate: string;
	endDate: string;
	previousStartDate: string;
	previousEndDate: string;
}

// KPI Cards
export interface KPICard {
	current: number;
	previous: number;
	change: number;
	changePercent: number;
	trend: "up" | "down" | "neutral";
}

export interface DashboardCards {
	totalIncome: KPICard;
	totalExpense: KPICard;
	netSavings: KPICard;
	totalTransactions: KPICard;
}

// Area Chart - Monthly Trend
export interface MonthlyTrend {
	month: string;
	monthKey: string;
	income: number;
	expense: number;
	savings: number;
}

// Pie/Donut Chart - Expense by Category
export interface ExpenseByCategory {
	categoryId: string;
	categoryName: string;
	categoryColor: string | null;
	amount: number;
	percentage: number;
}

// Bar Chart - Weekly Spending
export interface WeeklySpending {
	date: string;
	dateKey: string;
	amount: number;
	dayOfWeek: number;
}

// Interactive Bar Chart - Category Spending by Month
export interface CategorySpending {
	month: string;
	[categoryName: string]: string | number;
}

// Radar Chart - Category Budget Performance
export interface CategoryRadar {
	category: string;
	categoryId: string;
	budget: number;
	spent: number;
	percentage: number;
	color: string | null;
}

// Radar Chart - Tag Performance
export interface TagRadar {
	tag: string;
	tagId: string;
	usageCount: number;
	totalAmount: number;
	averageAmount: number;
	color: string | null;
}

// Stacked Bar Chart - Daily Category Breakdown
export interface DailyCategoryBreakdown {
	date: string;
	dayName: string;
	[categoryName: string]: string | number;
}

// Recent Transactions
export interface RecentTransaction {
	id: string;
	date: string;
	description: string | null;
	amount: number;
	type: "INCOME" | "EXPENSE" | "TRANSFER";
	category: {
		id: string;
		name: string;
		color: string | null;
		icon: string | null;
	} | null;
	account: {
		id: string;
		name: string;
	} | null;
}

// Budget Alerts
export interface BudgetAlert {
	budgetId: string;
	categoryId: string;
	categoryName: string;
	budgetAmount: number;
	spentAmount: number;
	remainingAmount: number;
	percentageUsed: number;
	alertThreshold: number;
	isExceeded: boolean;
	trend: "up" | "down" | "neutral";
	trendPercent: number;
}

export interface AlertSummary {
	totalAlerts: number;
	exceededCount: number;
	warningCount: number;
	averageUsage: number;
}

// Top Spending Days
export interface TopSpendingDay {
	date: string;
	amount: number;
	transactionCount: number;
	categories: string[];
}

// Summary Stats
export interface DashboardSummary {
	averageDailyExpense: number;
	averageDailyIncome: number;
	bestDay: string | null;
	bestDayAmount: number;
	worstDay: string | null;
	worstDayAmount: number;
	mostActiveCategory: string | null;
	savingsRate: number;
	monthlyChange: number;
}

// Complete Dashboard Response
export interface DashboardData {
	period: PeriodRange;
	cards: DashboardCards;
	summary: DashboardSummary;
	monthlyTrend: MonthlyTrend[];
	weeklySpending: WeeklySpending[];
	expenseByCategory: ExpenseByCategory[];
	totalExpenseAmount: number;
	categorySpending: CategorySpending[];
	categoryRadar: CategoryRadar[];
	tagRadar: TagRadar[];
	dailyCategoryBreakdown: DailyCategoryBreakdown[];
	recentTransactions: RecentTransaction[];
	budgetAlerts: BudgetAlert[];
	alertSummary: AlertSummary;
	topSpendingDays: TopSpendingDay[];
}

// Query Parameters
export interface DashboardQueryParams {
	period?:
		| "current-month"
		| "last-month"
		| "last-3-months"
		| "last-6-months"
		| "year-to-date"
		| "custom";
	startDate?: string;
	endDate?: string;
	compareWithPrevious?: boolean;
	includeTagAnalysis?: boolean;
}
