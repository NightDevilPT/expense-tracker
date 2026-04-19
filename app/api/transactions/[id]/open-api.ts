// app/api/transactions/[id]/open-api.ts

import { OpenAPIV3 } from "openapi-types";
import { successResponse, emptySuccessResponse } from "@/lib/swagger/schemas";

const idParameter: OpenAPIV3.ParameterObject = {
	name: "id",
	in: "path",
	description: "Transaction ID (CUID format)",
	required: true,
	schema: { type: "string", format: "cuid" },
	example: "clh1234567890abcdef",
};

const updateTransactionSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		amount: {
			type: "number",
			minimum: 0.01,
			description: "Updated transaction amount",
			example: 3000.0,
		},
		type: {
			type: "string",
			enum: ["INCOME", "EXPENSE", "TRANSFER"],
			description: "Updated transaction type",
			example: "EXPENSE",
		},
		description: {
			type: "string",
			maxLength: 255,
			description: "Updated description",
			example: "Monthly grocery shopping - updated",
		},
		date: {
			type: "string",
			format: "date-time",
			description: "Updated transaction date",
			example: "2024-01-20T15:45:00Z",
		},
		notes: {
			type: "string",
			description: "Updated notes",
			example: "Paid with debit card instead",
		},
		categoryId: {
			type: "string",
			format: "cuid",
			description: "Updated category ID",
			example: "category-new-456",
		},
		accountId: {
			type: "string",
			format: "cuid",
			description: "Updated account ID",
			example: "account-new-789",
		},
		tagIds: {
			type: "array",
			maxItems: 10,
			description: "Updated array of tag IDs",
			items: { type: "string", format: "cuid" },
			example: ["tag-003", "tag-004"],
		},
	},
	minProperties: 1,
	description: "At least one field must be provided for update",
};

export const transactionByIdPaths: OpenAPIV3.PathsObject = {
	"/api/transactions/{id}": {
		get: {
			summary: "Get transaction by ID",
			description:
				"Retrieve a single transaction with all its details including category, account, tags, and attachments",
			tags: ["Transactions"],
			parameters: [idParameter],
			responses: {
				"200": {
					description: "Transaction retrieved successfully",
					content: {
						"application/json": {
							schema: successResponse({
								$ref: "#/components/schemas/Transaction",
							} as OpenAPIV3.SchemaObject),
						},
					},
				},
				"401": { $ref: "#/components/responses/Unauthorized" },
				"404": { $ref: "#/components/responses/NotFound" },
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
		put: {
			summary: "Update transaction",
			description:
				"Update an existing transaction. Account balances will be adjusted automatically.",
			tags: ["Transactions"],
			parameters: [idParameter],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: updateTransactionSchema,
						example: {
							amount: 3000.0,
							description: "Updated grocery shopping amount",
							tagIds: ["tag-003"],
						},
					},
				},
			},
			responses: {
				"200": {
					description: "Transaction updated successfully",
					content: {
						"application/json": {
							schema: successResponse({
								$ref: "#/components/schemas/Transaction",
							} as OpenAPIV3.SchemaObject),
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
		delete: {
			summary: "Delete transaction",
			description:
				"Permanently delete a transaction. Account balance will be reverted automatically.",
			tags: ["Transactions"],
			parameters: [idParameter],
			responses: {
				"200": {
					description: "Transaction deleted successfully",
					content: {
						"application/json": {
							schema: emptySuccessResponse(),
						},
					},
				},
				"401": { $ref: "#/components/responses/Unauthorized" },
				"404": { $ref: "#/components/responses/NotFound" },
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
	},
};

export const transactionByIdSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	UpdateTransactionRequest: updateTransactionSchema,
};

export const transactionByIdTags: OpenAPIV3.TagObject[] = [];
