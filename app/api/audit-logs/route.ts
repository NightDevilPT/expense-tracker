import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
	formatSuccess,
	formatPaginated,
	formatBadRequest,
	formatNotFound,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import { getAuditLogs, exportAuditLogs } from "@/lib/audit-service";
import {
	validateGetAuditLogsQuery,
	validateExportAuditLogsQuery,
} from "@/lib/audit-service/validation";

const logger = new Logger("AUDIT-LOGS-API");

export async function GET(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("GET /api/audit-logs called");

		const userId = req.headers.get("x-user-id");
		if (!userId) {
			const response = formatBadRequest(startTime, "User ID not found");
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const url = new URL(req.url);
		const page = url.searchParams.get("page");
		const limit = url.searchParams.get("limit");
		const action = url.searchParams.get("action");
		const entityType = url.searchParams.get("entityType");
		const entityId = url.searchParams.get("entityId");
		const startDate = url.searchParams.get("startDate");
		const endDate = url.searchParams.get("endDate");
		const exportFormat = url.searchParams.get("export");

		// Check if export is requested
		if (exportFormat === "json" || exportFormat === "csv") {
			const query = validateExportAuditLogsQuery({
				format: exportFormat,
				startDate: startDate || undefined,
				endDate: endDate || undefined,
				action: action || undefined,
				entityType: entityType || undefined,
			});

			const exportData = await exportAuditLogs(userId, query);

			if (query.format === "json") {
				const response = formatSuccess(exportData, startTime, {
					message: "Audit logs exported successfully",
				});
				return NextResponse.json(response, { status: HttpStatus.OK });
			} else {
				// Return CSV as text/plain
				return new NextResponse(exportData as string, {
					status: HttpStatus.OK,
					headers: {
						"Content-Type": "text/csv",
						"Content-Disposition": `attachment; filename="audit-logs-${Date.now()}.csv"`,
					},
				});
			}
		}

		// Regular paginated list
		const query = validateGetAuditLogsQuery({
			page: page ? parseInt(page) : 1,
			limit: limit ? parseInt(limit) : 20,
			action: action || undefined,
			entityType: entityType || undefined,
			entityId: entityId || undefined,
			startDate: startDate || undefined,
			endDate: endDate || undefined,
		});

		const result = await getAuditLogs(userId, query);
		const totalPages = Math.ceil(result.total / result.limit);

		const response = formatPaginated(
			result.data,
			startTime,
			{
				page: result.page,
				limit: result.limit,
				total: result.total,
				totalPages,
				hasNext: result.page < totalPages,
				hasPrev: result.page > 1,
			},
			"Audit logs retrieved successfully",
		);
		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/audit-logs failed", error);

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid query parameters",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const response = formatInternalError(
			startTime,
			"Failed to retrieve audit logs",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
