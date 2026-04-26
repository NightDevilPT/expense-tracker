// app/api/transactions/summary/open-api.ts

import { OpenAPIV3 } from "openapi-types";
import { successResponse } from "@/lib/swagger/schemas";

const transactionSummarySchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		totalIncome: {
			type: "number",
			description: "Total income amount",
			example: 75000.0,
		},
		totalExpense: {
			type: "number",
			description: "Total expense amount",
			example: 45000.5,
		},
		totalTransfer: {
			type: "number",
			description: "Total transfer amount",
			example: 15000.0,
		},
		netBalance: {
			type: "number",
			description: "Net balance (income - expense)",
			example: 30000.5,
		},
		categoryBreakdown: {
			type: "array",
			description: "Expense breakdown by category",
			items: {
				type: "object",
				properties: {
					categoryId: { type: "string", format: "cuid" },
					categoryName: { type: "string", example: "Groceries" },
					amount: { type: "number", example: 12500.75 },
					percentage: { type: "number", example: 27.8 },
					transactionCount: { type: "number", example: 8 },
				},
			},
		},
		dailyTotals: {
			type: "array",
			description: "Daily income and expense totals",
			items: {
				type: "object",
				properties: {
					date: {
						type: "string",
						format: "date",
						example: "2024-01-15",
					},
					income: { type: "number", example: 50000 },
					expense: { type: "number", example: 2500 },
					net: { type: "number", example: 47500 },
				},
			},
		},
		accountBalances: {
			type: "array",
			description: "Current balance of all accounts",
			items: {
				type: "object",
				properties: {
					accountId: { type: "string", format: "cuid" },
					accountName: { type: "string", example: "HDFC Savings" },
					balance: { type: "number", example: 15000.75 },
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
					currency: {
						type: "string",
						nullable: true,
						example: "INR",
					},
				},
			},
		},
	},
};

const summaryParameters: OpenAPIV3.ParameterObject[] = [
	{
		name: "startDate",
		in: "query",
		description: "Start date for summary period",
		required: false,
		schema: { type: "string", format: "date-time" },
		example: "2024-01-01T00:00:00Z",
	},
	{
		name: "endDate",
		in: "query",
		description: "End date for summary period",
		required: false,
		schema: { type: "string", format: "date-time" },
		example: "2024-12-31T23:59:59Z",
	},
	{
		name: "categoryIds",
		in: "query",
		description: "Filter by category IDs (comma-separated)",
		required: false,
		schema: { type: "string" },
		example: "clh1234567890abcdef,clh0987654321fedcba",
	},
	{
		name: "accountIds",
		in: "query",
		description: "Filter by account IDs (comma-separated)",
		required: false,
		schema: { type: "string" },
		example: "clh1234567890abcdef",
	},
];

export const transactionSummaryPaths: OpenAPIV3.PathsObject = {
	"/api/transactions/summary": {
		get: {
			summary: "Get transaction summary",
			description:
				"Get comprehensive transaction summary including totals, category breakdown, daily trends, and account balances",
			tags: ["Transactions"],
			parameters: summaryParameters,
			responses: {
				"200": {
					description: "Transaction summary retrieved successfully",
					content: {
						"application/json": {
							schema: successResponse(transactionSummarySchema),
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

export const transactionSummarySchemas: Record<string, OpenAPIV3.SchemaObject> =
	{
		TransactionSummary: transactionSummarySchema,
	};

export const transactionSummaryTags: OpenAPIV3.TagObject[] = [];
