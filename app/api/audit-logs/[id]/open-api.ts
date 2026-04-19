import { OpenAPIV3 } from "openapi-types";
import { successResponse } from "@/lib/swagger/schemas";

const idParameter: OpenAPIV3.ParameterObject = {
	name: "id",
	in: "path",
	description: "Audit log ID (CUID format)",
	required: true,
	schema: { type: "string", format: "cuid" },
	example: "clh1234567890abcdef",
};

export const auditLogByIdPaths: OpenAPIV3.PathsObject = {
	"/api/audit-logs/{id}": {
		get: {
			summary: "Get audit log by ID",
			description: "Get a specific audit log entry by its ID",
			tags: ["Audit Logs"],
			parameters: [idParameter],
			responses: {
				"200": {
					description: "Audit log retrieved successfully",
					content: {
						"application/json": {
							schema: successResponse({
								type: "object",
								properties: {
									id: { type: "string" },
									action: { type: "string" },
									entityType: { type: "string" },
									entityId: {
										type: "string",
										nullable: true,
									},
									oldValue: {
										type: "object",
										nullable: true,
									},
									newValue: {
										type: "object",
										nullable: true,
									},
									description: {
										type: "string",
										nullable: true,
									},
									ipAddress: {
										type: "string",
										nullable: true,
									},
									userAgent: {
										type: "string",
										nullable: true,
									},
									userId: { type: "string" },
									createdAt: {
										type: "string",
										format: "date-time",
									},
								},
							} as OpenAPIV3.SchemaObject),
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

export const auditLogByIdSchemas: Record<string, OpenAPIV3.SchemaObject> = {};
export const auditLogByIdTags: OpenAPIV3.TagObject[] = [];
