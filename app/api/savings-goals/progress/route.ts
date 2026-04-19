// app/api/savings-goals/progress/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
	formatSuccess,
	formatUnauthorized,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import { getActiveGoalsProgress } from "@/lib/savings-goal-service";

const logger = new Logger("SAVINGS-GOALS-PROGRESS-API");

// GET /api/savings-goals/progress - Get active goals progress
export async function GET(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("GET /api/savings-goals/progress called");

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

		const goals = await getActiveGoalsProgress(userId);

		const response = formatSuccess(goals, startTime, {
			message: "Active goals progress retrieved successfully",
		});

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/savings-goals/progress failed", error);

		const response = formatInternalError(
			startTime,
			"Failed to retrieve goals progress",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
