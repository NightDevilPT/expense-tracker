// app/api/savings-goals/[id]/contribute/route.ts

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
import { contributeToGoal } from "@/lib/savings-goal-service";
import {
	validateContributeToGoal,
	validateSavingsGoalId,
} from "@/lib/savings-goal-service/validation";

const logger = new Logger("SAVINGS-GOAL-CONTRIBUTE-API");

// POST /api/savings-goals/:id/contribute - Add contribution to goal
export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const startTime = Date.now();

	try {
		const { id } = await params;
		logger.info("POST /api/savings-goals/[id]/contribute called", { id });

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

		validateSavingsGoalId(id);
		const validatedData = validateContributeToGoal(body);
		const result = await contributeToGoal(id, userId, validatedData);

		const response = formatSuccess(result, startTime, {
			message: result.message,
		});

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("POST /api/savings-goals/[id]/contribute failed", error);

		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(
				startTime,
				"Savings goal not found",
			);
			return NextResponse.json(response, {
				status: HttpStatus.NOT_FOUND,
			});
		}

		if (error.message === "GOAL_NOT_ACTIVE") {
			const response = formatBadRequest(
				startTime,
				"Goal is not active. Cannot contribute to completed, failed, or cancelled goals.",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid contribution data",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const response = formatInternalError(
			startTime,
			"Failed to contribute to savings goal",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
