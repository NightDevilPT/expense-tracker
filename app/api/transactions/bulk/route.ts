// app/api/transactions/bulk/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
	formatSuccess,
	formatBadRequest,
	formatUnauthorized,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import {
	bulkCreateTransactions,
	bulkDeleteTransactions,
} from "@/lib/transaction-service";
import {
	validateBulkCreateTransaction,
	validateBulkDeleteTransaction,
} from "@/lib/transaction-service/validation";

const logger = new Logger("TRANSACTIONS-BULK-API");

// POST /api/transactions/bulk - Bulk create transactions
export async function POST(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("POST /api/transactions/bulk called");

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

		// Validate the bulk create request
		const validatedData = validateBulkCreateTransaction(body);

		logger.info("Bulk creating transactions", {
			userId,
			count: validatedData.transactions.length,
		});

		// Process bulk create
		const result = await bulkCreateTransactions(userId, validatedData);

		const response = formatSuccess(result, startTime, {
			message: `Bulk create completed: ${result.created} created, ${result.failed} failed`,
		});

		// Return 201 if all succeeded, 400 if partial success, 200 if mixed results
		const statusCode = result.success ? HttpStatus.CREATED : HttpStatus.OK;

		return NextResponse.json(response, { status: statusCode });
	} catch (error: any) {
		logger.error("POST /api/transactions/bulk failed", error);

		// Handle validation errors
		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid bulk create data",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		// Handle specific business errors
		if (error.message === "CATEGORY_NOT_FOUND") {
			const response = formatBadRequest(
				startTime,
				"One or more categories not found",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		if (error.message === "ACCOUNT_NOT_FOUND") {
			const response = formatBadRequest(
				startTime,
				"One or more accounts not found",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		if (error.message === "TAG_NOT_FOUND") {
			const response = formatBadRequest(
				startTime,
				"One or more tags not found",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		if (error.message === "INSUFFICIENT_BALANCE") {
			const response = formatBadRequest(
				startTime,
				"Insufficient balance in one or more accounts",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const response = formatInternalError(
			startTime,
			"Failed to bulk create transactions",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}

// DELETE /api/transactions/bulk - Bulk delete transactions
export async function DELETE(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("DELETE /api/transactions/bulk called");

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

		// Validate the bulk delete request
		const validatedData = validateBulkDeleteTransaction(body);

		logger.info("Bulk deleting transactions", {
			userId,
			count: validatedData.transactionIds.length,
		});

		// Process bulk delete
		const result = await bulkDeleteTransactions(userId, validatedData);

		const response = formatSuccess(result, startTime, {
			message: `Bulk delete completed: ${result.deleted} deleted, ${result.failed} failed`,
		});

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("DELETE /api/transactions/bulk failed", error);

		// Handle validation errors
		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid bulk delete data",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const response = formatInternalError(
			startTime,
			"Failed to bulk delete transactions",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
