// app/api/auth/login-otp/open-api.ts
import { OpenAPIV3 } from "openapi-types";

const loginOtpBodySchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		email: {
			type: "string",
			format: "email",
			description: "Registered email address",
			example: "mike.williams@gmail.com",
		},
		otp: {
			type: "string",
			pattern: "^[0-9]{6}$",
			description: "6-digit OTP code received via email",
			example: "123456",
		},
	},
	required: ["email", "otp"],
};

const userDataSchema: OpenAPIV3.SchemaObject = {
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
	],
};

const loginResponseSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		success: { type: "boolean", enum: [true] },
		message: { type: "string" },
		data: {
			type: "object",
			properties: {
				user: userDataSchema,
			},
			required: ["user"],
		},
		meta: {
			type: "object",
			properties: {
				timestamp: { type: "string", format: "date-time" },
				executionTimeMs: { type: "number" },
			},
			required: ["timestamp", "executionTimeMs"],
		},
	},
	required: ["success", "message", "data", "meta"],
};

export const loginOtpPaths: OpenAPIV3.PathsObject = {
	"/api/auth/login": {
		post: {
			summary: "Login with OTP",
			description:
				"Verify OTP and authenticate user. Sets HTTP-only cookies for accessToken and refreshToken on success.",
			tags: ["Authentication"],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: loginOtpBodySchema,
						example: {
							email: "mike.williams@gmail.com",
							otp: "123456",
						},
					},
				},
			},
			responses: {
				"200": {
					description:
						"Login successful - Returns user data and sets authentication cookies",
					headers: {
						"Set-Cookie": {
							description: "HTTP-only cookies for authentication",
							schema: {
								type: "string",
								example:
									"accessToken=eyJhbGc...; HttpOnly; Path=/; Max-Age=600; SameSite=Lax",
							},
						},
					},
					content: {
						"application/json": {
							schema: loginResponseSchema,
						},
					},
				},
				"400": { $ref: "#/components/responses/BadRequest" },
				"401": {
					description: "Invalid or expired OTP",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/UnauthorizedError",
							},
						},
					},
				},
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [],
		},
	},
};

export const loginOtpSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	LoginOtpRequest: loginOtpBodySchema,
	UserData: userDataSchema,
};

export const loginOtpTags: OpenAPIV3.TagObject[] = [];
