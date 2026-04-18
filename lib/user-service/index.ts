// lib/user-service/index.ts

import { prisma } from "@/lib/prisma";
import {
	RequestOtpInput,
	LoginOtpInput,
	validateUserId,
	validateUpdateUser,
	type UpdateUserInput,
} from "./validation";
import { Logger } from "@/lib/logger-service";
import { SafeUserProfile } from "./types";

const logger = new Logger("USER-SERVICE");

export async function requestOtp(data: RequestOtpInput) {
	const { email } = data;

	logger.info("Request OTP initiated", { email });

	// Generate 6-digit OTP
	const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
	const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

	logger.debug("Generated OTP", {
		email,
		otpCode:
			process.env.NODE_ENV === "development" ? otpCode : "***HIDDEN***",
		expiresAt,
	});

	// Use transaction to ensure atomicity
	const result = await prisma.$transaction(async (tx) => {
		logger.debug("Starting OTP transaction", { email });

		// Mark all existing OTP sessions for this email as deleted
		const deleteResult = await tx.oTPSession.updateMany({
			where: {
				email,
				deletedAt: null,
			},
			data: {
				deletedAt: new Date(),
			},
		});

		logger.debug("Marked existing OTPs as deleted", {
			email,
			deletedCount: deleteResult.count,
		});

		// Create new OTP session
		const otpSession = await tx.oTPSession.create({
			data: {
				email,
				otpCode,
				expiresAt,
			},
		});

		logger.info("New OTP session created", {
			email,
			otpId: otpSession.id,
			expiresAt: otpSession.expiresAt,
		});

		return otpSession;
	});

	logger.info("OTP request completed successfully", {
		email,
		otpId: result.id,
		expiresAt: result.expiresAt,
	});

	return {
		email,
		otpId: result.id,
		expiresAt: result.expiresAt,
		otpCode: process.env.NODE_ENV === "development" ? otpCode : undefined,
	};
}

export async function loginOtp(data: LoginOtpInput) {
	const { email, otp } = data;

	logger.info("OTP login initiated", { email, otp: "***HIDDEN***" });

	// Use transaction to ensure atomicity
	const result = await prisma.$transaction(async (tx) => {
		logger.debug("Starting login transaction", { email });

		// Find valid OTP session
		const otpSession = await tx.oTPSession.findFirst({
			where: {
				email,
				otpCode: otp,
				deletedAt: null,
				expiresAt: {
					gt: new Date(), // Not expired
				},
			},
		});

		if (!otpSession) {
			logger.warn("Invalid or expired OTP attempted", {
				email,
				otp: "***HIDDEN***",
				reason: "OTP not found or expired",
			});
			throw new Error("INVALID_OTP");
		}

		logger.debug("Valid OTP session found", {
			email,
			otpId: otpSession.id,
			createdAt: otpSession.createdAt,
			expiresAt: otpSession.expiresAt,
		});

		// Mark OTP as verified
		await tx.oTPSession.update({
			where: { id: otpSession.id },
			data: {
				verifiedAt: new Date(),
				deletedAt: new Date(), // Mark as used
			},
		});

		logger.info("OTP marked as verified and used", {
			email,
			otpId: otpSession.id,
		});

		// Find or create user
		let user = await tx.user.findUnique({
			where: { email },
		});

		if (!user) {
			logger.info("Creating new user for OTP login", { email });

			// Create new user if doesn't exist
			user = await tx.user.create({
				data: {
					email,
					name: email.split("@")[0], // Use email prefix as name
					passwordHash: "", // Empty for OTP-based auth
				},
			});

			logger.info("New user created successfully", {
				email,
				userId: user.id,
				name: user.name,
			});
		} else {
			logger.debug("Existing user found for OTP login", {
				email,
				userId: user.id,
				name: user.name,
			});
		}

		return { user, otpSession };
	});

	logger.info("OTP login completed successfully", {
		email,
		userId: result.user.id,
		otpId: result.otpSession.id,
	});

	return {
		user: result.user,
		otpId: result.otpSession.id,
	};
}

export async function getUserProfileById(
	userId: string,
): Promise<SafeUserProfile> {
	logger.info("Fetching user profile", { userId });

	// Validate input
	validateUserId(userId);

	// Fetch user without password hash
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			email: true,
			name: true,
			avatar: true,
			currency: true,
			theme: true,
			firstDayOfWeek: true,
			dateFormat: true,
			numberFormat: true,
			emailNotifications: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	if (!user) {
		logger.warn("User not found", { userId });
		throw new Error("NOT_FOUND");
	}

	logger.info("User profile fetched successfully", { userId: user.id });
	return user;
}

// ADD THIS FUNCTION - Update user profile
export async function updateUserProfile(
	userId: string,
	updateData: UpdateUserInput,
): Promise<SafeUserProfile> {
	logger.info("Updating user profile", {
		userId,
		updates: Object.keys(updateData),
	});

	// Validate input
	validateUserId(userId);
	const validatedData = validateUpdateUser(updateData);

	// Check if user exists
	const existingUser = await prisma.user.findUnique({
		where: { id: userId },
		select: { id: true },
	});

	if (!existingUser) {
		logger.warn("User not found for update", { userId });
		throw new Error("NOT_FOUND");
	}

	// Update user
	const updatedUser = await prisma.user.update({
		where: { id: userId },
		data: validatedData,
		select: {
			id: true,
			email: true,
			name: true,
			avatar: true,
			currency: true,
			theme: true,
			firstDayOfWeek: true,
			dateFormat: true,
			numberFormat: true,
			emailNotifications: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	logger.info("User profile updated successfully", {
		userId: updatedUser.id,
	});
	return updatedUser;
}
