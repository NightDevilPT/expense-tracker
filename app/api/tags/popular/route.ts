// app/api/tags/popular/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
	formatSuccess,
	formatBadRequest,
	formatUnauthorized,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import { CookieService } from "@/lib/cookie-service";
import { getPopularTags } from "@/lib/tag-service";
import { validateGetPopularTagsParams } from "@/lib/tag-service/validation";

const logger = new Logger("TAGS-POPULAR-API");

export async function GET(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("GET /api/tags/popular called");

		const accessToken = req.cookies.get("accessToken")?.value;
		const refreshToken = req.cookies.get("refreshToken")?.value;
		const user = CookieService.validateTokens(accessToken, refreshToken);

		if (!user) {
			logger.warn("Unauthorized GET /api/tags/popular");
			const response = formatUnauthorized(
				startTime,
				"Authentication required",
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		const url = new URL(req.url);
		const limit = parseInt(url.searchParams.get("limit") || "10");

		const validatedParams = validateGetPopularTagsParams({ limit });
		const popularTags = await getPopularTags(user.id, validatedParams);

		const response = formatSuccess(popularTags, startTime, {
			message: "Popular tags retrieved successfully",
		});
		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/tags/popular failed", error);

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message,
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const response = formatInternalError(
			startTime,
			"Failed to retrieve popular tags",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
