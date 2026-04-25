// app/api/budgets/route.ts

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
import { getAllBudgets, createBudget } from "@/lib/budget-service";
import {
	validateGetBudgetsQuery,
	validateCreateBudget,
} from "@/lib/budget-service/validation";
import type { GetBudgetsParams } from "@/lib/budget-service/types";

const logger = new Logger("BUDGETS-API");

// Helper: Parse query params to service params
function parseGetBudgetsParams(validatedParams: any): GetBudgetsParams {
	return {
		page: validatedParams.page,
		limit: validatedParams.limit,
		period: validatedParams.period,
		currency: validatedParams.currency,
		categoryId: validatedParams.categoryId,
		startDate: validatedParams.startDate
			? new Date(validatedParams.startDate)
			: undefined,
		endDate: validatedParams.endDate
			? new Date(validatedParams.endDate)
			: undefined,
		sortBy: validatedParams.sortBy,
		sortOrder: validatedParams.sortOrder,
	};
}

// GET /api/budgets - List all budgets
export async function GET(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("GET /api/budgets called");

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
			period: searchParams.period as any,
			currency: searchParams.currency as any,
			categoryId: searchParams.categoryId,
			startDate: searchParams.startDate,
			endDate: searchParams.endDate,
			sortBy: (searchParams.sortBy as any) || "startDate",
			sortOrder: (searchParams.sortOrder as any) || "desc",
		};

		const validatedParams = validateGetBudgetsQuery(params);
		const serviceParams = parseGetBudgetsParams(validatedParams);
		const result = await getAllBudgets(userId, serviceParams);
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
			"Budgets retrieved successfully",
		);

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/budgets failed", error);

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
			"Failed to retrieve budgets",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}

// POST /api/budgets - Create new budget
export async function POST(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("POST /api/budgets called");

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
		const validatedData = validateCreateBudget(body);
		const budget = await createBudget(userId, validatedData);

		const response = formatSuccess(budget, startTime, {
			message: "Budget created successfully",
		});

		return NextResponse.json(response, { status: HttpStatus.CREATED });
	} catch (error: any) {
		logger.error("POST /api/budgets failed", error);

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid budget data",
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

		if (error.message.includes("Unique constraint")) {
			const response = formatConflict(
				startTime,
				"Budget already exists for this category and period",
			);
			return NextResponse.json(response, { status: HttpStatus.CONFLICT });
		}

		const response = formatInternalError(
			startTime,
			"Failed to create budget",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
