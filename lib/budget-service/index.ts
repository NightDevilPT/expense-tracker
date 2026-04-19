// lib/budget-service/index.ts

import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/logger-service";
import { getCategoryById } from "@/lib/category-service";
import {
	validateCreateBudget,
	validateUpdateBudget,
	validateGetBudgetsQuery,
	validateBudgetId,
	type CreateBudgetInput,
	type UpdateBudgetInput,
	type GetBudgetsQueryInput,
} from "./validation";
import type {
	Budget,
	BudgetWithProgress,
	CurrentMonthBudget,
	BudgetAlert,
	GetBudgetsParams,
	PaginatedResult,
} from "./types";

const logger = new Logger("BUDGET-SERVICE");

// Helper: Update budget spent and remaining
async function updateBudgetSpent(
	budgetId: string,
	userId: string,
): Promise<void> {
	const budget = await prisma.budget.findUnique({
		where: { id: budgetId },
	});

	if (!budget) return;

	const now = new Date();
	let startDate: Date;
	let endDate: Date;

	// Calculate date range based on period
	if (budget.period === "DAILY") {
		startDate = new Date(budget.startDate);
		startDate.setHours(0, 0, 0, 0);
		endDate = new Date(startDate);
		endDate.setHours(23, 59, 59, 999);
	} else if (budget.period === "WEEKLY") {
		startDate = new Date(budget.startDate);
		startDate.setHours(0, 0, 0, 0);
		endDate = new Date(startDate);
		endDate.setDate(endDate.getDate() + 7);
		endDate.setHours(23, 59, 59, 999);
	} else if (budget.period === "MONTHLY") {
		startDate = new Date(budget.startDate);
		startDate.setHours(0, 0, 0, 0);
		endDate = new Date(startDate);
		endDate.setMonth(endDate.getMonth() + 1);
		endDate.setHours(23, 59, 59, 999);
	} else if (budget.period === "YEARLY") {
		startDate = new Date(budget.startDate);
		startDate.setHours(0, 0, 0, 0);
		endDate = new Date(startDate);
		endDate.setFullYear(endDate.getFullYear() + 1);
		endDate.setHours(23, 59, 59, 999);
	} else {
		startDate = new Date(budget.startDate);
		endDate = budget.endDate
			? new Date(budget.endDate)
			: new Date(now.getFullYear(), 11, 31);
	}

	const where: any = {
		userId,
		type: "EXPENSE",
		date: { gte: startDate, lte: endDate },
	};

	if (budget.categoryId) {
		where.categoryId = budget.categoryId;
	}

	const transactions = await prisma.transaction.findMany({
		where,
		select: { amount: true },
	});

	const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
	const remaining = budget.amount - spent;

	await prisma.budget.update({
		where: { id: budgetId },
		data: { spent, remaining },
	});
}

// Helper: Calculate budget with progress
function calculateBudgetProgress(budget: Budget): BudgetWithProgress {
	const percentage =
		budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
	const isOverBudget = budget.spent > budget.amount;
	const isNearThreshold = percentage >= budget.alertThreshold;

	return {
		...budget,
		percentage,
		isOverBudget,
		isNearThreshold,
	};
}

// Verify category access
async function verifyCategoryAccess(
	categoryId: string,
	userId: string,
): Promise<void> {
	try {
		await getCategoryById(categoryId, userId);
	} catch (error) {
		throw new Error("CATEGORY_NOT_FOUND");
	}
}

// Get all budgets
export async function getAllBudgets(
	userId: string,
	params: GetBudgetsParams = {},
): Promise<PaginatedResult<BudgetWithProgress>> {
	logger.info("Fetching all budgets", { userId, params });

	const validatedParams = validateGetBudgetsQuery(params);
	const page = validatedParams.page;
	const limit = validatedParams.limit;
	const skip = (page - 1) * limit;

	const where: any = { userId };

	if (validatedParams.period) {
		where.period = validatedParams.period;
	}

	if (validatedParams.categoryId) {
		where.categoryId = validatedParams.categoryId;
	}

	if (validatedParams.startDate) {
		where.startDate = { gte: new Date(validatedParams.startDate) };
	}

	if (validatedParams.endDate) {
		where.startDate = {
			...where.startDate,
			lte: new Date(validatedParams.endDate),
		};
	}

	const orderBy: any = {
		[validatedParams.sortBy]: validatedParams.sortOrder,
	};

	const [total, budgets] = await Promise.all([
		prisma.budget.count({ where }),
		prisma.budget.findMany({
			where,
			skip,
			take: limit,
			orderBy,
			include: { category: true },
		}),
	]);

	// Update spent/remaining for all budgets
	await Promise.all(budgets.map((b) => updateBudgetSpent(b.id, userId)));

	// Refetch with updated values
	const updatedBudgets = await prisma.budget.findMany({
		where: { id: { in: budgets.map((b) => b.id) } },
		include: { category: true },
	});

	const budgetsWithProgress = updatedBudgets.map((b) =>
		calculateBudgetProgress(b as Budget),
	);

	logger.info("Budgets fetched successfully", {
		count: budgets.length,
		total,
	});

	return { data: budgetsWithProgress, total, page, limit };
}

// Get budget by ID
export async function getBudgetById(
	id: string,
	userId: string,
): Promise<BudgetWithProgress> {
	logger.info("Fetching budget by ID", { id, userId });

	validateBudgetId(id);

	const budget = await prisma.budget.findFirst({
		where: { id, userId },
		include: { category: true },
	});

	if (!budget) {
		logger.warn("Budget not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	await updateBudgetSpent(id, userId);

	const updatedBudget = await prisma.budget.findUnique({
		where: { id },
		include: { category: true },
	});

	return calculateBudgetProgress(updatedBudget as Budget);
}

// Create budget
export async function createBudget(
	userId: string,
	data: CreateBudgetInput,
): Promise<Budget> {
	logger.info("Creating new budget", { userId, ...data });

	const validatedData = validateCreateBudget(data);

	if (validatedData.categoryId) {
		await verifyCategoryAccess(validatedData.categoryId, userId);
	}

	const budget = await prisma.budget.create({
		data: {
			amount: validatedData.amount,
			period: validatedData.period,
			startDate: new Date(validatedData.startDate),
			endDate: validatedData.endDate
				? new Date(validatedData.endDate)
				: null,
			alertThreshold: validatedData.alertThreshold,
			rollover: validatedData.rollover,
			categoryId: validatedData.categoryId || null,
			userId,
			spent: 0,
			remaining: validatedData.amount,
		},
		include: { category: true },
	});

	logger.info("Budget created successfully", { id: budget.id });
	return budget as Budget;
}

// Update budget
export async function updateBudget(
	id: string,
	userId: string,
	data: UpdateBudgetInput,
): Promise<Budget> {
	logger.info("Updating budget", { id, userId });

	validateBudgetId(id);
	const validatedData = validateUpdateBudget(data);

	const existingBudget = await prisma.budget.findFirst({
		where: { id, userId },
	});

	if (!existingBudget) {
		logger.warn("Budget not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	if (validatedData.categoryId) {
		await verifyCategoryAccess(validatedData.categoryId, userId);
	}

	const updateData: any = { ...validatedData };
	if (validatedData.startDate) {
		updateData.startDate = new Date(validatedData.startDate);
	}
	if (validatedData.endDate !== undefined) {
		updateData.endDate = validatedData.endDate
			? new Date(validatedData.endDate)
			: null;
	}

	// If amount changed, recalculate remaining
	if (validatedData.amount) {
		updateData.remaining = validatedData.amount - existingBudget.spent;
	}

	const budget = await prisma.budget.update({
		where: { id },
		data: updateData,
		include: { category: true },
	});

	logger.info("Budget updated successfully", { id });
	return budget as Budget;
}

// Delete budget
export async function deleteBudget(id: string, userId: string): Promise<void> {
	logger.info("Deleting budget", { id, userId });

	validateBudgetId(id);

	const budget = await prisma.budget.findFirst({
		where: { id, userId },
	});

	if (!budget) {
		logger.warn("Budget not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	await prisma.budget.delete({ where: { id } });

	logger.info("Budget deleted successfully", { id });
}

// Get current month budgets (now handles all periods)
export async function getCurrentMonthBudgets(
	userId: string,
): Promise<CurrentMonthBudget[]> {
	logger.info("Fetching current active budgets", { userId });

	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
	const daysInMonth = endOfMonth.getDate();
	const currentDay = now.getDate();
	const daysRemaining = daysInMonth - currentDay;

	const budgets = await prisma.budget.findMany({
		where: {
			userId,
			OR: [
				{ period: "DAILY" },
				{ period: "WEEKLY" },
				{ period: "MONTHLY" },
				{ period: "YEARLY" },
			],
		},
		include: { category: true },
	});

	await Promise.all(budgets.map((b) => updateBudgetSpent(b.id, userId)));

	const updatedBudgets = await prisma.budget.findMany({
		where: { id: { in: budgets.map((b) => b.id) } },
		include: { category: true },
	});

	const budgetsWithProgress = updatedBudgets.map((budget) => {
		const progress = calculateBudgetProgress(budget as Budget);
		const dailyAverage = currentDay > 0 ? progress.spent / currentDay : 0;
		const projectedSpending = dailyAverage * daysInMonth;

		return {
			...progress,
			dailyAverage,
			projectedSpending,
			daysRemaining,
		};
	});

	logger.info("Active budgets fetched", {
		count: budgetsWithProgress.length,
	});
	return budgetsWithProgress;
}

// Get budget alerts
export async function getBudgetAlerts(userId: string): Promise<BudgetAlert[]> {
	logger.info("Fetching budget alerts", { userId });

	const budgets = await prisma.budget.findMany({
		where: { userId },
		include: { category: true },
	});

	await Promise.all(budgets.map((b) => updateBudgetSpent(b.id, userId)));

	const updatedBudgets = await prisma.budget.findMany({
		where: { id: { in: budgets.map((b) => b.id) } },
		include: { category: true },
	});

	const alerts: BudgetAlert[] = [];

	for (const budget of updatedBudgets) {
		const percentage =
			budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;

		if (percentage >= budget.alertThreshold) {
			const severity = percentage >= 100 ? "CRITICAL" : "WARNING";

			alerts.push({
				budgetId: budget.id,
				categoryName: budget.category?.name || null,
				amount: budget.amount,
				spent: budget.spent,
				percentage,
				threshold: budget.alertThreshold,
				severity,
			});
		}
	}

	alerts.sort((a, b) => {
		if (a.severity === "CRITICAL" && b.severity !== "CRITICAL") return -1;
		if (a.severity !== "CRITICAL" && b.severity === "CRITICAL") return 1;
		return b.percentage - a.percentage;
	});

	logger.info("Budget alerts fetched", { count: alerts.length });
	return alerts;
}
