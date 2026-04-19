// app/api/transactions/export/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
	formatSuccess,
	formatBadRequest,
	formatUnauthorized,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import { exportTransactions } from "@/lib/transaction-service";
import { validateExportOptions } from "@/lib/transaction-service/validation";

const logger = new Logger("TRANSACTIONS-EXPORT-API");

// GET /api/transactions/export - Export transactions
export async function GET(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("GET /api/transactions/export called");

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

		const url = new URL(req.url);
		const searchParams = Object.fromEntries(url.searchParams);

		const options = {
			format: (searchParams.format as any) || "json",
			startDate: searchParams.startDate,
			endDate: searchParams.endDate,
			includeAttachments: searchParams.includeAttachments === "true",
		};

		const validatedOptions = validateExportOptions(options);
		const exportData = await exportTransactions(userId, validatedOptions);

		// Handle CSV export
		if (validatedOptions.format === "csv") {
			const dateStr = new Date().toISOString().split("T")[0];
			return new NextResponse(exportData as string, {
				status: HttpStatus.OK,
				headers: {
					"Content-Type": "text/csv",
					"Content-Disposition": `attachment; filename="transactions-${dateStr}.csv"`,
				},
			});
		}

		// Handle JSON export
		if (validatedOptions.format === "json") {
			const response = formatSuccess(exportData, startTime, {
				message: "Transactions exported successfully",
			});
			return NextResponse.json(response, { status: HttpStatus.OK });
		}

		// PDF format not implemented yet
		throw new Error("PDF_EXPORT_NOT_IMPLEMENTED");
	} catch (error: any) {
		logger.error("GET /api/transactions/export failed", error);

		if (error.message === "PDF_EXPORT_NOT_IMPLEMENTED") {
			const response = formatBadRequest(
				startTime,
				"PDF export is not yet implemented. Please use CSV or JSON format.",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid export options",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const response = formatInternalError(
			startTime,
			"Failed to export transactions",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
