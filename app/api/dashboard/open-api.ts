// app/api/dashboard/open-api.ts
import { OpenAPIV3 } from "openapi-types";
import { successResponse } from "@/lib/swagger/schemas";

const periodRangeSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		startDate: { type: "string", format: "date-time" },
		endDate: { type: "string", format: "date-time" },
		previousStartDate: { type: "string", format: "date-time" },
		previousEndDate: { type: "string", format: "date-time" },
	},
};

const kpiCardSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		current: { type: "number" },
		previous: { type: "number" },
		change: { type: "number" },
		changePercent: { type: "number" },
		trend: { type: "string", enum: ["up", "down", "neutral"] },
	},
};

const categorySchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		id: { type: "string" },
		name: { type: "string" },
		color: { type: "string", nullable: true },
		icon: { type: "string", nullable: true },
	},
};

const accountSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		id: { type: "string" },
		name: { type: "string" },
	},
};

const recentTransactionSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		id: { type: "string" },
		date: { type: "string", format: "date-time" },
		description: { type: "string", nullable: true },
		amount: { type: "number" },
		type: { type: "string", enum: ["INCOME", "EXPENSE", "TRANSFER"] },
		category: { ...categorySchema, nullable: true },
		account: { ...accountSchema, nullable: true },
	},
};

const budgetAlertSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		budgetId: { type: "string" },
		categoryId: { type: "string" },
		categoryName: { type: "string" },
		budgetAmount: { type: "number" },
		spentAmount: { type: "number" },
		remainingAmount: { type: "number" },
		percentageUsed: { type: "number" },
		alertThreshold: { type: "number" },
		isExceeded: { type: "boolean" },
		trend: { type: "string", enum: ["up", "down", "neutral"] },
		trendPercent: { type: "number" },
	},
};

const alertSummarySchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		totalAlerts: { type: "integer" },
		exceededCount: { type: "integer" },
		warningCount: { type: "integer" },
		averageUsage: { type: "number" },
	},
};

const topSpendingDaySchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		date: { type: "string", format: "date-time" },
		amount: { type: "number" },
		transactionCount: { type: "integer" },
		categories: { type: "array", items: { type: "string" } },
	},
};

const dashboardSummarySchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		period: periodRangeSchema,
		cards: {
			type: "object",
			properties: {
				totalIncome: kpiCardSchema,
				totalExpense: kpiCardSchema,
				netSavings: kpiCardSchema,
				totalTransactions: kpiCardSchema,
			},
		},
		summary: {
			type: "object",
			properties: {
				averageDailyExpense: { type: "number" },
				averageDailyIncome: { type: "number" },
				bestDay: { type: "string", format: "date", nullable: true },
				bestDayAmount: { type: "number" },
				worstDay: { type: "string", format: "date", nullable: true },
				worstDayAmount: { type: "number" },
				mostActiveCategory: { type: "string", nullable: true },
				savingsRate: { type: "number" },
				monthlyChange: { type: "number" },
			},
		},
		monthlyTrend: {
			type: "array",
			items: {
				type: "object",
				properties: {
					month: { type: "string", example: "Jan" },
					monthKey: { type: "string", example: "2026-01" },
					income: { type: "number" },
					expense: { type: "number" },
					savings: { type: "number" },
				},
			},
		},
		weeklySpending: {
			type: "array",
			items: {
				type: "object",
				properties: {
					date: { type: "string", example: "Mon" },
					dateKey: { type: "string", example: "2026-04-25" },
					amount: { type: "number" },
					dayOfWeek: { type: "integer" },
				},
			},
		},
		expenseByCategory: {
			type: "array",
			items: {
				type: "object",
				properties: {
					categoryId: { type: "string" },
					categoryName: { type: "string" },
					categoryColor: { type: "string", nullable: true },
					amount: { type: "number" },
					percentage: { type: "number" },
				},
			},
		},
		totalExpenseAmount: { type: "number" },
		categorySpending: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: { type: "number" },
				properties: {
					month: { type: "string" },
					monthKey: { type: "string" },
				},
			},
		},
		categoryRadar: {
			type: "array",
			items: {
				type: "object",
				properties: {
					category: { type: "string" },
					categoryId: { type: "string" },
					budget: { type: "number" },
					spent: { type: "number" },
					percentage: { type: "number" },
					color: { type: "string", nullable: true },
				},
			},
		},
		tagRadar: {
			type: "array",
			items: {
				type: "object",
				properties: {
					tag: { type: "string" },
					tagId: { type: "string" },
					usageCount: { type: "integer" },
					totalAmount: { type: "number" },
					averageAmount: { type: "number" },
					color: { type: "string", nullable: true },
				},
			},
		},
		dailyCategoryBreakdown: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: { type: "number" },
				properties: {
					date: { type: "string", format: "date" },
					dayName: { type: "string" },
				},
			},
		},
		recentTransactions: {
			type: "array",
			items: recentTransactionSchema,
		},
		budgetAlerts: {
			type: "array",
			items: budgetAlertSchema,
		},
		alertSummary: alertSummarySchema,
		topSpendingDays: {
			type: "array",
			items: topSpendingDaySchema,
		},
	},
};

const dashboardQueryParameters: OpenAPIV3.ParameterObject[] = [
	{
		name: "period",
		in: "query",
		description: "Time period for dashboard data",
		required: false,
		schema: {
			type: "string",
			enum: [
				"current-month",
				"last-month",
				"last-3-months",
				"last-6-months",
				"year-to-date",
				"custom",
			],
			default: "current-month",
		},
	},
	{
		name: "startDate",
		in: "query",
		description: "Start date (required when period=custom)",
		required: false,
		schema: { type: "string", format: "date-time" },
	},
	{
		name: "endDate",
		in: "query",
		description: "End date (required when period=custom)",
		required: false,
		schema: { type: "string", format: "date-time" },
	},
	{
		name: "compareWithPrevious",
		in: "query",
		description: "Compare with previous period",
		required: false,
		schema: { type: "boolean", default: true },
	},
	{
		name: "includeTagAnalysis",
		in: "query",
		description: "Include tag analysis data for radar chart",
		required: false,
		schema: { type: "boolean", default: false },
	},
];

export const dashboardPaths: OpenAPIV3.PathsObject = {
	"/api/dashboard": {
		get: {
			summary: "Get dashboard overview data",
			description:
				"Returns comprehensive dashboard data including KPI cards, area charts, pie charts, bar charts, radar charts, recent transactions, budget alerts, and spending analysis optimized for shadcn/ui components",
			tags: ["Dashboard"],
			parameters: dashboardQueryParameters,
			responses: {
				"200": {
					description: "Dashboard data retrieved successfully",
					content: {
						"application/json": {
							schema: successResponse(dashboardSummarySchema),
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

export const dashboardSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	DashboardSummary: dashboardSummarySchema,
	PeriodRange: periodRangeSchema,
	KPICard: kpiCardSchema,
	Category: categorySchema,
	Account: accountSchema,
	RecentTransaction: recentTransactionSchema,
	BudgetAlert: budgetAlertSchema,
	AlertSummary: alertSummarySchema,
	TopSpendingDay: topSpendingDaySchema,
};

export const dashboardTags: OpenAPIV3.TagObject[] = [
	{
		name: "Dashboard",
		description: "Dashboard and report endpoints for data visualization",
	},
];
