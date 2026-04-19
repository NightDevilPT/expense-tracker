// app/api/transactions/export/open-api.ts

import { OpenAPIV3 } from "openapi-types";

const exportParameters: OpenAPIV3.ParameterObject[] = [
	{
		name: "format",
		in: "query",
		description: "Export format",
		required: false,
		schema: {
			type: "string",
			enum: ["json", "csv", "pdf"],
			default: "json",
		},
	},
	{
		name: "startDate",
		in: "query",
		description: "Export transactions from this date",
		required: false,
		schema: { type: "string", format: "date-time" },
		example: "2024-01-01T00:00:00Z",
	},
	{
		name: "endDate",
		in: "query",
		description: "Export transactions until this date",
		required: false,
		schema: { type: "string", format: "date-time" },
		example: "2024-01-31T23:59:59Z",
	},
	{
		name: "includeAttachments",
		in: "query",
		description: "Include attachment metadata in export",
		required: false,
		schema: { type: "boolean", default: false },
	},
];

export const transactionExportPaths: OpenAPIV3.PathsObject = {
	"/api/transactions/export": {
		get: {
			summary: "Export transactions",
			description:
				"Export transactions in JSON or CSV format. PDF export is planned for future release.",
			tags: ["Transactions"],
			parameters: exportParameters,
			responses: {
				"200": {
					description: "Transactions exported successfully",
					content: {
						"application/json": {
							schema: {
								type: "array",
								items: {
									$ref: "#/components/schemas/Transaction",
								},
							},
						},
						"text/csv": {
							schema: {
								type: "string",
								example:
									"ID,Date,Type,Amount,Description,Category,Account,Notes,Tags\nclh123,2024-01-15,EXPENSE,2500,Groceries,Food,HDFC,Monthly shopping,essentials",
							},
						},
					},
				},
				"400": { $ref: "#/components/responses/BadRequest" },
				"401": { $ref: "#/components/responses/Unauthorized" },
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
	},
};

export const transactionExportSchemas: Record<string, OpenAPIV3.SchemaObject> =
	{};
export const transactionExportTags: OpenAPIV3.TagObject[] = [];
