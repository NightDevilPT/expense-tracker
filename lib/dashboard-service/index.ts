// lib/dashboard-service/index.ts
import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/logger-service";
import type {
	DashboardData,
	DashboardQueryParams,
	CategoryRadar,
	TagRadar,
	DailyCategoryBreakdown,
	BudgetAlert,
	AlertSummary,
	TopSpendingDay,
} from "./types";
import { validateDashboardQuery } from "./validation";

const logger = new Logger("DASHBOARD-SERVICE");

// Helper: Get date range
function getDateRange(
	period: DashboardQueryParams["period"],
	customStartDate?: string,
	customEndDate?: string,
): {
	startDate: Date;
	endDate: Date;
	previousStartDate: Date;
	previousEndDate: Date;
} {
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth();

	let startDate: Date;
	let endDate: Date;

	switch (period) {
		case "current-month":
			startDate = new Date(currentYear, currentMonth, 1);
			endDate = new Date(now);
			endDate.setHours(23, 59, 59, 999);
			break;
		case "last-month":
			startDate = new Date(currentYear, currentMonth - 1, 1);
			endDate = new Date(currentYear, currentMonth, 0);
			endDate.setHours(23, 59, 59, 999);
			break;
		case "last-3-months":
			startDate = new Date(currentYear, currentMonth - 3, 1);
			endDate = new Date(now);
			endDate.setHours(23, 59, 59, 999);
			break;
		case "last-6-months":
			startDate = new Date(currentYear, currentMonth - 6, 1);
			endDate = new Date(now);
			endDate.setHours(23, 59, 59, 999);
			break;
		case "year-to-date":
			startDate = new Date(currentYear, 0, 1);
			endDate = new Date(now);
			endDate.setHours(23, 59, 59, 999);
			break;
		case "custom":
			if (!customStartDate || !customEndDate) {
				throw new Error(
					"startDate and endDate are required for custom period",
				);
			}
			startDate = new Date(customStartDate);
			endDate = new Date(customEndDate);
			endDate.setHours(23, 59, 59, 999);
			break;
		default:
			startDate = new Date(currentYear, currentMonth, 1);
			endDate = new Date(now);
			endDate.setHours(23, 59, 59, 999);
	}

	startDate.setHours(0, 0, 0, 0);

	const duration = endDate.getTime() - startDate.getTime();
	const previousEndDate = new Date(startDate);
	previousEndDate.setMilliseconds(-1);
	const previousStartDate = new Date(previousEndDate.getTime() - duration);

	return { startDate, endDate, previousStartDate, previousEndDate };
}

// Helper: Get KPI Cards
async function getCardMetrics(
	userId: string,
	startDate: Date,
	endDate: Date,
	previousStartDate: Date,
	previousEndDate: Date,
) {
	const [currentIncome, currentExpense, currentStats] = await Promise.all([
		prisma.transaction.aggregate({
			where: {
				userId,
				date: { gte: startDate, lte: endDate },
				type: "INCOME",
			},
			_sum: { amount: true },
		}),
		prisma.transaction.aggregate({
			where: {
				userId,
				date: { gte: startDate, lte: endDate },
				type: "EXPENSE",
			},
			_sum: { amount: true },
		}),
		prisma.transaction.aggregate({
			where: { userId, date: { gte: startDate, lte: endDate } },
			_count: true,
		}),
	]);

	const [previousIncome, previousExpense, previousStats] = await Promise.all([
		prisma.transaction.aggregate({
			where: {
				userId,
				date: { gte: previousStartDate, lte: previousEndDate },
				type: "INCOME",
			},
			_sum: { amount: true },
		}),
		prisma.transaction.aggregate({
			where: {
				userId,
				date: { gte: previousStartDate, lte: previousEndDate },
				type: "EXPENSE",
			},
			_sum: { amount: true },
		}),
		prisma.transaction.aggregate({
			where: {
				userId,
				date: { gte: previousStartDate, lte: previousEndDate },
			},
			_count: true,
		}),
	]);

	const calculateTrend = (
		current: number,
		previous: number,
	): "up" | "down" | "neutral" => {
		if (current > previous) return "up";
		if (current < previous) return "down";
		return "neutral";
	};

	const calculateChangePercent = (
		current: number,
		previous: number,
	): number => {
		if (previous === 0) return current > 0 ? 100 : 0;
		return ((current - previous) / previous) * 100;
	};

	const currentIncomeAmount = currentIncome._sum.amount || 0;
	const currentExpenseAmount = currentExpense._sum.amount || 0;
	const previousIncomeAmount = previousIncome._sum.amount || 0;
	const previousExpenseAmount = previousExpense._sum.amount || 0;

	return {
		totalIncome: {
			current: currentIncomeAmount,
			previous: previousIncomeAmount,
			change: currentIncomeAmount - previousIncomeAmount,
			changePercent: calculateChangePercent(
				currentIncomeAmount,
				previousIncomeAmount,
			),
			trend: calculateTrend(currentIncomeAmount, previousIncomeAmount),
		},
		totalExpense: {
			current: currentExpenseAmount,
			previous: previousExpenseAmount,
			change: currentExpenseAmount - previousExpenseAmount,
			changePercent: calculateChangePercent(
				currentExpenseAmount,
				previousExpenseAmount,
			),
			trend: calculateTrend(currentExpenseAmount, previousExpenseAmount),
		},
		netSavings: {
			current: currentIncomeAmount - currentExpenseAmount,
			previous: previousIncomeAmount - previousExpenseAmount,
			change:
				currentIncomeAmount -
				currentExpenseAmount -
				(previousIncomeAmount - previousExpenseAmount),
			changePercent: calculateChangePercent(
				currentIncomeAmount - currentExpenseAmount,
				previousIncomeAmount - previousExpenseAmount,
			),
			trend: calculateTrend(
				currentIncomeAmount - currentExpenseAmount,
				previousIncomeAmount - previousExpenseAmount,
			),
		},
		totalTransactions: {
			current: currentStats._count,
			previous: previousStats._count,
			change: currentStats._count - previousStats._count,
			changePercent: calculateChangePercent(
				currentStats._count,
				previousStats._count,
			),
			trend: calculateTrend(currentStats._count, previousStats._count),
		},
	};
}

// Helper: Get Monthly Trend for Area Chart
async function getMonthlyTrend(userId: string, startDate: Date, endDate: Date) {
	const transactions = await prisma.transaction.groupBy({
		by: ["type", "date"],
		where: {
			userId,
			date: { gte: startDate, lte: endDate },
			type: { in: ["INCOME", "EXPENSE"] },
		},
		_sum: { amount: true },
		orderBy: { date: "asc" },
	});

	const monthlyMap = new Map<string, { income: number; expense: number }>();

	transactions.forEach((t) => {
		const monthKey = t.date.toISOString().slice(0, 7);
		const existing = monthlyMap.get(monthKey) || { income: 0, expense: 0 };

		if (t.type === "INCOME") {
			existing.income += t._sum.amount || 0;
		} else {
			existing.expense += t._sum.amount || 0;
		}
		monthlyMap.set(monthKey, existing);
	});

	return Array.from(monthlyMap.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([monthKey, data]) => ({
			month: new Date(monthKey).toLocaleString("default", {
				month: "short",
			}),
			monthKey,
			income: data.income,
			expense: data.expense,
			savings: data.income - data.expense,
		}));
}

// Helper: Get Expense by Category for Donut Chart
async function getExpenseByCategory(
	userId: string,
	startDate: Date,
	endDate: Date,
) {
	const totalExpense = await prisma.transaction.aggregate({
		where: {
			userId,
			date: { gte: startDate, lte: endDate },
			type: "EXPENSE",
		},
		_sum: { amount: true },
	});

	const total = totalExpense._sum.amount || 0;

	const categoryExpenses = await prisma.transaction.groupBy({
		by: ["categoryId"],
		where: {
			userId,
			date: { gte: startDate, lte: endDate },
			type: "EXPENSE",
			categoryId: { not: null },
		},
		_sum: { amount: true },
	});

	const categories = await prisma.category.findMany({
		where: {
			id: {
				in: categoryExpenses.map((c) => c.categoryId!).filter(Boolean),
			},
		},
		select: { id: true, name: true, color: true },
	});

	const categoryMap = new Map(categories.map((c) => [c.id, c]));

	const result = categoryExpenses.map((c) => {
		const category = categoryMap.get(c.categoryId!);
		const amount = c._sum.amount || 0;
		return {
			categoryId: c.categoryId!,
			categoryName: category?.name || "Uncategorized",
			categoryColor: category?.color || null,
			amount,
			percentage: total > 0 ? (amount / total) * 100 : 0,
		};
	});

	return result.sort((a, b) => b.amount - a.amount);
}

// Helper: Get Category Spending for Interactive Bar Chart
async function getCategorySpending(
	userId: string,
	startDate: Date,
	endDate: Date,
) {
	const transactions = await prisma.transaction.findMany({
		where: {
			userId,
			date: { gte: startDate, lte: endDate },
			type: "EXPENSE",
			categoryId: { not: null },
		},
		include: { category: { select: { name: true } } },
	});

	const monthlyData = new Map();

	transactions.forEach((t) => {
		const monthKey = t.date.toISOString().slice(0, 7);
		const monthName = t.date.toLocaleString("default", { month: "short" });
		const categoryName = t.category?.name || "Other";

		if (!monthlyData.has(monthKey)) {
			monthlyData.set(monthKey, { month: monthName, monthKey });
		}

		const monthData = monthlyData.get(monthKey);
		monthData[categoryName] = (monthData[categoryName] || 0) + t.amount;
	});

	return Array.from(monthlyData.values()).sort((a, b) =>
		a.monthKey.localeCompare(b.monthKey),
	);
}

// Helper: Get Category Radar Data
async function getCategoryRadar(
	userId: string,
	startDate: Date,
	endDate: Date,
): Promise<CategoryRadar[]> {
	const budgets = await prisma.budget.findMany({
		where: {
			userId,
			startDate: { lte: endDate },
			OR: [{ endDate: null }, { endDate: { gte: startDate } }],
			categoryId: { not: null },
		},
		include: {
			category: { select: { id: true, name: true, color: true } },
		},
	});

	const result: CategoryRadar[] = [];

	for (const budget of budgets) {
		if (!budget.category) continue;

		const spent = await prisma.transaction.aggregate({
			where: {
				userId,
				categoryId: budget.categoryId!,
				type: "EXPENSE",
				date: { gte: startDate, lte: endDate },
			},
			_sum: { amount: true },
		});

		const spentAmount = spent._sum.amount || 0;
		const percentage = (spentAmount / budget.amount) * 100;

		result.push({
			category: budget.category.name,
			categoryId: budget.category.id,
			budget: budget.amount,
			spent: spentAmount,
			percentage: Math.min(percentage, 100),
			color: budget.category.color,
		});
	}

	return result.sort((a, b) => b.percentage - a.percentage).slice(0, 8);
}

// Helper: Get Tag Radar Data
async function getTagRadar(
	userId: string,
	startDate: Date,
	endDate: Date,
): Promise<TagRadar[]> {
	const tagStats = await prisma.transactionTag.groupBy({
		by: ["tagId"],
		where: {
			transaction: {
				userId,
				date: { gte: startDate, lte: endDate },
				type: "EXPENSE",
			},
		},
		_count: { tagId: true },
	});

	const tagIds = tagStats.map((t) => t.tagId);
	const tags = await prisma.tag.findMany({
		where: { id: { in: tagIds }, userId },
		select: { id: true, name: true, color: true },
	});

	const tagMap = new Map(tags.map((t) => [t.id, t]));
	const result: TagRadar[] = [];

	for (const stat of tagStats) {
		const tag = tagMap.get(stat.tagId);
		if (!tag) continue;

		const transactions = await prisma.transactionTag.findMany({
			where: { tagId: stat.tagId },
			include: { transaction: true },
		});

		const totalAmount = transactions.reduce(
			(sum, t) =>
				sum +
				(t.transaction.type === "EXPENSE" ? t.transaction.amount : 0),
			0,
		);

		result.push({
			tag: tag.name,
			tagId: tag.id,
			usageCount: stat._count.tagId,
			totalAmount,
			averageAmount: totalAmount / stat._count.tagId,
			color: tag.color,
		});
	}

	return result.sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 6);
}

// Helper: Get Daily Category Breakdown for Stacked Bar Chart
async function getDailyCategoryBreakdown(
	userId: string,
	startDate: Date,
	endDate: Date,
): Promise<DailyCategoryBreakdown[]> {
	const transactions = await prisma.transaction.findMany({
		where: {
			userId,
			date: { gte: startDate, lte: endDate },
			type: "EXPENSE",
			categoryId: { not: null },
		},
		include: { category: { select: { name: true } } },
		orderBy: { date: "asc" },
	});

	const dailyData = new Map();

	transactions.forEach((t) => {
		const dateKey = t.date.toISOString().slice(0, 10);
		const dayName = t.date.toLocaleString("default", { weekday: "short" });
		const categoryName = t.category?.name || "Other";

		if (!dailyData.has(dateKey)) {
			dailyData.set(dateKey, { date: dateKey, dayName });
		}

		const dayData = dailyData.get(dateKey);
		dayData[categoryName] = (dayData[categoryName] || 0) + t.amount;
	});

	return Array.from(dailyData.values()).slice(0, 10);
}

// Helper: Get Budget Alerts
async function getBudgetAlerts(
	userId: string,
	startDate: Date,
	endDate: Date,
): Promise<{ alerts: BudgetAlert[]; summary: AlertSummary }> {
	const budgets = await prisma.budget.findMany({
		where: {
			userId,
			startDate: { lte: endDate },
			OR: [{ endDate: null }, { endDate: { gte: startDate } }],
		},
		include: { category: { select: { id: true, name: true } } },
	});

	const alerts: BudgetAlert[] = [];

	for (const budget of budgets) {
		const spent = await prisma.transaction.aggregate({
			where: {
				userId,
				categoryId: budget.categoryId || undefined,
				type: "EXPENSE",
				date: { gte: startDate, lte: endDate },
			},
			_sum: { amount: true },
		});

		const spentAmount = spent._sum.amount || 0;
		const percentageUsed = (spentAmount / budget.amount) * 100;
		const previousSpent = await prisma.transaction.aggregate({
			where: {
				userId,
				categoryId: budget.categoryId || undefined,
				type: "EXPENSE",
			},
			_sum: { amount: true },
		});

		const previousAmount = previousSpent._sum.amount || 0;
		const trendPercent =
			previousAmount > 0
				? ((spentAmount - previousAmount) / previousAmount) * 100
				: 0;

		if (percentageUsed >= budget.alertThreshold) {
			alerts.push({
				budgetId: budget.id,
				categoryId: budget.categoryId || "uncategorized",
				categoryName: budget.category?.name || "All Categories",
				budgetAmount: budget.amount,
				spentAmount,
				remainingAmount: budget.amount - spentAmount,
				percentageUsed,
				alertThreshold: budget.alertThreshold,
				isExceeded: spentAmount > budget.amount,
				trend:
					trendPercent > 0
						? "up"
						: trendPercent < 0
							? "down"
							: "neutral",
				trendPercent: Math.abs(trendPercent),
			});
		}
	}

	const summary: AlertSummary = {
		totalAlerts: alerts.length,
		exceededCount: alerts.filter((a) => a.isExceeded).length,
		warningCount: alerts.filter(
			(a) => !a.isExceeded && a.percentageUsed >= a.alertThreshold,
		).length,
		averageUsage:
			alerts.length > 0
				? alerts.reduce((sum, a) => sum + a.percentageUsed, 0) /
					alerts.length
				: 0,
	};

	return {
		alerts: alerts.sort((a, b) => b.percentageUsed - a.percentageUsed),
		summary,
	};
}

// Helper: Get Recent Transactions
async function getRecentTransactions(userId: string, limit: number = 10) {
	const transactions = await prisma.transaction.findMany({
		where: { userId },
		orderBy: { date: "desc" },
		take: limit,
		include: {
			category: {
				select: { id: true, name: true, color: true, icon: true },
			},
			account: { select: { id: true, name: true } },
		},
	});

	return transactions.map((t) => ({
		id: t.id,
		date: t.date.toISOString(),
		description: t.description,
		amount: t.amount,
		type: t.type,
		category: t.category
			? {
					id: t.category.id,
					name: t.category.name,
					color: t.category.color,
					icon: t.category.icon,
				}
			: null,
		account: t.account
			? {
					id: t.account.id,
					name: t.account.name,
				}
			: null,
	}));
}

// Helper: Get Top Spending Days
async function getTopSpendingDays(
	userId: string,
	startDate: Date,
	endDate: Date,
	limit: number = 5,
): Promise<TopSpendingDay[]> {
	const dailySpending = await prisma.transaction.groupBy({
		by: ["date"],
		where: {
			userId,
			date: { gte: startDate, lte: endDate },
			type: "EXPENSE",
		},
		_sum: { amount: true },
		_count: true,
	});

	const topDays = dailySpending
		.sort((a, b) => (b._sum.amount || 0) - (a._sum.amount || 0))
		.slice(0, limit);

	const result: TopSpendingDay[] = [];

	for (const day of topDays) {
		const categoryTransactions = await prisma.transaction.groupBy({
			by: ["categoryId"],
			where: {
				userId,
				date: day.date,
				type: "EXPENSE",
			},
			_sum: { amount: true },
		});

		const categories = await prisma.category.findMany({
			where: {
				id: {
					in: categoryTransactions
						.map((c) => c.categoryId!)
						.filter(Boolean),
				},
			},
			select: { name: true },
		});

		result.push({
			date: day.date.toISOString(),
			amount: day._sum.amount || 0,
			transactionCount: day._count,
			categories: categories.map((c) => c.name).slice(0, 3),
		});
	}

	return result;
}

// Helper: Get Summary Stats - Fixed
async function getSummaryStats(userId: string, startDate: Date, endDate: Date) {
	const [totalIncome, totalExpense, transactions] = await Promise.all([
		prisma.transaction.aggregate({
			where: {
				userId,
				date: { gte: startDate, lte: endDate },
				type: "INCOME",
			},
			_sum: { amount: true },
		}),
		prisma.transaction.aggregate({
			where: {
				userId,
				date: { gte: startDate, lte: endDate },
				type: "EXPENSE",
			},
			_sum: { amount: true },
		}),
		prisma.transaction.findMany({
			where: { userId, date: { gte: startDate, lte: endDate } },
			select: {
				date: true,
				amount: true,
				type: true,
				category: { select: { name: true } },
			},
		}),
	]);

	const incomeAmount = totalIncome._sum.amount || 0;
	const expenseAmount = totalExpense._sum.amount || 0;

	// Calculate daily averages
	const daysDiff = Math.max(
		1,
		Math.ceil(
			(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
		),
	);
	const averageDailyExpense = expenseAmount / daysDiff;
	const averageDailyIncome = incomeAmount / daysDiff;

	// Find best and worst days - Simplified approach
	const dailyMap = new Map<string, number>();

	for (const t of transactions) {
		const dateKey = t.date.toISOString().slice(0, 10);
		const currentAmount = dailyMap.get(dateKey) || 0;

		if (t.type === "INCOME") {
			dailyMap.set(dateKey, currentAmount + t.amount);
		} else {
			dailyMap.set(dateKey, currentAmount - t.amount);
		}
	}

	// Find best and worst days
	let bestDate: string | null = null;
	let bestAmount: number = -Infinity;
	let worstDate: string | null = null;
	let worstAmount: number = Infinity;

	for (const [date, amount] of dailyMap) {
		if (amount > bestAmount) {
			bestAmount = amount;
			bestDate = date;
		}
		if (amount < worstAmount) {
			worstAmount = amount;
			worstDate = date;
		}
	}

	// Find most active category
	const categoryStats = await prisma.transaction.groupBy({
		by: ["categoryId"],
		where: {
			userId,
			date: { gte: startDate, lte: endDate },
			type: "EXPENSE",
			categoryId: { not: null },
		},
		_sum: { amount: true },
		orderBy: { _sum: { amount: "desc" } },
		take: 1,
	});

	let mostActiveCategory: string | null = null;
	if (categoryStats.length > 0 && categoryStats[0].categoryId) {
		const category = await prisma.category.findUnique({
			where: { id: categoryStats[0].categoryId },
			select: { name: true },
		});
		mostActiveCategory = category?.name || null;
	}

	// Calculate savings rate and monthly change
	const savingsRate =
		incomeAmount > 0
			? ((incomeAmount - expenseAmount) / incomeAmount) * 100
			: 0;

	// Get previous month for comparison
	const previousStartDate = new Date(startDate);
	previousStartDate.setMonth(previousStartDate.getMonth() - 1);
	const previousEndDate = new Date(startDate);
	previousEndDate.setDate(previousEndDate.getDate() - 1);

	const previousExpense = await prisma.transaction.aggregate({
		where: {
			userId,
			date: { gte: previousStartDate, lte: previousEndDate },
			type: "EXPENSE",
		},
		_sum: { amount: true },
	});

	const monthlyChange =
		previousExpense._sum.amount && previousExpense._sum.amount > 0
			? ((expenseAmount - previousExpense._sum.amount) /
					previousExpense._sum.amount) *
				100
			: 0;

	return {
		averageDailyExpense,
		averageDailyIncome,
		bestDay: bestDate,
		bestDayAmount: bestAmount === -Infinity ? 0 : bestAmount,
		worstDay: worstDate,
		worstDayAmount: worstAmount === Infinity ? 0 : worstAmount,
		mostActiveCategory,
		savingsRate,
		monthlyChange,
	};
}

// Main export function
export async function getDashboardData(
	userId: string,
	params: DashboardQueryParams,
): Promise<DashboardData> {
	logger.info("Fetching dashboard data", { userId, period: params.period });

	const validatedParams = validateDashboardQuery(params);
	const includeTagAnalysis = validatedParams.includeTagAnalysis || false;

	const { startDate, endDate, previousStartDate, previousEndDate } =
		getDateRange(
			validatedParams.period,
			validatedParams.startDate,
			validatedParams.endDate,
		);

	const [
		cards,
		monthlyTrend,
		expenseByCategory,
		categorySpending,
		categoryRadar,
		tagRadar,
		dailyCategoryBreakdown,
		recentTransactions,
		{ alerts: budgetAlerts, summary: alertSummary },
		topSpendingDays,
		summary,
	] = await Promise.all([
		getCardMetrics(
			userId,
			startDate,
			endDate,
			previousStartDate,
			previousEndDate,
		),
		getMonthlyTrend(userId, startDate, endDate),
		getExpenseByCategory(userId, startDate, endDate),
		getCategorySpending(userId, startDate, endDate),
		getCategoryRadar(userId, startDate, endDate),
		includeTagAnalysis
			? getTagRadar(userId, startDate, endDate)
			: Promise.resolve([]),
		getDailyCategoryBreakdown(userId, startDate, endDate),
		getRecentTransactions(userId, 10),
		getBudgetAlerts(userId, startDate, endDate),
		getTopSpendingDays(userId, startDate, endDate, 5),
		getSummaryStats(userId, startDate, endDate),
	]);

	const totalExpenseAmount = expenseByCategory.reduce(
		(sum, cat) => sum + cat.amount,
		0,
	);

	// Get weekly spending
	const weeklySpending = [];
	for (let i = 6; i >= 0; i--) {
		const date = new Date(endDate);
		date.setDate(endDate.getDate() - i);
		const dateKey = date.toISOString().slice(0, 10);
		const daySpending = await prisma.transaction.aggregate({
			where: {
				userId,
				date: {
					gte: new Date(dateKey),
					lte: new Date(dateKey + "T23:59:59.999Z"),
				},
				type: "EXPENSE",
			},
			_sum: { amount: true },
		});
		weeklySpending.push({
			date: date.toLocaleString("default", { weekday: "short" }),
			dateKey,
			amount: daySpending._sum.amount || 0,
			dayOfWeek: date.getDay(),
		});
	}

	return {
		period: {
			startDate: startDate.toISOString(),
			endDate: endDate.toISOString(),
			previousStartDate: previousStartDate.toISOString(),
			previousEndDate: previousEndDate.toISOString(),
		},
		cards,
		summary,
		monthlyTrend,
		weeklySpending,
		expenseByCategory,
		totalExpenseAmount,
		categorySpending,
		categoryRadar,
		tagRadar,
		dailyCategoryBreakdown,
		recentTransactions,
		budgetAlerts,
		alertSummary,
		topSpendingDays,
	};
}
