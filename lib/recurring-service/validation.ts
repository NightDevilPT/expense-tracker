// lib/recurring-service/validation.ts

import { z } from "zod";

// Create Recurring Transaction
export const createRecurringSchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name too long"),
	amount: z.number().positive("Amount must be positive"),
	type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]).default("EXPENSE"),
	frequency: z
		.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"])
		.default("MONTHLY"),
	interval: z.number().int().min(1).default(1),
	startDate: z
		.string()
		.datetime()
		.or(z.date())
		.default(() => new Date()),
	endDate: z.string().datetime().or(z.date()).nullable().optional(),
	description: z.string().max(500).nullable().optional(),
	categoryId: z.string().cuid("Invalid category ID").nullable().optional(),
	accountId: z.string().cuid("Invalid account ID").nullable().optional(),
	isActive: z.boolean().default(true),
});

// Update Recurring Transaction
export const updateRecurringSchema = z
	.object({
		name: z.string().min(1).max(100).optional(),
		amount: z.number().positive().optional(),
		type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]).optional(),
		frequency: z
			.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"])
			.optional(),
		interval: z.number().int().min(1).optional(),
		startDate: z.string().datetime().or(z.date()).optional(),
		endDate: z.string().datetime().or(z.date()).nullable().optional(),
		description: z.string().max(500).nullable().optional(),
		categoryId: z.string().cuid().nullable().optional(),
		accountId: z.string().cuid().nullable().optional(),
		isActive: z.boolean().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided for update",
	});

// Get Recurring Query
export const getRecurringQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]).optional(),
	frequency: z
		.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"])
		.optional(),
	isActive: z.coerce.boolean().optional(),
	categoryId: z.string().cuid().optional(),
	accountId: z.string().cuid().optional(),
	search: z.string().max(100).optional(),
	sortBy: z
		.enum(["name", "amount", "nextDueDate", "frequency", "createdAt"])
		.default("nextDueDate"),
	sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// ID Validation
export const recurringIdSchema = z
	.string()
	.cuid("Invalid recurring transaction ID format");

// Validation Functions
export function validateCreateRecurring(data: unknown): CreateRecurringInput {
	return createRecurringSchema.parse(data);
}

export function validateUpdateRecurring(data: unknown): UpdateRecurringInput {
	return updateRecurringSchema.parse(data);
}

export function validateGetRecurringQuery(
	data: unknown,
): GetRecurringQueryInput {
	return getRecurringQuerySchema.parse(data);
}

export function validateRecurringId(id: string): void {
	recurringIdSchema.parse(id);
}

// Input Types
export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>;
export type GetRecurringQueryInput = z.infer<typeof getRecurringQuerySchema>;
