// lib/category-service/index.ts

import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/logger-service";
import {
	validateCreateCategory,
	validateUpdateCategory,
	validateCategoryId,
	type CreateCategoryInput,
	type UpdateCategoryInput,
} from "./validation";
import type { Category, GetCategoriesParams, PaginatedResult } from "./types";

const logger = new Logger("CATEGORY-SERVICE");

export async function getAllCategories(
	userId: string,
	params: GetCategoriesParams = {},
): Promise<PaginatedResult<Category>> {
	const page = Math.max(1, params.page || 1);
	const limit = Math.min(100, Math.max(1, params.limit || 20));
	const skip = (page - 1) * limit;

	logger.info("Fetching all categories", {
		userId,
		page,
		limit,
		search: params.search,
		type: params.type,
	});

	// Build where clause
	const where: any = {
		OR: [{ userId: userId }, { isDefault: true }],
	};

	// Add search filter
	if (params.search) {
		where.name = {
			contains: params.search,
			mode: "insensitive",
		};
	}

	// Add type filter
	if (params.type) {
		where.type = params.type;
	}

	// Get total count for pagination
	const total = await prisma.category.count({ where });

	// Get paginated categories
	const categories = await prisma.category.findMany({
		where,
		skip,
		take: limit,
		orderBy: [{ order: "asc" }, { name: "asc" }],
	});

	logger.info("Categories fetched successfully", {
		count: categories.length,
		total,
		page,
		limit,
	});

	return {
		data: categories,
		total,
		page,
		limit,
	};
}

export async function getCategoryById(
	id: string,
	userId: string,
): Promise<Category> {
	logger.info("Fetching category by ID", { id, userId });

	validateCategoryId(id);

	const category = await prisma.category.findFirst({
		where: {
			id,
			OR: [{ userId: userId }, { isDefault: true }],
		},
	});

	if (!category) {
		logger.warn("Category not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	logger.info("Category fetched successfully", { id });
	return category;
}

export async function createCategory(
	userId: string,
	data: CreateCategoryInput,
): Promise<Category> {
	logger.info("Creating new category", { userId, name: data.name });

	const validatedData = validateCreateCategory(data);

	// Check if category with same name already exists for this user
	const existingCategory = await prisma.category.findFirst({
		where: {
			userId: userId,
			name: validatedData.name,
		},
	});

	if (existingCategory) {
		logger.warn("Category already exists", {
			userId,
			name: validatedData.name,
		});
		throw new Error("ALREADY_EXISTS");
	}

	const category = await prisma.category.create({
		data: {
			name: validatedData.name,
			type: validatedData.type,
			icon: validatedData.icon || null,
			color: validatedData.color || null,
			order: validatedData.order || 0,
			userId: userId,
			isDefault: false,
		},
	});

	logger.info("Category created successfully", {
		id: category.id,
		name: category.name,
	});
	return category;
}

export async function updateCategory(
	id: string,
	userId: string,
	data: UpdateCategoryInput,
): Promise<Category> {
	logger.info("Updating category", { id, userId });

	validateCategoryId(id);
	const validatedData = validateUpdateCategory(data);

	// Check if category exists and belongs to user
	const existingCategory = await prisma.category.findFirst({
		where: {
			id,
			userId: userId,
		},
	});

	if (!existingCategory) {
		logger.warn("Category not found or access denied", { id, userId });
		throw new Error("NOT_FOUND");
	}

	// If updating name, check for duplicates
	if (validatedData.name && validatedData.name !== existingCategory.name) {
		const duplicateCategory = await prisma.category.findFirst({
			where: {
				userId: userId,
				name: validatedData.name,
				id: { not: id },
			},
		});

		if (duplicateCategory) {
			logger.warn("Category name already exists", {
				userId,
				name: validatedData.name,
			});
			throw new Error("ALREADY_EXISTS");
		}
	}

	const category = await prisma.category.update({
		where: { id },
		data: validatedData,
	});

	logger.info("Category updated successfully", { id, name: category.name });
	return category;
}

export async function deleteCategory(
	id: string,
	userId: string,
): Promise<void> {
	logger.info("Deleting category", { id, userId });

	validateCategoryId(id);

	// Check if category exists and belongs to user
	const category = await prisma.category.findFirst({
		where: {
			id,
			userId: userId,
		},
	});

	if (!category) {
		logger.warn("Category not found or access denied", { id, userId });
		throw new Error("NOT_FOUND");
	}

	// Check if category is default (cannot delete default categories)
	if (category.isDefault) {
		logger.warn("Cannot delete default category", { id, userId });
		throw new Error("FORBIDDEN");
	}

	// Check if category has transactions
	const transactionCount = await prisma.transaction.count({
		where: { categoryId: id },
	});

	if (transactionCount > 0) {
		logger.warn("Category has transactions, cannot delete", {
			id,
			transactionCount,
		});
		throw new Error("CONFLICT");
	}

	await prisma.category.delete({
		where: { id },
	});

	logger.info("Category deleted successfully", { id });
}
