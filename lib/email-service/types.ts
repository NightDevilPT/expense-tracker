// lib/email-service/types.ts

export enum EmailTemplate {
	OTP_MAIL = "OTP_MAIL",
	// Add new templates here in future
}

// Base payload that all emails share
export interface BaseEmailPayload {
	to: string;
	subject: string;
}

// OTP Email Payload
export interface OtpEmailPayload extends BaseEmailPayload {
	otp: string;
	userName: string;
	expiryMinutes: number;
}

// Email Send Result
export interface EmailSendResult {
	success: boolean;
	messageId?: string;
	error?: string;
}

// Email provider configuration
export interface EmailProviderConfig {
	host: string;
	port: number;
	secure: boolean;
	auth: {
		user: string;
		pass: string;
	};
	from: string;
}
