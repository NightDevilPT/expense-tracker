// lib/swagger/schemas.ts
import { OpenAPIV3 } from "openapi-types";
import { ErrorCode } from "@/lib/response-service";

// ============================================
// HELPER FUNCTIONS FOR SUCCESS RESPONSES
// ============================================

export function successResponse(
	dataSchema: OpenAPIV3.SchemaObject,
): OpenAPIV3.SchemaObject {
	return {
		type: "object",
		properties: {
			success: { type: "boolean", enum: [true] },
			message: { type: "string" },
			data: dataSchema,
			meta: {
				type: "object",
				properties: {
					timestamp: { type: "string", format: "date-time" },
					executionTimeMs: { type: "number" },
				},
				required: ["timestamp", "executionTimeMs"],
			},
		},
		required: ["success", "message", "data", "meta"],
	};
}

export function paginatedResponse(
	itemSchema: OpenAPIV3.SchemaObject,
): OpenAPIV3.SchemaObject {
	return {
		type: "object",
		properties: {
			success: { type: "boolean", enum: [true] },
			message: { type: "string" },
			data: {
				type: "array",
				items: itemSchema,
			},
			meta: {
				type: "object",
				properties: {
					timestamp: { type: "string", format: "date-time" },
					executionTimeMs: { type: "number" },
					pagination: {
						type: "object",
						properties: {
							page: { type: "integer" },
							limit: { type: "integer" },
							total: { type: "integer" },
							totalPages: { type: "integer" },
							hasNext: { type: "boolean" },
							hasPrev: { type: "boolean" },
						},
						required: [
							"page",
							"limit",
							"total",
							"totalPages",
							"hasNext",
							"hasPrev",
						],
					},
				},
				required: ["timestamp", "executionTimeMs", "pagination"],
			},
		},
		required: ["success", "message", "data", "meta"],
	};
}

export function emptySuccessResponse(): OpenAPIV3.SchemaObject {
	return {
		type: "object",
		properties: {
			success: { type: "boolean", enum: [true] },
			message: { type: "string" },
			data: {
				nullable: true,
				type: "object",
				description: "Always null for DELETE operations",
			},
			meta: {
				type: "object",
				properties: {
					timestamp: { type: "string", format: "date-time" },
					executionTimeMs: { type: "number" },
				},
				required: ["timestamp", "executionTimeMs"],
			},
		},
		required: ["success", "message", "data", "meta"],
	};
}

// ============================================
// ERROR SCHEMAS - Required for references
// ============================================

export const errorSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	ValidationError: {
		type: "object",
		properties: {
			success: { type: "boolean", enum: [false] },
			error: {
				type: "object",
				properties: {
					code: {
						type: "string",
						enum: [ErrorCode.VALIDATION_ERROR],
					},
					message: { type: "string" },
					details: { nullable: true },
				},
				required: ["code", "message"],
			},
			meta: {
				type: "object",
				properties: {
					timestamp: { type: "string", format: "date-time" },
					executionTimeMs: { type: "number" },
				},
				required: ["timestamp", "executionTimeMs"],
			},
		},
		required: ["success", "error", "meta"],
	},

	UnauthorizedError: {
		type: "object",
		properties: {
			success: { type: "boolean", enum: [false] },
			error: {
				type: "object",
				properties: {
					code: { type: "string", enum: [ErrorCode.UNAUTHORIZED] },
					message: { type: "string" },
					details: { nullable: true },
				},
				required: ["code", "message"],
			},
			meta: {
				type: "object",
				properties: {
					timestamp: { type: "string", format: "date-time" },
					executionTimeMs: { type: "number" },
				},
				required: ["timestamp", "executionTimeMs"],
			},
		},
		required: ["success", "error", "meta"],
	},

	ForbiddenError: {
		type: "object",
		properties: {
			success: { type: "boolean", enum: [false] },
			error: {
				type: "object",
				properties: {
					code: { type: "string", enum: [ErrorCode.FORBIDDEN] },
					message: { type: "string" },
					details: { nullable: true },
				},
				required: ["code", "message"],
			},
			meta: {
				type: "object",
				properties: {
					timestamp: { type: "string", format: "date-time" },
					executionTimeMs: { type: "number" },
				},
				required: ["timestamp", "executionTimeMs"],
			},
		},
		required: ["success", "error", "meta"],
	},

	NotFoundError: {
		type: "object",
		properties: {
			success: { type: "boolean", enum: [false] },
			error: {
				type: "object",
				properties: {
					code: { type: "string", enum: [ErrorCode.NOT_FOUND] },
					message: { type: "string" },
					details: { nullable: true },
				},
				required: ["code", "message"],
			},
			meta: {
				type: "object",
				properties: {
					timestamp: { type: "string", format: "date-time" },
					executionTimeMs: { type: "number" },
				},
				required: ["timestamp", "executionTimeMs"],
			},
		},
		required: ["success", "error", "meta"],
	},

	ConflictError: {
		type: "object",
		properties: {
			success: { type: "boolean", enum: [false] },
			error: {
				type: "object",
				properties: {
					code: { type: "string", enum: [ErrorCode.CONFLICT] },
					message: { type: "string" },
					details: { nullable: true },
				},
				required: ["code", "message"],
			},
			meta: {
				type: "object",
				properties: {
					timestamp: { type: "string", format: "date-time" },
					executionTimeMs: { type: "number" },
				},
				required: ["timestamp", "executionTimeMs"],
			},
		},
		required: ["success", "error", "meta"],
	},

	TooManyRequestsError: {
		type: "object",
		properties: {
			success: { type: "boolean", enum: [false] },
			error: {
				type: "object",
				properties: {
					code: {
						type: "string",
						enum: [ErrorCode.TOO_MANY_REQUESTS],
					},
					message: { type: "string" },
					details: { nullable: true },
				},
				required: ["code", "message"],
			},
			meta: {
				type: "object",
				properties: {
					timestamp: { type: "string", format: "date-time" },
					executionTimeMs: { type: "number" },
				},
				required: ["timestamp", "executionTimeMs"],
			},
		},
		required: ["success", "error", "meta"],
	},

	InternalServerError: {
		type: "object",
		properties: {
			success: { type: "boolean", enum: [false] },
			error: {
				type: "object",
				properties: {
					code: {
						type: "string",
						enum: [ErrorCode.INTERNAL_SERVER_ERROR],
					},
					message: { type: "string" },
					details: { nullable: true },
				},
				required: ["code", "message"],
			},
			meta: {
				type: "object",
				properties: {
					timestamp: { type: "string", format: "date-time" },
					executionTimeMs: { type: "number" },
				},
				required: ["timestamp", "executionTimeMs"],
			},
		},
		required: ["success", "error", "meta"],
	},
};

// ============================================
// COMMON ERROR RESPONSES
// ============================================

export const commonResponses: Record<string, OpenAPIV3.ResponseObject> = {
	BadRequest: {
		description: "Bad request - Invalid input or validation error",
		content: {
			"application/json": {
				schema: { $ref: "#/components/schemas/ValidationError" },
			},
		},
	},
	Unauthorized: {
		description: "Unauthorized - Authentication required",
		content: {
			"application/json": {
				schema: { $ref: "#/components/schemas/UnauthorizedError" },
			},
		},
	},
	Forbidden: {
		description: "Forbidden - Insufficient permissions",
		content: {
			"application/json": {
				schema: { $ref: "#/components/schemas/ForbiddenError" },
			},
		},
	},
	NotFound: {
		description: "Not found - Resource does not exist",
		content: {
			"application/json": {
				schema: { $ref: "#/components/schemas/NotFoundError" },
			},
		},
	},
	Conflict: {
		description: "Conflict - Resource already exists",
		content: {
			"application/json": {
				schema: { $ref: "#/components/schemas/ConflictError" },
			},
		},
	},
	TooManyRequests: {
		description: "Too many requests - Rate limit exceeded",
		content: {
			"application/json": {
				schema: { $ref: "#/components/schemas/TooManyRequestsError" },
			},
		},
	},
	InternalServerError: {
		description: "Internal server error",
		content: {
			"application/json": {
				schema: { $ref: "#/components/schemas/InternalServerError" },
			},
		},
	},
};
