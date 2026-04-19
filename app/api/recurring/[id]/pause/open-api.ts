// app/api/recurring/[id]/pause/open-api.ts

import { OpenAPIV3 } from "openapi-types";
import { successResponse } from "@/lib/swagger/schemas";

const idParameter: OpenAPIV3.ParameterObject = {
	name: "id",
	in: "path",
	description: "Recurring transaction ID (CUID format)",
	required: true,
	schema: { type: "string", format: "cuid" },
	example: "clh1234567890abcdef",
};

export const recurringPausePaths: OpenAPIV3.PathsObject = {
	"/api/recurring/{id}/pause": {
		post: {
			summary: "Pause recurring transaction",
			description: "Pause an active recurring transaction",
			tags: ["Recurring Transactions"],
			parameters: [idParameter],
			responses: {
				"200": {
					description: "Recurring transaction paused successfully",
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
				"409": { $ref: "#/components/responses/Conflict" },
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
	},
};

export const recurringPauseSchemas: Record<string, OpenAPIV3.SchemaObject> = {};
export const recurringPauseTags: OpenAPIV3.TagObject[] = [];
