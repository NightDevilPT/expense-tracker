// app/api/accounts/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
	formatSuccess,
	formatPaginated,
	formatBadRequest,
	formatUnauthorized,
	formatConflict,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import { CookieService } from "@/lib/cookie-service";
import { getAllAccounts, createAccount, getIpAddress } from "@/lib/account-service";
import { validateCreateAccount } from "@/lib/account-service/validation";
import type { AccountType } from "@/lib/account-service/types";

const logger = new Logger("ACCOUNTS-API");

export async function GET(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("GET /api/accounts called");

		const accessToken = req.cookies.get("accessToken")?.value;
		const refreshToken = req.cookies.get("refreshToken")?.value;
		const user = CookieService.validateTokens(accessToken, refreshToken);

		if (!user) {
			logger.warn("Unauthorized GET /api/accounts");
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
		const search = url.searchParams.get("search") || undefined;
		const type = url.searchParams.get("type") as AccountType | undefined;
		const isDefault =
			url.searchParams.get("isDefault") === "true"
				? true
				: url.searchParams.get("isDefault") === "false"
					? false
					: undefined;

		if (isNaN(page) || page < 1) {
			const response = formatBadRequest(
				startTime,
				"Page must be a positive number",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		if (isNaN(limit) || limit < 1 || limit > 100) {
			const response = formatBadRequest(
				startTime,
				"Limit must be between 1 and 100",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const result = await getAllAccounts(user.id, {
			page,
			limit,
			search,
			type,
			isDefault,
		});
		const totalPages = Math.ceil(result.total / result.limit);

		const response = formatPaginated(
			result.data,
			startTime,
			{
				page: result.page,
				limit: result.limit,
				total: result.total,
				totalPages: totalPages,
				hasNext: result.page < totalPages,
				hasPrev: result.page > 1,
			},
			"Accounts retrieved successfully",
		);
		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/accounts failed", error);
		const response = formatInternalError(
			startTime,
			"Failed to retrieve accounts",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}

export async function POST(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("POST /api/accounts called");

		const accessToken = req.cookies.get("accessToken")?.value;
		const refreshToken = req.cookies.get("refreshToken")?.value;
		const user = CookieService.validateTokens(accessToken, refreshToken);

		if (!user) {
			logger.warn("Unauthorized POST /api/accounts");
			const response = formatUnauthorized(
				startTime,
				"Authentication required",
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		const body = await req.json();
		const validatedData = validateCreateAccount(body);
		const ipAddress = getIpAddress(req);
		const userAgent = req.headers.get("user-agent") || undefined;

		const account = await createAccount(
			user.id,
			validatedData,
			ipAddress,
			userAgent,
		);

		const response = formatSuccess(account, startTime, {
			message: "Account created successfully",
		});
		return NextResponse.json(response, { status: HttpStatus.CREATED });
	} catch (error: any) {
		logger.error("POST /api/accounts failed", error);

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid request data",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		if (error.message === "ALREADY_EXISTS") {
			const response = formatConflict(
				startTime,
				"An account with this name already exists",
			);
			return NextResponse.json(response, { status: HttpStatus.CONFLICT });
		}

		const response = formatInternalError(
			startTime,
			"Failed to create account",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
