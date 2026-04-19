// app/api/savings-goals/route.ts

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
import {
	getAllSavingsGoals,
	createSavingsGoal,
} from "@/lib/savings-goal-service";
import {
	validateGetSavingsGoalsQuery,
	validateCreateSavingsGoal,
} from "@/lib/savings-goal-service/validation";
import type { GetSavingsGoalsParams } from "@/lib/savings-goal-service/types";

const logger = new Logger("SAVINGS-GOALS-API");

// Helper: Parse query params
function parseGetSavingsGoalsParams(
	validatedParams: any,
): GetSavingsGoalsParams {
	return {
		page: validatedParams.page,
		limit: validatedParams.limit,
		status: validatedParams.status,
		sortBy: validatedParams.sortBy,
		sortOrder: validatedParams.sortOrder,
	};
}

// GET /api/savings-goals - List all savings goals
export async function GET(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("GET /api/savings-goals called");

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
			status: searchParams.status as any,
			sortBy: (searchParams.sortBy as any) || "deadline",
			sortOrder: (searchParams.sortOrder as any) || "asc",
		};

		const validatedParams = validateGetSavingsGoalsQuery(params);
		const serviceParams = parseGetSavingsGoalsParams(validatedParams);
		const result = await getAllSavingsGoals(userId, serviceParams);
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
			"Savings goals retrieved successfully",
		);

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/savings-goals failed", error);

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
			"Failed to retrieve savings goals",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}

// POST /api/savings-goals - Create new savings goal
export async function POST(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("POST /api/savings-goals called");

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
		const validatedData = validateCreateSavingsGoal(body);
		const goal = await createSavingsGoal(userId, validatedData);

		const response = formatSuccess(goal, startTime, {
			message: "Savings goal created successfully",
		});

		return NextResponse.json(response, { status: HttpStatus.CREATED });
	} catch (error: any) {
		logger.error("POST /api/savings-goals failed", error);

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid savings goal data",
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

		const response = formatInternalError(
			startTime,
			"Failed to create savings goal",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
