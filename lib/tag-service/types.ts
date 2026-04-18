// lib/tag-service/types.ts

export interface Tag {
	id: string;
	name: string;
	color: string | null;
	userId: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface TagWithCount extends Tag {
	transactionCount?: number;
}

export interface GetTagsParams {
	page?: number;
	limit?: number;
	search?: string;
	sortBy?: "name" | "transactionCount" | "createdAt";
	sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
}

export interface PopularTag {
	id: string;
	name: string;
	color: string | null;
	transactionCount: number;
}
