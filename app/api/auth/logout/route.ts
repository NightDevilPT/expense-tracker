import {
	formatSuccess,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import { Logger } from "@/lib/logger-service";
import { NextRequest, NextResponse } from "next/server";

const logger = new Logger("LOGOUT");

export async function POST(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("POST /api/auth/logout called");

		// Create success response
		const response = formatSuccess(null, startTime, {
			message: "Logged out successfully",
		});

		// Create NextResponse and clear cookies
		const nextResponse = NextResponse.json(response, {
			status: HttpStatus.OK,
		});

		// Clear accessToken cookie
		nextResponse.cookies.set("accessToken", "", {
			httpOnly: true,
			path: "/",
			maxAge: 0, // Expire immediately
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
		});

		// Clear refreshToken cookie
		nextResponse.cookies.set("refreshToken", "", {
			httpOnly: true,
			path: "/",
			maxAge: 0, // Expire immediately
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
		});

		logger.info("Logout successful - cookies cleared");

		return nextResponse;
	} catch (error: any) {
		logger.error("POST /api/auth/logout failed", error);

		const response = formatInternalError(
			startTime,
			"Failed to logout. Please try again.",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
