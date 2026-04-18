// lib/account-service/validation.ts

import { z } from "zod";
import type { AccountType } from "./types";

export const accountTypeSchema = z.enum([
	"CASH",
	"BANK_ACCOUNT",
	"SAVINGS_ACCOUNT",
	"CREDIT_CARD",
	"DIGITAL_WALLET",
	"OTHER",
]) as z.ZodType<AccountType>;

export const createAccountSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(100, "Name must be 100 characters or less"),
	type: accountTypeSchema.default("CASH"),
	balance: z.number().min(0, "Initial balance cannot be negative").default(0),
	currency: z
		.string()
		.length(3, "Currency must be a 3-letter code")
		.optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
		.optional(),
	notes: z
		.string()
		.max(500, "Notes must be 500 characters or less")
		.optional(),
});

export const updateAccountSchema = z
	.object({
		name: z
			.string()
			.min(1, "Name is required")
			.max(100, "Name must be 100 characters or less")
			.optional(),
		type: accountTypeSchema.optional(),
		currency: z
			.string()
			.length(3, "Currency must be a 3-letter code")
			.optional(),
		color: z
			.string()
			.regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
			.optional(),
		notes: z
			.string()
			.max(500, "Notes must be 500 characters or less")
			.optional(),
		// balance is NOT allowed here - use add-balance API instead
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided for update",
	});

export const addBalanceSchema = z.object({
	amount: z.number().positive("Amount must be greater than 0"),
	type: z.enum(["ADD", "SUBTRACT"]),
	description: z
		.string()
		.max(500, "Description must be 500 characters or less")
		.optional(),
});

export const accountIdSchema = z.string().cuid("Invalid account ID format");

export const getBalanceHistorySchema = z.object({
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(20),
	days: z.number().int().min(1).max(365).default(30),
});

export function validateCreateAccount(data: unknown): CreateAccountInput {
	return createAccountSchema.parse(data);
}

export function validateUpdateAccount(data: unknown): UpdateAccountInput {
	return updateAccountSchema.parse(data);
}

export function validateAddBalance(data: unknown): AddBalanceInput {
	return addBalanceSchema.parse(data);
}

export function validateAccountId(id: string): void {
	accountIdSchema.parse(id);
}

export function validateGetBalanceHistory(
	params: unknown,
): GetBalanceHistoryInput {
	return getBalanceHistorySchema.parse(params);
}

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type AddBalanceInput = z.infer<typeof addBalanceSchema>;
export type GetBalanceHistoryInput = z.infer<typeof getBalanceHistorySchema>;
