// lib/transaction-service/validation.ts

import { z } from "zod";

// Create Transaction
export const createTransactionSchema = z.object({
	amount: z.number().positive("Amount must be positive"),
	type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
	description: z.string().max(255).nullable().optional(),
	date: z.string().datetime().or(z.date()).optional(),
	notes: z.string().nullable().optional(),
	categoryId: z.string().cuid("Invalid category ID").nullable().optional(),
	accountId: z.string().cuid("Invalid account ID").nullable().optional(),
	tagIds: z.array(z.string().cuid("Invalid tag ID")).max(10).optional(),
	// For transfers
	toAccountId: z.string().cuid("Invalid account ID").optional(),
	transferFee: z.number().min(0).optional(),
});

// Update Transaction
export const updateTransactionSchema = z
	.object({
		amount: z.number().positive("Amount must be positive").optional(),
		type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]).optional(),
		description: z.string().max(255).nullable().optional(),
		date: z.string().datetime().or(z.date()).optional(),
		notes: z.string().nullable().optional(),
		categoryId: z.string().cuid().nullable().optional(),
		accountId: z.string().cuid().nullable().optional(),
		tagIds: z.array(z.string().cuid()).max(10).optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided for update",
	});

// Get Transactions Query
export const getTransactionsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
	type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]).optional(),
	categoryId: z.string().cuid().optional(),
	accountId: z.string().cuid().optional(),
	search: z.string().max(100).optional(),
	minAmount: z.coerce.number().min(0).optional(),
	maxAmount: z.coerce.number().min(0).optional(),
	tagIds: z
		.string()
		.transform((val) => val?.split(",").filter(Boolean))
		.pipe(z.array(z.string().cuid()))
		.optional(),
	sortBy: z.enum(["date", "amount", "description"]).default("date"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Transaction Summary Query
export const transactionSummaryQuerySchema = z.object({
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
	categoryIds: z
		.string()
		.transform((val) => val?.split(",").filter(Boolean))
		.pipe(z.array(z.string().cuid()))
		.optional(),
	accountIds: z
		.string()
		.transform((val) => val?.split(",").filter(Boolean))
		.pipe(z.array(z.string().cuid()))
		.optional(),
});

// Bulk Create
export const bulkCreateTransactionSchema = z.object({
	transactions: z
		.array(createTransactionSchema)
		.min(1, "At least one transaction required")
		.max(1000, "Maximum 1000 transactions per bulk operation"),
});

// Bulk Delete
export const bulkDeleteTransactionSchema = z.object({
	transactionIds: z
		.array(z.string().cuid("Invalid transaction ID"))
		.min(1, "At least one transaction ID required")
		.max(100, "Maximum 100 transactions per bulk operation"),
});

// Export Options
export const exportOptionsSchema = z.object({
	format: z.enum(["csv", "json", "pdf"]).default("json"),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
	includeAttachments: z.boolean().default(false),
});

// ID Validation
export const transactionIdSchema = z
	.string()
	.cuid("Invalid transaction ID format");

// Validation Functions
export function validateCreateTransaction(
	data: unknown,
): CreateTransactionInput {
	return createTransactionSchema.parse(data);
}

export function validateUpdateTransaction(
	data: unknown,
): UpdateTransactionInput {
	return updateTransactionSchema.parse(data);
}

export function validateGetTransactionsQuery(
	data: unknown,
): GetTransactionsQueryInput {
	return getTransactionsQuerySchema.parse(data);
}

export function validateTransactionSummaryQuery(
	data: unknown,
): TransactionSummaryQueryInput {
	return transactionSummaryQuerySchema.parse(data);
}

export function validateBulkCreateTransaction(
	data: unknown,
): BulkCreateTransactionInput {
	return bulkCreateTransactionSchema.parse(data);
}

export function validateBulkDeleteTransaction(
	data: unknown,
): BulkDeleteTransactionInput {
	return bulkDeleteTransactionSchema.parse(data);
}

export function validateExportOptions(data: unknown): ExportOptionsInput {
	return exportOptionsSchema.parse(data);
}

export function validateTransactionId(id: string): void {
	transactionIdSchema.parse(id);
}

// Input Types
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type GetTransactionsQueryInput = z.infer<
	typeof getTransactionsQuerySchema
>;
export type TransactionSummaryQueryInput = z.infer<
	typeof transactionSummaryQuerySchema
>;
export type BulkCreateTransactionInput = z.infer<
	typeof bulkCreateTransactionSchema
>;
export type BulkDeleteTransactionInput = z.infer<
	typeof bulkDeleteTransactionSchema
>;
export type ExportOptionsInput = z.infer<typeof exportOptionsSchema>;
