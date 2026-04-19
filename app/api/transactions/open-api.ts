// app/api/transactions/open-api.ts

import { OpenAPIV3 } from "openapi-types";
import { successResponse, paginatedResponse } from "@/lib/swagger/schemas";

// Schema Definitions
const transactionSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		id: { type: "string", format: "cuid", example: "clh1234567890abcdef" },
		amount: { type: "number", example: 2500.5 },
		type: {
			type: "string",
			enum: ["INCOME", "EXPENSE", "TRANSFER"],
			example: "EXPENSE",
		},
		description: {
			type: "string",
			nullable: true,
			example: "Weekly grocery shopping at DMart",
		},
		date: {
			type: "string",
			format: "date-time",
			example: "2024-01-15T10:30:00Z",
		},
		notes: {
			type: "string",
			nullable: true,
			example: "Used credit card, got 5% cashback",
		},
		userId: { type: "string", example: "user-123" },
		categoryId: {
			type: "string",
			format: "cuid",
			nullable: true,
			example: "category-456",
		},
		category: {
			type: "object",
			nullable: true,
			properties: {
				id: { type: "string", format: "cuid" },
				name: { type: "string", example: "Groceries" },
				type: {
					type: "string",
					enum: ["INCOME", "EXPENSE", "TRANSFER"],
				},
				icon: { type: "string", nullable: true, example: "🛒" },
				color: { type: "string", nullable: true, example: "#4CAF50" },
				isDefault: { type: "boolean" },
				order: { type: "number" },
			},
		},
		accountId: {
			type: "string",
			format: "cuid",
			nullable: true,
			example: "account-789",
		},
		account: {
			type: "object",
			nullable: true,
			properties: {
				id: { type: "string", format: "cuid" },
				name: { type: "string", example: "HDFC Savings" },
				type: {
					type: "string",
					enum: [
						"CASH",
						"BANK_ACCOUNT",
						"SAVINGS_ACCOUNT",
						"CREDIT_CARD",
						"DIGITAL_WALLET",
						"OTHER",
					],
				},
				balance: { type: "number", example: 15000.75 },
				currency: { type: "string", nullable: true, example: "INR" },
				isDefault: { type: "boolean" },
				color: { type: "string", nullable: true, example: "#2196F3" },
			},
		},
		recurringTxnId: {
			type: "string",
			format: "cuid",
			nullable: true,
		},
		attachments: {
			type: "array",
			items: {
				type: "object",
				properties: {
					id: { type: "string", format: "cuid" },
					filename: { type: "string", example: "receipt.pdf" },
					originalName: { type: "string", example: "dmart-bill.pdf" },
					mimeType: { type: "string", example: "application/pdf" },
					size: { type: "number", example: 245760 },
					url: {
						type: "string",
						example: "https://storage.example.com/receipt.pdf",
					},
					thumbnailUrl: { type: "string", nullable: true },
					uploadedAt: { type: "string", format: "date-time" },
				},
			},
		},
		tags: {
			type: "array",
			items: {
				type: "object",
				properties: {
					transactionId: { type: "string", format: "cuid" },
					tagId: { type: "string", format: "cuid" },
					tag: {
						type: "object",
						properties: {
							id: { type: "string", format: "cuid" },
							name: {
								type: "string",
								example: "Monthly Essentials",
							},
							color: {
								type: "string",
								nullable: true,
								example: "#FF9800",
							},
						},
					},
				},
			},
		},
		createdAt: { type: "string", format: "date-time" },
		updatedAt: { type: "string", format: "date-time" },
	},
};

const createTransactionSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		amount: {
			type: "number",
			minimum: 0.01,
			description: "Transaction amount (must be positive)",
			example: 2500.5,
		},
		type: {
			type: "string",
			enum: ["INCOME", "EXPENSE", "TRANSFER"],
			description: "Type of transaction",
			example: "EXPENSE",
		},
		description: {
			type: "string",
			maxLength: 255,
			description: "Short description of the transaction",
			example: "Weekly grocery shopping at DMart",
		},
		date: {
			type: "string",
			format: "date-time",
			description: "Transaction date (defaults to current time)",
			example: "2024-01-15T10:30:00Z",
		},
		notes: {
			type: "string",
			description: "Additional notes",
			example: "Used credit card, got 5% cashback",
		},
		categoryId: {
			type: "string",
			format: "cuid",
			description: "ID of the category",
			example: "category-456",
		},
		accountId: {
			type: "string",
			format: "cuid",
			description: "ID of the account (source account for transfers)",
			example: "account-789",
		},
		tagIds: {
			type: "array",
			maxItems: 10,
			description: "Array of tag IDs to associate with transaction",
			items: { type: "string", format: "cuid" },
			example: ["tag-001", "tag-002"],
		},
		toAccountId: {
			type: "string",
			format: "cuid",
			description: "Destination account ID (required for TRANSFER type)",
			example: "account-999",
		},
		transferFee: {
			type: "number",
			minimum: 0,
			description: "Transfer fee (if any)",
			example: 10.0,
		},
	},
	required: ["amount", "type"],
};

// Query Parameters
const getTransactionsParameters: OpenAPIV3.ParameterObject[] = [
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
		name: "startDate",
		in: "query",
		description: "Filter transactions from this date",
		required: false,
		schema: { type: "string", format: "date-time" },
		example: "2024-01-01T00:00:00Z",
	},
	{
		name: "endDate",
		in: "query",
		description: "Filter transactions until this date",
		required: false,
		schema: { type: "string", format: "date-time" },
		example: "2024-01-31T23:59:59Z",
	},
	{
		name: "type",
		in: "query",
		description: "Filter by transaction type",
		required: false,
		schema: {
			type: "string",
			enum: ["INCOME", "EXPENSE", "TRANSFER"],
		},
	},
	{
		name: "categoryId",
		in: "query",
		description: "Filter by category ID",
		required: false,
		schema: { type: "string", format: "cuid" },
	},
	{
		name: "accountId",
		in: "query",
		description: "Filter by account ID",
		required: false,
		schema: { type: "string", format: "cuid" },
	},
	{
		name: "search",
		in: "query",
		description: "Search in description and notes",
		required: false,
		schema: { type: "string", maxLength: 100 },
	},
	{
		name: "minAmount",
		in: "query",
		description: "Minimum transaction amount",
		required: false,
		schema: { type: "number", minimum: 0 },
	},
	{
		name: "maxAmount",
		in: "query",
		description: "Maximum transaction amount",
		required: false,
		schema: { type: "number", minimum: 0 },
	},
	{
		name: "tagIds",
		in: "query",
		description: "Filter by tag IDs (comma-separated)",
		required: false,
		schema: { type: "string" },
		example: "tag-001,tag-002",
	},
	{
		name: "sortBy",
		in: "query",
		description: "Field to sort by",
		required: false,
		schema: {
			type: "string",
			enum: ["date", "amount", "description"],
			default: "date",
		},
	},
	{
		name: "sortOrder",
		in: "query",
		description: "Sort order",
		required: false,
		schema: {
			type: "string",
			enum: ["asc", "desc"],
			default: "desc",
		},
	},
];

// Export paths
export const transactionPaths: OpenAPIV3.PathsObject = {
	"/api/transactions": {
		get: {
			summary: "List all transactions",
			description:
				"Get paginated list of transactions with advanced filtering options",
			tags: ["Transactions"],
			parameters: getTransactionsParameters,
			responses: {
				"200": {
					description: "Transactions retrieved successfully",
					content: {
						"application/json": {
							schema: paginatedResponse(transactionSchema),
						},
					},
				},
				"400": { $ref: "#/components/responses/BadRequest" },
				"401": { $ref: "#/components/responses/Unauthorized" },
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
		post: {
			summary: "Create new transaction",
			description:
				"Create a new transaction. For transfers, provide toAccountId.",
			tags: ["Transactions"],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: createTransactionSchema,
						examples: {
							expense: {
								summary: "Expense Transaction",
								value: {
									amount: 2500.5,
									type: "EXPENSE",
									description: "Weekly grocery shopping",
									accountId: "account-789",
									categoryId: "category-456",
									tagIds: ["tag-001"],
								},
							},
							income: {
								summary: "Income Transaction",
								value: {
									amount: 50000,
									type: "INCOME",
									description: "Monthly Salary",
									accountId: "account-789",
									categoryId: "category-salary",
									date: "2024-01-31T00:00:00Z",
								},
							},
							transfer: {
								summary: "Transfer Between Accounts",
								value: {
									amount: 5000,
									type: "TRANSFER",
									description: "Transfer to Savings",
									accountId: "account-789",
									toAccountId: "account-999",
									transferFee: 10,
									notes: "Monthly savings transfer",
								},
							},
						},
					},
				},
			},
			responses: {
				"201": {
					description: "Transaction created successfully",
					content: {
						"application/json": {
							schema: successResponse(transactionSchema),
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

// Export schemas
export const transactionSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	Transaction: transactionSchema,
	CreateTransactionRequest: createTransactionSchema,
};

// Export tags
export const transactionTags: OpenAPIV3.TagObject[] = [
	{
		name: "Transactions",
		description:
			"Transaction management endpoints - create, read, update, delete, and analyze transactions",
	},
];
