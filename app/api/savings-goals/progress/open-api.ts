// app/api/savings-goals/progress/open-api.ts

import { OpenAPIV3 } from "openapi-types";
import { successResponse } from "@/lib/swagger/schemas";

export const savingsGoalProgressPaths: OpenAPIV3.PathsObject = {
	"/api/savings-goals/progress": {
		get: {
			summary: "Get active goals progress",
			description: "Get progress of all active savings goals",
			tags: ["Savings Goals"],
			responses: {
				"200": {
					description: "Active goals progress retrieved successfully",
					content: {
						"application/json": {
							schema: successResponse({
								type: "array",
								items: {
									$ref: "#/components/schemas/SavingsGoalWithProgress",
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

export const savingsGoalProgressSchemas: Record<
	string,
	OpenAPIV3.SchemaObject
> = {};
export const savingsGoalProgressTags: OpenAPIV3.TagObject[] = [];
