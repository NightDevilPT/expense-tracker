// app/api/recurring/upcoming/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
	formatSuccess,
	formatBadRequest,
	formatUnauthorized,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import { getUpcomingRecurring } from "@/lib/recurring-service";

const logger = new Logger("RECURRING-UPCOMING-API");

// GET /api/recurring/upcoming - Get upcoming recurring transactions
export async function GET(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("GET /api/recurring/upcoming called");

		const userId = req.headers.get("x-user-id");
		if (!userId) {
			const response = formatUnauthorized(
				startTime,
				"User not authenticated",
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		const url = new URL(req.url);
		const days = url.searchParams.get("days");
		const daysParam = days ? parseInt(days) : 30;

		if (isNaN(daysParam) || daysParam < 1 || daysParam > 365) {
			const response = formatBadRequest(
				startTime,
				"Days must be between 1 and 365",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const upcoming = await getUpcomingRecurring(userId, daysParam);

		const response = formatSuccess(upcoming, startTime, {
			message: `Upcoming recurring transactions retrieved successfully`,
		});

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/recurring/upcoming failed", error);

		const response = formatInternalError(
			startTime,
			"Failed to retrieve upcoming recurring transactions",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
