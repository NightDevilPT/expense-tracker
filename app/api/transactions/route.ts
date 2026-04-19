// app/api/transactions/route.ts

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
	getAllTransactions,
	createTransaction,
} from "@/lib/transaction-service";
import {
	validateGetTransactionsQuery,
	validateCreateTransaction,
} from "@/lib/transaction-service/validation";
import type { GetTransactionsParams } from "@/lib/transaction-service/types";

const logger = new Logger("TRANSACTIONS-API");

// Helper: Convert validated query params to service params
function parseGetTransactionsParams(
	validatedParams: any,
): GetTransactionsParams {
	return {
		page: validatedParams.page,
		limit: validatedParams.limit,
		startDate: validatedParams.startDate
			? new Date(validatedParams.startDate)
			: undefined,
		endDate: validatedParams.endDate
			? new Date(validatedParams.endDate)
			: undefined,
		type: validatedParams.type,
		categoryId: validatedParams.categoryId,
		accountId: validatedParams.accountId,
		search: validatedParams.search,
		minAmount: validatedParams.minAmount,
		maxAmount: validatedParams.maxAmount,
		tagIds: validatedParams.tagIds,
		sortBy: validatedParams.sortBy,
		sortOrder: validatedParams.sortOrder,
	};
}

// GET /api/transactions - List all transactions with filters
export async function GET(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("GET /api/transactions called");

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
			startDate: searchParams.startDate,
			endDate: searchParams.endDate,
			type: searchParams.type as any,
			categoryId: searchParams.categoryId,
			accountId: searchParams.accountId,
			search: searchParams.search,
			minAmount: searchParams.minAmount
				? parseFloat(searchParams.minAmount)
				: undefined,
			maxAmount: searchParams.maxAmount
				? parseFloat(searchParams.maxAmount)
				: undefined,
			tagIds: searchParams.tagIds as any,
			sortBy: (searchParams.sortBy as any) || "date",
			sortOrder: (searchParams.sortOrder as any) || "desc",
		};

		// Validate the raw params
		const validatedParams = validateGetTransactionsQuery(params);

		// Convert to service params with proper Date objects
		const serviceParams = parseGetTransactionsParams(validatedParams);

		const result = await getAllTransactions(userId, serviceParams);
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
			"Transactions retrieved successfully",
		);

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/transactions failed", error);

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
			"Failed to retrieve transactions",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}

// POST /api/transactions - Create new transaction
export async function POST(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("POST /api/transactions called");

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
		const validatedData = validateCreateTransaction(body);
		const transaction = await createTransaction(userId, validatedData);

		const response = formatSuccess(transaction, startTime, {
			message: "Transaction created successfully",
		});

		return NextResponse.json(response, { status: HttpStatus.CREATED });
	} catch (error: any) {
		logger.error("POST /api/transactions failed", error);

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid transaction data",
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

		if (error.message === "TAG_NOT_FOUND") {
			const response = formatBadRequest(
				startTime,
				"One or more tags not found",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		if (error.message === "SOURCE_ACCOUNT_REQUIRED") {
			const response = formatBadRequest(
				startTime,
				"Source account is required for transfers",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		if (error.message === "DESTINATION_ACCOUNT_REQUIRED") {
			const response = formatBadRequest(
				startTime,
				"Destination account is required for transfers",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		if (error.message === "INSUFFICIENT_BALANCE") {
			const response = formatBadRequest(
				startTime,
				"Insufficient balance in source account",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const response = formatInternalError(
			startTime,
			"Failed to create transaction",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
