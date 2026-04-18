import { NextRequest, NextResponse } from "next/server";
import { rateLimitStorage } from "@/lib/rate-limit";
import { formatTooManyRequests, HttpStatus } from "@/lib/response-service";

// ============================================
// DEFAULT KEY GENERATOR (IP + Path Based)
// ============================================

function getIpAndPathKey(req: NextRequest): string {
	const forwarded = req.headers.get("x-forwarded-for");
	const realIp = req.headers.get("x-real-ip");

	let ip = "unknown";

	if (forwarded) {
		ip = forwarded.split(",")[0].trim();
	} else if (realIp) {
		ip = realIp;
	}

	const path = req.nextUrl.pathname;

	return `rate-limit:${ip}:${path}`;
}

// ============================================
// RATE LIMIT MIDDLEWARE
// ============================================

export function withRateLimit(
	handler: (req: NextRequest) => Promise<NextResponse>,
	options: { windowMs: number; maxRequests: number; keyGenerator?: (req: NextRequest) => string }
) {
	const { windowMs, maxRequests, keyGenerator = getIpAndPathKey } = options;

	return async (req: NextRequest): Promise<NextResponse> => {
		const startTime = Date.now();
		const key = keyGenerator(req);
		const now = Date.now();

		// Get current record WITHOUT incrementing
		let record = rateLimitStorage.get(key);

		// If record exists but expired, clear it
		if (record && now > record.resetTime) {
			record = undefined;
		}

		// Check if rate limited BEFORE incrementing
		if (record && record.count >= maxRequests) {
			const response = formatTooManyRequests(
				startTime,
				"Too many requests. Please try again later.",
				{
					limit: maxRequests,
					remaining: 0,
					reset: record.resetTime,
					retryAfter: Math.ceil((record.resetTime - now) / 1000),
				},
			);

			return NextResponse.json(response, {
				status: HttpStatus.TOO_MANY_REQUESTS,
			});
		}

		// Now increment the count
		const { count, resetTime } = rateLimitStorage.increment(key, windowMs);
		const remaining = Math.max(0, maxRequests - count);

		// Execute handler
		const response = await handler(req);

		// Add rate limit headers
		response.headers.set("X-RateLimit-Limit", maxRequests.toString());
		response.headers.set("X-RateLimit-Remaining", remaining.toString());
		response.headers.set(
			"X-RateLimit-Reset",
			Math.ceil(resetTime / 1000).toString(),
		);

		return response;
	};
}