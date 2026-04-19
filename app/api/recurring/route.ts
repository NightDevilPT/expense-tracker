// app/api/recurring/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
	formatSuccess,
	formatPaginated,
	formatBadRequest,
	formatUnauthorized,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import { getAllRecurring, createRecurring } from "@/lib/recurring-service";
import {
	validateGetRecurringQuery,
	validateCreateRecurring,
} from "@/lib/recurring-service/validation";
import type { GetRecurringParams } from "@/lib/recurring-service/types";

const logger = new Logger("RECURRING-API");

// Helper: Parse query params
function parseGetRecurringParams(validatedParams: any): GetRecurringParams {
	return {
		page: validatedParams.page,
		limit: validatedParams.limit,
		type: validatedParams.type,
		frequency: validatedParams.frequency,
		isActive: validatedParams.isActive,
		categoryId: validatedParams.categoryId,
		accountId: validatedParams.accountId,
		search: validatedParams.search,
		sortBy: validatedParams.sortBy,
		sortOrder: validatedParams.sortOrder,
	};
}

// GET /api/recurring - List all recurring transactions
export async function GET(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("GET /api/recurring called");

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
		const searchParams = Object.fromEntries(url.searchParams);

		const params = {
			page: searchParams.page ? parseInt(searchParams.page) : undefined,
			limit: searchParams.limit
				? parseInt(searchParams.limit)
				: undefined,
			type: searchParams.type as any,
			frequency: searchParams.frequency as any,
			isActive:
				searchParams.isActive === "true"
					? true
					: searchParams.isActive === "false"
						? false
						: undefined,
			categoryId: searchParams.categoryId,
			accountId: searchParams.accountId,
			search: searchParams.search,
			sortBy: (searchParams.sortBy as any) || "nextDueDate",
			sortOrder: (searchParams.sortOrder as any) || "asc",
		};

		const validatedParams = validateGetRecurringQuery(params);
		const serviceParams = parseGetRecurringParams(validatedParams);
		const result = await getAllRecurring(userId, serviceParams);
		const totalPages = Math.ceil(result.total / result.limit);

		const response = formatPaginated(
			result.data,
			startTime,
			{
				page: result.page,
				limit: result.limit,
				total: result.total,
				totalPages,
				hasNext: result.page < totalPages,
				hasPrev: result.page > 1,
			},
			"Recurring transactions retrieved successfully",
		);

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/recurring failed", error);

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid query parameters",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const response = formatInternalError(
			startTime,
			"Failed to retrieve recurring transactions",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}

// POST /api/recurring - Create new recurring transaction
export async function POST(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("POST /api/recurring called");

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

		const body = await req.json();
		const validatedData = validateCreateRecurring(body);
		const recurring = await createRecurring(userId, validatedData);

		const response = formatSuccess(recurring, startTime, {
			message: "Recurring transaction created successfully",
		});

		return NextResponse.json(response, { status: HttpStatus.CREATED });
	} catch (error: any) {
		logger.error("POST /api/recurring failed", error);

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message ||
					"Invalid recurring transaction data",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		if (error.message === "CATEGORY_NOT_FOUND") {
			const response = formatBadRequest(
				startTime,
				"Category not found or access denied",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		if (error.message === "ACCOUNT_NOT_FOUND") {
			const response = formatBadRequest(
				startTime,
				"Account not found or access denied",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const response = formatInternalError(
			startTime,
			"Failed to create recurring transaction",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
