// app/api/accounts/[id]/open-api.ts
import { OpenAPIV3 } from "openapi-types";
import { successResponse, emptySuccessResponse } from "@/lib/swagger/schemas";

const idParameter: OpenAPIV3.ParameterObject = {
	name: "id",
	in: "path",
	description: "Account ID (CUID format)",
	required: true,
	schema: { type: "string", format: "cuid" },
	example: "clh1234567890abcdef",
};

const accountSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		id: { type: "string", format: "cuid", example: "clh1234567890abcdef" },
		name: { type: "string", example: "Main Checking Account" },
		type: {
			type: "string",
			enum: [
				"CASH",
				"BANK_ACCOUNT",
				"SAVINGS_ACCOUNT",
				"CREDIT_CARD",
				"DIGITAL_WALLET",
				"OTHER",
			],
			example: "BANK_ACCOUNT",
		},
		balance: { type: "number", format: "float", example: 1250.75 },
		currency: { type: "string", nullable: true, example: "USD" },
		isDefault: { type: "boolean", example: false },
		color: { type: "string", nullable: true, example: "#4F46E5" },
		notes: {
			type: "string",
			nullable: true,
			example: "Primary spending account",
		},
		userId: { type: "string", format: "cuid" },
		createdAt: { type: "string", format: "date-time" },
		updatedAt: { type: "string", format: "date-time" },
	},
	required: [
		"id",
		"name",
		"type",
		"balance",
		"isDefault",
		"userId",
		"createdAt",
		"updatedAt",
	],
};

const updateAccountSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		name: {
			type: "string",
			minLength: 1,
			maxLength: 100,
			example: "Main Checking Account Updated",
		},
		type: {
			type: "string",
			enum: [
				"CASH",
				"BANK_ACCOUNT",
				"SAVINGS_ACCOUNT",
				"CREDIT_CARD",
				"DIGITAL_WALLET",
				"OTHER",
			],
			example: "CASH",
		},
		currency: {
			type: "string",
			maxLength: 3,
			nullable: true,
			example: "EUR",
		},
		color: {
			type: "string",
			pattern: "^#[0-9A-Fa-f]{6}$",
			nullable: true,
			example: "#EF4444",
		},
		notes: {
			type: "string",
			maxLength: 500,
			nullable: true,
			example: "Updated notes",
		},
	},
	minProperties: 1,
};

export const accountByIdPaths: OpenAPIV3.PathsObject = {
	"/api/accounts/{id}": {
		get: {
			summary: "Get account by ID",
			description: "Retrieve a specific financial account by its ID",
			tags: ["Accounts"],
			parameters: [idParameter],
			responses: {
				"200": {
					description: "Account retrieved successfully",
					content: {
						"application/json": {
							schema: successResponse(accountSchema),
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
			summary: "Update account",
			description: "Update an existing financial account",
			tags: ["Accounts"],
			parameters: [idParameter],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: updateAccountSchema,
					},
				},
			},
			responses: {
				"200": {
					description: "Account updated successfully",
					content: {
						"application/json": {
							schema: successResponse(accountSchema),
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
		delete: {
			summary: "Delete account",
			description: "Delete an account (only if it has no transactions)",
			tags: ["Accounts"],
			parameters: [idParameter],
			responses: {
				"200": {
					description: "Account deleted successfully",
					content: {
						"application/json": {
							schema: emptySuccessResponse(),
						},
					},
				},
				"400": { $ref: "#/components/responses/BadRequest" },
				"401": { $ref: "#/components/responses/Unauthorized" },
				"404": { $ref: "#/components/responses/NotFound" },
				"409": {
					description:
						"Cannot delete account with existing transactions",
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
											"Cannot delete account with existing transactions",
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
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
	},
};

export const accountByIdSchemas: Record<string, OpenAPIV3.SchemaObject> = {};
export const accountByIdTags: OpenAPIV3.TagObject[] = [];
