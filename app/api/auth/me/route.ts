// app/api/auth/get-profile/route.ts

import {
	formatSuccess,
	formatUnauthorized,
	formatNotFound,
	formatInternalError,
	formatBadRequest,
	HttpStatus,
} from "@/lib/response-service";
import { Logger } from "@/lib/logger-service";
import { CookieService } from "@/lib/cookie-service";
import { getUserProfileById } from "@/lib/user-service";
import { NextRequest, NextResponse } from "next/server";

const logger = new Logger("GET-PROFILE");

export async function GET(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("GET /api/auth/get-profile called");

		// Extract tokens from cookies
		const accessToken = req.cookies.get("accessToken")?.value;
		const refreshToken = req.cookies.get("refreshToken")?.value;

		// Validate tokens and extract user payload
		const userPayload = CookieService.validateTokens(
			accessToken,
			refreshToken,
		);

		if (!userPayload) {
			logger.warn(
				"Unauthorized GET /api/auth/get-profile - Invalid or missing tokens",
			);
			const response = formatUnauthorized(
				startTime,
				"Authentication required. Please login again.",
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		// Fetch user profile from database
		const userProfile = await getUserProfileById(userPayload.id);

		logger.info("Profile fetched successfully", { userId: userProfile.id });

		const response = formatSuccess(userProfile, startTime, {
			message: "Profile retrieved successfully",
		});

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/auth/get-profile failed", error);

		// Handle validation errors
		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid user ID format",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		// Handle user not found
		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(
				startTime,
				"User profile not found",
			);
			return NextResponse.json(response, {
				status: HttpStatus.NOT_FOUND,
			});
		}

		// Handle invalid ID format from validation
		if (error.message?.includes("Invalid user ID")) {
			const response = formatBadRequest(startTime, error.message);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		// Fallback for unexpected errors
		const response = formatInternalError(
			startTime,
			"Failed to retrieve user profile. Please try again later.",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
