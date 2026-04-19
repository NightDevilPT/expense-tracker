// app/api/savings-goals/[id]/contribute/open-api.ts

import { OpenAPIV3 } from "openapi-types";
import { successResponse } from "@/lib/swagger/schemas";

const idParameter: OpenAPIV3.ParameterObject = {
	name: "id",
	in: "path",
	description: "Savings goal ID (CUID format)",
	required: true,
	schema: { type: "string", format: "cuid" },
	example: "clh1234567890abcdef",
};

const contributeToGoalSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		amount: {
			type: "number",
			minimum: 0.01,
			description: "Contribution amount (must be positive)",
			example: 5000.0,
		},
		notes: {
			type: "string",
			maxLength: 200,
			description: "Optional note about this contribution",
			example: "Monthly savings from salary",
		},
	},
	required: ["amount"],
};

const contributionResultSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		goal: {
			$ref: "#/components/schemas/SavingsGoal",
		} as OpenAPIV3.SchemaObject,
		contributed: {
			type: "number",
			description: "Amount contributed in this transaction",
			example: 5000.0,
		},
		previousAmount: {
			type: "number",
			description: "Total amount before this contribution",
			example: 40000.0,
		},
		newAmount: {
			type: "number",
			description: "Total amount after this contribution",
			example: 45000.0,
		},
		progress: {
			type: "number",
			description: "Progress percentage after contribution",
			example: 45.0,
		},
		isCompleted: {
			type: "boolean",
			description: "Whether the goal was completed by this contribution",
			example: false,
		},
		message: {
			type: "string",
			description: "Human-readable success message",
			example:
				"5,000 added. 55,000 more to reach your goal. (45.0% complete)",
		},
	},
};

export const savingsGoalContributePaths: OpenAPIV3.PathsObject = {
	"/api/savings-goals/{id}/contribute": {
		post: {
			summary: "Contribute to savings goal",
			description:
				"Add a contribution amount to an active savings goal. Cannot contribute to completed, failed, or cancelled goals.",
			tags: ["Savings Goals"],
			parameters: [idParameter],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: contributeToGoalSchema,
						examples: {
							monthlyContribution: {
								summary: "Monthly contribution",
								value: {
									amount: 5000.0,
									notes: "Monthly savings from salary",
								},
							},
							bonusContribution: {
								summary: "Bonus contribution",
								value: {
									amount: 25000.0,
									notes: "Year-end bonus contribution",
								},
							},
							simpleContribution: {
								summary: "Simple contribution",
								value: {
									amount: 2000.0,
								},
							},
						},
					},
				},
			},
			responses: {
				"200": {
					description: "Contribution added successfully",
					content: {
						"application/json": {
							schema: successResponse(contributionResultSchema),
							example: {
								success: true,
								data: {
									goal: {
										id: "clh1234567890abcdef",
										name: "Emergency Fund",
										targetAmount: 100000.0,
										currentAmount: 45000.0,
										deadline: "2024-12-31T23:59:59Z",
										status: "ACTIVE",
										progress: 45.0,
										daysRemaining: 180,
									},
									contributed: 5000.0,
									previousAmount: 40000.0,
									newAmount: 45000.0,
									progress: 45.0,
									isCompleted: false,
									message:
										"5,000 added. 55,000 more to reach your goal. (45.0% complete)",
								},
								message:
									"5,000 added. 55,000 more to reach your goal. (45.0% complete)",
								timestamp: "2024-01-15T10:30:00Z",
								responseTime: 125,
							},
						},
					},
				},
				"400": {
					description:
						"Bad Request - Invalid contribution data or goal not active",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/ErrorResponse",
							},
							examples: {
								goalNotActive: {
									summary: "Goal not active",
									value: {
										success: false,
										message:
											"Goal is not active. Cannot contribute to completed, failed, or cancelled goals.",
										timestamp: "2024-01-15T10:30:00Z",
										responseTime: 45,
									},
								},
								invalidAmount: {
									summary: "Invalid amount",
									value: {
										success: false,
										message:
											"Contribution amount must be positive",
										timestamp: "2024-01-15T10:30:00Z",
										responseTime: 32,
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
								responseTime: 38,
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

export const savingsGoalContributeSchemas: Record<
	string,
	OpenAPIV3.SchemaObject
> = {
	ContributeToGoalRequest: contributeToGoalSchema,
	ContributionResult: contributionResultSchema,
};

export const savingsGoalContributeTags: OpenAPIV3.TagObject[] = [];
