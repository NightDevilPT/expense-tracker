// app/api/tags/popular/open-api.ts
import { OpenAPIV3 } from "openapi-types";
import { successResponse } from "@/lib/swagger/schemas";

// Query parameters for GET /tags/popular
const getPopularTagsParameters: OpenAPIV3.ParameterObject[] = [
	{
		name: "limit",
		in: "query",
		description: "Number of popular tags to return (max 50)",
		required: false,
		schema: {
			type: "integer",
			minimum: 1,
			maximum: 50,
			default: 10
		}
	}
];

export const popularTagsPaths: OpenAPIV3.PathsObject = {
	"/api/tags/popular": {
		get: {
			summary: "Get popular tags",
			description: "Retrieve the most frequently used tags by the authenticated user",
			tags: ["Tags"],
			parameters: getPopularTagsParameters,
			responses: {
				"200": {
					description: "Popular tags retrieved successfully",
					content: {
						"application/json": {
							schema: successResponse({
								type: "array",
								items: { $ref: "#/components/schemas/PopularTag" }
							})
						}
					}
				},
				"400": { $ref: "#/components/responses/BadRequest" },
				"401": { $ref: "#/components/responses/Unauthorized" },
				"500": { $ref: "#/components/responses/InternalServerError" }
			},
			security: [{ accessToken: [], refreshToken: [] }]
		}
	}
};

export const popularTagsSchemas: Record<string, OpenAPIV3.SchemaObject> = {};

export const popularTagsTags: OpenAPIV3.TagObject[] = [];