// app/api/budgets/alerts/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
	formatSuccess,
	formatUnauthorized,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import { getBudgetAlerts } from "@/lib/budget-service";

const logger = new Logger("BUDGETS-ALERTS-API");

// GET /api/budgets/alerts - Get budgets exceeding threshold
export async function GET(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("GET /api/budgets/alerts called");

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

		const alerts = await getBudgetAlerts(userId);

		const response = formatSuccess(alerts, startTime, {
			message: "Budget alerts retrieved successfully",
		});

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/budgets/alerts failed", error);

		const response = formatInternalError(
			startTime,
			"Failed to retrieve budget alerts",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
