// app/api/recurring/open-api.ts

import { OpenAPIV3 } from "openapi-types";
import { successResponse, paginatedResponse } from "@/lib/swagger/schemas";

const recurringTransactionSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		id: { type: "string", format: "cuid", example: "clh1234567890abcdef" },
		name: { type: "string", example: "Netflix Subscription" },
		amount: { type: "number", example: 499.0 },
		type: {
			type: "string",
			enum: ["INCOME", "EXPENSE", "TRANSFER"],
			example: "EXPENSE",
		},
		frequency: {
			type: "string",
			enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"],
			example: "MONTHLY",
		},
		interval: { type: "integer", minimum: 1, example: 1 },
		startDate: {
			type: "string",
			format: "date-time",
			example: "2024-01-01T00:00:00Z",
		},
		endDate: {
			type: "string",
			format: "date-time",
			nullable: true,
			example: "2024-12-31T23:59:59Z",
		},
		nextDueDate: {
			type: "string",
			format: "date-time",
			example: "2024-02-01T00:00:00Z",
		},
		isActive: { type: "boolean", example: true },
		description: {
			type: "string",
			nullable: true,
			example: "Premium 4K plan",
		},
		userId: { type: "string", example: "user-123" },
		categoryId: {
			type: "string",
			format: "cuid",
			nullable: true,
			example: "category-entertainment-456",
		},
		category: {
			type: "object",
			nullable: true,
			properties: {
				id: { type: "string", format: "cuid" },
				name: { type: "string", example: "Entertainment" },
				type: {
					type: "string",
					enum: ["INCOME", "EXPENSE", "TRANSFER"],
				},
				icon: { type: "string", nullable: true },
				color: { type: "string", nullable: true },
			},
		},
		accountId: {
			type: "string",
			format: "cuid",
			nullable: true,
			example: "account-credit-789",
		},
		account: {
			type: "object",
			nullable: true,
			properties: {
				id: { type: "string", format: "cuid" },
				name: { type: "string", example: "HDFC Credit Card" },
				type: { type: "string" },
				balance: { type: "number" },
				currency: { type: "string", nullable: true },
			},
		},
		createdAt: { type: "string", format: "date-time" },
		updatedAt: { type: "string", format: "date-time" },
	},
};

const recurringWithMetricsSchema: OpenAPIV3.SchemaObject = {
	allOf: [
		{
			$ref: "#/components/schemas/RecurringTransaction",
		} as OpenAPIV3.SchemaObject,
		{
			type: "object",
			properties: {
				daysUntilDue: { type: "integer", example: 5 },
				isOverdue: { type: "boolean", example: false },
				isDueSoon: { type: "boolean", example: true },
				yearlyTotal: { type: "number", example: 5988.0 },
				monthlyAverage: { type: "number", example: 499.0 },
			},
		},
	],
};

const createRecurringSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		name: {
			type: "string",
			minLength: 1,
			maxLength: 100,
			example: "Netflix Subscription",
		},
		amount: {
			type: "number",
			minimum: 0.01,
			example: 499.0,
		},
		type: {
			type: "string",
			enum: ["INCOME", "EXPENSE", "TRANSFER"],
			default: "EXPENSE",
			example: "EXPENSE",
		},
		frequency: {
			type: "string",
			enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"],
			default: "MONTHLY",
			example: "MONTHLY",
		},
		interval: {
			type: "integer",
			minimum: 1,
			default: 1,
			example: 1,
		},
		startDate: {
			type: "string",
			format: "date-time",
			example: "2024-01-01T00:00:00Z",
		},
		endDate: {
			type: "string",
			format: "date-time",
			nullable: true,
			example: "2024-12-31T23:59:59Z",
		},
		description: {
			type: "string",
			maxLength: 500,
			nullable: true,
			example: "Premium 4K plan",
		},
		categoryId: {
			type: "string",
			format: "cuid",
			nullable: true,
			example: "category-entertainment-456",
		},
		accountId: {
			type: "string",
			format: "cuid",
			nullable: true,
			example: "account-credit-789",
		},
		isActive: {
			type: "boolean",
			default: true,
		},
	},
	required: ["name", "amount"],
};

const getRecurringParameters: OpenAPIV3.ParameterObject[] = [
	{
		name: "page",
		in: "query",
		required: false,
		schema: { type: "integer", minimum: 1, default: 1 },
	},
	{
		name: "limit",
		in: "query",
		required: false,
		schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
	},
	{
		name: "type",
		in: "query",
		required: false,
		schema: { type: "string", enum: ["INCOME", "EXPENSE", "TRANSFER"] },
	},
	{
		name: "frequency",
		in: "query",
		required: false,
		schema: {
			type: "string",
			enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"],
		},
	},
	{
		name: "isActive",
		in: "query",
		required: false,
		schema: { type: "boolean" },
	},
	{
		name: "categoryId",
		in: "query",
		required: false,
		schema: { type: "string", format: "cuid" },
	},
	{
		name: "accountId",
		in: "query",
		required: false,
		schema: { type: "string", format: "cuid" },
	},
	{
		name: "search",
		in: "query",
		required: false,
		schema: { type: "string", maxLength: 100 },
	},
	{
		name: "sortBy",
		in: "query",
		required: false,
		schema: {
			type: "string",
			enum: ["name", "amount", "nextDueDate", "frequency", "createdAt"],
			default: "nextDueDate",
		},
	},
	{
		name: "sortOrder",
		in: "query",
		required: false,
		schema: { type: "string", enum: ["asc", "desc"], default: "asc" },
	},
];

export const recurringPaths: OpenAPIV3.PathsObject = {
	"/api/recurring": {
		get: {
			summary: "List all recurring transactions",
			description:
				"Get paginated list of recurring transactions with filtering options",
			tags: ["Recurring Transactions"],
			parameters: getRecurringParameters,
			responses: {
				"200": {
					description:
						"Recurring transactions retrieved successfully",
					content: {
						"application/json": {
							schema: paginatedResponse(
								recurringWithMetricsSchema,
							),
						},
					},
				},
				"401": { $ref: "#/components/responses/Unauthorized" },
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
		post: {
			summary: "Create recurring transaction",
			description: "Create a new recurring transaction",
			tags: ["Recurring Transactions"],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: createRecurringSchema,
						examples: {
							subscription: {
								summary: "Monthly Subscription",
								value: {
									name: "Netflix Subscription",
									amount: 499,
									type: "EXPENSE",
									frequency: "MONTHLY",
									interval: 1,
									categoryId: "category-entertainment-456",
									accountId: "account-credit-789",
									description: "Premium 4K plan",
								},
							},
							salary: {
								summary: "Monthly Salary",
								value: {
									name: "Monthly Salary",
									amount: 75000,
									type: "INCOME",
									frequency: "MONTHLY",
									interval: 1,
									categoryId: "category-salary-123",
									accountId: "account-salary-456",
									description: "Software Engineer Salary",
								},
							},
							rent: {
								summary: "Monthly Rent",
								value: {
									name: "Apartment Rent",
									amount: 25000,
									type: "EXPENSE",
									frequency: "MONTHLY",
									interval: 1,
									startDate: "2024-01-05T00:00:00Z",
									categoryId: "category-rent-789",
									accountId: "account-rent-012",
								},
							},
						},
					},
				},
			},
			responses: {
				"201": {
					description: "Recurring transaction created successfully",
					content: {
						"application/json": {
							schema: successResponse(recurringTransactionSchema),
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

export const recurringSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	RecurringTransaction: recurringTransactionSchema,
	RecurringWithMetrics: recurringWithMetricsSchema,
	CreateRecurringRequest: createRecurringSchema,
};

export const recurringTags: OpenAPIV3.TagObject[] = [
	{
		name: "Recurring Transactions",
		description:
			"Manage recurring transactions - subscriptions, bills, and regular income/expenses",
	},
];
