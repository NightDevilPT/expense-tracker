// components/pages/dashboard/index.tsx
"use client";

import { toast } from "sonner";
import { useEffect, useState, useCallback } from "react";
import { KPICardsGrid } from "./_components/kpi-cards-grid";
import { SummaryCards } from "./_components/summary-cards";
import { DashboardHeader } from "./_components/dashboard-header";
import { MonthlyTrendChart } from "./_components/monthly-trend-chart";
import { DashboardSkeletons } from "./_components/dashboard-skeletons";
import { WeeklySpendingChart } from "./_components/weekly-spending-chart";
import type { DashboardQueryParams } from "@/lib/dashboard-service/types";
import { useDashboard } from "@/components/context/dashboard-context/dashboard-context";

export default function DashboardPage() {
	const {
		dashboardData,
		isLoading,
		error,
		fetchDashboardData,
		queryParams,
		setPeriod,
		setDateRange,
		setCompareWithPrevious,
		setIncludeTagAnalysis,
		refreshDashboard,
		clearError,
		hasData,
	} = useDashboard();

	const [isFirstLoad, setIsFirstLoad] = useState(true);

	// Initial fetch
	useEffect(() => {
		if (!hasData) {
			fetchDashboardData().finally(() => setIsFirstLoad(false));
		} else {
			setIsFirstLoad(false);
		}
	}, [fetchDashboardData, hasData]);

	// Toast errors
	useEffect(() => {
		if (error) {
			toast.error(error);
			clearError();
		}
	}, [error, clearError]);

	// Handle query params change from filter
	const handleQueryParamsChange = useCallback(
		(newParams: DashboardQueryParams) => {
			// Update all params at once to avoid multiple API calls
			if (
				newParams.period !== undefined &&
				newParams.period !== queryParams.period
			) {
				setPeriod(newParams.period);
			}

			// Handle date range
			if (
				newParams.startDate !== undefined &&
				newParams.endDate !== undefined
			) {
				if (
					newParams.startDate !== queryParams.startDate ||
					newParams.endDate !== queryParams.endDate
				) {
					setDateRange(newParams.startDate, newParams.endDate);
				}
			} else if (
				newParams.period !== "custom" &&
				(queryParams.startDate || queryParams.endDate)
			) {
				// Clear custom dates if switching from custom to non-custom
				setDateRange("", "");
			}

			// Handle compare with previous
			if (
				newParams.compareWithPrevious !== undefined &&
				newParams.compareWithPrevious !==
					queryParams.compareWithPrevious
			) {
				setCompareWithPrevious(newParams.compareWithPrevious);
			}

			// Handle tag analysis
			if (
				newParams.includeTagAnalysis !== undefined &&
				newParams.includeTagAnalysis !== queryParams.includeTagAnalysis
			) {
				setIncludeTagAnalysis(newParams.includeTagAnalysis);
			}
		},
		[
			queryParams,
			setPeriod,
			setDateRange,
			setCompareWithPrevious,
			setIncludeTagAnalysis,
		],
	);

	return (
		<div className="flex flex-col gap-6 px-1 pb-5">
			<DashboardHeader
				queryParams={queryParams}
				onQueryParamsChange={handleQueryParamsChange}
				onRefresh={refreshDashboard}
				isLoading={isLoading}
			/>

			{isFirstLoad ? (
				<DashboardSkeletons />
			) : dashboardData ? (
				<>
					<KPICardsGrid cards={dashboardData.cards} />
					<SummaryCards
						summary={dashboardData.summary}
						isLoading={isLoading}
					/>
					<MonthlyTrendChart data={dashboardData.monthlyTrend} />
					<WeeklySpendingChart
						data={dashboardData.weeklySpending}
						isLoading={isLoading}
					/>
				</>
			) : null}
		</div>
	);
}
