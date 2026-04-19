// lib/savings-goal-service/types.ts

// Match Prisma enum exactly
export type SavingsGoalStatus = "ACTIVE" | "COMPLETED" | "FAILED" | "CANCELLED";
export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";

export interface Category {
	id: string;
	name: string;
	type: TransactionType;
	icon: string | null;
	color: string | null;
	isDefault: boolean;
	order: number;
	userId: string | null;
}

export interface SavingsGoal {
	id: string;
	name: string;
	targetAmount: number;
	currentAmount: number;
	deadline: Date;
	status: SavingsGoalStatus;
	notes: string | null;
	progress: number;
	daysRemaining: number;
	userId: string;
	linkedCategoryId: string | null;
	linkedCategory?: Category | null;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface SavingsGoalWithProgress extends SavingsGoal {
	remaining: number;
	isCompleted: boolean;
	isFailed: boolean;
	isOverdue: boolean;
	suggestedMonthlyContribution: number;
	dailyTarget: number;
}

export interface ContributionResult {
	goal: SavingsGoal;
	contributed: number;
	previousAmount: number;
	newAmount: number;
	progress: number;
	isCompleted: boolean;
	message: string;
}

// Query Parameters
export interface GetSavingsGoalsParams {
	page?: number;
	limit?: number;
	status?: SavingsGoalStatus;
	sortBy?:
		| "deadline"
		| "targetAmount"
		| "currentAmount"
		| "progress"
		| "createdAt";
	sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
}
