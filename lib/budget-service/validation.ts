// lib/budget-service/validation.ts

import { z } from "zod";

export const createBudgetSchema = z.object({
	amount: z.number().positive("Amount must be positive"),
	currency: z.enum(["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD"]).default("USD"),
	period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).default("MONTHLY"),
	startDate: z
		.string()
		.datetime()
		.or(z.date())
		.default(() => new Date()),
	endDate: z.string().datetime().or(z.date()).nullable().optional(),
	alertThreshold: z.number().min(0).max(100).default(80),
	rollover: z.boolean().default(false),
	categoryId: z.string().cuid("Invalid category ID").nullable().optional(),
});

export const updateBudgetSchema = z
	.object({
		amount: z.number().positive().optional(),
		currency: z.enum(["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD"]).optional(),
		period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
		startDate: z.string().datetime().or(z.date()).optional(),
		endDate: z.string().datetime().or(z.date()).nullable().optional(),
		alertThreshold: z.number().min(0).max(100).optional(),
		rollover: z.boolean().optional(),
		categoryId: z.string().cuid().nullable().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided for update",
	});

export const getBudgetsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
	currency: z.enum(["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD"]).optional(),
	categoryId: z.string().cuid().optional(),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
	sortBy: z
		.enum(["startDate", "amount", "spent", "remaining"])
		.default("startDate"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const budgetIdSchema = z.string().cuid("Invalid budget ID format");

export function validateCreateBudget(data: unknown): CreateBudgetInput {
	return createBudgetSchema.parse(data);
}

export function validateUpdateBudget(data: unknown): UpdateBudgetInput {
	return updateBudgetSchema.parse(data);
}

export function validateGetBudgetsQuery(data: unknown): GetBudgetsQueryInput {
	return getBudgetsQuerySchema.parse(data);
}

export function validateBudgetId(id: string): void {
	budgetIdSchema.parse(id);
}

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type GetBudgetsQueryInput = z.infer<typeof getBudgetsQuerySchema>;
