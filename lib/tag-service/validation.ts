// lib/tag-service/validation.ts

import { z } from "zod";

// ==================== SCHEMAS ====================

export const createTagSchema = z.object({
	name: z
		.string()
		.min(1, "Tag name is required")
		.max(50, "Tag name must be 50 characters or less")
		.regex(
			/^[a-zA-Z0-9\s\-_]+$/,
			"Tag name can only contain letters, numbers, spaces, hyphens, and underscores",
		),
	color: z
		.string()
		.regex(
			/^#[0-9A-Fa-f]{6}$/,
			"Invalid color format. Use hex color like #FF5733",
		)
		.optional(),
});

export const updateTagSchema = z
	.object({
		name: z
			.string()
			.min(1, "Tag name is required")
			.max(50, "Tag name must be 50 characters or less")
			.regex(
				/^[a-zA-Z0-9\s\-_]+$/,
				"Tag name can only contain letters, numbers, spaces, hyphens, and underscores",
			)
			.optional(),
		color: z
			.string()
			.regex(
				/^#[0-9A-Fa-f]{6}$/,
				"Invalid color format. Use hex color like #FF5733",
			)
			.optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided for update",
	});

export const tagIdSchema = z.string().cuid("Invalid tag ID format");

export const getTagsParamsSchema = z.object({
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(20),
	search: z.string().max(50).optional(),
	sortBy: z.enum(["name", "transactionCount", "createdAt"]).default("name"),
	sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const getPopularTagsSchema = z.object({
	limit: z.number().int().min(1).max(50).default(10),
});

// ==================== VALIDATION FUNCTIONS ====================

export function validateCreateTag(data: unknown): CreateTagInput {
	return createTagSchema.parse(data);
}

export function validateUpdateTag(data: unknown): UpdateTagInput {
	return updateTagSchema.parse(data);
}

export function validateTagId(id: string): void {
	tagIdSchema.parse(id);
}

export function validateGetTagsParams(params: unknown): GetTagsParams {
	// Set default values if params is empty
	const defaultParams = {
		page: 1,
		limit: 20,
		sortBy: "name" as const,
		sortOrder: "asc" as const,
	};

	const mergedParams = { ...defaultParams, ...((params as object) || {}) };
	return getTagsParamsSchema.parse(mergedParams);
}

export function validateGetPopularTagsParams(
	params: unknown,
): GetPopularTagsParams {
	const defaultParams = { limit: 10 };
	const mergedParams = { ...defaultParams, ...((params as object) || {}) };
	return getPopularTagsSchema.parse(mergedParams);
}

// ==================== INPUT TYPES ====================

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type GetTagsParams = z.infer<typeof getTagsParamsSchema>;
export type GetPopularTagsParams = z.infer<typeof getPopularTagsSchema>;
