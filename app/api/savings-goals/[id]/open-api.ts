// app/api/savings-goals/[id]/open-api.ts

import { OpenAPIV3 } from "openapi-types";
import { successResponse, emptySuccessResponse } from "@/lib/swagger/schemas";

const idParameter: OpenAPIV3.ParameterObject = {
	name: "id",
	in: "path",
	description: "Savings goal ID (CUID format)",
	required: true,
	schema: { type: "string", format: "cuid" },
	example: "clh1234567890abcdef",
};

const updateSavingsGoalSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		name: {
			type: "string",
			minLength: 1,
			maxLength: 100,
			description: "Updated name of the savings goal",
			example: "Updated Emergency Fund",
		},
		targetAmount: {
			type: "number",
			minimum: 0.01,
			description: "Updated target amount to save",
			example: 120000.0,
		},
		deadline: {
			type: "string",
			format: "date-time",
			description: "Updated deadline for the goal",
			example: "2025-06-30T23:59:59Z",
		},
		notes: {
			type: "string",
			maxLength: 500,
			nullable: true,
			description: "Updated notes about the goal",
			example: "Increased target due to inflation",
		},
		linkedCategoryId: {
			type: "string",
			format: "cuid",
			nullable: true,
			description: "Updated linked category ID",
			example: "category-new-456",
		},
		status: {
			type: "string",
			enum: ["ACTIVE", "COMPLETED", "FAILED", "CANCELLED"],
			description: "Updated status of the goal",
			example: "ACTIVE",
		},
	},
	minProperties: 1,
	description: "At least one field must be provided for update",
};

export const savingsGoalByIdPaths: OpenAPIV3.PathsObject = {
	"/api/savings-goals/{id}": {
		get: {
			summary: "Get savings goal by ID",
			description:
				"Retrieve a single savings goal with all its details including progress metrics",
			tags: ["Savings Goals"],
			parameters: [idParameter],
			responses: {
				"200": {
					description: "Savings goal retrieved successfully",
					content: {
						"application/json": {
							schema: successResponse({
								$ref: "#/components/schemas/SavingsGoalWithProgress",
							} as OpenAPIV3.SchemaObject),
							example: {
								success: true,
								data: {
									id: "clh1234567890abcdef",
									name: "Emergency Fund",
									targetAmount: 100000.0,
									currentAmount: 45000.0,
									deadline: "2024-12-31T23:59:59Z",
									status: "ACTIVE",
									notes: "6 months of expenses",
									progress: 45.0,
									daysRemaining: 180,
									userId: "user-123",
									linkedCategoryId: "category-savings-456",
									linkedCategory: {
										id: "category-savings-456",
										name: "Savings",
										type: "EXPENSE",
									},
									remaining: 55000.0,
									isCompleted: false,
									isFailed: false,
									isOverdue: false,
									suggestedMonthlyContribution: 9166.67,
									dailyTarget: 305.56,
									createdAt: "2024-01-01T00:00:00Z",
									updatedAt: "2024-01-15T10:30:00Z",
								},
								message: "Savings goal retrieved successfully",
								timestamp: "2024-01-15T10:30:00Z",
								responseTime: 45,
							},
						},
					},
				},
				"400": {
					description: "Bad Request - Invalid goal ID format",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/ErrorResponse",
							},
							example: {
								success: false,
								message: "Invalid goal ID format",
								timestamp: "2024-01-15T10:30:00Z",
								responseTime: 12,
							},
						},
					},
				},
				"401": { $ref: "#/components/responses/Unauthorized" },
				"404": {
					description: "Savings goal not found",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/ErrorResponse",
							},
							example: {
								success: false,
								message: "Savings goal not found",
								timestamp: "2024-01-15T10:30:00Z",
								responseTime: 28,
							},
						},
					},
				},
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
		put: {
			summary: "Update savings goal",
			description:
				"Update an existing savings goal. Only provided fields will be updated.",
			tags: ["Savings Goals"],
			parameters: [idParameter],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: updateSavingsGoalSchema,
						examples: {
							updateAmount: {
								summary: "Update target amount",
								value: {
									targetAmount: 120000.0,
								},
							},
							updateDeadline: {
								summary: "Extend deadline",
								value: {
									deadline: "2025-06-30T23:59:59Z",
									notes: "Extended deadline by 6 months",
								},
							},
							updateStatus: {
								summary: "Cancel goal",
								value: {
									status: "CANCELLED",
									notes: "No longer needed",
								},
							},
							fullUpdate: {
								summary: "Full update",
								value: {
									name: "Updated Emergency Fund",
									targetAmount: 150000.0,
									deadline: "2025-12-31T23:59:59Z",
									notes: "Increased target for better safety margin",
									status: "ACTIVE",
								},
							},
						},
					},
				},
			},
			responses: {
				"200": {
					description: "Savings goal updated successfully",
					content: {
						"application/json": {
							schema: successResponse({
								$ref: "#/components/schemas/SavingsGoal",
							} as OpenAPIV3.SchemaObject),
							example: {
								success: true,
								data: {
									id: "clh1234567890abcdef",
									name: "Updated Emergency Fund",
									targetAmount: 120000.0,
									currentAmount: 45000.0,
									deadline: "2025-06-30T23:59:59Z",
									status: "ACTIVE",
									notes: "Increased target due to inflation",
									progress: 37.5,
									daysRemaining: 532,
									userId: "user-123",
									linkedCategoryId: "category-savings-456",
									createdAt: "2024-01-01T00:00:00Z",
									updatedAt: "2024-01-15T10:30:00Z",
								},
								message: "Savings goal updated successfully",
								timestamp: "2024-01-15T10:30:00Z",
								responseTime: 52,
							},
						},
					},
				},
				"400": {
					description:
						"Bad Request - Invalid update data or category not found",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/ErrorResponse",
							},
							examples: {
								invalidData: {
									summary: "Invalid update data",
									value: {
										success: false,
										message:
											"At least one field must be provided for update",
										timestamp: "2024-01-15T10:30:00Z",
										responseTime: 15,
									},
								},
								categoryNotFound: {
									summary: "Category not found",
									value: {
										success: false,
										message:
											"Category not found or access denied",
										timestamp: "2024-01-15T10:30:00Z",
										responseTime: 22,
									},
								},
							},
						},
					},
				},
				"401": { $ref: "#/components/responses/Unauthorized" },
				"404": {
					description: "Savings goal not found",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/ErrorResponse",
							},
							example: {
								success: false,
								message: "Savings goal not found",
								timestamp: "2024-01-15T10:30:00Z",
								responseTime: 18,
							},
						},
					},
				},
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
		delete: {
			summary: "Delete savings goal",
			description:
				"Permanently delete a savings goal. This action cannot be undone.",
			tags: ["Savings Goals"],
			parameters: [idParameter],
			responses: {
				"200": {
					description: "Savings goal deleted successfully",
					content: {
						"application/json": {
							schema: emptySuccessResponse(),
							example: {
								success: true,
								data: null,
								message: "Savings goal deleted successfully",
								timestamp: "2024-01-15T10:30:00Z",
								responseTime: 35,
							},
						},
					},
				},
				"400": {
					description: "Bad Request - Invalid goal ID format",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/ErrorResponse",
							},
							example: {
								success: false,
								message: "Invalid goal ID format",
								timestamp: "2024-01-15T10:30:00Z",
								responseTime: 10,
							},
						},
					},
				},
				"401": { $ref: "#/components/responses/Unauthorized" },
				"404": {
					description: "Savings goal not found",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/ErrorResponse",
							},
							example: {
								success: false,
								message: "Savings goal not found",
								timestamp: "2024-01-15T10:30:00Z",
								responseTime: 15,
							},
						},
					},
				},
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
	},
};

export const savingsGoalByIdSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	UpdateSavingsGoalRequest: updateSavingsGoalSchema,
};

export const savingsGoalByIdTags: OpenAPIV3.TagObject[] = [];
