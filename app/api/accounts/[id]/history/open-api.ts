// app/api/accounts/[id]/history/open-api.ts
import { OpenAPIV3 } from "openapi-types";
import { paginatedResponse } from "@/lib/swagger/schemas";

const idParameter: OpenAPIV3.ParameterObject = {
	name: "id",
	in: "path",
	description: "Account ID (CUID format)",
	required: true,
	schema: { type: "string", format: "cuid" },
	example: "clh1234567890abcdef",
};

const balanceHistorySchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		id: { type: "string", format: "cuid", example: "clh1234567890abcdef" },
		accountId: { type: "string", format: "cuid", example: "clh1234567890abcdef" },
		balance: { type: "number", format: "float", example: 1250.75 },
		changeAmount: { type: "number", format: "float", example: 100.50 },
		changeType: {
			type: "string",
			enum: ["INITIAL", "INITIAL_ZERO", "DEPOSIT", "WITHDRAWAL"],
			example: "DEPOSIT",
		},
		description: { type: "string", nullable: true, example: "Added $100.50" },
		referenceId: { type: "string", nullable: true, example: "txn_abc123" },
		createdAt: { type: "string", format: "date-time" },
	},
	required: ["id", "accountId", "balance", "changeAmount", "changeType", "createdAt"],
};

const getHistoryParameters: OpenAPIV3.ParameterObject[] = [
	{
		name: "page",
		in: "query",
		description: "Page number (starts from 1)",
		required: false,
		schema: { type: "integer", minimum: 1, default: 1 },
	},
	{
		name: "limit",
		in: "query",
		description: "Items per page (max 100)",
		required: false,
		schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
	},
	{
		name: "days",
		in: "query",
		description: "Number of days to look back (max 365)",
		required: false,
		schema: { type: "integer", minimum: 1, maximum: 365, default: 30 },
	},
];

export const accountHistoryPaths: OpenAPIV3.PathsObject = {
	"/api/accounts/{id}/history": {
		get: {
			summary: "Get account balance history",
			description: "Get paginated balance change history for a specific account",
			tags: ["Accounts"],
			parameters: [idParameter, ...getHistoryParameters],
			responses: {
				"200": {
					description: "Balance history retrieved successfully",
					content: {
						"application/json": {
							schema: paginatedResponse(balanceHistorySchema),
						},
					},
				},
				"400": { $ref: "#/components/responses/BadRequest" },
				"401": { $ref: "#/components/responses/Unauthorized" },
				"404": { $ref: "#/components/responses/NotFound" },
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
	},
};

export const accountHistorySchemas: Record<string, OpenAPIV3.SchemaObject> = {
	AccountBalanceHistory: balanceHistorySchema,
};

export const accountHistoryTags: OpenAPIV3.TagObject[] = [];