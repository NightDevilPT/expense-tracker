// app/api/recurring/[id]/pause/route.ts

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
import { pauseRecurring } from "@/lib/recurring-service";
import { validateRecurringId } from "@/lib/recurring-service/validation";

const logger = new Logger("RECURRING-PAUSE-API");

// POST /api/recurring/:id/pause - Pause recurring transaction
export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const startTime = Date.now();

	try {
		const { id } = await params;
		logger.info("POST /api/recurring/[id]/pause called", { id });

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

		validateRecurringId(id);
		const recurring = await pauseRecurring(id, userId);

		const response = formatSuccess(recurring, startTime, {
			message: "Recurring transaction paused successfully",
		});

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("POST /api/recurring/[id]/pause failed", error);

		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(
				startTime,
				"Recurring transaction not found",
			);
			return NextResponse.json(response, {
				status: HttpStatus.NOT_FOUND,
			});
		}

		if (error.message === "ALREADY_PAUSED") {
			const response = formatConflict(
				startTime,
				"Recurring transaction is already paused",
			);
			return NextResponse.json(response, { status: HttpStatus.CONFLICT });
		}

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid ID",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const response = formatInternalError(
			startTime,
			"Failed to pause recurring transaction",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
