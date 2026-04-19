// app/api/tags/open-api.ts
import { OpenAPIV3 } from "openapi-types";
import { paginatedResponse, successResponse, emptySuccessResponse } from "@/lib/swagger/schemas";

// Tag schema
const tagSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		id: {
			type: "string",
			format: "cuid",
			description: "Tag ID",
			example: "clh1234567890abcdef"
		},
		name: {
			type: "string",
			description: "Tag name",
			example: "Groceries"
		},
		color: {
			type: "string",
			nullable: true,
			pattern: "^#[0-9A-Fa-f]{6}$",
			description: "Hex color code for the tag",
			example: "#FF5733"
		},
		userId: {
			type: "string",
			format: "cuid",
			description: "User ID who owns this tag"
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
	required: ["id", "name", "userId", "createdAt", "updatedAt"]
};

// Tag with transaction count schema
const tagWithCountSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		id: { type: "string", format: "cuid" },
		name: { type: "string", example: "Groceries" },
		color: { type: "string", nullable: true, pattern: "^#[0-9A-Fa-f]{6}$" },
		userId: { type: "string", format: "cuid" },
		createdAt: { type: "string", format: "date-time" },
		updatedAt: { type: "string", format: "date-time" },
		transactionCount: {
			type: "integer",
			description: "Number of transactions using this tag",
			example: 15
		}
	},
	required: ["id", "name", "userId", "createdAt", "updatedAt", "transactionCount"]
};

// Popular tag schema
const popularTagSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		id: { type: "string", format: "cuid" },
		name: { type: "string", example: "Groceries" },
		color: { type: "string", nullable: true, pattern: "^#[0-9A-Fa-f]{6}$" },
		transactionCount: {
			type: "integer",
			description: "Number of transactions using this tag",
			example: 25
		}
	},
	required: ["id", "name", "transactionCount"]
};

// Create tag request schema
const createTagSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		name: {
			type: "string",
			minLength: 1,
			maxLength: 50,
			description: "Tag name",
			example: "Groceries"
		},
		color: {
			type: "string",
			pattern: "^#[0-9A-Fa-f]{6}$",
			nullable: true,
			description: "Hex color code (e.g., #FF5733)",
			example: "#FF5733"
		}
	},
	required: ["name"]
};

// Update tag request schema
const updateTagSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		name: {
			type: "string",
			minLength: 1,
			maxLength: 50,
			description: "Tag name",
			example: "Food & Drinks"
		},
		color: {
			type: "string",
			pattern: "^#[0-9A-Fa-f]{6}$",
			nullable: true,
			description: "Hex color code",
			example: "#33FF57"
		}
	},
	minProperties: 1,
	description: "At least one field must be provided for update"
};

// Query parameters for GET /tags
const getTagsParameters: OpenAPIV3.ParameterObject[] = [
	{
		name: "page",
		in: "query",
		description: "Page number (starts from 1)",
		required: false,
		schema: {
			type: "integer",
			minimum: 1,
			default: 1
		}
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
		}
	},
	{
		name: "search",
		in: "query",
		description: "Search term for tag name",
		required: false,
		schema: {
			type: "string"
		}
	},
	{
		name: "sortBy",
		in: "query",
		description: "Field to sort by",
		required: false,
		schema: {
			type: "string",
			enum: ["name", "transactionCount", "createdAt"],
			default: "name"
		}
	},
	{
		name: "sortOrder",
		in: "query",
		description: "Sort direction",
		required: false,
		schema: {
			type: "string",
			enum: ["asc", "desc"],
			default: "asc"
		}
	}
];

export const tagsPaths: OpenAPIV3.PathsObject = {
	"/api/tags": {
		get: {
			summary: "List tags",
			description: "Get paginated list of user's tags with transaction counts",
			tags: ["Tags"],
			parameters: getTagsParameters,
			responses: {
				"200": {
					description: "Tags retrieved successfully",
					content: {
						"application/json": {
							schema: paginatedResponse(tagWithCountSchema)
						}
					}
				},
				"401": { $ref: "#/components/responses/Unauthorized" },
				"500": { $ref: "#/components/responses/InternalServerError" }
			},
			security: [{ accessToken: [], refreshToken: [] }]
		},
		post: {
			summary: "Create tag",
			description: "Create a new tag for the authenticated user",
			tags: ["Tags"],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: createTagSchema,
						example: {
							name: "Groceries",
							color: "#FF5733"
						}
					}
				}
			},
			responses: {
				"201": {
					description: "Tag created successfully",
					content: {
						"application/json": {
							schema: successResponse(tagSchema)
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

export const tagsSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	Tag: tagSchema,
	TagWithCount: tagWithCountSchema,
	PopularTag: popularTagSchema,
	CreateTagRequest: createTagSchema,
	UpdateTagRequest: updateTagSchema
};

export const tagsTags: OpenAPIV3.TagObject[] = [
	{
		name: "Tags",
		description: "Tag management endpoints for categorizing transactions"
	}
];