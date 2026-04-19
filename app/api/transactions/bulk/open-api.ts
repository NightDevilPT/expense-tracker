// app/api/transactions/bulk/open-api.ts

import { OpenAPIV3 } from "openapi-types";
import { successResponse } from "@/lib/swagger/schemas";

const bulkCreateRequestSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		transactions: {
			type: "array",
			minItems: 1,
			maxItems: 1000,
			description: "Array of transactions to create",
			items: {
				$ref: "#/components/schemas/CreateTransactionRequest",
			},
		},
	},
	required: ["transactions"],
};

const bulkCreateResponseSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		success: { type: "boolean", example: true },
		created: { type: "number", example: 5 },
		failed: { type: "number", example: 0 },
		errors: {
			type: "array",
			items: {
				type: "object",
				properties: {
					index: {
						type: "number",
						description: "Index of failed transaction",
					},
					error: { type: "string", description: "Error message" },
				},
			},
		},
		transactions: {
			type: "array",
			items: {
				$ref: "#/components/schemas/Transaction",
			},
		},
	},
};

const bulkDeleteRequestSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		transactionIds: {
			type: "array",
			minItems: 1,
			maxItems: 100,
			description: "Array of transaction IDs to delete",
			items: { type: "string", format: "cuid" },
		},
	},
	required: ["transactionIds"],
};

const bulkDeleteResponseSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		success: { type: "boolean", example: true },
		deleted: { type: "number", example: 3 },
		failed: { type: "number", example: 0 },
		errors: {
			type: "array",
			items: {
				type: "object",
				properties: {
					id: {
						type: "string",
						description: "Transaction ID that failed",
					},
					error: { type: "string", description: "Error message" },
				},
			},
		},
	},
};

export const transactionBulkPaths: OpenAPIV3.PathsObject = {
	"/api/transactions/bulk": {
		post: {
			summary: "Bulk create transactions",
			description:
				"Create multiple transactions in a single request. Maximum 1000 transactions per request.",
			tags: ["Transactions"],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: bulkCreateRequestSchema,
						example: {
							transactions: [
								{
									amount: 2500,
									type: "EXPENSE",
									description: "Groceries",
									accountId: "account-123",
									categoryId: "category-456",
								},
								{
									amount: 1500,
									type: "EXPENSE",
									description: "Transportation",
									accountId: "account-123",
									categoryId: "category-789",
								},
							],
						},
					},
				},
			},
			responses: {
				"201": {
					description: "Bulk create completed",
					content: {
						"application/json": {
							schema: successResponse(bulkCreateResponseSchema),
						},
					},
				},
				"400": { $ref: "#/components/responses/BadRequest" },
				"401": { $ref: "#/components/responses/Unauthorized" },
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
		delete: {
			summary: "Bulk delete transactions",
			description:
				"Delete multiple transactions in a single request. Maximum 100 transactions per request.",
			tags: ["Transactions"],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: bulkDeleteRequestSchema,
						example: {
							transactionIds: [
								"clh1234567890abcdef",
								"clh1234567890ghijkl",
								"clh1234567890mnopqr",
							],
						},
					},
				},
			},
			responses: {
				"200": {
					description: "Bulk delete completed",
					content: {
						"application/json": {
							schema: successResponse(bulkDeleteResponseSchema),
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

export const transactionBulkSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	BulkCreateRequest: bulkCreateRequestSchema,
	BulkCreateResponse: bulkCreateResponseSchema,
	BulkDeleteRequest: bulkDeleteRequestSchema,
	BulkDeleteResponse: bulkDeleteResponseSchema,
};

export const transactionBulkTags: OpenAPIV3.TagObject[] = [];
