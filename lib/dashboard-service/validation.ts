// lib/dashboard-service/validation.ts
import { z } from "zod";

export const dashboardQuerySchema = z
	.object({
		period: z
			.enum([
				"current-month",
				"last-month",
				"last-3-months",
				"last-6-months",
				"year-to-date",
				"custom",
			])
			.default("current-month"),
		startDate: z.string().optional(),
		endDate: z.string().optional(),
		compareWithPrevious: z
			.preprocess((val) => {
				if (val === "true") return true;
				if (val === "false") return false;
				return val;
			}, z.boolean())
			.default(true),
		includeTagAnalysis: z
			.preprocess((val) => {
				if (val === "true") return true;
				if (val === "false") return false;
				return val;
			}, z.boolean())
			.default(false),
	})
	.refine(
		(data) => {
			if (data.period === "custom") {
				return data.startDate && data.endDate;
			}
			return true;
		},
		{
			message:
				"startDate and endDate are required when period is 'custom'",
			path: ["period"],
		},
	);

export function validateDashboardQuery(params: unknown): DashboardQueryParams {
	return dashboardQuerySchema.parse(params);
}

export type DashboardQueryParams = z.infer<typeof dashboardQuerySchema>;
