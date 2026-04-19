// app/api/categories/[id]/open-api.ts
import { OpenAPIV3 } from "openapi-types";
import { successResponse, emptySuccessResponse } from "@/lib/swagger/schemas";

const categoryIdParameter: OpenAPIV3.ParameterObject = {
	name: "id",
	in: "path",
	description: "Category ID (CUID format)",
	required: true,
	schema: {
		type: "string",
		format: "cuid"
	},
	example: "clh1234567890abcdef"
};

export const categoryByIdPaths: OpenAPIV3.PathsObject = {
	"/api/categories/{id}": {
		get: {
			summary: "Get category by ID",
			description: "Retrieve a specific category by its ID",
			tags: ["Categories"],
			parameters: [categoryIdParameter],
			responses: {
				"200": {
					description: "Category retrieved successfully",
					content: {
						"application/json": {
							schema: successResponse({ 
								$ref: "#/components/schemas/Category" 
							} as OpenAPIV3.SchemaObject)
						}
					}
				},
				"400": { $ref: "#/components/responses/BadRequest" },
				"401": { $ref: "#/components/responses/Unauthorized" },
				"404": { $ref: "#/components/responses/NotFound" },
				"500": { $ref: "#/components/responses/InternalServerError" }
			},
			security: [{ accessToken: [], refreshToken: [] }]
		},
		put: {
			summary: "Update category",
			description: "Update an existing user-specific category",
			tags: ["Categories"],
			parameters: [categoryIdParameter],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: { 
							$ref: "#/components/schemas/UpdateCategoryRequest" 
						} as OpenAPIV3.SchemaObject,
						example: {
							name: "Food & Drinks",
							icon: "🍕",
							color: "#33FF57",
							order: 1
						}
					}
				}
			},
			responses: {
				"200": {
					description: "Category updated successfully",
					content: {
						"application/json": {
							schema: successResponse({ 
								$ref: "#/components/schemas/Category" 
							} as OpenAPIV3.SchemaObject)
						}
					}
				},
				"400": { $ref: "#/components/responses/BadRequest" },
				"401": { $ref: "#/components/responses/Unauthorized" },
				"404": { $ref: "#/components/responses/NotFound" },
				"409": { $ref: "#/components/responses/Conflict" },
				"500": { $ref: "#/components/responses/InternalServerError" }
			},
			security: [{ accessToken: [], refreshToken: [] }]
		},
		delete: {
			summary: "Delete category",
			description: "Delete a user-specific category (cannot delete default categories or categories with transactions)",
			tags: ["Categories"],
			parameters: [categoryIdParameter],
			responses: {
				"200": {
					description: "Category deleted successfully",
					content: {
						"application/json": {
							schema: emptySuccessResponse()
						}
					}
				},
				"400": { $ref: "#/components/responses/BadRequest" },
				"401": { $ref: "#/components/responses/Unauthorized" },
				"403": { $ref: "#/components/responses/Forbidden" },
				"404": { $ref: "#/components/responses/NotFound" },
				"409": { $ref: "#/components/responses/Conflict" },
				"500": { $ref: "#/components/responses/InternalServerError" }
			},
			security: [{ accessToken: [], refreshToken: [] }]
		}
	}
};

export const categoryByIdSchemas: Record<string, OpenAPIV3.SchemaObject> = {};

export const categoryByIdTags: OpenAPIV3.TagObject[] = [];