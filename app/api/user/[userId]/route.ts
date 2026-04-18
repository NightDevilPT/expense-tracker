// app/api/user/[userId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
	formatSuccess,
	formatBadRequest,
	formatNotFound,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import { updateUserProfile } from "@/lib/user-service";
import { validateUpdateUser } from "@/lib/user-service/validation";

const logger = new Logger("USER-UPDATE");

export async function PUT(
	req: NextRequest,
	{ params }: { params: Promise<{ userId: string }> },
) {
	const startTime = Date.now();

	try {
		const { userId } = await params;

		logger.info("PUT /api/user/[userId] called", {
			userId,
		});

		// Parse and validate request body
		const body = await req.json();
		const validatedData = validateUpdateUser(body);

		// Update user profile using userId from params
		const updatedUser = await updateUserProfile(userId, validatedData);

		logger.info("User profile updated successfully", {
			userId: updatedUser.id,
			updatedFields: Object.keys(validatedData),
		});

		const response = formatSuccess(updatedUser, startTime, {
			message: "Profile updated successfully",
		});

		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("PUT /api/user/[userId] failed", error);

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid request data",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(startTime, "User not found");
			return NextResponse.json(response, {
				status: HttpStatus.NOT_FOUND,
			});
		}

		const response = formatInternalError(
			startTime,
			"Failed to update user profile. Please try again later.",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
