// app/api/transactions/summary/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
	formatSuccess,
	formatBadRequest,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import { getTransactionSummary } from "@/lib/transaction-service";
import { validateTransactionSummaryQuery } from "@/lib/transaction-service/validation";

const logger = new Logger("TRANSACTIONS-SUMMARY-API");

export async function GET(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("GET /api/transactions/summary called");

		const userId = req.headers.get("x-user-id");
		if (!userId) {
			const response = formatBadRequest(
				startTime,
				"User ID not found in request",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		// Get query parameters from URL
		const url = new URL(req.url);
		const startDate = url.searchParams.get("startDate") || undefined;
		const endDate = url.searchParams.get("endDate") || undefined;
		const categoryIds =
			url.searchParams.get("categoryIds")?.split(",").filter(Boolean) ||
			undefined;
		const accountIds =
			url.searchParams.get("accountIds")?.split(",").filter(Boolean) ||
			undefined;

		const validatedParams = validateTransactionSummaryQuery({
			startDate,
			endDate,
			categoryIds,
			accountIds,
		});

		const summary = await getTransactionSummary(userId, validatedParams);

		const response = formatSuccess(summary, startTime, {
			message: "Transaction summary retrieved successfully",
		});
		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/transactions/summary failed", error);

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid request data",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const response = formatInternalError(
			startTime,
			"Failed to retrieve transaction summary",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
