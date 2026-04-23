// components/context/accounts-context/accounts-context.tsx
"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import type {
	CreateAccountInput,
	UpdateAccountInput,
	AddBalanceInput,
} from "@/lib/account-service/validation";
import { apiClient, ApiError } from "@/lib/api-client";
import type {
	Account,
	AccountBalanceHistory,
	AccountType,
} from "@/lib/account-service/types";
import { useAuth } from "@/components/context/auth-context/auth-context";
import {
	ErrorCode,
	type ApiSuccessResponse,
	type ApiMeta,
} from "@/lib/response-service";

// ============================================
// TYPES
// ============================================

interface PaginatedHistoryResult {
	data: AccountBalanceHistory[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

interface AccountsContextType {
	accounts: Account[];
	pagination: ApiMeta["pagination"] | null;
	balanceHistory: AccountBalanceHistory[];
	historyPagination: ApiMeta["pagination"] | null;
	isLoading: boolean;
	error: string | null;
	fetchAccounts: (params?: {
		page?: number;
		limit?: number;
		search?: string;
		type?: AccountType;
		isDefault?: boolean;
	}) => Promise<void>;
	fetchBalanceHistory: (
		accountId: string,
		params?: {
			page?: number;
			limit?: number;
			days?: number;
		},
	) => Promise<void>;
	createAccount: (data: CreateAccountInput) => Promise<Account | null>;
	updateAccount: (
		id: string,
		data: UpdateAccountInput,
	) => Promise<Account | null>;
	deleteAccount: (id: string) => Promise<boolean>;
	addBalance: (id: string, data: AddBalanceInput) => Promise<Account | null>;
	getAccountById: (id: string) => Promise<Account | null>;
	clearError: () => void;
}

// ============================================
// CONTEXT
// ============================================

const AccountsContext = createContext<AccountsContextType | undefined>(
	undefined,
);

// ============================================
// PROVIDER
// ============================================

interface AccountsProviderProps {
	children: React.ReactNode;
}

export function AccountsProvider({ children }: AccountsProviderProps) {
	const { isAuthenticated } = useAuth();
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [pagination, setPagination] = useState<ApiMeta["pagination"] | null>(
		null,
	);
	const [balanceHistory, setBalanceHistory] = useState<
		AccountBalanceHistory[]
	>([]);
	const [historyPagination, setHistoryPagination] = useState<
		ApiMeta["pagination"] | null
	>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => setError(null), []);

	const fetchAccounts = useCallback(
		async (
			params: {
				page?: number;
				limit?: number;
				search?: string;
				type?: AccountType;
				isDefault?: boolean;
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
				if (params.search) queryParams.set("search", params.search);
				if (params.type) queryParams.set("type", params.type);
				if (params.isDefault !== undefined) {
					queryParams.set("isDefault", params.isDefault.toString());
				}

				const response = await apiClient.get<
					ApiSuccessResponse<Account[]>
				>(`/accounts?${queryParams.toString()}`);

				setAccounts(response.data);
				setPagination(response.meta.pagination || null);
			} catch (error) {
				const errorMessage =
					error instanceof ApiError
						? error.message
						: "Failed to fetch accounts";
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const fetchBalanceHistory = useCallback(
		async (
			accountId: string,
			params: {
				page?: number;
				limit?: number;
				days?: number;
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
				if (params.days)
					queryParams.set("days", params.days.toString());

				const response = await apiClient.get<
					ApiSuccessResponse<AccountBalanceHistory[]>
				>(`/accounts/${accountId}/history?${queryParams.toString()}`);

				setBalanceHistory(response.data);
				setHistoryPagination(response.meta.pagination || null);
			} catch (error) {
				const errorMessage =
					error instanceof ApiError
						? error.message
						: "Failed to fetch balance history";
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const createAccount = useCallback(
		async (data: CreateAccountInput): Promise<Account | null> => {
			if (!isAuthenticated) return null;

			setIsLoading(true);
			setError(null);

			try {
				const response = await apiClient.post<
					ApiSuccessResponse<Account>
				>("/accounts", data);
				const newAccount = response.data;
				setAccounts((prev) => [newAccount, ...prev]);
				return newAccount;
			} catch (error) {
				let errorMessage = "Failed to create account";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.ALREADY_EXISTS) {
						errorMessage =
							"An account with this name already exists";
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

	const updateAccount = useCallback(
		async (
			id: string,
			data: UpdateAccountInput,
		): Promise<Account | null> => {
			if (!isAuthenticated) return null;

			setIsLoading(true);
			setError(null);

			try {
				const response = await apiClient.put<
					ApiSuccessResponse<Account>
				>(`/accounts/${id}`, data);
				const updatedAccount = response.data;
				setAccounts((prev) =>
					prev.map((account) =>
						account.id === id ? updatedAccount : account,
					),
				);
				return updatedAccount;
			} catch (error) {
				let errorMessage = "Failed to update account";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Account not found";
					} else if (error.code === ErrorCode.ALREADY_EXISTS) {
						errorMessage =
							"An account with this name already exists";
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

	const deleteAccount = useCallback(
		async (id: string): Promise<boolean> => {
			if (!isAuthenticated) return false;

			setIsLoading(true);
			setError(null);

			try {
				await apiClient.delete<ApiSuccessResponse<null>>(
					`/accounts/${id}`,
				);
				setAccounts((prev) =>
					prev.filter((account) => account.id !== id),
				);
				return true;
			} catch (error) {
				let errorMessage = "Failed to delete account";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Account not found";
					} else if (error.code === ErrorCode.CONFLICT) {
						errorMessage =
							"Cannot delete account with existing transactions";
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

	const addBalance = useCallback(
		async (id: string, data: AddBalanceInput): Promise<Account | null> => {
			if (!isAuthenticated) return null;

			setIsLoading(true);
			setError(null);

			try {
				const response = await apiClient.put<
					ApiSuccessResponse<Account>
				>(`/accounts/${id}/add-balance`, data);
				const updatedAccount = response.data;
				setAccounts((prev) =>
					prev.map((account) =>
						account.id === id ? updatedAccount : account,
					),
				);
				return updatedAccount;
			} catch (error) {
				let errorMessage = "Failed to update balance";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Account not found";
					} else if (error.code === ErrorCode.BAD_REQUEST) {
						errorMessage =
							"Insufficient balance for this operation";
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

	const getAccountById = useCallback(
		async (id: string): Promise<Account | null> => {
			if (!isAuthenticated) return null;

			try {
				const response = await apiClient.get<
					ApiSuccessResponse<Account>
				>(`/accounts/${id}`);
				return response.data;
			} catch (error) {
				let errorMessage = "Failed to fetch account";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Account not found";
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
			fetchAccounts();
		}
	}, [isAuthenticated, fetchAccounts]);

	const value: AccountsContextType = {
		accounts,
		pagination,
		balanceHistory,
		historyPagination,
		isLoading,
		error,
		fetchAccounts,
		fetchBalanceHistory,
		createAccount,
		updateAccount,
		deleteAccount,
		addBalance,
		getAccountById,
		clearError,
	};

	return (
		<AccountsContext.Provider value={value}>
			{children}
		</AccountsContext.Provider>
	);
}

// ============================================
// HOOK
// ============================================

export function useAccounts() {
	const context = useContext(AccountsContext);
	if (context === undefined) {
		throw new Error("useAccounts must be used within a AccountsProvider");
	}
	return context;
}
