// lib/recurring-service/types.ts

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type RecurringFrequency =
	| "DAILY"
	| "WEEKLY"
	| "MONTHLY"
	| "YEARLY"
	| "CUSTOM";

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

export interface Account {
	id: string;
	name: string;
	type: string;
	balance: number;
	currency: string | null;
	isDefault: boolean;
	color: string | null;
	notes: string | null;
	userId: string;
}

export interface RecurringTransaction {
	id: string;
	name: string;
	amount: number;
	type: TransactionType;
	frequency: RecurringFrequency;
	interval: number;
	startDate: Date;
	endDate: Date | null;
	nextDueDate: Date;
	isActive: boolean;
	description: string | null;
	userId: string;
	categoryId: string | null;
	category?: Category | null;
	accountId: string | null;
	account?: Account | null;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface RecurringWithNextDue extends RecurringTransaction {
	daysUntilDue: number;
	isOverdue: boolean;
	isDueSoon: boolean;
	yearlyTotal: number;
	monthlyAverage: number;
}

export interface UpcomingRecurring {
	id: string;
	name: string;
	amount: number;
	type: TransactionType;
	nextDueDate: Date;
	daysUntilDue: number;
	frequency: RecurringFrequency;
	categoryName: string | null;
	accountName: string | null;
}

// Query Parameters
export interface GetRecurringParams {
	page?: number;
	limit?: number;
	type?: TransactionType;
	frequency?: RecurringFrequency;
	isActive?: boolean;
	categoryId?: string;
	accountId?: string;
	search?: string;
	sortBy?: "name" | "amount" | "nextDueDate" | "frequency" | "createdAt";
	sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
}
