// app/api/budgets/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
	formatSuccess,
	formatBadRequest,
	formatUnauthorized,
	formatNotFound,
	formatConflict,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import {
	getBudgetById,
	updateBudget,
	deleteBudget,
} from "@/lib/budget-service";
import {
	validateUpdateBudget,
	validateBudgetId,
} from "@/lib/budget-service/validation";

const logger = new Logger("BUDGET-API");

// GET /api/budgets/:id - Get budget by ID
export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const startTime = Date.now();

	try {
		const { id } = await params;
		logger.info("GET /api/budgets/[id] called", { id });

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

		validateBudgetId(id);
		const budget = await getBudgetById(id, userId);

		const response = formatSuccess(budget, startTime, {
			message: "Budget retrieved successfully",
		});

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/budgets/[id] failed", error);

		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(startTime, "Budget not found");
			return NextResponse.json(response, {
				status: HttpStatus.NOT_FOUND,
			});
		}

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid budget ID",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const response = formatInternalError(
			startTime,
			"Failed to retrieve budget",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}

// PUT /api/budgets/:id - Update budget
export async function PUT(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const startTime = Date.now();

	try {
		const { id } = await params;
		logger.info("PUT /api/budgets/[id] called", { id });

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

		validateBudgetId(id);
		const validatedData = validateUpdateBudget(body);
		const budget = await updateBudget(id, userId, validatedData);

		const response = formatSuccess(budget, startTime, {
			message: "Budget updated successfully",
		});

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("PUT /api/budgets/[id] failed", error);

		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(startTime, "Budget not found");
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

		if (error.message.includes("Unique constraint")) {
			const response = formatConflict(
				startTime,
				"Budget already exists for this category and period",
			);
			return NextResponse.json(response, { status: HttpStatus.CONFLICT });
		}

		const response = formatInternalError(
			startTime,
			"Failed to update budget",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}

// DELETE /api/budgets/:id - Delete budget
export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const startTime = Date.now();

	try {
		const { id } = await params;
		logger.info("DELETE /api/budgets/[id] called", { id });

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

		validateBudgetId(id);
		await deleteBudget(id, userId);

		const response = formatSuccess(null, startTime, {
			message: "Budget deleted successfully",
		});

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("DELETE /api/budgets/[id] failed", error);

		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(startTime, "Budget not found");
			return NextResponse.json(response, {
				status: HttpStatus.NOT_FOUND,
			});
		}

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid budget ID",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const response = formatInternalError(
			startTime,
			"Failed to delete budget",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
