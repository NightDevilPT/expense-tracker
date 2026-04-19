// app/api/savings-goals/open-api.ts

import { OpenAPIV3 } from "openapi-types";
import { successResponse, paginatedResponse } from "@/lib/swagger/schemas";

const savingsGoalSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		id: { type: "string", format: "cuid", example: "clh1234567890abcdef" },
		name: { type: "string", example: "Emergency Fund" },
		targetAmount: { type: "number", example: 100000.0 },
		currentAmount: { type: "number", example: 45000.0 },
		deadline: {
			type: "string",
			format: "date-time",
			example: "2024-12-31T23:59:59Z",
		},
		status: {
			type: "string",
			enum: ["ACTIVE", "COMPLETED", "FAILED", "CANCELLED"],
			example: "ACTIVE",
		},
		notes: {
			type: "string",
			nullable: true,
			example: "6 months of expenses",
		},
		progress: { type: "number", example: 45.0 },
		daysRemaining: { type: "number", example: 180 },
		userId: { type: "string", example: "user-123" },
		linkedCategoryId: { type: "string", format: "cuid", nullable: true },
		linkedCategory: {
			type: "object",
			nullable: true,
			properties: {
				id: { type: "string", format: "cuid" },
				name: { type: "string", example: "Savings" },
				type: {
					type: "string",
					enum: ["INCOME", "EXPENSE", "TRANSFER"],
				},
			},
		},
		createdAt: { type: "string", format: "date-time" },
		updatedAt: { type: "string", format: "date-time" },
	},
};

const savingsGoalWithProgressSchema: OpenAPIV3.SchemaObject = {
	allOf: [
		{ $ref: "#/components/schemas/SavingsGoal" } as OpenAPIV3.SchemaObject,
		{
			type: "object",
			properties: {
				remaining: { type: "number", example: 55000.0 },
				isCompleted: { type: "boolean", example: false },
				isFailed: { type: "boolean", example: false },
				isOverdue: { type: "boolean", example: false },
				suggestedMonthlyContribution: {
					type: "number",
					example: 9166.67,
				},
				dailyTarget: { type: "number", example: 305.56 },
			},
		},
	],
};

const createSavingsGoalSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		name: {
			type: "string",
			minLength: 1,
			maxLength: 100,
			example: "Emergency Fund",
		},
		targetAmount: {
			type: "number",
			minimum: 0.01,
			example: 100000.0,
		},
		deadline: {
			type: "string",
			format: "date-time",
			example: "2024-12-31T23:59:59Z",
		},
		notes: {
			type: "string",
			maxLength: 500,
			nullable: true,
			example: "6 months of living expenses",
		},
		linkedCategoryId: {
			type: "string",
			format: "cuid",
			nullable: true,
			example: "category-savings-456",
		},
	},
	required: ["name", "targetAmount", "deadline"],
};

const contributeToGoalSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		amount: {
			type: "number",
			minimum: 0.01,
			example: 5000.0,
		},
		notes: {
			type: "string",
			maxLength: 200,
			example: "Monthly contribution",
		},
	},
	required: ["amount"],
};

const contributionResultSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		goal: {
			$ref: "#/components/schemas/SavingsGoal",
		} as OpenAPIV3.SchemaObject,
		contributed: { type: "number", example: 5000.0 },
		previousAmount: { type: "number", example: 40000.0 },
		newAmount: { type: "number", example: 45000.0 },
		progress: { type: "number", example: 45.0 },
		isCompleted: { type: "boolean", example: false },
		message: {
			type: "string",
			example:
				"5000 added. 55000 more to reach your goal. (45.0% complete)",
		},
	},
};

const getSavingsGoalsParameters: OpenAPIV3.ParameterObject[] = [
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
		name: "status",
		in: "query",
		required: false,
		schema: {
			type: "string",
			enum: ["ACTIVE", "COMPLETED", "FAILED", "CANCELLED"],
		},
	},
	{
		name: "sortBy",
		in: "query",
		required: false,
		schema: {
			type: "string",
			enum: [
				"deadline",
				"targetAmount",
				"currentAmount",
				"progress",
				"createdAt",
			],
			default: "deadline",
		},
	},
	{
		name: "sortOrder",
		in: "query",
		required: false,
		schema: { type: "string", enum: ["asc", "desc"], default: "asc" },
	},
];

export const savingsGoalPaths: OpenAPIV3.PathsObject = {
	"/api/savings-goals": {
		get: {
			summary: "List all savings goals",
			tags: ["Savings Goals"],
			parameters: getSavingsGoalsParameters,
			responses: {
				"200": {
					description: "Savings goals retrieved successfully",
					content: {
						"application/json": {
							schema: paginatedResponse(
								savingsGoalWithProgressSchema,
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
			summary: "Create new savings goal",
			tags: ["Savings Goals"],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: createSavingsGoalSchema,
					},
				},
			},
			responses: {
				"201": {
					description: "Savings goal created successfully",
					content: {
						"application/json": {
							schema: successResponse(savingsGoalSchema),
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

export const savingsGoalSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	SavingsGoal: savingsGoalSchema,
	SavingsGoalWithProgress: savingsGoalWithProgressSchema,
	CreateSavingsGoalRequest: createSavingsGoalSchema,
	ContributeToGoalRequest: contributeToGoalSchema,
	ContributionResult: contributionResultSchema,
};

export const savingsGoalTags: OpenAPIV3.TagObject[] = [
	{
		name: "Savings Goals",
		description:
			"Savings goals management - set targets, track progress, and make contributions",
	},
];
