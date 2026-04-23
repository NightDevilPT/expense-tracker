// components/context/savings-goals-context/savings-goals-context.tsx
"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import type {
	CreateSavingsGoalInput,
	UpdateSavingsGoalInput,
	ContributeToGoalInput,
} from "@/lib/savings-goal-service/validation";
import { apiClient, ApiError } from "@/lib/api-client";
import type {
	SavingsGoal,
	SavingsGoalWithProgress,
	ContributionResult,
	SavingsGoalStatus,
} from "@/lib/savings-goal-service/types";
import { useAuth } from "@/components/context/auth-context/auth-context";
import { ErrorCode, type ApiMeta } from "@/lib/response-service";

// ============================================
// TYPES
// ============================================

interface SavingsGoalsContextType {
	goals: SavingsGoalWithProgress[];
	pagination: ApiMeta["pagination"] | null;
	activeGoals: SavingsGoalWithProgress[];
	isLoading: boolean;
	error: string | null;
	fetchGoals: (params?: {
		page?: number;
		limit?: number;
		status?: SavingsGoalStatus;
		sortBy?:
			| "deadline"
			| "targetAmount"
			| "currentAmount"
			| "progress"
			| "createdAt";
		sortOrder?: "asc" | "desc";
	}) => Promise<void>;
	fetchActiveGoalsProgress: () => Promise<void>;
	createGoal: (data: CreateSavingsGoalInput) => Promise<SavingsGoal | null>;
	updateGoal: (
		id: string,
		data: UpdateSavingsGoalInput,
	) => Promise<SavingsGoal | null>;
	deleteGoal: (id: string) => Promise<boolean>;
	contributeToGoal: (
		id: string,
		data: ContributeToGoalInput,
	) => Promise<ContributionResult | null>;
	getGoalById: (id: string) => Promise<SavingsGoalWithProgress | null>;
	clearError: () => void;
}

// ============================================
// CONTEXT
// ============================================

const SavingsGoalsContext = createContext<SavingsGoalsContextType | undefined>(
	undefined,
);

// ============================================
// PROVIDER
// ============================================

interface SavingsGoalsProviderProps {
	children: React.ReactNode;
}

export function SavingsGoalsProvider({ children }: SavingsGoalsProviderProps) {
	const { isAuthenticated } = useAuth();
	const [goals, setGoals] = useState<SavingsGoalWithProgress[]>([]);
	const [pagination, setPagination] = useState<ApiMeta["pagination"] | null>(
		null,
	);
	const [activeGoals, setActiveGoals] = useState<SavingsGoalWithProgress[]>(
		[],
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => setError(null), []);

	const fetchGoals = useCallback(
		async (
			params: {
				page?: number;
				limit?: number;
				status?: SavingsGoalStatus;
				sortBy?:
					| "deadline"
					| "targetAmount"
					| "currentAmount"
					| "progress"
					| "createdAt";
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
				if (params.status) queryParams.set("status", params.status);
				if (params.sortBy) queryParams.set("sortBy", params.sortBy);
				if (params.sortOrder)
					queryParams.set("sortOrder", params.sortOrder);

				// ✅ apiClient.get returns ApiSuccessResponse<SavingsGoalWithProgress[]>
				const response = await apiClient.get<SavingsGoalWithProgress[]>(
					`/savings-goals?${queryParams.toString()}`,
				);

				setGoals(response.data);
				setPagination(response.meta.pagination || null);
			} catch (error) {
				const errorMessage =
					error instanceof ApiError
						? error.message
						: "Failed to fetch savings goals";
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const fetchActiveGoalsProgress = useCallback(async () => {
		if (!isAuthenticated) return;

		setIsLoading(true);
		setError(null);

		try {
			// ✅ apiClient.get returns ApiSuccessResponse<SavingsGoalWithProgress[]>
			const response = await apiClient.get<SavingsGoalWithProgress[]>(
				"/savings-goals/progress",
			);

			setActiveGoals(response.data);
		} catch (error) {
			const errorMessage =
				error instanceof ApiError
					? error.message
					: "Failed to fetch active goals progress";
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated]);

	const createGoal = useCallback(
		async (data: CreateSavingsGoalInput): Promise<SavingsGoal | null> => {
			if (!isAuthenticated) return null;

			setIsLoading(true);
			setError(null);

			try {
				// ✅ apiClient.post returns ApiSuccessResponse<SavingsGoal>
				const response = await apiClient.post<SavingsGoal>(
					"/savings-goals",
					data,
				);
				const newGoal = response.data;

				await Promise.all([fetchGoals(), fetchActiveGoalsProgress()]);

				return newGoal;
			} catch (error) {
				let errorMessage = "Failed to create savings goal";

				if (error instanceof ApiError) {
					if (error.message.includes("Category")) {
						errorMessage = "Category not found or access denied";
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
		[isAuthenticated, fetchGoals, fetchActiveGoalsProgress],
	);

	const updateGoal = useCallback(
		async (
			id: string,
			data: UpdateSavingsGoalInput,
		): Promise<SavingsGoal | null> => {
			if (!isAuthenticated) return null;

			setIsLoading(true);
			setError(null);

			try {
				// ✅ apiClient.put returns ApiSuccessResponse<SavingsGoal>
				const response = await apiClient.put<SavingsGoal>(
					`/savings-goals/${id}`,
					data,
				);
				const updatedGoal = response.data;

				setGoals((prev) =>
					prev.map((goal) =>
						goal.id === id ? { ...goal, ...updatedGoal } : goal,
					),
				);

				await fetchActiveGoalsProgress();

				return updatedGoal;
			} catch (error) {
				let errorMessage = "Failed to update savings goal";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Savings goal not found";
					} else if (error.message.includes("Category")) {
						errorMessage = "Category not found or access denied";
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
		[isAuthenticated, fetchActiveGoalsProgress],
	);

	const deleteGoal = useCallback(
		async (id: string): Promise<boolean> => {
			if (!isAuthenticated) return false;

			setIsLoading(true);
			setError(null);

			try {
				// ✅ apiClient.delete returns ApiSuccessResponse<null>
				await apiClient.delete<null>(`/savings-goals/${id}`);

				setGoals((prev) => prev.filter((goal) => goal.id !== id));
				setActiveGoals((prev) => prev.filter((goal) => goal.id !== id));

				return true;
			} catch (error) {
				let errorMessage = "Failed to delete savings goal";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Savings goal not found";
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
		[isAuthenticated],
	);

	const contributeToGoal = useCallback(
		async (
			id: string,
			data: ContributeToGoalInput,
		): Promise<ContributionResult | null> => {
			if (!isAuthenticated) return null;

			setIsLoading(true);
			setError(null);

			try {
				// ✅ apiClient.post returns ApiSuccessResponse<ContributionResult>
				const response = await apiClient.post<ContributionResult>(
					`/savings-goals/${id}/contribute`,
					data,
				);
				const result = response.data;

				setGoals((prev) =>
					prev.map((goal) =>
						goal.id === id
							? {
									...goal,
									currentAmount: result.newAmount,
									progress: result.progress,
									status: result.isCompleted
										? "COMPLETED"
										: goal.status,
								}
							: goal,
					),
				);

				await fetchActiveGoalsProgress();

				return result;
			} catch (error) {
				let errorMessage = "Failed to contribute to goal";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Savings goal not found";
					} else if (error.code === ErrorCode.BAD_REQUEST) {
						errorMessage =
							"Goal is not active. Cannot contribute to completed, failed, or cancelled goals.";
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
		[isAuthenticated, fetchActiveGoalsProgress],
	);

	const getGoalById = useCallback(
		async (id: string): Promise<SavingsGoalWithProgress | null> => {
			if (!isAuthenticated) return null;

			try {
				// ✅ apiClient.get returns ApiSuccessResponse<SavingsGoalWithProgress>
				const response = await apiClient.get<SavingsGoalWithProgress>(
					`/savings-goals/${id}`,
				);
				return response.data;
			} catch (error) {
				let errorMessage = "Failed to fetch savings goal";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Savings goal not found";
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

	useEffect(() => {
		if (isAuthenticated) {
			Promise.all([fetchGoals(), fetchActiveGoalsProgress()]);
		}
	}, [isAuthenticated, fetchGoals, fetchActiveGoalsProgress]);

	const value: SavingsGoalsContextType = {
		goals,
		pagination,
		activeGoals,
		isLoading,
		error,
		fetchGoals,
		fetchActiveGoalsProgress,
		createGoal,
		updateGoal,
		deleteGoal,
		contributeToGoal,
		getGoalById,
		clearError,
	};

	return (
		<SavingsGoalsContext.Provider value={value}>
			{children}
		</SavingsGoalsContext.Provider>
	);
}

// ============================================
// HOOK
// ============================================

export function useSavingsGoals() {
	const context = useContext(SavingsGoalsContext);
	if (context === undefined) {
		throw new Error(
			"useSavingsGoals must be used within a SavingsGoalsProvider",
		);
	}
	return context;
}
