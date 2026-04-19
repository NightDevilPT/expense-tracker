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
		const validatedData = validateBulkCreateTransaction(body);
		const result = await bulkCreateTransactions(userId, validatedData);

		const response = formatSuccess(result, startTime, {
			message: `Bulk create completed: ${result.created} created, ${result.failed} failed`,
		});

		return NextResponse.json(response, {
			status: result.success
				? HttpStatus.CREATED
				: HttpStatus.BAD_REQUEST,
		});
	} catch (error: any) {
		logger.error("POST /api/transactions/bulk failed", error);

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid bulk create data",
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
		const validatedData = validateBulkDeleteTransaction(body);
		const result = await bulkDeleteTransactions(userId, validatedData);

		const response = formatSuccess(result, startTime, {
			message: `Bulk delete completed: ${result.deleted} deleted, ${result.failed} failed`,
		});

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("DELETE /api/transactions/bulk failed", error);

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
