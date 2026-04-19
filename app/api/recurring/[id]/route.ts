// app/api/recurring/[id]/route.ts

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
	getRecurringById,
	updateRecurring,
	deleteRecurring,
} from "@/lib/recurring-service";
import {
	validateUpdateRecurring,
	validateRecurringId,
} from "@/lib/recurring-service/validation";

const logger = new Logger("RECURRING-ID-API");

// GET /api/recurring/:id - Get recurring by ID
export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const startTime = Date.now();

	try {
		const { id } = await params;
		logger.info("GET /api/recurring/[id] called", { id });

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

		validateRecurringId(id);
		const recurring = await getRecurringById(id, userId);

		const response = formatSuccess(recurring, startTime, {
			message: "Recurring transaction retrieved successfully",
		});

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/recurring/[id] failed", error);

		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(
				startTime,
				"Recurring transaction not found",
			);
			return NextResponse.json(response, {
				status: HttpStatus.NOT_FOUND,
			});
		}

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid ID",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const response = formatInternalError(
			startTime,
			"Failed to retrieve recurring transaction",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}

// PUT /api/recurring/:id - Update recurring
export async function PUT(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const startTime = Date.now();

	try {
		const { id } = await params;
		logger.info("PUT /api/recurring/[id] called", { id });

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

		validateRecurringId(id);
		const validatedData = validateUpdateRecurring(body);
		const recurring = await updateRecurring(id, userId, validatedData);

		const response = formatSuccess(recurring, startTime, {
			message: "Recurring transaction updated successfully",
		});

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("PUT /api/recurring/[id] failed", error);

		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(
				startTime,
				"Recurring transaction not found",
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
			"Failed to update recurring transaction",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}

// DELETE /api/recurring/:id - Delete recurring
export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const startTime = Date.now();

	try {
		const { id } = await params;
		logger.info("DELETE /api/recurring/[id] called", { id });

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

		validateRecurringId(id);
		await deleteRecurring(id, userId);

		const response = formatSuccess(null, startTime, {
			message: "Recurring transaction deleted successfully",
		});

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("DELETE /api/recurring/[id] failed", error);

		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(
				startTime,
				"Recurring transaction not found",
			);
			return NextResponse.json(response, {
				status: HttpStatus.NOT_FOUND,
			});
		}

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid ID",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const response = formatInternalError(
			startTime,
			"Failed to delete recurring transaction",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
