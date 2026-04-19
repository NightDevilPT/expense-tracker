// proxy.ts (Next.js 16+) or middleware.ts (Next.js 15)
import { NextRequest, NextResponse } from "next/server";
import { CookieService } from "@/lib/cookie-service";
import { rateLimitStorage } from "@/lib/rate-limit";
import {
	formatUnauthorized,
	formatTooManyRequests,
	HttpStatus,
} from "@/lib/response-service";

// ============================================
// CONFIGURATION
// ============================================

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
	"/api/auth/login",
	"/api/auth/request-otp",
	"/api/auth/verify-otp",
	"/api/auth/logout",
	"/api/open-api", // ✅ Added - OpenAPI JSON endpoint
	"/api/docs", // ✅ Added - Swagger UI page (if you serve it via API route)
	// ... etc
];

// proxy.ts - Rate limit configuration
const RATE_LIMITS: Record<string, { windowMs: number; maxRequests: number }> = {
	// Auth routes
	"/api/auth/login": { windowMs: 60_000, maxRequests: 5 },
	"/api/auth/request-otp": { windowMs: 60_000, maxRequests: 3 },
	"/api/auth/verify-otp": { windowMs: 60_000, maxRequests: 5 },
	"/api/auth/logout": { windowMs: 60_000, maxRequests: 60 },
	"/api/auth/me": { windowMs: 60_000, maxRequests: 30 },

	// Category routes
	"/api/categories": { windowMs: 60_000, maxRequests: 60 },
	"/api/categories/*": { windowMs: 60_000, maxRequests: 30 },

	// Tag routes
	"/api/tags": { windowMs: 60_000, maxRequests: 60 },
	"/api/tags/popular": { windowMs: 60_000, maxRequests: 30 },
	"/api/tags/*": { windowMs: 60_000, maxRequests: 30 },

	// User routes
	"/api/user/*": { windowMs: 60_000, maxRequests: 30 },

	// Account routes
	"/api/accounts": { windowMs: 60_000, maxRequests: 60 },
	"/api/accounts/*": { windowMs: 60_000, maxRequests: 30 },
	"/api/accounts/*/history": { windowMs: 60_000, maxRequests: 30 },
	"/api/accounts/*/add-balance": { windowMs: 60_000, maxRequests: 10 },

	// Transaction API rate limits
	"/api/transactions": { windowMs: 60_000, maxRequests: 60 },
	"/api/transactions/summary": { windowMs: 60_000, maxRequests: 30 },
	"/api/transactions/bulk": { windowMs: 60_000, maxRequests: 10 },
	"/api/transactions/export": { windowMs: 60_000, maxRequests: 10 },

	// OpenAPI documentation
	"/api/open-api": { windowMs: 60_000, maxRequests: 100 },

	// Default fallback
	default: { windowMs: 60_000, maxRequests: 30 },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function isPublicRoute(pathname: string): boolean {
	return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function getRateLimitConfig(pathname: string): {
	windowMs: number;
	maxRequests: number;
} {
	// Check exact match
	if (RATE_LIMITS[pathname]) {
		return RATE_LIMITS[pathname];
	}

	// Check prefix matches
	for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
		if (pattern !== "default" && pathname.startsWith(pattern)) {
			return config;
		}
	}

	return RATE_LIMITS["default"];
}

function getClientIp(req: NextRequest): string {
	const forwarded = req.headers.get("x-forwarded-for");
	const realIp = req.headers.get("x-real-ip");

	if (forwarded) {
		return forwarded.split(",")[0].trim();
	}
	if (realIp) {
		return realIp;
	}
	return "unknown";
}

// ============================================
// MAIN PROXY/MIDDLEWARE
// ============================================

export function proxy(request: NextRequest) {
	const startTime = Date.now();
	const pathname = request.nextUrl.pathname;

	// Skip non-API routes
	if (!pathname.startsWith("/api/")) {
		return NextResponse.next();
	}

	// ============================================
	// RATE LIMITING
	// ============================================

	const { windowMs, maxRequests } = getRateLimitConfig(pathname);
	const ip = getClientIp(request);
	const key = `rate-limit:${ip}:${pathname}`;
	const now = Date.now();

	let record = rateLimitStorage.get(key);

	if (record && now > record.resetTime) {
		record = undefined;
	}

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

	const { count, resetTime } = rateLimitStorage.increment(key, windowMs);

	// ============================================
	// AUTHENTICATION (Skip for public routes)
	// ============================================

	if (!isPublicRoute(pathname)) {
		const accessToken = request.cookies.get("accessToken")?.value;
		const refreshToken = request.cookies.get("refreshToken")?.value;
		console.log(accessToken, refreshToken, "CONSOLINH AR");

		if (!accessToken || !refreshToken) {
			const response = formatUnauthorized(
				startTime,
				"Authentication required. Please log in.",
				{ reason: "missing_tokens" },
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		const userPayload = CookieService.validateTokens(
			accessToken,
			refreshToken,
		);

		if (!userPayload) {
			const response = formatUnauthorized(
				startTime,
				"Invalid or expired session. Please log in again.",
				{ reason: "invalid_tokens" },
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		// Add user info to headers
		const requestHeaders = new Headers(request.headers);
		requestHeaders.set("x-user-id", userPayload.id);
		requestHeaders.set("x-user-email", userPayload.email);
		requestHeaders.set("x-user-name", userPayload.name);

		// Return response with modified headers
		return NextResponse.next({
			request: {
				headers: requestHeaders,
			},
		});
	}

	// Continue to route handler with rate limit headers
	const responseHeaders = new Headers(request.headers);
	responseHeaders.set("X-RateLimit-Limit", maxRequests.toString());
	responseHeaders.set(
		"X-RateLimit-Remaining",
		Math.max(0, maxRequests - count).toString(),
	);
	responseHeaders.set(
		"X-RateLimit-Reset",
		Math.ceil(resetTime / 1000).toString(),
	);

	return NextResponse.next({
		request: {
			headers: responseHeaders,
		},
	});
}

// ============================================
// CONFIGURATION
// ============================================

export const config = {
	matcher: ["/api/:path*"],
};
