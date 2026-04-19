// app/api/accounts/open-api.ts
import { OpenAPIV3 } from "openapi-types";
import { successResponse, paginatedResponse } from "@/lib/swagger/schemas";

// Account type enum
const accountTypeEnum = [
	"CASH",
	"BANK_ACCOUNT",
	"SAVINGS_ACCOUNT",
	"CREDIT_CARD",
	"DIGITAL_WALLET",
	"OTHER",
];

// Schemas
const accountSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		id: { type: "string", format: "cuid", example: "clh1234567890abcdef" },
		name: { type: "string", example: "Main Checking Account" },
		type: {
			type: "string",
			enum: accountTypeEnum,
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
		userId: {
			type: "string",
			format: "cuid",
			example: "clh1234567890abcdef",
		},
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

const createAccountSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		name: {
			type: "string",
			minLength: 1,
			maxLength: 100,
			example: "Emergency Fund",
		},
		type: {
			type: "string",
			enum: accountTypeEnum,
			example: "SAVINGS_ACCOUNT",
		},
		balance: {
			type: "number",
			format: "float",
			minimum: 0,
			example: 5000.0,
		},
		currency: {
			type: "string",
			maxLength: 3,
			nullable: true,
			example: "USD",
		},
		color: {
			type: "string",
			pattern: "^#[0-9A-Fa-f]{6}$",
			nullable: true,
			example: "#10B981",
		},
		notes: {
			type: "string",
			maxLength: 500,
			nullable: true,
			example: "Savings for unexpected expenses",
		},
	},
	required: ["name", "type", "balance"],
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
			enum: accountTypeEnum,
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
			example: "Updated notes for this account",
		},
	},
	minProperties: 1,
};

// Query parameters
const getAccountsParameters: OpenAPIV3.ParameterObject[] = [
	{
		name: "page",
		in: "query",
		description: "Page number (starts from 1)",
		required: false,
		schema: { type: "integer", minimum: 1, default: 1 },
	},
	{
		name: "limit",
		in: "query",
		description: "Items per page (max 100)",
		required: false,
		schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
	},
	{
		name: "search",
		in: "query",
		description: "Search term for account name",
		required: false,
		schema: { type: "string", example: "checking" },
	},
	{
		name: "type",
		in: "query",
		description: "Filter by account type",
		required: false,
		schema: {
			type: "string",
			enum: accountTypeEnum,
		},
	},
	{
		name: "isDefault",
		in: "query",
		description: "Filter by default status",
		required: false,
		schema: { type: "boolean" },
	},
];

// Export paths
export const accountsPaths: OpenAPIV3.PathsObject = {
	"/api/accounts": {
		get: {
			summary: "List accounts",
			description: "Get paginated list of user's financial accounts",
			tags: ["Accounts"],
			parameters: getAccountsParameters,
			responses: {
				"200": {
					description: "Accounts retrieved successfully",
					content: {
						"application/json": {
							schema: paginatedResponse(accountSchema),
						},
					},
				},
				"400": { $ref: "#/components/responses/BadRequest" },
				"401": { $ref: "#/components/responses/Unauthorized" },
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
		post: {
			summary: "Create account",
			description: "Create a new financial account",
			tags: ["Accounts"],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: createAccountSchema,
					},
				},
			},
			responses: {
				"201": {
					description: "Account created successfully",
					content: {
						"application/json": {
							schema: successResponse(accountSchema),
						},
					},
				},
				"400": { $ref: "#/components/responses/BadRequest" },
				"401": { $ref: "#/components/responses/Unauthorized" },
				"409": { $ref: "#/components/responses/Conflict" },
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
	},
};

// Export schemas
export const accountsSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	Account: accountSchema,
	CreateAccountRequest: createAccountSchema,
	UpdateAccountRequest: updateAccountSchema,
};

// Export tags
export const accountsTags: OpenAPIV3.TagObject[] = [
	{
		name: "Accounts",
		description: "Financial account management endpoints",
	},
];
