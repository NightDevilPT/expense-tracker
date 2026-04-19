// lib/savings-goal-service/index.ts

import type {
	SavingsGoal,
	SavingsGoalWithProgress,
	ContributionResult,
	GetSavingsGoalsParams,
	PaginatedResult,
} from "./types";
import {
	validateCreateSavingsGoal,
	validateUpdateSavingsGoal,
	validateContributeToGoal,
	validateGetSavingsGoalsQuery,
	validateSavingsGoalId,
	type CreateSavingsGoalInput,
	type UpdateSavingsGoalInput,
	type ContributeToGoalInput,
} from "./validation";
import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/logger-service";
import { getCategoryById } from "@/lib/category-service";
import { SavingsGoalStatus } from "@/generated/prisma/enums";

const logger = new Logger("SAVINGS-GOAL-SERVICE");

// Helper: Calculate days remaining and progress
function calculateGoalMetrics(goal: any): {
	progress: number;
	daysRemaining: number;
	status: SavingsGoalStatus;
} {
	const now = new Date();
	const deadline = new Date(goal.deadline);
	const diffTime = deadline.getTime() - now.getTime();
	const daysRemaining = Math.max(
		0,
		Math.ceil(diffTime / (1000 * 60 * 60 * 24)),
	);

	const progress =
		goal.targetAmount > 0
			? (goal.currentAmount / goal.targetAmount) * 100
			: 0;

	// Determine status based on progress and deadline
	let status: SavingsGoalStatus = goal.status;

	// Only auto-update status for ACTIVE goals
	if (goal.status === "ACTIVE") {
		if (goal.currentAmount >= goal.targetAmount) {
			status = SavingsGoalStatus.COMPLETED;
		} else if (
			daysRemaining === 0 &&
			goal.currentAmount < goal.targetAmount
		) {
			status = SavingsGoalStatus.FAILED;
		}
	}

	return {
		progress: Math.min(progress, 100),
		daysRemaining,
		status,
	};
}

// Helper: Enhance goal with additional metrics
function enhanceGoalWithMetrics(goal: SavingsGoal): SavingsGoalWithProgress {
	const remaining = goal.targetAmount - goal.currentAmount;
	const isCompleted = goal.status === "COMPLETED";
	const isFailed = goal.status === "FAILED";
	const isOverdue = new Date(goal.deadline) < new Date() && !isCompleted;

	// Calculate suggested monthly contribution
	const now = new Date();
	const deadline = new Date(goal.deadline);
	const monthsRemaining = Math.max(
		0.5,
		(deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30),
	);
	const suggestedMonthlyContribution = remaining / monthsRemaining;

	// Daily target for remaining days
	const dailyTarget =
		goal.daysRemaining > 0 ? remaining / goal.daysRemaining : remaining;

	return {
		...goal,
		remaining,
		isCompleted,
		isFailed,
		isOverdue,
		suggestedMonthlyContribution,
		dailyTarget,
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

// Update goal metrics in database
async function updateGoalMetrics(goalId: string): Promise<void> {
	const goal = await prisma.savingsGoal.findUnique({
		where: { id: goalId },
	});

	if (!goal) return;

	const metrics = calculateGoalMetrics(goal);

	await prisma.savingsGoal.update({
		where: { id: goalId },
		data: {
			progress: metrics.progress,
			daysRemaining: metrics.daysRemaining,
			status: metrics.status, // Now properly typed as SavingsGoalStatus
		},
	});
}

// Get all savings goals
export async function getAllSavingsGoals(
	userId: string,
	params: GetSavingsGoalsParams = {},
): Promise<PaginatedResult<SavingsGoalWithProgress>> {
	logger.info("Fetching all savings goals", { userId, params });

	const validatedParams = validateGetSavingsGoalsQuery(params);
	const page = validatedParams.page;
	const limit = validatedParams.limit;
	const skip = (page - 1) * limit;

	const where: any = { userId };

	if (validatedParams.status) {
		where.status = validatedParams.status;
	}

	const orderBy: any = {
		[validatedParams.sortBy]: validatedParams.sortOrder,
	};

	const [total, goals] = await Promise.all([
		prisma.savingsGoal.count({ where }),
		prisma.savingsGoal.findMany({
			where,
			skip,
			take: limit,
			orderBy,
			include: { linkedCategory: true },
		}),
	]);

	// Update metrics for all goals
	await Promise.all(goals.map((g) => updateGoalMetrics(g.id)));

	// Refetch with updated values
	const updatedGoals = await prisma.savingsGoal.findMany({
		where: { id: { in: goals.map((g) => g.id) } },
		include: { linkedCategory: true },
	});

	const goalsWithMetrics = updatedGoals.map((g) =>
		enhanceGoalWithMetrics(g as SavingsGoal),
	);

	logger.info("Savings goals fetched successfully", {
		count: goals.length,
		total,
	});

	return { data: goalsWithMetrics, total, page, limit };
}

// Get savings goal by ID
export async function getSavingsGoalById(
	id: string,
	userId: string,
): Promise<SavingsGoalWithProgress> {
	logger.info("Fetching savings goal by ID", { id, userId });

	validateSavingsGoalId(id);

	const goal = await prisma.savingsGoal.findFirst({
		where: { id, userId },
		include: { linkedCategory: true },
	});

	if (!goal) {
		logger.warn("Savings goal not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	await updateGoalMetrics(id);

	const updatedGoal = await prisma.savingsGoal.findUnique({
		where: { id },
		include: { linkedCategory: true },
	});

	return enhanceGoalWithMetrics(updatedGoal as SavingsGoal);
}

// Get active goals progress (only ACTIVE status)
export async function getActiveGoalsProgress(
	userId: string,
): Promise<SavingsGoalWithProgress[]> {
	logger.info("Fetching active goals progress", { userId });

	const goals = await prisma.savingsGoal.findMany({
		where: {
			userId,
			status: SavingsGoalStatus.ACTIVE,
		},
		include: { linkedCategory: true },
		orderBy: { deadline: "asc" },
	});

	await Promise.all(goals.map((g) => updateGoalMetrics(g.id)));

	const updatedGoals = await prisma.savingsGoal.findMany({
		where: { id: { in: goals.map((g) => g.id) } },
		include: { linkedCategory: true },
	});

	const goalsWithMetrics = updatedGoals.map((g) =>
		enhanceGoalWithMetrics(g as SavingsGoal),
	);

	logger.info("Active goals progress fetched", {
		count: goalsWithMetrics.length,
	});
	return goalsWithMetrics;
}

// Create savings goal
export async function createSavingsGoal(
	userId: string,
	data: CreateSavingsGoalInput,
): Promise<SavingsGoal> {
	logger.info("Creating new savings goal", { userId, name: data.name });

	const validatedData = validateCreateSavingsGoal(data);

	if (validatedData.linkedCategoryId) {
		await verifyCategoryAccess(validatedData.linkedCategoryId, userId);
	}

	const goal = await prisma.savingsGoal.create({
		data: {
			name: validatedData.name,
			targetAmount: validatedData.targetAmount,
			currentAmount: 0,
			deadline: new Date(validatedData.deadline),
			status: SavingsGoalStatus.ACTIVE,
			notes: validatedData.notes || null,
			linkedCategoryId: validatedData.linkedCategoryId || null,
			userId,
			progress: 0,
			daysRemaining: 0,
		},
		include: { linkedCategory: true },
	});

	await updateGoalMetrics(goal.id);

	logger.info("Savings goal created successfully", {
		id: goal.id,
		name: goal.name,
	});
	return goal as SavingsGoal;
}

// Update savings goal
export async function updateSavingsGoal(
	id: string,
	userId: string,
	data: UpdateSavingsGoalInput,
): Promise<SavingsGoal> {
	logger.info("Updating savings goal", { id, userId });

	validateSavingsGoalId(id);
	const validatedData = validateUpdateSavingsGoal(data);

	const existingGoal = await prisma.savingsGoal.findFirst({
		where: { id, userId },
	});

	if (!existingGoal) {
		logger.warn("Savings goal not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	if (validatedData.linkedCategoryId) {
		await verifyCategoryAccess(validatedData.linkedCategoryId, userId);
	}

	const updateData: any = { ...validatedData };
	if (validatedData.deadline) {
		updateData.deadline = new Date(validatedData.deadline);
	}

	// Convert status string to Prisma enum if provided
	if (validatedData.status) {
		updateData.status = validatedData.status as SavingsGoalStatus;
	}

	const goal = await prisma.savingsGoal.update({
		where: { id },
		data: updateData,
		include: { linkedCategory: true },
	});

	await updateGoalMetrics(id);

	logger.info("Savings goal updated successfully", { id });
	return goal as SavingsGoal;
}

// Delete savings goal
export async function deleteSavingsGoal(
	id: string,
	userId: string,
): Promise<void> {
	logger.info("Deleting savings goal", { id, userId });

	validateSavingsGoalId(id);

	const goal = await prisma.savingsGoal.findFirst({
		where: { id, userId },
	});

	if (!goal) {
		logger.warn("Savings goal not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	await prisma.savingsGoal.delete({ where: { id } });

	logger.info("Savings goal deleted successfully", { id });
}

// Contribute to savings goal
export async function contributeToGoal(
	id: string,
	userId: string,
	data: ContributeToGoalInput,
): Promise<ContributionResult> {
	logger.info("Contributing to savings goal", {
		id,
		userId,
		amount: data.amount,
	});

	validateSavingsGoalId(id);
	const validatedData = validateContributeToGoal(data);

	const goal = await prisma.savingsGoal.findFirst({
		where: { id, userId },
		include: { linkedCategory: true },
	});

	if (!goal) {
		logger.warn("Savings goal not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	// Check if goal is ACTIVE
	if (goal.status !== "ACTIVE") {
		throw new Error("GOAL_NOT_ACTIVE");
	}

	const previousAmount = goal.currentAmount;
	const newAmount = previousAmount + validatedData.amount;

	// Determine new status
	let newStatus: SavingsGoalStatus = SavingsGoalStatus.ACTIVE;
	let message = "";

	if (newAmount >= goal.targetAmount) {
		newStatus = SavingsGoalStatus.COMPLETED;
		message = `Congratulations! You've reached your savings goal of ${goal.targetAmount.toLocaleString()}.`;
	} else {
		const remaining = goal.targetAmount - newAmount;
		const progressValue = (newAmount / goal.targetAmount) * 100;
		message = `${validatedData.amount.toLocaleString()} added. ${remaining.toLocaleString()} more to reach your goal. (${progressValue.toFixed(1)}% complete)`;
	}

	const updatedGoal = await prisma.savingsGoal.update({
		where: { id },
		data: {
			currentAmount: newAmount,
			status: newStatus, // Properly typed as SavingsGoalStatus
		},
		include: { linkedCategory: true },
	});

	await updateGoalMetrics(id);

	const progressValue = (newAmount / goal.targetAmount) * 100;
	const isCompleted = newStatus === SavingsGoalStatus.COMPLETED;

	logger.info("Contribution successful", {
		id,
		contributed: validatedData.amount,
		newAmount,
		progress: progressValue,
		isCompleted,
	});

	return {
		goal: updatedGoal as SavingsGoal,
		contributed: validatedData.amount,
		previousAmount,
		newAmount,
		progress: progressValue,
		isCompleted,
		message,
	};
}
