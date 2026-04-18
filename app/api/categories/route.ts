// app/api/categories/route.ts

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
import { getAllCategories, createCategory } from "@/lib/category-service";
import { validateCreateCategory } from "@/lib/category-service/validation";

const logger = new Logger("CATEGORIES-API");

// GET - Get all categories with pagination
export async function GET(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("GET /api/categories called");

		const accessToken = req.cookies.get("accessToken")?.value;
		const refreshToken = req.cookies.get("refreshToken")?.value;
		const user = CookieService.validateTokens(accessToken, refreshToken);

		if (!user) {
			logger.warn("Unauthorized GET /api/categories");
			const response = formatUnauthorized(
				startTime,
				"Authentication required",
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		// Get query parameters for pagination
		const url = new URL(req.url);
		const page = parseInt(url.searchParams.get("page") || "1");
		const limit = parseInt(url.searchParams.get("limit") || "20");
		const search = url.searchParams.get("search") || undefined;
		const type = url.searchParams.get("type") as
			| "INCOME"
			| "EXPENSE"
			| "TRANSFER"
			| undefined;

		// Validate pagination params
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

		// Fetch categories with pagination
		const result = await getAllCategories(user.id, {
			page,
			limit,
			search,
			type,
		});

		const totalPages = Math.ceil(result.total / result.limit);

		// Use formatPaginated helper with hasNext and hasPrev
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
			"Categories retrieved successfully",
		);

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/categories failed", error);

		const response = formatInternalError(
			startTime,
			"Failed to retrieve categories",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}

// POST - Create new category
export async function POST(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("POST /api/categories called");

		const accessToken = req.cookies.get("accessToken")?.value;
		const refreshToken = req.cookies.get("refreshToken")?.value;
		const user = CookieService.validateTokens(accessToken, refreshToken);

		if (!user) {
			logger.warn("Unauthorized POST /api/categories");
			const response = formatUnauthorized(
				startTime,
				"Authentication required",
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		const body = await req.json();
		const validatedData = validateCreateCategory(body);

		const category = await createCategory(user.id, validatedData);

		const response = formatSuccess(category, startTime, {
			message: "Category created successfully",
		});

		return NextResponse.json(response, { status: HttpStatus.CREATED });
	} catch (error: any) {
		logger.error("POST /api/categories failed", error);

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
				"Category with this name already exists",
			);
			return NextResponse.json(response, { status: HttpStatus.CONFLICT });
		}

		const response = formatInternalError(
			startTime,
			"Failed to create category",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
