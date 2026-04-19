// app/api/budgets/open-api.ts

import { OpenAPIV3 } from "openapi-types";
import { successResponse, paginatedResponse } from "@/lib/swagger/schemas";

// Schema Definitions
const budgetSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		id: { type: "string", format: "cuid", example: "clh1234567890abcdef" },
		amount: { type: "number", example: 5000.0 },
		period: {
			type: "string",
			enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
			example: "MONTHLY",
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
		alertThreshold: {
			type: "number",
			minimum: 0,
			maximum: 100,
			example: 80,
			description: "Percentage threshold for alerts",
		},
		rollover: {
			type: "boolean",
			example: false,
			description: "Whether unused budget rolls over to next period",
		},
		spent: { type: "number", example: 3250.5 },
		remaining: { type: "number", example: 1749.5 },
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
				icon: { type: "string", nullable: true },
				color: { type: "string", nullable: true, example: "#4CAF50" },
			},
		},
		createdAt: { type: "string", format: "date-time" },
		updatedAt: { type: "string", format: "date-time" },
	},
};

const budgetWithProgressSchema: OpenAPIV3.SchemaObject = {
	allOf: [
		{ $ref: "#/components/schemas/Budget" } as OpenAPIV3.SchemaObject,
		{
			type: "object",
			properties: {
				percentage: { type: "number", example: 65.01 },
				isOverBudget: { type: "boolean", example: false },
				isNearThreshold: { type: "boolean", example: false },
			},
		},
	],
};

const createBudgetSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		amount: {
			type: "number",
			minimum: 0.01,
			description: "Budget amount",
			example: 5000.0,
		},
		period: {
			type: "string",
			enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
			default: "MONTHLY",
			example: "MONTHLY",
		},
		startDate: {
			type: "string",
			format: "date-time",
			description: "Start date (defaults to now)",
			example: "2024-01-01T00:00:00Z",
		},
		endDate: {
			type: "string",
			format: "date-time",
			nullable: true,
			description: "End date for custom periods",
			example: "2024-12-31T23:59:59Z",
		},
		alertThreshold: {
			type: "number",
			minimum: 0,
			maximum: 100,
			default: 80,
			description: "Alert when spending reaches this percentage",
			example: 80,
		},
		rollover: {
			type: "boolean",
			default: false,
			description: "Rollover unused budget to next period",
			example: false,
		},
		categoryId: {
			type: "string",
			format: "cuid",
			nullable: true,
			description: "Category ID (null for all categories)",
			example: "category-456",
		},
	},
	required: ["amount"],
};

const budgetAlertSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		budgetId: { type: "string", format: "cuid" },
		categoryName: { type: "string", nullable: true, example: "Groceries" },
		amount: { type: "number", example: 5000 },
		spent: { type: "number", example: 4250 },
		percentage: { type: "number", example: 85 },
		threshold: { type: "number", example: 80 },
		severity: {
			type: "string",
			enum: ["WARNING", "CRITICAL"],
			example: "WARNING",
		},
	},
};

// Query Parameters
const getBudgetsParameters: OpenAPIV3.ParameterObject[] = [
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
		name: "period",
		in: "query",
		required: false,
		schema: {
			type: "string",
			enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
		},
	},
	{
		name: "categoryId",
		in: "query",
		required: false,
		schema: { type: "string", format: "cuid" },
	},
	{
		name: "startDate",
		in: "query",
		required: false,
		schema: { type: "string", format: "date-time" },
	},
	{
		name: "endDate",
		in: "query",
		required: false,
		schema: { type: "string", format: "date-time" },
	},
	{
		name: "sortBy",
		in: "query",
		required: false,
		schema: {
			type: "string",
			enum: ["startDate", "amount", "spent", "remaining"],
			default: "startDate",
		},
	},
	{
		name: "sortOrder",
		in: "query",
		required: false,
		schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
	},
];

// Export paths
export const budgetPaths: OpenAPIV3.PathsObject = {
	"/api/budgets": {
		get: {
			summary: "List all budgets",
			tags: ["Budgets"],
			parameters: getBudgetsParameters,
			responses: {
				"200": {
					description: "Budgets retrieved successfully",
					content: {
						"application/json": {
							schema: paginatedResponse(budgetWithProgressSchema),
						},
					},
				},
				"401": { $ref: "#/components/responses/Unauthorized" },
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
		post: {
			summary: "Create new budget",
			tags: ["Budgets"],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: createBudgetSchema,
					},
				},
			},
			responses: {
				"201": {
					description: "Budget created successfully",
					content: {
						"application/json": {
							schema: successResponse(budgetSchema),
						},
					},
				},
				"400": { $ref: "#/components/responses/BadRequest" },
				"401": { $ref: "#/components/responses/Unauthorized" },
				"409": { $ref: "#/components/responses/Conflict" },
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
	},
};

export const budgetSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	Budget: budgetSchema,
	BudgetWithProgress: budgetWithProgressSchema,
	CreateBudgetRequest: createBudgetSchema,
	BudgetAlert: budgetAlertSchema,
};

export const budgetTags: OpenAPIV3.TagObject[] = [
	{
		name: "Budgets",
		description:
			"Budget management - set spending limits and track progress",
	},
];
