// app/api/budgets/alerts/open-api.ts

import { OpenAPIV3 } from "openapi-types";
import { successResponse } from "@/lib/swagger/schemas";

export const budgetAlertsPaths: OpenAPIV3.PathsObject = {
	"/api/budgets/alerts": {
		get: {
			summary: "Get budget alerts",
			description:
				"Get all budgets that have exceeded their alert threshold",
			tags: ["Budgets"],
			responses: {
				"200": {
					description: "Budget alerts retrieved successfully",
					content: {
						"application/json": {
							schema: successResponse({
								type: "array",
								items: {
									$ref: "#/components/schemas/BudgetAlert",
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

export const budgetAlertsSchemas: Record<string, OpenAPIV3.SchemaObject> = {};
export const budgetAlertsTags: OpenAPIV3.TagObject[] = [];
