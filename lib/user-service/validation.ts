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

// ==================== VALIDATION FUNCTIONS ====================

export function validateRequestOtp(data: unknown): RequestOtpInput {
	return requestOtpSchema.parse(data); // Throws if invalid
}

export function validateLoginOtp(data: unknown): LoginOtpInput {
	return loginOtpSchema.parse(data); // Throws if invalid
}

// ==================== INPUT TYPES ====================

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type LoginOtpInput = z.infer<typeof loginOtpSchema>;
