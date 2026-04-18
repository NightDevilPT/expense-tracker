// app/api/accounts/[id]/history/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
	formatSuccess,
	formatPaginated,
	formatBadRequest,
	formatUnauthorized,
	formatNotFound,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import { CookieService } from "@/lib/cookie-service";
import { getBalanceHistory } from "@/lib/account-service";
import {
	validateAccountId,
	validateGetBalanceHistory,
} from "@/lib/account-service/validation";

const logger = new Logger("ACCOUNT-HISTORY-API");

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const startTime = Date.now();

	try {
		const { id } = await params;
		logger.info("GET /api/accounts/[id]/history called", { id });

		const accessToken = req.cookies.get("accessToken")?.value;
		const refreshToken = req.cookies.get("refreshToken")?.value;
		const user = CookieService.validateTokens(accessToken, refreshToken);

		if (!user) {
			logger.warn("Unauthorized GET /api/accounts/[id]/history");
			const response = formatUnauthorized(
				startTime,
				"Authentication required",
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		const url = new URL(req.url);
		const page = parseInt(url.searchParams.get("page") || "1");
		const limit = parseInt(url.searchParams.get("limit") || "20");
		const days = parseInt(url.searchParams.get("days") || "30");

		// Validate all params together
		const validatedParams = validateGetBalanceHistory({
			page,
			limit,
			days,
		});
		validateAccountId(id);

		const result = await getBalanceHistory(id, user.id, validatedParams);

		const response = formatPaginated(
			result.data,
			startTime,
			{
				page: result.page,
				limit: result.limit,
				total: result.total,
				totalPages: result.totalPages,
				hasNext: result.page < result.totalPages,
				hasPrev: result.page > 1,
			},
			"Balance history retrieved successfully",
		);
		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/accounts/[id]/history failed", error);

		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(startTime, "Account not found");
			return NextResponse.json(response, {
				status: HttpStatus.NOT_FOUND,
			});
		}

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message,
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const response = formatInternalError(
			startTime,
			"Failed to retrieve balance history",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
