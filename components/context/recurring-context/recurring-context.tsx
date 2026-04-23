// components/context/recurring-context/recurring-context.tsx
"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import type {
	CreateRecurringInput,
	UpdateRecurringInput,
} from "@/lib/recurring-service/validation";
import { apiClient, ApiError } from "@/lib/api-client";
import type {
	RecurringTransaction,
	RecurringWithNextDue,
	UpcomingRecurring,
	TransactionType,
	RecurringFrequency,
} from "@/lib/recurring-service/types";
import { useAuth } from "@/components/context/auth-context/auth-context";
import {
	ErrorCode,
	type ApiSuccessResponse,
	type ApiMeta,
} from "@/lib/response-service";

// ============================================
// TYPES
// ============================================

interface RecurringContextType {
	recurringTransactions: RecurringWithNextDue[];
	pagination: ApiMeta["pagination"] | null;
	upcomingRecurring: UpcomingRecurring[];
	isLoading: boolean;
	error: string | null;
	fetchRecurring: (params?: {
		page?: number;
		limit?: number;
		type?: TransactionType;
		frequency?: RecurringFrequency;
		isActive?: boolean;
		categoryId?: string;
		accountId?: string;
		search?: string;
		sortBy?: "name" | "amount" | "nextDueDate" | "frequency" | "createdAt";
		sortOrder?: "asc" | "desc";
	}) => Promise<void>;
	fetchUpcomingRecurring: (days?: number) => Promise<void>;
	createRecurring: (
		data: CreateRecurringInput,
	) => Promise<RecurringTransaction | null>;
	updateRecurring: (
		id: string,
		data: UpdateRecurringInput,
	) => Promise<RecurringTransaction | null>;
	deleteRecurring: (id: string) => Promise<boolean>;
	pauseRecurring: (id: string) => Promise<RecurringTransaction | null>;
	resumeRecurring: (id: string) => Promise<RecurringTransaction | null>;
	getRecurringById: (id: string) => Promise<RecurringWithNextDue | null>;
	clearError: () => void;
}

// ============================================
// CONTEXT
// ============================================

const RecurringContext = createContext<RecurringContextType | undefined>(
	undefined,
);

// ============================================
// PROVIDER
// ============================================

interface RecurringProviderProps {
	children: React.ReactNode;
}

export function RecurringProvider({ children }: RecurringProviderProps) {
	const { isAuthenticated } = useAuth();
	const [recurringTransactions, setRecurringTransactions] = useState<
		RecurringWithNextDue[]
	>([]);
	const [pagination, setPagination] = useState<ApiMeta["pagination"] | null>(
		null,
	);
	const [upcomingRecurring, setUpcomingRecurring] = useState<
		UpcomingRecurring[]
	>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => setError(null), []);

	const fetchRecurring = useCallback(
		async (
			params: {
				page?: number;
				limit?: number;
				type?: TransactionType;
				frequency?: RecurringFrequency;
				isActive?: boolean;
				categoryId?: string;
				accountId?: string;
				search?: string;
				sortBy?:
					| "name"
					| "amount"
					| "nextDueDate"
					| "frequency"
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
				if (params.type) queryParams.set("type", params.type);
				if (params.frequency)
					queryParams.set("frequency", params.frequency);
				if (params.isActive !== undefined)
					queryParams.set("isActive", params.isActive.toString());
				if (params.categoryId)
					queryParams.set("categoryId", params.categoryId);
				if (params.accountId)
					queryParams.set("accountId", params.accountId);
				if (params.search) queryParams.set("search", params.search);
				if (params.sortBy) queryParams.set("sortBy", params.sortBy);
				if (params.sortOrder)
					queryParams.set("sortOrder", params.sortOrder);

				const response = await apiClient.get<
					ApiSuccessResponse<RecurringWithNextDue[]>
				>(`/recurring?${queryParams.toString()}`);

				setRecurringTransactions(response.data);
				setPagination(response.meta.pagination || null);
			} catch (error) {
				const errorMessage =
					error instanceof ApiError
						? error.message
						: "Failed to fetch recurring transactions";
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const fetchUpcomingRecurring = useCallback(
		async (days: number = 30) => {
			if (!isAuthenticated) return;

			setIsLoading(true);
			setError(null);

			try {
				const response = await apiClient.get<
					ApiSuccessResponse<UpcomingRecurring[]>
				>(`/recurring/upcoming?days=${days}`);

				setUpcomingRecurring(response.data);
			} catch (error) {
				const errorMessage =
					error instanceof ApiError
						? error.message
						: "Failed to fetch upcoming recurring transactions";
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const createRecurring = useCallback(
		async (
			data: CreateRecurringInput,
		): Promise<RecurringTransaction | null> => {
			if (!isAuthenticated) return null;

			setIsLoading(true);
			setError(null);

			try {
				const response = await apiClient.post<
					ApiSuccessResponse<RecurringTransaction>
				>("/recurring", data);
				const newRecurring = response.data;

				// Refresh lists
				await Promise.all([fetchRecurring(), fetchUpcomingRecurring()]);

				return newRecurring;
			} catch (error) {
				let errorMessage = "Failed to create recurring transaction";

				if (error instanceof ApiError) {
					if (error.message.includes("Category")) {
						errorMessage = "Category not found or access denied";
					} else if (error.message.includes("Account")) {
						errorMessage = "Account not found or access denied";
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
		[isAuthenticated, fetchRecurring, fetchUpcomingRecurring],
	);

	const updateRecurring = useCallback(
		async (
			id: string,
			data: UpdateRecurringInput,
		): Promise<RecurringTransaction | null> => {
			if (!isAuthenticated) return null;

			setIsLoading(true);
			setError(null);

			try {
				const response = await apiClient.put<
					ApiSuccessResponse<RecurringTransaction>
				>(`/recurring/${id}`, data);
				const updatedRecurring = response.data;

				// Update in local state
				setRecurringTransactions((prev) =>
					prev.map((rt) =>
						rt.id === id ? { ...rt, ...updatedRecurring } : rt,
					),
				);

				// Refresh upcoming list
				await fetchUpcomingRecurring();

				return updatedRecurring;
			} catch (error) {
				let errorMessage = "Failed to update recurring transaction";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Recurring transaction not found";
					} else if (error.message.includes("Category")) {
						errorMessage = "Category not found or access denied";
					} else if (error.message.includes("Account")) {
						errorMessage = "Account not found or access denied";
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
		[isAuthenticated, fetchUpcomingRecurring],
	);

	const deleteRecurring = useCallback(
		async (id: string): Promise<boolean> => {
			if (!isAuthenticated) return false;

			setIsLoading(true);
			setError(null);

			try {
				await apiClient.delete<ApiSuccessResponse<null>>(
					`/recurring/${id}`,
				);

				// Remove from local state
				setRecurringTransactions((prev) =>
					prev.filter((rt) => rt.id !== id),
				);
				setUpcomingRecurring((prev) =>
					prev.filter((rt) => rt.id !== id),
				);

				return true;
			} catch (error) {
				let errorMessage = "Failed to delete recurring transaction";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Recurring transaction not found";
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

	const pauseRecurring = useCallback(
		async (id: string): Promise<RecurringTransaction | null> => {
			if (!isAuthenticated) return null;

			setIsLoading(true);
			setError(null);

			try {
				const response = await apiClient.post<
					ApiSuccessResponse<RecurringTransaction>
				>(`/recurring/${id}/pause`);
				const pausedRecurring = response.data;

				// Update in local state
				setRecurringTransactions((prev) =>
					prev.map((rt) =>
						rt.id === id ? { ...rt, isActive: false } : rt,
					),
				);
				setUpcomingRecurring((prev) =>
					prev.filter((rt) => rt.id !== id),
				);

				return pausedRecurring;
			} catch (error) {
				let errorMessage = "Failed to pause recurring transaction";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Recurring transaction not found";
					} else if (error.code === ErrorCode.CONFLICT) {
						errorMessage =
							"Recurring transaction is already paused";
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
		[isAuthenticated],
	);

	const resumeRecurring = useCallback(
		async (id: string): Promise<RecurringTransaction | null> => {
			if (!isAuthenticated) return null;

			setIsLoading(true);
			setError(null);

			try {
				const response = await apiClient.post<
					ApiSuccessResponse<RecurringTransaction>
				>(`/recurring/${id}/resume`);
				const resumedRecurring = response.data;

				// Update in local state
				setRecurringTransactions((prev) =>
					prev.map((rt) =>
						rt.id === id ? { ...rt, isActive: true } : rt,
					),
				);

				// Refresh upcoming list
				await fetchUpcomingRecurring();

				return resumedRecurring;
			} catch (error) {
				let errorMessage = "Failed to resume recurring transaction";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Recurring transaction not found";
					} else if (error.code === ErrorCode.CONFLICT) {
						errorMessage =
							"Recurring transaction is already active";
					} else if (error.code === ErrorCode.BAD_REQUEST) {
						errorMessage = "Cannot resume - end date has passed";
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
		[isAuthenticated, fetchUpcomingRecurring],
	);

	const getRecurringById = useCallback(
		async (id: string): Promise<RecurringWithNextDue | null> => {
			if (!isAuthenticated) return null;

			try {
				const response = await apiClient.get<
					ApiSuccessResponse<RecurringWithNextDue>
				>(`/recurring/${id}`);
				return response.data;
			} catch (error) {
				let errorMessage = "Failed to fetch recurring transaction";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Recurring transaction not found";
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
			Promise.all([fetchRecurring(), fetchUpcomingRecurring()]);
		}
	}, [isAuthenticated, fetchRecurring, fetchUpcomingRecurring]);

	const value: RecurringContextType = {
		recurringTransactions,
		pagination,
		upcomingRecurring,
		isLoading,
		error,
		fetchRecurring,
		fetchUpcomingRecurring,
		createRecurring,
		updateRecurring,
		deleteRecurring,
		pauseRecurring,
		resumeRecurring,
		getRecurringById,
		clearError,
	};

	return (
		<RecurringContext.Provider value={value}>
			{children}
		</RecurringContext.Provider>
	);
}

// ============================================
// HOOK
// ============================================

export function useRecurring() {
	const context = useContext(RecurringContext);
	if (context === undefined) {
		throw new Error("useRecurring must be used within a RecurringProvider");
	}
	return context;
}
