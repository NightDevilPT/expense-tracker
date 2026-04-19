// app/api/accounts/[id]/add-balance/open-api.ts
import { OpenAPIV3 } from "openapi-types";
import { successResponse } from "@/lib/swagger/schemas";

const idParameter: OpenAPIV3.ParameterObject = {
	name: "id",
	in: "path",
	description: "Account ID (CUID format)",
	required: true,
	schema: { type: "string", format: "cuid" },
	example: "clh1234567890abcdef",
};

const addBalanceSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		amount: {
			type: "number",
			format: "float",
			minimum: 0.01,
			example: 100.5,
			description: "Amount to add or subtract",
		},
		type: {
			type: "string",
			enum: ["ADD", "SUBTRACT"],
			example: "ADD",
			description: "ADD adds money to account, SUBTRACT removes money",
		},
		description: {
			type: "string",
			maxLength: 255,
			nullable: true,
			example: "Cash deposit",
			description: "Optional description for this balance change",
		},
	},
	required: ["amount", "type"],
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
		balance: { type: "number", format: "float", example: 1351.25 },
		currency: { type: "string", nullable: true, example: "USD" },
		isDefault: { type: "boolean", example: false },
		color: { type: "string", nullable: true, example: "#4F46E5" },
		notes: { type: "string", nullable: true },
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

export const accountAddBalancePaths: OpenAPIV3.PathsObject = {
	"/api/accounts/{id}/add-balance": {
		put: {
			summary: "Add or subtract balance",
			description:
				"Manually add or subtract money from an account balance (creates a history record)",
			tags: ["Accounts"],
			parameters: [idParameter],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: addBalanceSchema,
					},
				},
			},
			responses: {
				"200": {
					description: "Balance updated successfully",
					content: {
						"application/json": {
							schema: successResponse(accountSchema),
						},
					},
				},
				"400": {
					description:
						"Bad request - invalid data or insufficient balance",
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
											"Insufficient balance for this operation",
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

export const accountAddBalanceSchemas: Record<string, OpenAPIV3.SchemaObject> =
	{
		AddBalanceRequest: addBalanceSchema,
	};

export const accountAddBalanceTags: OpenAPIV3.TagObject[] = [];
