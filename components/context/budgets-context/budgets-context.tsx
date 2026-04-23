// components/context/budgets-context/budgets-context.tsx
"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import type {
	CreateBudgetInput,
	UpdateBudgetInput,
} from "@/lib/budget-service/validation";
import { apiClient, ApiError } from "@/lib/api-client";
import type {
	Budget,
	BudgetWithProgress,
	CurrentMonthBudget,
	BudgetAlert,
	BudgetPeriod,
} from "@/lib/budget-service/types";
import { useAuth } from "@/components/context/auth-context/auth-context";
import {
	ErrorCode,
	type ApiSuccessResponse,
	type ApiMeta,
} from "@/lib/response-service";

// ============================================
// TYPES
// ============================================

interface BudgetsContextType {
	budgets: BudgetWithProgress[];
	pagination: ApiMeta["pagination"] | null;
	currentBudgets: CurrentMonthBudget[];
	alerts: BudgetAlert[];
	isLoading: boolean;
	error: string | null;
	fetchBudgets: (params?: {
		page?: number;
		limit?: number;
		period?: BudgetPeriod;
		categoryId?: string;
		startDate?: string;
		endDate?: string;
		sortBy?: "startDate" | "amount" | "spent" | "remaining";
		sortOrder?: "asc" | "desc";
	}) => Promise<void>;
	fetchCurrentBudgets: () => Promise<void>;
	fetchAlerts: () => Promise<void>;
	createBudget: (data: CreateBudgetInput) => Promise<Budget | null>;
	updateBudget: (
		id: string,
		data: UpdateBudgetInput,
	) => Promise<Budget | null>;
	deleteBudget: (id: string) => Promise<boolean>;
	getBudgetById: (id: string) => Promise<BudgetWithProgress | null>;
	clearError: () => void;
}

// ============================================
// CONTEXT
// ============================================

const BudgetsContext = createContext<BudgetsContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

interface BudgetsProviderProps {
	children: React.ReactNode;
}

export function BudgetsProvider({ children }: BudgetsProviderProps) {
	const { isAuthenticated } = useAuth();
	const [budgets, setBudgets] = useState<BudgetWithProgress[]>([]);
	const [pagination, setPagination] = useState<ApiMeta["pagination"] | null>(
		null,
	);
	const [currentBudgets, setCurrentBudgets] = useState<CurrentMonthBudget[]>(
		[],
	);
	const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => setError(null), []);

	const fetchBudgets = useCallback(
		async (
			params: {
				page?: number;
				limit?: number;
				period?: BudgetPeriod;
				categoryId?: string;
				startDate?: string;
				endDate?: string;
				sortBy?: "startDate" | "amount" | "spent" | "remaining";
				sortOrder?: "asc" | "desc";
			} = {},
		) => {
			if (!isAuthenticated) return;

			setIsLoading(true);
			setError(null);

			try {
				const queryParams = new URLSearchParams();
				if (params.page)
					queryParams.set("page", params.page.toString());
				if (params.limit)
					queryParams.set("limit", params.limit.toString());
				if (params.period) queryParams.set("period", params.period);
				if (params.categoryId)
					queryParams.set("categoryId", params.categoryId);
				if (params.startDate)
					queryParams.set("startDate", params.startDate);
				if (params.endDate) queryParams.set("endDate", params.endDate);
				if (params.sortBy) queryParams.set("sortBy", params.sortBy);
				if (params.sortOrder)
					queryParams.set("sortOrder", params.sortOrder);

				const response = await apiClient.get<
					ApiSuccessResponse<BudgetWithProgress[]>
				>(`/budgets?${queryParams.toString()}`);

				setBudgets(response.data);
				setPagination(response.meta.pagination || null);
			} catch (error) {
				const errorMessage =
					error instanceof ApiError
						? error.message
						: "Failed to fetch budgets";
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const fetchCurrentBudgets = useCallback(async () => {
		if (!isAuthenticated) return;

		setIsLoading(true);
		setError(null);

		try {
			const response =
				await apiClient.get<ApiSuccessResponse<CurrentMonthBudget[]>>(
					"/budgets/current",
				);

			setCurrentBudgets(response.data);
		} catch (error) {
			const errorMessage =
				error instanceof ApiError
					? error.message
					: "Failed to fetch current budgets";
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated]);

	const fetchAlerts = useCallback(async () => {
		if (!isAuthenticated) return;

		setIsLoading(true);
		setError(null);

		try {
			const response =
				await apiClient.get<ApiSuccessResponse<BudgetAlert[]>>(
					"/budgets/alerts",
				);

			setAlerts(response.data);
		} catch (error) {
			const errorMessage =
				error instanceof ApiError
					? error.message
					: "Failed to fetch budget alerts";
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated]);

	const createBudget = useCallback(
		async (data: CreateBudgetInput): Promise<Budget | null> => {
			if (!isAuthenticated) return null;

			setIsLoading(true);
			setError(null);

			try {
				const response = await apiClient.post<
					ApiSuccessResponse<Budget>
				>("/budgets", data);
				const newBudget = response.data;
				// Refresh budgets list and current budgets
				await Promise.all([fetchBudgets(), fetchCurrentBudgets()]);
				return newBudget;
			} catch (error) {
				let errorMessage = "Failed to create budget";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.BAD_REQUEST) {
						if (error.message.includes("Category")) {
							errorMessage =
								"Category not found or access denied";
						} else {
							errorMessage = error.message;
						}
					} else if (error.code === ErrorCode.CONFLICT) {
						errorMessage =
							"Budget already exists for this category and period";
					} else {
						errorMessage = error.message;
					}
				}

				setError(errorMessage);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated, fetchBudgets, fetchCurrentBudgets],
	);

	const updateBudget = useCallback(
		async (id: string, data: UpdateBudgetInput): Promise<Budget | null> => {
			if (!isAuthenticated) return null;

			setIsLoading(true);
			setError(null);

			try {
				const response = await apiClient.put<
					ApiSuccessResponse<Budget>
				>(`/budgets/${id}`, data);
				const updatedBudget = response.data;

				// Update in local state
				setBudgets((prev) =>
					prev.map((budget) =>
						budget.id === id
							? { ...budget, ...updatedBudget }
							: budget,
					),
				);

				// Refresh current budgets and alerts
				await Promise.all([fetchCurrentBudgets(), fetchAlerts()]);

				return updatedBudget;
			} catch (error) {
				let errorMessage = "Failed to update budget";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Budget not found";
					} else if (error.code === ErrorCode.BAD_REQUEST) {
						if (error.message.includes("Category")) {
							errorMessage =
								"Category not found or access denied";
						} else {
							errorMessage = error.message;
						}
					} else if (error.code === ErrorCode.CONFLICT) {
						errorMessage =
							"Budget already exists for this category and period";
					} else {
						errorMessage = error.message;
					}
				}

				setError(errorMessage);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated, fetchCurrentBudgets, fetchAlerts],
	);

	const deleteBudget = useCallback(
		async (id: string): Promise<boolean> => {
			if (!isAuthenticated) return false;

			setIsLoading(true);
			setError(null);

			try {
				await apiClient.delete<ApiSuccessResponse<null>>(
					`/budgets/${id}`,
				);

				// Remove from local state
				setBudgets((prev) => prev.filter((budget) => budget.id !== id));
				setCurrentBudgets((prev) =>
					prev.filter((budget) => budget.id !== id),
				);

				// Refresh alerts
				await fetchAlerts();

				return true;
			} catch (error) {
				let errorMessage = "Failed to delete budget";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Budget not found";
					} else {
						errorMessage = error.message;
					}
				}

				setError(errorMessage);
				return false;
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated, fetchAlerts],
	);

	const getBudgetById = useCallback(
		async (id: string): Promise<BudgetWithProgress | null> => {
			if (!isAuthenticated) return null;

			try {
				const response = await apiClient.get<
					ApiSuccessResponse<BudgetWithProgress>
				>(`/budgets/${id}`);
				return response.data;
			} catch (error) {
				let errorMessage = "Failed to fetch budget";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Budget not found";
					} else {
						errorMessage = error.message;
					}
				}

				setError(errorMessage);
				return null;
			}
		},
		[isAuthenticated],
	);

	// Initial fetch
	useEffect(() => {
		if (isAuthenticated) {
			Promise.all([fetchBudgets(), fetchCurrentBudgets(), fetchAlerts()]);
		}
	}, [isAuthenticated, fetchBudgets, fetchCurrentBudgets, fetchAlerts]);

	const value: BudgetsContextType = {
		budgets,
		pagination,
		currentBudgets,
		alerts,
		isLoading,
		error,
		fetchBudgets,
		fetchCurrentBudgets,
		fetchAlerts,
		createBudget,
		updateBudget,
		deleteBudget,
		getBudgetById,
		clearError,
	};

	return (
		<BudgetsContext.Provider value={value}>
			{children}
		</BudgetsContext.Provider>
	);
}

// ============================================
// HOOK
// ============================================

export function useBudgets() {
	const context = useContext(BudgetsContext);
	if (context === undefined) {
		throw new Error("useBudgets must be used within a BudgetsProvider");
	}
	return context;
}
