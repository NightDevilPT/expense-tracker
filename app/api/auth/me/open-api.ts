// app/api/auth/me/open-api.ts
import { OpenAPIV3 } from "openapi-types";
import { successResponse } from "@/lib/swagger/schemas";

const profileDataSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		id: {
			type: "string",
			format: "cuid",
			description: "User ID",
			example: "clh1234567890abcdef",
		},
		email: {
			type: "string",
			format: "email",
			description: "User email",
			example: "mike.williams@gmail.com",
		},
		name: {
			type: "string",
			description: "User display name",
			example: "Mike Williams",
		},
		avatar: {
			type: "string",
			nullable: true,
			description: "Avatar URL",
			example: "https://example.com/avatar.jpg",
		},
		currency: {
			type: "string",
			description: "Preferred currency",
			example: "USD",
		},
		theme: {
			type: "string",
			enum: ["light", "dark", "system"],
			description: "UI theme preference",
			example: "system",
		},
		firstDayOfWeek: {
			type: "string",
			enum: ["monday", "sunday"],
			description: "First day of week preference",
			example: "monday",
		},
		dateFormat: {
			type: "string",
			description: "Date format preference",
			example: "DD/MM/YYYY",
		},
		numberFormat: {
			type: "string",
			description: "Number format preference",
			example: "en-US",
		},
		emailNotifications: {
			type: "boolean",
			description: "Email notifications enabled",
			example: true,
		},
		createdAt: {
			type: "string",
			format: "date-time",
			description: "Account creation timestamp",
			example: "2024-01-01T00:00:00.000Z",
		},
		updatedAt: {
			type: "string",
			format: "date-time",
			description: "Last update timestamp",
			example: "2024-01-15T10:30:00.000Z",
		},
	},
	required: [
		"id",
		"email",
		"name",
		"currency",
		"theme",
		"firstDayOfWeek",
		"dateFormat",
		"numberFormat",
		"emailNotifications",
		"createdAt",
		"updatedAt",
	],
};

export const mePaths: OpenAPIV3.PathsObject = {
	"/api/auth/me": {
		get: {
			summary: "Get current user profile",
			description:
				"Retrieve the authenticated user's profile information. Requires both accessToken and refreshToken cookies.",
			tags: ["Auth"],
			responses: {
				"200": {
					description: "Profile retrieved successfully",
					content: {
						"application/json": {
							schema: successResponse(profileDataSchema),
						},
					},
				},
				"401": { $ref: "#/components/responses/Unauthorized" },
				"404": { $ref: "#/components/responses/NotFound" },
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			// ✅ Explicitly require both tokens
			security: [
				{
					accessToken: [],
					refreshToken: [],
				},
			],
		},
	},
};

export const meSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	UserProfile: profileDataSchema,
};

export const meTags: OpenAPIV3.TagObject[] = [];
