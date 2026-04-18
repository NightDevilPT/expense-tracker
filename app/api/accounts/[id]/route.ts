// app/api/accounts/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
	formatSuccess,
	formatBadRequest,
	formatUnauthorized,
	formatNotFound,
	formatConflict,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import { CookieService } from "@/lib/cookie-service";
import {
	getAccountById,
	updateAccount,
	deleteAccount,
	getIpAddress,
} from "@/lib/account-service";
import {
	validateUpdateAccount,
	validateAccountId,
} from "@/lib/account-service/validation";

const logger = new Logger("ACCOUNT-API");

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const startTime = Date.now();

	try {
		const { id } = await params;
		logger.info("GET /api/accounts/[id] called", { id });

		const accessToken = req.cookies.get("accessToken")?.value;
		const refreshToken = req.cookies.get("refreshToken")?.value;
		const user = CookieService.validateTokens(accessToken, refreshToken);

		if (!user) {
			logger.warn("Unauthorized GET /api/accounts/[id]");
			const response = formatUnauthorized(
				startTime,
				"Authentication required",
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		validateAccountId(id);
		const account = await getAccountById(id, user.id);

		const response = formatSuccess(account, startTime, {
			message: "Account retrieved successfully",
		});
		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/accounts/[id] failed", error);

		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(startTime, "Account not found");
			return NextResponse.json(response, {
				status: HttpStatus.NOT_FOUND,
			});
		}

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
			"Failed to retrieve account",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}

export async function PUT(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const startTime = Date.now();

	try {
		const { id } = await params;
		logger.info("PUT /api/accounts/[id] called", { id });

		const accessToken = req.cookies.get("accessToken")?.value;
		const refreshToken = req.cookies.get("refreshToken")?.value;
		const user = CookieService.validateTokens(accessToken, refreshToken);

		if (!user) {
			logger.warn("Unauthorized PUT /api/accounts/[id]");
			const response = formatUnauthorized(
				startTime,
				"Authentication required",
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		const body = await req.json();
		const validatedData = validateUpdateAccount(body);
		const ipAddress = getIpAddress(req);
		const userAgent = req.headers.get("user-agent") || undefined;

		const account = await updateAccount(
			id,
			user.id,
			validatedData,
			ipAddress,
			userAgent,
		);

		const response = formatSuccess(account, startTime, {
			message: "Account updated successfully",
		});
		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("PUT /api/accounts/[id] failed", error);

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message,
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(startTime, "Account not found");
			return NextResponse.json(response, {
				status: HttpStatus.NOT_FOUND,
			});
		}

		if (error.message === "ALREADY_EXISTS") {
			const response = formatConflict(
				startTime,
				"An account with this name already exists",
			);
			return NextResponse.json(response, { status: HttpStatus.CONFLICT });
		}

		const response = formatInternalError(
			startTime,
			"Failed to update account",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const startTime = Date.now();

	try {
		const { id } = await params;
		logger.info("DELETE /api/accounts/[id] called", { id });

		const accessToken = req.cookies.get("accessToken")?.value;
		const refreshToken = req.cookies.get("refreshToken")?.value;
		const user = CookieService.validateTokens(accessToken, refreshToken);

		if (!user) {
			logger.warn("Unauthorized DELETE /api/accounts/[id]");
			const response = formatUnauthorized(
				startTime,
				"Authentication required",
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		validateAccountId(id);
		const ipAddress = getIpAddress(req);
		const userAgent = req.headers.get("user-agent") || undefined;

		await deleteAccount(id, user.id, ipAddress, userAgent);

		const response = formatSuccess(null, startTime, {
			message: "Account deleted successfully",
		});
		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("DELETE /api/accounts/[id] failed", error);

		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(startTime, "Account not found");
			return NextResponse.json(response, {
				status: HttpStatus.NOT_FOUND,
			});
		}

		if (error.message === "CONFLICT") {
			const response = formatConflict(
				startTime,
				"Cannot delete account with existing transactions",
			);
			return NextResponse.json(response, { status: HttpStatus.CONFLICT });
		}

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
			"Failed to delete account",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
