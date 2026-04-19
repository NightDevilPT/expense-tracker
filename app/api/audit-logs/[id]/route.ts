import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
	formatSuccess,
	formatBadRequest,
	formatNotFound,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import { getAuditLogById } from "@/lib/audit-service";

const logger = new Logger("AUDIT-LOG-API");

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const startTime = Date.now();

	try {
		const { id } = await params;
		logger.info("GET /api/audit-logs/[id] called", { id });

		const userId = req.headers.get("x-user-id");
		if (!userId) {
			const response = formatBadRequest(startTime, "User ID not found");
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const auditLog = await getAuditLogById(id, userId);

		const response = formatSuccess(auditLog, startTime, {
			message: "Audit log retrieved successfully",
		});
		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/audit-logs/[id] failed", error);

		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(startTime, "Audit log not found");
			return NextResponse.json(response, {
				status: HttpStatus.NOT_FOUND,
			});
		}

		const response = formatInternalError(
			startTime,
			"Failed to retrieve audit log",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
