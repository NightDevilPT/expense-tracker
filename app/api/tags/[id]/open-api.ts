// app/api/tags/[id]/open-api.ts
import { OpenAPIV3 } from "openapi-types";
import { successResponse, emptySuccessResponse } from "@/lib/swagger/schemas";

const tagIdParameter: OpenAPIV3.ParameterObject = {
	name: "id",
	in: "path",
	description: "Tag ID (CUID format)",
	required: true,
	schema: {
		type: "string",
		format: "cuid",
	},
	example: "clh1234567890abcdef",
};

export const tagByIdPaths: OpenAPIV3.PathsObject = {
	"/api/tags/{id}": {
		get: {
			summary: "Get tag by ID",
			description: "Retrieve a specific tag by its ID",
			tags: ["Tags"],
			parameters: [tagIdParameter],
			responses: {
				"200": {
					description: "Tag retrieved successfully",
					content: {
						"application/json": {
							schema: successResponse({
								$ref: "#/components/schemas/Tag",
							} as OpenAPIV3.SchemaObject),
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
			summary: "Update tag",
			description: "Update an existing tag",
			tags: ["Tags"],
			parameters: [tagIdParameter],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: {
							$ref: "#/components/schemas/UpdateTagRequest",
						} as OpenAPIV3.SchemaObject,
						example: {
							name: "Food & Drinks",
							color: "#33FF57",
						},
					},
				},
			},
			responses: {
				"200": {
					description: "Tag updated successfully",
					content: {
						"application/json": {
							schema: successResponse({
								$ref: "#/components/schemas/Tag",
							} as OpenAPIV3.SchemaObject),
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
			summary: "Delete tag",
			description:
				"Delete a tag (cannot delete tags that are used in transactions)",
			tags: ["Tags"],
			parameters: [tagIdParameter],
			responses: {
				"200": {
					description: "Tag deleted successfully",
					content: {
						"application/json": {
							schema: emptySuccessResponse(),
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
	},
};

export const tagByIdSchemas: Record<string, OpenAPIV3.SchemaObject> = {};

export const tagByIdTags: OpenAPIV3.TagObject[] = [];
