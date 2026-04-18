import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import { requestOtp } from "@/lib/user-service";
import { validateRequestOtp } from "@/lib/user-service/validation";
import {
	formatSuccess,
	formatBadRequest,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import { withRateLimit } from "@/middleware/with-ratelimit";

const logger = new Logger("REQUEST-OTP");

async function handleRequestOtp(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("POST /api/auth/request-otp called");

		const body = await req.json();

		// Validate with Zod — throws if invalid
		const validatedData = validateRequestOtp(body);

		const result = await requestOtp(validatedData);

		logger.info("OTP requested successfully", {
			email: result.email,
			otpId: result.otpId,
		});

		const response = formatSuccess(
			{
				email: result.email,
				otpId: result.otpId,
				expiresAt: result.expiresAt,
				...(process.env.NODE_ENV === "development" && {
					otpCode: result.otpCode,
				}),
			},
			startTime,
			{ message: "OTP sent successfully" },
		);

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("POST /api/auth/request-otp failed", error);

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

		const response = formatInternalError(startTime, "Failed to send OTP");
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}

export const POST = withRateLimit(handleRequestOtp, {
	windowMs: 1 * 60 * 1000, // 1 minute
	maxRequests: 1,
});
