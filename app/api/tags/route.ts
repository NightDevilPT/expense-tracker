// app/api/tags/route.ts

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
import { getAllTags, createTag } from "@/lib/tag-service";
import {
	validateCreateTag,
	validateGetTagsParams,
} from "@/lib/tag-service/validation";

const logger = new Logger("TAGS-API");

export async function GET(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("GET /api/tags called");

		const accessToken = req.cookies.get("accessToken")?.value;
		const refreshToken = req.cookies.get("refreshToken")?.value;
		const user = CookieService.validateTokens(accessToken, refreshToken);

		if (!user) {
			logger.warn("Unauthorized GET /api/tags");
			const response = formatUnauthorized(
				startTime,
				"Authentication required",
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		const url = new URL(req.url);
		const page = parseInt(url.searchParams.get("page") || "1");
		const limit = parseInt(url.searchParams.get("limit") || "20");
		const search = url.searchParams.get("search") || undefined;
		const sortBy =
			(url.searchParams.get("sortBy") as
				| "name"
				| "transactionCount"
				| "createdAt") || "name";
		const sortOrder =
			(url.searchParams.get("sortOrder") as "asc" | "desc") || "asc";

		const validatedParams = validateGetTagsParams({
			page,
			limit,
			search,
			sortBy,
			sortOrder,
		});

		const result = await getAllTags(user.id, validatedParams);
		const totalPages = Math.ceil(result.total / result.limit);

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
			"Tags retrieved successfully",
		);
		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/tags failed", error);
		const response = formatInternalError(
			startTime,
			"Failed to retrieve tags",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}

export async function POST(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("POST /api/tags called");

		const accessToken = req.cookies.get("accessToken")?.value;
		const refreshToken = req.cookies.get("refreshToken")?.value;
		const user = CookieService.validateTokens(accessToken, refreshToken);

		if (!user) {
			logger.warn("Unauthorized POST /api/tags");
			const response = formatUnauthorized(
				startTime,
				"Authentication required",
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		const body = await req.json();
		const validatedData = validateCreateTag(body);

		const tag = await createTag(user.id, validatedData);

		const response = formatSuccess(tag, startTime, {
			message: "Tag created successfully",
		});
		return NextResponse.json(response, { status: HttpStatus.CREATED });
	} catch (error: any) {
		logger.error("POST /api/tags failed", error);

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
				"A tag with this name already exists",
			);
			return NextResponse.json(response, { status: HttpStatus.CONFLICT });
		}

		const response = formatInternalError(startTime, "Failed to create tag");
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
