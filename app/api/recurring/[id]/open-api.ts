// app/api/recurring/[id]/open-api.ts

import { OpenAPIV3 } from "openapi-types";
import { successResponse, emptySuccessResponse } from "@/lib/swagger/schemas";

const idParameter: OpenAPIV3.ParameterObject = {
	name: "id",
	in: "path",
	description: "Recurring transaction ID (CUID format)",
	required: true,
	schema: { type: "string", format: "cuid" },
	example: "clh1234567890abcdef",
};

const updateRecurringSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		name: {
			type: "string",
			minLength: 1,
			maxLength: 100,
			example: "Updated Netflix Plan",
		},
		amount: { type: "number", minimum: 0.01, example: 649.0 },
		type: { type: "string", enum: ["INCOME", "EXPENSE", "TRANSFER"] },
		frequency: {
			type: "string",
			enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"],
		},
		interval: { type: "integer", minimum: 1, example: 1 },
		startDate: { type: "string", format: "date-time" },
		endDate: { type: "string", format: "date-time", nullable: true },
		description: { type: "string", maxLength: 500, nullable: true },
		categoryId: { type: "string", format: "cuid", nullable: true },
		accountId: { type: "string", format: "cuid", nullable: true },
		isActive: { type: "boolean" },
	},
	minProperties: 1,
};

export const recurringByIdPaths: OpenAPIV3.PathsObject = {
	"/api/recurring/{id}": {
		get: {
			summary: "Get recurring transaction by ID",
			tags: ["Recurring Transactions"],
			parameters: [idParameter],
			responses: {
				"200": {
					description: "Recurring transaction retrieved successfully",
					content: {
						"application/json": {
							schema: successResponse({
								$ref: "#/components/schemas/RecurringWithMetrics",
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
			summary: "Update recurring transaction",
			tags: ["Recurring Transactions"],
			parameters: [idParameter],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: updateRecurringSchema,
					},
				},
			},
			responses: {
				"200": {
					description: "Recurring transaction updated successfully",
					content: {
						"application/json": {
							schema: successResponse({
								$ref: "#/components/schemas/RecurringTransaction",
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
			summary: "Delete recurring transaction",
			tags: ["Recurring Transactions"],
			parameters: [idParameter],
			responses: {
				"200": {
					description: "Recurring transaction deleted successfully",
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

export const recurringByIdSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	UpdateRecurringRequest: updateRecurringSchema,
};

export const recurringByIdTags: OpenAPIV3.TagObject[] = [];
