// components/context/transactions-context/transactions-context.tsx
"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import type {
	CreateTransactionInput,
	UpdateTransactionInput,
	BulkCreateTransactionInput,
	BulkDeleteTransactionInput,
	ExportOptionsInput,
	TransactionSummaryQueryInput,
} from "@/lib/transaction-service/validation";
import { apiClient, ApiError } from "@/lib/api-client";
import type {
	Transaction,
	TransactionSummary,
	BulkCreateResult,
	BulkDeleteResult,
	TransactionType,
	GetTransactionsParams,
} from "@/lib/transaction-service/types";
import { useAuth } from "@/components/context/auth-context/auth-context";
import {
	ErrorCode,
	type ApiSuccessResponse,
	type ApiMeta,
} from "@/lib/response-service";

// ============================================
// TYPES
// ============================================

interface TransactionsContextType {
	transactions: Transaction[];
	pagination: ApiMeta["pagination"] | null;
	summary: TransactionSummary | null;
	isLoading: boolean;
	error: string | null;
	fetchTransactions: (params?: {
		page?: number;
		limit?: number;
		startDate?: string;
		endDate?: string;
		type?: TransactionType;
		categoryId?: string;
		accountId?: string;
		search?: string;
		minAmount?: number;
		maxAmount?: number;
		tagIds?: string[];
		sortBy?: "date" | "amount" | "description";
		sortOrder?: "asc" | "desc";
	}) => Promise<void>;
	fetchSummary: (params?: {
		startDate?: string;
		endDate?: string;
		categoryIds?: string[];
		accountIds?: string[];
	}) => Promise<void>;
	createTransaction: (
		data: CreateTransactionInput,
	) => Promise<Transaction | null>;
	updateTransaction: (
		id: string,
		data: UpdateTransactionInput,
	) => Promise<Transaction | null>;
	deleteTransaction: (id: string) => Promise<boolean>;
	bulkCreateTransactions: (
		data: BulkCreateTransactionInput,
	) => Promise<BulkCreateResult | null>;
	bulkDeleteTransactions: (
		data: BulkDeleteTransactionInput,
	) => Promise<BulkDeleteResult | null>;
	exportTransactions: (
		options: ExportOptionsInput,
	) => Promise<Transaction[] | string | null>;
	getTransactionById: (id: string) => Promise<Transaction | null>;
	clearError: () => void;
}

// ============================================
// CONTEXT
// ============================================

const TransactionsContext = createContext<TransactionsContextType | undefined>(
	undefined,
);

// ============================================
// PROVIDER
// ============================================

interface TransactionsProviderProps {
	children: React.ReactNode;
}

export function TransactionsProvider({ children }: TransactionsProviderProps) {
	const { isAuthenticated } = useAuth();
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [pagination, setPagination] = useState<ApiMeta["pagination"] | null>(
		null,
	);
	const [summary, setSummary] = useState<TransactionSummary | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => setError(null), []);

	const fetchTransactions = useCallback(
		async (
			params: {
				page?: number;
				limit?: number;
				startDate?: string;
				endDate?: string;
				type?: TransactionType;
				categoryId?: string;
				accountId?: string;
				search?: string;
				minAmount?: number;
				maxAmount?: number;
				tagIds?: string[];
				sortBy?: "date" | "amount" | "description";
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
				if (params.startDate)
					queryParams.set("startDate", params.startDate);
				if (params.endDate) queryParams.set("endDate", params.endDate);
				if (params.type) queryParams.set("type", params.type);
				if (params.categoryId)
					queryParams.set("categoryId", params.categoryId);
				if (params.accountId)
					queryParams.set("accountId", params.accountId);
				if (params.search) queryParams.set("search", params.search);
				if (params.minAmount)
					queryParams.set("minAmount", params.minAmount.toString());
				if (params.maxAmount)
					queryParams.set("maxAmount", params.maxAmount.toString());
				if (params.tagIds && params.tagIds.length > 0) {
					queryParams.set("tagIds", params.tagIds.join(","));
				}
				if (params.sortBy) queryParams.set("sortBy", params.sortBy);
				if (params.sortOrder)
					queryParams.set("sortOrder", params.sortOrder);

				const response = await apiClient.get<
					ApiSuccessResponse<Transaction[]>
				>(`/transactions?${queryParams.toString()}`);

				setTransactions(response.data);
				setPagination(response.meta.pagination || null);
			} catch (error) {
				const errorMessage =
					error instanceof ApiError
						? error.message
						: "Failed to fetch transactions";
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const fetchSummary = useCallback(
		async (
			params: {
				startDate?: string;
				endDate?: string;
				categoryIds?: string[];
				accountIds?: string[];
			} = {},
		) => {
			if (!isAuthenticated) return;

			setIsLoading(true);
			setError(null);

			try {
				const queryParams = new URLSearchParams();
				if (params.startDate)
					queryParams.set("startDate", params.startDate);
				if (params.endDate) queryParams.set("endDate", params.endDate);
				if (params.categoryIds && params.categoryIds.length > 0) {
					queryParams.set(
						"categoryIds",
						params.categoryIds.join(","),
					);
				}
				if (params.accountIds && params.accountIds.length > 0) {
					queryParams.set("accountIds", params.accountIds.join(","));
				}

				const response = await apiClient.get<
					ApiSuccessResponse<TransactionSummary>
				>(`/transactions/summary?${queryParams.toString()}`);

				setSummary(response.data);
			} catch (error) {
				const errorMessage =
					error instanceof ApiError
						? error.message
						: "Failed to fetch transaction summary";
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const createTransaction = useCallback(
		async (data: CreateTransactionInput): Promise<Transaction | null> => {
			if (!isAuthenticated) return null;

			setIsLoading(true);
			setError(null);

			try {
				const response = await apiClient.post<
					ApiSuccessResponse<Transaction>
				>("/transactions", data);
				const newTransaction = response.data;

				// Refresh lists
				await Promise.all([fetchTransactions(), fetchSummary()]);

				return newTransaction;
			} catch (error) {
				let errorMessage = "Failed to create transaction";

				if (error instanceof ApiError) {
					if (error.message.includes("Category")) {
						errorMessage = "Category not found or access denied";
					} else if (error.message.includes("Account")) {
						errorMessage = "Account not found or access denied";
					} else if (error.message.includes("Tag")) {
						errorMessage = "One or more tags not found";
					} else if (error.message.includes("INSUFFICIENT_BALANCE")) {
						errorMessage = "Insufficient balance in source account";
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
		[isAuthenticated, fetchTransactions, fetchSummary],
	);

	const updateTransaction = useCallback(
		async (
			id: string,
			data: UpdateTransactionInput,
		): Promise<Transaction | null> => {
			if (!isAuthenticated) return null;

			setIsLoading(true);
			setError(null);

			try {
				const response = await apiClient.put<
					ApiSuccessResponse<Transaction>
				>(`/transactions/${id}`, data);
				const updatedTransaction = response.data;

				// Update in local state
				setTransactions((prev) =>
					prev.map((tx) => (tx.id === id ? updatedTransaction : tx)),
				);

				// Refresh summary
				await fetchSummary();

				return updatedTransaction;
			} catch (error) {
				let errorMessage = "Failed to update transaction";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Transaction not found";
					} else if (error.message.includes("Category")) {
						errorMessage = "Category not found or access denied";
					} else if (error.message.includes("Tag")) {
						errorMessage = "One or more tags not found";
					} else if (error.message.includes("INSUFFICIENT_BALANCE")) {
						errorMessage = "Insufficient balance for this update";
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
		[isAuthenticated, fetchSummary],
	);

	const deleteTransaction = useCallback(
		async (id: string): Promise<boolean> => {
			if (!isAuthenticated) return false;

			setIsLoading(true);
			setError(null);

			try {
				await apiClient.delete<ApiSuccessResponse<null>>(
					`/transactions/${id}`,
				);

				// Remove from local state
				setTransactions((prev) => prev.filter((tx) => tx.id !== id));

				// Refresh summary
				await fetchSummary();

				return true;
			} catch (error) {
				let errorMessage = "Failed to delete transaction";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Transaction not found";
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
		[isAuthenticated, fetchSummary],
	);

	const bulkCreateTransactions = useCallback(
		async (
			data: BulkCreateTransactionInput,
		): Promise<BulkCreateResult | null> => {
			if (!isAuthenticated) return null;

			setIsLoading(true);
			setError(null);

			try {
				const response = await apiClient.post<
					ApiSuccessResponse<BulkCreateResult>
				>("/transactions/bulk", data);
				const result = response.data;

				// Refresh lists
				await Promise.all([fetchTransactions(), fetchSummary()]);

				return result;
			} catch (error) {
				let errorMessage = "Failed to bulk create transactions";

				if (error instanceof ApiError) {
					errorMessage = error.message;
				}

				setError(errorMessage);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated, fetchTransactions, fetchSummary],
	);

	const bulkDeleteTransactions = useCallback(
		async (
			data: BulkDeleteTransactionInput,
		): Promise<BulkDeleteResult | null> => {
			if (!isAuthenticated) return null;

			setIsLoading(true);
			setError(null);

			try {
				// Use raw fetch for DELETE with body
				const response = await fetch("/api/transactions/bulk", {
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
					body: JSON.stringify(data),
				});

				const result = await response.json();

				if (!result.success) {
					throw new ApiError(
						result.error.message,
						result.error.code,
						response.status,
					);
				}

				// Refresh lists
				await Promise.all([fetchTransactions(), fetchSummary()]);

				return result.data;
			} catch (error) {
				let errorMessage = "Failed to bulk delete transactions";

				if (error instanceof ApiError) {
					errorMessage = error.message;
				}

				setError(errorMessage);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated, fetchTransactions, fetchSummary],
	);

	const exportTransactions = useCallback(
		async (
			options: ExportOptionsInput,
		): Promise<Transaction[] | string | null> => {
			if (!isAuthenticated) return null;

			setIsLoading(true);
			setError(null);

			try {
				const queryParams = new URLSearchParams();
				queryParams.set("format", options.format);
				if (options.startDate)
					queryParams.set("startDate", options.startDate);
				if (options.endDate)
					queryParams.set("endDate", options.endDate);
				if (options.includeAttachments) {
					queryParams.set("includeAttachments", "true");
				}

				if (options.format === "csv") {
					const response = await fetch(
						`/api/transactions/export?${queryParams.toString()}`,
						{ credentials: "include" },
					);

					if (!response.ok) {
						const errorData = await response.json();
						throw new ApiError(
							errorData.error?.message || "Export failed",
							errorData.error?.code ||
								ErrorCode.INTERNAL_SERVER_ERROR,
							response.status,
						);
					}

					const csvData = await response.text();

					// Trigger download
					const blob = new Blob([csvData], { type: "text/csv" });
					const url = window.URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.href = url;
					a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					window.URL.revokeObjectURL(url);

					return csvData;
				} else {
					const response = await apiClient.get<
						ApiSuccessResponse<Transaction[]>
					>(`/transactions/export?${queryParams.toString()}`);
					return response.data;
				}
			} catch (error) {
				let errorMessage = "Failed to export transactions";

				if (error instanceof ApiError) {
					errorMessage = error.message;
				}

				setError(errorMessage);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const getTransactionById = useCallback(
		async (id: string): Promise<Transaction | null> => {
			if (!isAuthenticated) return null;

			try {
				const response = await apiClient.get<
					ApiSuccessResponse<Transaction>
				>(`/transactions/${id}`);
				return response.data;
			} catch (error) {
				let errorMessage = "Failed to fetch transaction";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Transaction not found";
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
			Promise.all([fetchTransactions(), fetchSummary()]);
		}
	}, [isAuthenticated, fetchTransactions, fetchSummary]);

	const value: TransactionsContextType = {
		transactions,
		pagination,
		summary,
		isLoading,
		error,
		fetchTransactions,
		fetchSummary,
		createTransaction,
		updateTransaction,
		deleteTransaction,
		bulkCreateTransactions,
		bulkDeleteTransactions,
		exportTransactions,
		getTransactionById,
		clearError,
	};

	return (
		<TransactionsContext.Provider value={value}>
			{children}
		</TransactionsContext.Provider>
	);
}

// ============================================
// HOOK
// ============================================

export function useTransactions() {
	const context = useContext(TransactionsContext);
	if (context === undefined) {
		throw new Error(
			"useTransactions must be used within a TransactionsProvider",
		);
	}
	return context;
}
