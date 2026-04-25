// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
	formatSuccess,
	formatBadRequest,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import { getDashboardData } from "@/lib/dashboard-service";
import { validateDashboardQuery } from "@/lib/dashboard-service/validation";
import { ZodError } from "zod";

const logger = new Logger("DASHBOARD-API");

export async function GET(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("GET /api/dashboard called");

		const userId = req.headers.get("x-user-id");
		if (!userId) {
			const response = formatBadRequest(startTime, "User ID not found");
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const url = new URL(req.url);
		const queryParams = {
			period: url.searchParams.get("period"),
			startDate: url.searchParams.get("startDate") || undefined,
			endDate: url.searchParams.get("endDate") || undefined,
			compareWithPrevious:
				url.searchParams.get("compareWithPrevious") || "true",
			includeTagAnalysis:
				url.searchParams.get("includeTagAnalysis") || "false",
		};

		logger.info("Dashboard query params", {
			period: queryParams.period,
			compareWithPrevious: queryParams.compareWithPrevious,
			includeTagAnalysis: queryParams.includeTagAnalysis,
		});

		const validatedParams = validateDashboardQuery(queryParams);
		const dashboardData = await getDashboardData(userId, validatedParams);

		const response = formatSuccess(dashboardData, startTime, {
			message: "Dashboard data retrieved successfully",
		});
		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error) {
		logger.error("GET /api/dashboard failed", error);

		// Handle ZodError correctly
		if (error instanceof ZodError) {
			const firstIssue = error.issues[0];
			const errorMessage =
				firstIssue?.message || "Invalid query parameters";

			const response = formatBadRequest(startTime, errorMessage);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		// Handle generic error
		const errorMessage =
			error instanceof Error
				? error.message
				: "Failed to retrieve dashboard data";
		const response = formatInternalError(startTime, errorMessage);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
