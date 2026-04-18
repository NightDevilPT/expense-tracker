// app/api/accounts/[id]/add-balance/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
  formatSuccess,
  formatBadRequest,
  formatUnauthorized,
  formatNotFound,
  formatInternalError,
  HttpStatus,
} from "@/lib/response-service";
import { CookieService } from "@/lib/cookie-service";
import { addBalanceToAccount, getIpAddress } from "@/lib/account-service";
import { validateAddBalance, validateAccountId } from "@/lib/account-service/validation";

const logger = new Logger("ACCOUNT-ADD-BALANCE-API");

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { id } = await params;
    logger.info("PUT /api/accounts/[id]/add-balance called", { id });

    const accessToken = req.cookies.get("accessToken")?.value;
    const refreshToken = req.cookies.get("refreshToken")?.value;
    const user = CookieService.validateTokens(accessToken, refreshToken);

    if (!user) {
      logger.warn("Unauthorized PUT /api/accounts/[id]/add-balance");
      const response = formatUnauthorized(startTime, "Authentication required");
      return NextResponse.json(response, { status: HttpStatus.UNAUTHORIZED });
    }

    const body = await req.json();
    const validatedData = validateAddBalance(body);
    const ipAddress = getIpAddress(req);
    const userAgent = req.headers.get("user-agent") || undefined;

    validateAccountId(id);
    const account = await addBalanceToAccount(id, user.id, validatedData, ipAddress, userAgent);

    const message = validatedData.type === "ADD" 
      ? `$${validatedData.amount} added successfully` 
      : `$${validatedData.amount} subtracted successfully`;

    const response = formatSuccess(account, startTime, { message });
    return NextResponse.json(response, { status: HttpStatus.OK });
  } catch (error: any) {
    logger.error("PUT /api/accounts/[id]/add-balance failed", error);

    if (error.message === "NOT_FOUND") {
      const response = formatNotFound(startTime, "Account not found");
      return NextResponse.json(response, { status: HttpStatus.NOT_FOUND });
    }

    if (error.message === "INSUFFICIENT_BALANCE") {
      const response = formatBadRequest(startTime, "Insufficient balance for this operation");
      return NextResponse.json(response, { status: HttpStatus.BAD_REQUEST });
    }

    if (error.name === "ZodError") {
      const response = formatBadRequest(startTime, error.errors?.[0]?.message);
      return NextResponse.json(response, { status: HttpStatus.BAD_REQUEST });
    }

    const response = formatInternalError(startTime, "Failed to update balance");
    return NextResponse.json(response, { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
}