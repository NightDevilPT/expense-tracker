// app/api/user/[userId]/open-api.ts
import { OpenAPIV3 } from "openapi-types";
import { successResponse } from "@/lib/swagger/schemas";

const userIdParameter: OpenAPIV3.ParameterObject = {
	name: "userId",
	in: "path",
	description: "User ID (CUID format)",
	required: true,
	schema: { type: "string", format: "cuid" },
	example: "cmo4j3tlg0002xu2s8q4jsped",
};

// User profile schema (safe output - no sensitive data)
const userProfileSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		id: { type: "string", format: "cuid", example: "cmo4j3tlg0002xu2s8q4jsped" },
		email: {
			type: "string",
			format: "email",
			example: "john.doe@example.com",
		},
		name: { type: "string", example: "John Doe" },
		avatar: {
			type: "string",
			nullable: true,
			example: "https://example.com/avatar.jpg",
		},
		currency: {
			type: "string",
			example: "USD",
			description: "Preferred currency (ISO 4217)",
		},
		theme: {
			type: "string",
			enum: ["light", "dark", "system"],
			example: "light",
		},
		firstDayOfWeek: {
			type: "integer",
			minimum: 0,
			maximum: 6,
			example: 0,
			description: "0 = Sunday, 1 = Monday, etc.",
		},
		dateFormat: {
			type: "string",
			example: "MM/DD/YYYY",
			description: "Preferred date format",
		},
		numberFormat: {
			type: "string",
			example: "1,234.56",
			description: "Preferred number format",
		},
		emailNotifications: { type: "boolean", example: true },
		createdAt: { type: "string", format: "date-time" },
		updatedAt: { type: "string", format: "date-time" },
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

// Update user request schema
const updateUserSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		name: {
			type: "string",
			minLength: 1,
			maxLength: 100,
			example: "Johnathan Doe",
			description: "User's full name",
		},
		avatar: {
			type: "string",
			format: "uri",
			maxLength: 500,
			nullable: true,
			example: "https://example.com/new-avatar.jpg",
			description: "URL to user's avatar image",
		},
		currency: {
			type: "string",
			pattern: "^[A-Z]{3}$",
			minLength: 3,
			maxLength: 3,
			example: "EUR",
			description: "Preferred currency (ISO 4217 three-letter code)",
		},
		theme: {
			type: "string",
			enum: ["light", "dark", "system"],
			example: "dark",
			description: "UI theme preference",
		},
		firstDayOfWeek: {
			type: "integer",
			minimum: 0,
			maximum: 6,
			example: 1,
			description:
				"0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday",
		},
		dateFormat: {
			type: "string",
			example: "DD/MM/YYYY",
			description: "Preferred date format",
		},
		numberFormat: {
			type: "string",
			example: "1.234,56",
			description: "Preferred number format",
		},
		emailNotifications: {
			type: "boolean",
			example: false,
			description: "Whether to receive email notifications",
		},
	},
	minProperties: 1,
	additionalProperties: false,
};

// Export paths
export const userPaths: OpenAPIV3.PathsObject = {
	"/api/user/{userId}": {
		get: {
			summary: "Get user profile",
			description:
				"Retrieve a user's profile information by their ID (excluding sensitive data)",
			tags: ["User"],
			parameters: [userIdParameter],
			responses: {
				"200": {
					description: "User profile retrieved successfully",
					content: {
						"application/json": {
							schema: successResponse(userProfileSchema),
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
		put: {
			summary: "Update user profile",
			description:
				"Update a user's profile information. Only the authenticated user can update their own profile.",
			tags: ["User"],
			parameters: [userIdParameter],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: updateUserSchema,
						examples: {
							"Update Name": {
								summary: "Update user's name",
								value: { name: "Jonathan Doe" },
							},
							"Update Theme and Currency": {
								summary:
									"Update theme and currency preferences",
								value: { theme: "dark", currency: "EUR" },
							},
							"Update All Settings": {
								summary: "Update multiple settings",
								value: {
									name: "Jane Smith",
									avatar: "https://example.com/jane-avatar.jpg",
									currency: "GBP",
									theme: "system",
									firstDayOfWeek: 1,
									dateFormat: "YYYY-MM-DD",
									numberFormat: "1,234.56",
									emailNotifications: true,
								},
							},
						},
					},
				},
			},
			responses: {
				"200": {
					description: "User profile updated successfully",
					content: {
						"application/json": {
							schema: successResponse(userProfileSchema),
						},
					},
				},
				"400": {
					description:
						"Bad request - invalid data or no fields to update",
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									success: {
										type: "boolean",
										example: false,
									},
									message: {
										type: "string",
										example:
											"At least one field must be provided for update",
									},
									timestamp: {
										type: "string",
										format: "date-time",
									},
								},
							},
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

// Export schemas
export const userSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	UserProfile: userProfileSchema,
	UpdateUserRequest: updateUserSchema,
};

// Export tags
export const userTags: OpenAPIV3.TagObject[] = [
	{
		name: "User",
		description: "User profile management endpoints",
	},
];
