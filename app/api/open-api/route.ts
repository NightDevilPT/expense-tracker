// app/api/openapi/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import { getOpenApiSpec } from "@/lib/swagger";

const logger = new Logger("OPENAPI-API");

export async function GET(req: NextRequest) {
	try {
		logger.info("GET /api/openapi called");

		const spec = getOpenApiSpec();

		// Return with no-cache headers
		return NextResponse.json(spec, {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control":
					"no-store, no-cache, must-revalidate, proxy-revalidate",
				Pragma: "no-cache",
				Expires: "0",
				"Surrogate-Control": "no-store",
			},
		});
	} catch (error: any) {
		logger.error("GET /api/openapi failed", error);
		return NextResponse.json(
			{ error: "Failed to generate OpenAPI specification" },
			{ status: 500 },
		);
	}
}
