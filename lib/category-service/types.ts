// lib/category-service/types.ts

export interface Category {
	id: string;
	name: string;
	type: "INCOME" | "EXPENSE" | "TRANSFER";
	icon: string | null;
	color: string | null;
	isDefault: boolean;
	order: number;
	userId: string | null;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface CategoryWithStats extends Category {
	transactionCount?: number;
	totalAmount?: number;
}

export interface GetCategoriesParams {
	page?: number;
	limit?: number;
	search?: string;
	type?: "INCOME" | "EXPENSE" | "TRANSFER";
}

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
}
