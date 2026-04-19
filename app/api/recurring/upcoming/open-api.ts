// app/api/recurring/upcoming/open-api.ts

import { OpenAPIV3 } from "openapi-types";
import { successResponse } from "@/lib/swagger/schemas";

const upcomingRecurringSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		id: { type: "string", format: "cuid" },
		name: { type: "string", example: "Netflix Subscription" },
		amount: { type: "number", example: 499.0 },
		type: { type: "string", enum: ["INCOME", "EXPENSE", "TRANSFER"] },
		nextDueDate: { type: "string", format: "date-time" },
		daysUntilDue: { type: "integer", example: 5 },
		frequency: {
			type: "string",
			enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"],
		},
		categoryName: {
			type: "string",
			nullable: true,
			example: "Entertainment",
		},
		accountName: {
			type: "string",
			nullable: true,
			example: "HDFC Credit Card",
		},
	},
};

const upcomingParameters: OpenAPIV3.ParameterObject[] = [
	{
		name: "days",
		in: "query",
		description: "Number of days to look ahead (1-365)",
		required: false,
		schema: { type: "integer", minimum: 1, maximum: 365, default: 30 },
	},
];

export const recurringUpcomingPaths: OpenAPIV3.PathsObject = {
	"/api/recurring/upcoming": {
		get: {
			summary: "Get upcoming recurring transactions",
			description:
				"Get recurring transactions due within the specified number of days",
			tags: ["Recurring Transactions"],
			parameters: upcomingParameters,
			responses: {
				"200": {
					description:
						"Upcoming recurring transactions retrieved successfully",
					content: {
						"application/json": {
							schema: successResponse({
								type: "array",
								items: upcomingRecurringSchema,
							} as OpenAPIV3.SchemaObject),
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

export const recurringUpcomingSchemas: Record<string, OpenAPIV3.SchemaObject> =
	{
		UpcomingRecurring: upcomingRecurringSchema,
	};

export const recurringUpcomingTags: OpenAPIV3.TagObject[] = [];
