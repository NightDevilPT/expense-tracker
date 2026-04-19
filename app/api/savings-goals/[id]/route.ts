// app/api/savings-goals/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
	formatSuccess,
	formatBadRequest,
	formatUnauthorized,
	formatNotFound,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import {
	getSavingsGoalById,
	updateSavingsGoal,
	deleteSavingsGoal,
} from "@/lib/savings-goal-service";
import {
	validateUpdateSavingsGoal,
	validateSavingsGoalId,
} from "@/lib/savings-goal-service/validation";

const logger = new Logger("SAVINGS-GOAL-API");

// GET /api/savings-goals/:id - Get goal by ID
export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const startTime = Date.now();

	try {
		const { id } = await params;
		logger.info("GET /api/savings-goals/[id] called", { id });

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

		validateSavingsGoalId(id);
		const goal = await getSavingsGoalById(id, userId);

		const response = formatSuccess(goal, startTime, {
			message: "Savings goal retrieved successfully",
		});

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/savings-goals/[id] failed", error);

		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(
				startTime,
				"Savings goal not found",
			);
			return NextResponse.json(response, {
				status: HttpStatus.NOT_FOUND,
			});
		}

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid goal ID",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const response = formatInternalError(
			startTime,
			"Failed to retrieve savings goal",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}

// PUT /api/savings-goals/:id - Update goal
export async function PUT(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const startTime = Date.now();

	try {
		const { id } = await params;
		logger.info("PUT /api/savings-goals/[id] called", { id });

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

		validateSavingsGoalId(id);
		const validatedData = validateUpdateSavingsGoal(body);
		const goal = await updateSavingsGoal(id, userId, validatedData);

		const response = formatSuccess(goal, startTime, {
			message: "Savings goal updated successfully",
		});

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("PUT /api/savings-goals/[id] failed", error);

		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(
				startTime,
				"Savings goal not found",
			);
			return NextResponse.json(response, {
				status: HttpStatus.NOT_FOUND,
			});
		}

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid update data",
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
			"Failed to update savings goal",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}

// DELETE /api/savings-goals/:id - Delete goal
export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const startTime = Date.now();

	try {
		const { id } = await params;
		logger.info("DELETE /api/savings-goals/[id] called", { id });

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

		validateSavingsGoalId(id);
		await deleteSavingsGoal(id, userId);

		const response = formatSuccess(null, startTime, {
			message: "Savings goal deleted successfully",
		});

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("DELETE /api/savings-goals/[id] failed", error);

		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(
				startTime,
				"Savings goal not found",
			);
			return NextResponse.json(response, {
				status: HttpStatus.NOT_FOUND,
			});
		}

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid goal ID",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const response = formatInternalError(
			startTime,
			"Failed to delete savings goal",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
