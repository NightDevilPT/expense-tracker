// app/api/budgets/current/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
	formatSuccess,
	formatUnauthorized,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import { getCurrentMonthBudgets } from "@/lib/budget-service";

const logger = new Logger("BUDGETS-CURRENT-API");

// GET /api/budgets/current - Get current active budgets
export async function GET(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("GET /api/budgets/current called");

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

		const budgets = await getCurrentMonthBudgets(userId);

		const response = formatSuccess(budgets, startTime, {
			message: "Current budgets retrieved successfully",
		});

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/budgets/current failed", error);

		const response = formatInternalError(
			startTime,
			"Failed to retrieve current budgets",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
