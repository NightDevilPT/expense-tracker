// app/api/budgets/current/open-api.ts

import { OpenAPIV3 } from "openapi-types";
import { successResponse } from "@/lib/swagger/schemas";

export const budgetCurrentPaths: OpenAPIV3.PathsObject = {
	"/api/budgets/current": {
		get: {
			summary: "Get current active budgets",
			description:
				"Get all active budgets with progress for the current period",
			tags: ["Budgets"],
			responses: {
				"200": {
					description: "Current budgets retrieved successfully",
					content: {
						"application/json": {
							schema: successResponse({
								type: "array",
								items: {
									$ref: "#/components/schemas/BudgetWithProgress",
								} as OpenAPIV3.SchemaObject,
							} as OpenAPIV3.SchemaObject),
						},
					},
				},
				"401": { $ref: "#/components/responses/Unauthorized" },
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
	},
};

export const budgetCurrentSchemas: Record<string, OpenAPIV3.SchemaObject> = {};
export const budgetCurrentTags: OpenAPIV3.TagObject[] = [];
