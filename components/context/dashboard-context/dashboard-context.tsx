// components/context/dashboard-context/dashboard-context.tsx
"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import { apiClient, ApiError } from "@/lib/api-client";
import type {
	DashboardData,
	DashboardQueryParams,
} from "@/lib/dashboard-service/types";
import { useAuth } from "@/components/context/auth-context/auth-context";
import { ErrorCode, type ApiMeta } from "@/lib/response-service";

// ============================================
// TYPES
// ============================================

type Period =
	| "current-month"
	| "last-month"
	| "last-3-months"
	| "last-6-months"
	| "year-to-date"
	| "custom";

interface DashboardContextType {
	// State
	dashboardData: DashboardData | null;
	pagination: ApiMeta["pagination"] | null;
	isLoading: boolean;
	error: string | null;

	// Query params state
	queryParams: DashboardQueryParams;

	// Operations
	fetchDashboardData: (params?: DashboardQueryParams) => Promise<void>;
	setPeriod: (period: Period) => void;
	setDateRange: (startDate: string, endDate: string) => void;
	setCompareWithPrevious: (compare: boolean) => void;
	setIncludeTagAnalysis: (include: boolean) => void;
	refreshDashboard: () => Promise<void>;
	clearError: () => void;

	// Convenience getters
	currentPeriod: Period;
	hasData: boolean;
}

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_QUERY_PARAMS: DashboardQueryParams = {
	period: "current-month",
	compareWithPrevious: true,
	includeTagAnalysis: false,
};

// ============================================
// CONTEXT
// ============================================

const DashboardContext = createContext<DashboardContextType | undefined>(
	undefined,
);

// ============================================
// PROVIDER
// ============================================

interface DashboardProviderProps {
	children: React.ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
	const { isAuthenticated } = useAuth();
	const [dashboardData, setDashboardData] = useState<DashboardData | null>(
		null,
	);
	const [pagination, setPagination] = useState<ApiMeta["pagination"] | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [queryParams, setQueryParams] =
		useState<DashboardQueryParams>(DEFAULT_QUERY_PARAMS);

	const clearError = useCallback(() => setError(null), []);

	// Fetch dashboard data
	const fetchDashboardData = useCallback(
		async (params?: DashboardQueryParams) => {
			if (!isAuthenticated) return;

			setIsLoading(true);
			setError(null);

			try {
				const finalParams = params || queryParams;

				const urlParams = new URLSearchParams();

				// Period
				const period = finalParams.period ?? "current-month";
				urlParams.set("period", period);

				// compareWithPrevious - send as string "true" or "false"
				const compareValue = finalParams.compareWithPrevious ?? true;
				urlParams.set(
					"compareWithPrevious",
					compareValue ? "true" : "false",
				);

				// includeTagAnalysis - send as string "true" or "false"
				const includeTags = finalParams.includeTagAnalysis ?? false;
				urlParams.set(
					"includeTagAnalysis",
					includeTags ? "true" : "false",
				);

				// Custom dates
				if (period === "custom") {
					if (finalParams.startDate) {
						urlParams.set("startDate", finalParams.startDate);
					}
					if (finalParams.endDate) {
						urlParams.set("endDate", finalParams.endDate);
					}
				}

				// ✅ apiClient.get returns ApiSuccessResponse<DashboardData>
				const response = await apiClient.get<DashboardData>(
					`/dashboard?${urlParams.toString()}`,
				);

				setDashboardData(response.data);
				setPagination(response.meta.pagination || null);
			} catch (error) {
				let errorMessage = "Failed to fetch dashboard data";

				if (error instanceof ApiError) {
					switch (error.code) {
						case ErrorCode.UNAUTHORIZED:
						case ErrorCode.INVALID_TOKEN:
						case ErrorCode.TOKEN_EXPIRED:
							errorMessage =
								"Session expired. Please login again.";
							break;
						case ErrorCode.BAD_REQUEST:
							errorMessage =
								error.message || "Invalid request parameters";
							break;
						default:
							errorMessage = error.message;
					}
				}

				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated, queryParams],
	);

	// Set period and fetch
	const setPeriod = useCallback((period: Period) => {
		setQueryParams((prev) => ({
			...prev,
			period,
			// Clear custom dates if period is not custom
			...(period !== "custom" && {
				startDate: undefined,
				endDate: undefined,
			}),
		}));
	}, []);

	// Set custom date range
	const setDateRange = useCallback((startDate: string, endDate: string) => {
		setQueryParams((prev) => ({
			...prev,
			period: "custom",
			startDate,
			endDate,
		}));
	}, []);

	// Set compare with previous
	const setCompareWithPrevious = useCallback((compare: boolean) => {
		setQueryParams((prev) => ({
			...prev,
			compareWithPrevious: compare,
		}));
	}, []);

	// Set include tag analysis
	const setIncludeTagAnalysis = useCallback((include: boolean) => {
		setQueryParams((prev) => ({
			...prev,
			includeTagAnalysis: include,
		}));
	}, []);

	// Refresh dashboard with current query params
	const refreshDashboard = useCallback(async () => {
		if (isAuthenticated) {
			await fetchDashboardData(queryParams);
		}
	}, [isAuthenticated, fetchDashboardData, queryParams]);

	// Auto-fetch when query params change OR auth changes
	useEffect(() => {
		if (isAuthenticated) {
			fetchDashboardData(queryParams);
		}
	}, [isAuthenticated, queryParams, fetchDashboardData]);

	// Initial fetch on mount (if already authenticated)
	useEffect(() => {
		if (isAuthenticated && !dashboardData) {
			fetchDashboardData();
		}
	}, [isAuthenticated, dashboardData, fetchDashboardData]);

	const value: DashboardContextType = {
		dashboardData,
		pagination,
		isLoading,
		error,
		queryParams,
		fetchDashboardData,
		setPeriod,
		setDateRange,
		setCompareWithPrevious,
		setIncludeTagAnalysis,
		refreshDashboard,
		clearError,
		currentPeriod: (queryParams.period ?? "current-month") as Period,
		hasData: dashboardData !== null,
	};

	return (
		<DashboardContext.Provider value={value}>
			{children}
		</DashboardContext.Provider>
	);
}

// ============================================
// HOOK
// ============================================

export function useDashboard() {
	const context = useContext(DashboardContext);
	if (context === undefined) {
		throw new Error("useDashboard must be used within a DashboardProvider");
	}
	return context;
}
