// lib/budget-service/types.ts

export type BudgetPeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type CurrencyType = "USD" | "EUR" | "GBP" | "INR" | "JPY" | "AUD" | "CAD";

export interface Category {
	id: string;
	name: string;
	type: "INCOME" | "EXPENSE" | "TRANSFER";
	icon: string | null;
	color: string | null;
	isDefault: boolean;
	order: number;
	userId: string | null;
}

export interface Budget {
	id: string;
	amount: number;
	currency: CurrencyType;
	period: BudgetPeriod;
	startDate: Date;
	endDate: Date | null;
	alertThreshold: number;
	rollover: boolean;
	spent: number;
	remaining: number;
	userId: string;
	categoryId: string | null;
	category?: Category | null;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface BudgetWithProgress extends Budget {
	percentage: number;
	isOverBudget: boolean;
	isNearThreshold: boolean;
}

export interface CurrentMonthBudget extends BudgetWithProgress {
	dailyAverage: number;
	projectedSpending: number;
	daysRemaining: number;
}

export interface BudgetAlert {
	budgetId: string;
	categoryName: string | null;
	amount: number;
	spent: number;
	percentage: number;
	threshold: number;
	severity: "WARNING" | "CRITICAL";
}

export interface GetBudgetsParams {
	page?: number;
	limit?: number;
	period?: BudgetPeriod;
	currency?: CurrencyType;
	categoryId?: string;
	startDate?: Date;
	endDate?: Date;
	sortBy?: "startDate" | "amount" | "spent" | "remaining";
	sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
}
