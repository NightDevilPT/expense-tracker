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
} from "@/lib/transaction-service/validation";
import { apiClient, ApiError } from "@/lib/api-client";
import type {
	Transaction,
	TransactionSummary,
	BulkCreateResult,
	BulkDeleteResult,
	TransactionType,
} from "@/lib/transaction-service/types";
import { useAuth } from "@/components/context/auth-context/auth-context";
import { ErrorCode, type ApiMeta } from "@/lib/response-service";

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

				// ✅ apiClient.get returns ApiSuccessResponse<Transaction[]>
				const response = await apiClient.get<Transaction[]>(
					`/transactions?${queryParams.toString()}`,
				);

				setTransactions(response.data);
				setPagination(response.meta.pagination || null);
			} catch (error) {
				setError(
					error instanceof ApiError
						? error.message
						: "Failed to fetch transactions",
				);
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

				// ✅ apiClient.get returns ApiSuccessResponse<TransactionSummary>
				const response = await apiClient.get<TransactionSummary>(
					`/transactions/summary?${queryParams.toString()}`,
				);

				setSummary(response.data);
			} catch (error) {
				setError(
					error instanceof ApiError
						? error.message
						: "Failed to fetch summary",
				);
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
				// ✅ apiClient.post returns ApiSuccessResponse<Transaction>
				const response = await apiClient.post<Transaction>(
					"/transactions",
					data,
				);
				await Promise.all([fetchTransactions(), fetchSummary()]);
				return response.data;
			} catch (error) {
				setError(
					error instanceof ApiError
						? error.message
						: "Failed to create transaction",
				);
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
				// ✅ apiClient.put returns ApiSuccessResponse<Transaction>
				const response = await apiClient.put<Transaction>(
					`/transactions/${id}`,
					data,
				);
				setTransactions((prev) =>
					prev.map((tx) => (tx.id === id ? response.data : tx)),
				);
				await fetchSummary();
				return response.data;
			} catch (error) {
				setError(
					error instanceof ApiError
						? error.message
						: "Failed to update transaction",
				);
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
				// ✅ apiClient.delete returns ApiSuccessResponse<null>
				await apiClient.delete<null>(`/transactions/${id}`);
				setTransactions((prev) => prev.filter((tx) => tx.id !== id));
				await fetchSummary();
				return true;
			} catch (error) {
				setError(
					error instanceof ApiError
						? error.message
						: "Failed to delete transaction",
				);
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
				// ✅ apiClient.post returns ApiSuccessResponse<BulkCreateResult>
				const response = await apiClient.post<BulkCreateResult>(
					"/transactions/bulk",
					data,
				);
				await Promise.all([fetchTransactions(), fetchSummary()]);
				return response.data;
			} catch (error) {
				setError(
					error instanceof ApiError
						? error.message
						: "Failed to bulk create",
				);
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
				// ✅ apiClient.delete with body returns ApiSuccessResponse<BulkDeleteResult>
				const response = await apiClient.delete<BulkDeleteResult>(
					"/transactions/bulk",
					data,
				);
				await Promise.all([fetchTransactions(), fetchSummary()]);
				return response.data;
			} catch (error) {
				setError(
					error instanceof ApiError
						? error.message
						: "Failed to bulk delete",
				);
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
				if (options.includeAttachments)
					queryParams.set("includeAttachments", "true");

				if (options.format === "csv") {
					const response = await fetch(
						`/api/transactions/export?${queryParams.toString()}`,
						{
							credentials: "include",
						},
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
					// ✅ apiClient.get returns ApiSuccessResponse<Transaction[]>
					const response = await apiClient.get<Transaction[]>(
						`/transactions/export?${queryParams.toString()}`,
					);
					return response.data;
				}
			} catch (error) {
				setError(
					error instanceof ApiError
						? error.message
						: "Failed to export",
				);
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
				// ✅ apiClient.get returns ApiSuccessResponse<Transaction>
				const response = await apiClient.get<Transaction>(
					`/transactions/${id}`,
				);
				return response.data;
			} catch (error) {
				setError(
					error instanceof ApiError
						? error.message
						: "Failed to fetch transaction",
				);
				return null;
			}
		},
		[isAuthenticated],
	);

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
