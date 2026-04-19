// app/api/auth/request-otp/open-api.ts
import { OpenAPIV3 } from "openapi-types";
import { successResponse } from "@/lib/swagger/schemas";

const requestOtpBodySchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		email: {
			type: "string",
			format: "email",
			description: "Email address to receive OTP",
			example: "mike.williams@gmail.com",
		},
	},
	required: ["email"],
};

const requestOtpDataSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		email: {
			type: "string",
			format: "email",
			description: "Email address OTP was sent to",
			example: "mike.williams@gmail.com",
		},
		otpId: {
			type: "string",
			format: "cuid",
			description: "OTP session ID for verification",
		},
		expiresAt: {
			type: "string",
			format: "date-time",
			description: "OTP expiration timestamp",
		},
		otpCode: {
			type: "string",
			description: "OTP code (only returned in development environment)",
			example: "123456",
		},
	},
	required: ["email", "otpId", "expiresAt"],
};

export const requestOtpPaths: OpenAPIV3.PathsObject = {
	"/api/auth/request-otp": {
		post: {
			summary: "Request OTP",
			description:
				"Request a one-time password to be sent to the provided email address. In development mode, the OTP code is returned in the response.",
			tags: ["Authentication"],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: requestOtpBodySchema,
						example: {
							email: "mike.williams@gmail.com",
						},
					},
				},
			},
			responses: {
				"200": {
					description: "OTP sent successfully",
					content: {
						"application/json": {
							schema: successResponse(requestOtpDataSchema),
						},
					},
				},
				"400": { $ref: "#/components/responses/BadRequest" },
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [],
		},
	},
};

export const requestOtpSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	RequestOtpRequest: requestOtpBodySchema,
	RequestOtpResponse: requestOtpDataSchema,
};

export const requestOtpTags: OpenAPIV3.TagObject[] = [
	{
		name: "Authentication",
		description:
			"Authentication endpoints for login, logout, and OTP management",
	},
];
