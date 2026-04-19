// app/api/categories/open-api.ts
import { OpenAPIV3 } from "openapi-types";
import { paginatedResponse, successResponse } from "@/lib/swagger/schemas";

// Category schema
const categorySchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		id: {
			type: "string",
			format: "cuid",
			description: "Category ID",
			example: "clh1234567890abcdef"
		},
		name: {
			type: "string",
			description: "Category name",
			example: "Groceries"
		},
		type: {
			type: "string",
			enum: ["INCOME", "EXPENSE", "TRANSFER"],
			description: "Category type",
			example: "EXPENSE"
		},
		icon: {
			type: "string",
			nullable: true,
			description: "Emoji or icon identifier",
			example: "🛒"
		},
		color: {
			type: "string",
			nullable: true,
			pattern: "^#[0-9A-Fa-f]{6}$",
			description: "Hex color code",
			example: "#FF5733"
		},
		isDefault: {
			type: "boolean",
			description: "Whether this is a system default category",
			example: false
		},
		order: {
			type: "integer",
			description: "Display order",
			minimum: 0,
			example: 0
		},
		userId: {
			type: "string",
			format: "cuid",
			nullable: true,
			description: "User ID for user-specific categories (null for defaults)"
		},
		createdAt: {
			type: "string",
			format: "date-time",
			description: "Creation timestamp"
		},
		updatedAt: {
			type: "string",
			format: "date-time",
			description: "Last update timestamp"
		}
	},
	required: ["id", "name", "type", "isDefault", "order", "createdAt", "updatedAt"]
};

// Create category request schema
const createCategorySchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		name: {
			type: "string",
			minLength: 1,
			maxLength: 50,
			description: "Category name",
			example: "Groceries"
		},
		type: {
			type: "string",
			enum: ["INCOME", "EXPENSE", "TRANSFER"],
			description: "Category type",
			example: "EXPENSE"
		},
		icon: {
			type: "string",
			maxLength: 50,
			nullable: true,
			description: "Icon identifier (emoji or icon name)",
			example: "🛒"
		},
		color: {
			type: "string",
			pattern: "^#[0-9A-Fa-f]{6}$",
			nullable: true,
			description: "Hex color code",
			example: "#FF5733"
		},
		order: {
			type: "integer",
			minimum: 0,
			default: 0,
			description: "Display order",
			example: 0
		}
	},
	required: ["name", "type"]
};

// Update category request schema
const updateCategorySchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		name: {
			type: "string",
			minLength: 1,
			maxLength: 50,
			description: "Category name",
			example: "Food & Drinks"
		},
		icon: {
			type: "string",
			maxLength: 50,
			nullable: true,
			description: "Icon identifier",
			example: "🍕"
		},
		color: {
			type: "string",
			pattern: "^#[0-9A-Fa-f]{6}$",
			nullable: true,
			description: "Hex color code",
			example: "#33FF57"
		},
		order: {
			type: "integer",
			minimum: 0,
			description: "Display order",
			example: 1
		}
	},
	minProperties: 1,
	description: "At least one field must be provided for update"
};

// Query parameters for GET /categories
const getCategoriesParameters: OpenAPIV3.ParameterObject[] = [
	{
		name: "page",
		in: "query",
		description: "Page number (starts from 1)",
		required: false,
		schema: {
			type: "integer",
			minimum: 1,
			default: 1
		},
		example: 1
	},
	{
		name: "limit",
		in: "query",
		description: "Number of items per page (max 100)",
		required: false,
		schema: {
			type: "integer",
			minimum: 1,
			maximum: 100,
			default: 20
		},
		example: 20
	},
	{
		name: "search",
		in: "query",
		description: "Search term for category name",
		required: false,
		schema: {
			type: "string"
		},
		example: "food"
	},
	{
		name: "type",
		in: "query",
		description: "Filter by category type",
		required: false,
		schema: {
			type: "string",
			enum: ["INCOME", "EXPENSE", "TRANSFER"]
		},
		example: "EXPENSE"
	}
];

export const categoriesPaths: OpenAPIV3.PathsObject = {
	"/api/categories": {
		get: {
			summary: "List categories",
			description: "Get paginated list of categories (user-specific + default categories)",
			tags: ["Categories"],
			parameters: getCategoriesParameters,
			responses: {
				"200": {
					description: "Categories retrieved successfully",
					content: {
						"application/json": {
							schema: paginatedResponse(categorySchema)
						}
					}
				},
				"400": { $ref: "#/components/responses/BadRequest" },
				"401": { $ref: "#/components/responses/Unauthorized" },
				"500": { $ref: "#/components/responses/InternalServerError" }
			},
			security: [{ accessToken: [], refreshToken: [] }]
		},
		post: {
			summary: "Create category",
			description: "Create a new user-specific category",
			tags: ["Categories"],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: createCategorySchema,
						example: {
							name: "Groceries",
							type: "EXPENSE",
							icon: "🛒",
							color: "#FF5733",
							order: 0
						}
					}
				}
			},
			responses: {
				"201": {
					description: "Category created successfully",
					content: {
						"application/json": {
							schema: successResponse(categorySchema)
						}
					}
				},
				"400": { $ref: "#/components/responses/BadRequest" },
				"401": { $ref: "#/components/responses/Unauthorized" },
				"409": { $ref: "#/components/responses/Conflict" },
				"500": { $ref: "#/components/responses/InternalServerError" }
			},
			security: [{ accessToken: [], refreshToken: [] }]
		}
	}
};

export const categoriesSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	Category: categorySchema,
	CreateCategoryRequest: createCategorySchema,
	UpdateCategoryRequest: updateCategorySchema
};

export const categoriesTags: OpenAPIV3.TagObject[] = [
	{
		name: "Categories",
		description: "Category management endpoints for organizing transactions"
	}
];