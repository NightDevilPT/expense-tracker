// lib/user-service/types.ts

// Only database/model output types
export interface OTPSession {
	id: string;
	email: string;
	otpCode: string;
	expiresAt: Date;
	verifiedAt?: Date;
	attempts: number;
	createdAt: Date;
	deletedAt?: Date;
}
