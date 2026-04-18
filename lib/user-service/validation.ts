// lib/user-service/validation.ts

import { z } from "zod";

// ==================== SCHEMAS ====================

export const requestOtpSchema = z.object({
	email: z
		.string()
		.email("Invalid email format")
		.endsWith("@gmail.com", "Only Gmail addresses are allowed")
		.min(1, "Email is required"),
});

export const loginOtpSchema = z.object({
	email: z
		.string()
		.email("Invalid email format")
		.endsWith("@gmail.com", "Only Gmail addresses are allowed")
		.min(1, "Email is required"),
	otp: z
		.string()
		.length(6, "OTP must be exactly 6 digits")
		.regex(/^\d{6}$/, "OTP must contain only numbers"),
});

export const userIdSchema = z.object({
	userId: z
		.string()
		.min(1, "User ID is required")
		.cuid("Invalid user ID format"),
});

// Update user schema
export const updateUserSchema = z
	.object({
		name: z
			.string()
			.min(1, "Name cannot be empty")
			.max(100, "Name is too long")
			.optional(),
		avatar: z.string().url("Invalid avatar URL").nullable().optional(),
		currency: z
			.string()
			.length(3, "Currency must be a 3-letter code (e.g., USD, EUR)")
			.optional(),
		theme: z.enum(["light", "dark", "system"]).optional(),
		firstDayOfWeek: z
			.number()
			.min(0, "Must be 0-6 (Sunday-Saturday)")
			.max(6, "Must be 0-6 (Sunday-Saturday)")
			.optional(),
		dateFormat: z
			.string()
			.min(1, "Date format is required")
			.max(20, "Date format is too long")
			.optional(),
		numberFormat: z
			.string()
			.min(1, "Number format is required")
			.max(20, "Number format is too long")
			.optional(),
		emailNotifications: z.boolean().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided for update",
	});

// ==================== VALIDATION FUNCTIONS ====================

export function validateUserId(userId: string): void {
	const schema = z
		.string()
		.min(1, "User ID is required")
		.cuid("Invalid user ID format");
	schema.parse(userId);
}

export function validateRequestOtp(data: unknown): RequestOtpInput {
	return requestOtpSchema.parse(data);
}

export function validateLoginOtp(data: unknown): LoginOtpInput {
	return loginOtpSchema.parse(data);
}

export function validateUpdateUser(data: unknown): UpdateUserInput {
	return updateUserSchema.parse(data);
}

// ==================== INPUT TYPES ====================

export type UserIdInput = z.infer<typeof userIdSchema>;
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type LoginOtpInput = z.infer<typeof loginOtpSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
