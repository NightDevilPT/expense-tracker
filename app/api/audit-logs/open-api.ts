import { OpenAPIV3 } from "openapi-types";
import { successResponse, paginatedResponse } from "@/lib/swagger/schemas";

const auditLogSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		id: { type: "string", format: "cuid", example: "clh1234567890abcdef" },
		action: {
			type: "string",
			enum: [
				"CREATE",
				"UPDATE",
				"DELETE",
				"EXPORT",
				"LOGIN",
				"LOGOUT",
				"SETTINGS_CHANGE",
				"BUDGET_ALERT",
				"GOAL_MILESTONE",
			],
			example: "CREATE",
		},
		entityType: { type: "string", example: "Transaction" },
		entityId: {
			type: "string",
			nullable: true,
			example: "clh9876543210abcdef",
		},
		oldValue: { type: "object", nullable: true },
		newValue: { type: "object", nullable: true },
		description: {
			type: "string",
			nullable: true,
			example: "Transaction created: Grocery shopping",
		},
		ipAddress: { type: "string", nullable: true, example: "192.168.1.1" },
		userAgent: {
			type: "string",
			nullable: true,
			example: "Mozilla/5.0...",
		},
		userId: {
			type: "string",
			format: "cuid",
			example: "clh1111111111abcdef",
		},
		createdAt: {
			type: "string",
			format: "date-time",
			example: "2024-01-15T10:30:00Z",
		},
	},
	required: ["id", "action", "entityType", "userId", "createdAt"],
};

const getAuditLogsParameters: OpenAPIV3.ParameterObject[] = [
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
		name: "action",
		in: "query",
		description: "Filter by action type",
		required: false,
		schema: {
			type: "string",
			enum: [
				"CREATE",
				"UPDATE",
				"DELETE",
				"EXPORT",
				"LOGIN",
				"LOGOUT",
				"SETTINGS_CHANGE",
				"BUDGET_ALERT",
				"GOAL_MILESTONE",
			],
		},
	},
	{
		name: "entityType",
		in: "query",
		description: "Filter by entity type",
		required: false,
		schema: { type: "string", example: "Transaction" },
	},
	{
		name: "entityId",
		in: "query",
		description: "Filter by entity ID",
		required: false,
		schema: { type: "string", format: "cuid" },
	},
	{
		name: "startDate",
		in: "query",
		description: "Filter by start date (ISO format)",
		required: false,
		schema: { type: "string", format: "date-time" },
	},
	{
		name: "endDate",
		in: "query",
		description: "Filter by end date (ISO format)",
		required: false,
		schema: { type: "string", format: "date-time" },
	},
	{
		name: "export",
		in: "query",
		description: "Export format (json or csv)",
		required: false,
		schema: { type: "string", enum: ["json", "csv"] },
	},
];

export const auditLogsPaths: OpenAPIV3.PathsObject = {
	"/api/audit-logs": {
		get: {
			summary: "List audit logs",
			description:
				"Get paginated list of audit logs for the authenticated user. Can also export as JSON or CSV.",
			tags: ["Audit Logs"],
			parameters: getAuditLogsParameters,
			responses: {
				"200": {
					description: "Audit logs retrieved successfully",
					content: {
						"application/json": {
							schema: paginatedResponse(auditLogSchema),
						},
					},
				},
				"400": { $ref: "#/components/responses/BadRequest" },
				"401": { $ref: "#/components/responses/Unauthorized" },
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
	},
};

export const auditLogsSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	AuditLog: auditLogSchema,
};

export const auditLogsTags: OpenAPIV3.TagObject[] = [
	{
		name: "Audit Logs",
		description: "Audit log management endpoints for tracking user actions",
	},
];
