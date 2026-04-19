// app/api/budgets/[id]/open-api.ts

import { OpenAPIV3 } from "openapi-types";
import { successResponse, emptySuccessResponse } from "@/lib/swagger/schemas";

const idParameter: OpenAPIV3.ParameterObject = {
	name: "id",
	in: "path",
	description: "Budget ID (CUID format)",
	required: true,
	schema: { type: "string", format: "cuid" },
};

const updateBudgetSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		amount: { type: "number", minimum: 0.01, example: 6000.0 },
		period: {
			type: "string",
			enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
		},
		startDate: { type: "string", format: "date-time" },
		endDate: { type: "string", format: "date-time", nullable: true },
		alertThreshold: {
			type: "number",
			minimum: 0,
			maximum: 100,
			example: 90,
		},
		rollover: { type: "boolean", example: true },
		categoryId: { type: "string", format: "cuid", nullable: true },
	},
	minProperties: 1,
};

export const budgetByIdPaths: OpenAPIV3.PathsObject = {
	"/api/budgets/{id}": {
		get: {
			summary: "Get budget by ID",
			tags: ["Budgets"],
			parameters: [idParameter],
			responses: {
				"200": {
					description: "Budget retrieved successfully",
					content: {
						"application/json": {
							schema: successResponse({
								$ref: "#/components/schemas/BudgetWithProgress",
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
			summary: "Update budget",
			tags: ["Budgets"],
			parameters: [idParameter],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: updateBudgetSchema,
					},
				},
			},
			responses: {
				"200": {
					description: "Budget updated successfully",
					content: {
						"application/json": {
							schema: successResponse({
								$ref: "#/components/schemas/Budget",
							} as OpenAPIV3.SchemaObject),
						},
					},
				},
				"400": { $ref: "#/components/responses/BadRequest" },
				"401": { $ref: "#/components/responses/Unauthorized" },
				"404": { $ref: "#/components/responses/NotFound" },
				"409": { $ref: "#/components/responses/Conflict" },
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
		delete: {
			summary: "Delete budget",
			tags: ["Budgets"],
			parameters: [idParameter],
			responses: {
				"200": {
					description: "Budget deleted successfully",
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

export const budgetByIdSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	UpdateBudgetRequest: updateBudgetSchema,
};

export const budgetByIdTags: OpenAPIV3.TagObject[] = [];
