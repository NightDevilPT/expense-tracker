// lib/category-service/validation.ts

import { z } from "zod";

// ==================== SCHEMAS ====================

export const createCategorySchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(50, "Name must be 50 characters or less"),
	type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
	icon: z.string().max(50).nullable().optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
		.nullable()
		.optional(),
	order: z.number().int().min(0).default(0).optional(),
});

export const updateCategorySchema = z
	.object({
		name: z
			.string()
			.min(1, "Name is required")
			.max(50, "Name must be 50 characters or less")
			.optional(),
		icon: z.string().max(50).nullable().optional(),
		color: z
			.string()
			.regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
			.nullable()
			.optional(),
		order: z.number().int().min(0).optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided for update",
	});

export const categoryIdSchema = z.string().cuid("Invalid category ID format");

// ==================== VALIDATION FUNCTIONS ====================

export function validateCreateCategory(data: unknown): CreateCategoryInput {
	return createCategorySchema.parse(data);
}

export function validateUpdateCategory(data: unknown): UpdateCategoryInput {
	return updateCategorySchema.parse(data);
}

export function validateCategoryId(id: string): void {
	categoryIdSchema.parse(id);
}

// ==================== INPUT TYPES ====================

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
