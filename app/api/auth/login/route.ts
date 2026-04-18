import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import { CookieService } from "@/lib/cookie-service";
import { loginOtp } from "@/lib/user-service";
import { validateLoginOtp } from "@/lib/user-service/validation";
import {
	formatSuccess,
	formatBadRequest,
	formatInternalError,
	formatUnauthorized,
	HttpStatus,
} from "@/lib/response-service";
import { withRateLimit } from "@/middleware/with-ratelimit";

const logger = new Logger("LOGIN-OTP");

async function handleLoginOtp(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("POST /api/auth/login called");

		const body = await req.json();

		// Validate with Zod — throws if invalid
		const validatedData = validateLoginOtp(body);

		const result = await loginOtp(validatedData);

		logger.info("OTP login successful", {
			email: result.user.email,
			userId: result.user.id,
		});

		// Generate JWT tokens
		const tokens = CookieService.generateTokens({
			id: result.user.id,
			email: result.user.email,
			name: result.user.name,
		});

		// Prepare user data
		const userData = {
			id: result.user.id,
			email: result.user.email,
			name: result.user.name,
			avatar: result.user.avatar,
			currency: result.user.currency,
			theme: result.user.theme,
			firstDayOfWeek: result.user.firstDayOfWeek,
			dateFormat: result.user.dateFormat,
			numberFormat: result.user.numberFormat,
			emailNotifications: result.user.emailNotifications,
		};

		// Format success response
		const response = formatSuccess({ user: userData }, startTime, {
			message: "Login successful",
		});

		// Create NextResponse and set cookies
		const nextResponse = NextResponse.json(response, {
			status: HttpStatus.OK,
		});

		// Set JWT cookies
		nextResponse.cookies.set("accessToken", tokens.accessToken, {
			httpOnly: true,
			path: "/",
			maxAge: 10 * 60, // 10 minutes
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
		});

		nextResponse.cookies.set("refreshToken", tokens.refreshToken, {
			httpOnly: true,
			path: "/",
			maxAge: 12 * 60, // 12 minutes
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
		});

		return nextResponse;
	} catch (error: any) {
		logger.error("POST /api/auth/login failed", error);

		// Handle validation errors
		if (
			error.message?.includes("Validation") ||
			error.name === "ZodError"
		) {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || error.message,
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		// Handle invalid OTP
		if (error.message?.includes("Invalid or expired OTP")) {
			const response = formatUnauthorized(
				startTime,
				"Invalid or expired OTP",
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		// Handle all other errors
		const response = formatInternalError(startTime, "Login failed");
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}

export const POST = withRateLimit(handleLoginOtp, {
	windowMs: 1 * 60 * 1000, // 1 minute
	maxRequests: 3,
});
