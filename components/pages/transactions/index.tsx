// components/pages/transactions/index.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useTransactions } from "@/components/context/transactions-context/transactions-context";
import { useCategories } from "@/components/context/categories-context/categories-context";
import { useAccounts } from "@/components/context/accounts-context/accounts-context";
import { useTags } from "@/components/context/tags-context/tags-context";
import type { SortConfig } from "@/components/shared/data-table";
import type { TransactionType } from "@/lib/transaction-service/types";
import { Button } from "@/components/ui/button";
import { Download, Filter, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TransactionsSkeletons } from "./_components/transactions-skeletons";
import { TransactionsHeader } from "./_components/transactions-header";
import { TransactionSummaryCards } from "./_components/transaction-summary-cards";
import { TransactionsTable } from "./_components/transactions-table";

export default function TransactionsPage() {
	const {
		transactions,
		pagination,
		summary,
		isLoading,
		error,
		fetchTransactions,
		fetchSummary,
		deleteTransaction,
		exportTransactions,
		clearError,
	} = useTransactions();
	const { categories } = useCategories();
	const { accounts } = useAccounts();
	const { tags } = useTags();

	const [isFirstLoad, setIsFirstLoad] = useState(true);
	const [search, setSearch] = useState("");
	const [typeFilter, setTypeFilter] = useState<TransactionType | "ALL">(
		"ALL",
	);
	const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
	const [accountFilter, setAccountFilter] = useState<string>("ALL");
	const [sort, setSort] = useState<SortConfig | null>(null);
	const [dateRange, setDateRange] = useState<{
		from: Date | undefined;
		to: Date | undefined;
	}>({
		from: undefined,
		to: undefined,
	});
	const debounceRef = useRef<NodeJS.Timeout | null>(null);
	const [isExporting, setIsExporting] = useState(false);

	// Initial fetch
	useEffect(() => {
		Promise.all([
			fetchTransactions({ page: 1, limit: 20 }),
			fetchSummary(),
		]).finally(() => setIsFirstLoad(false));
	}, [fetchTransactions, fetchSummary]);

	// Toast errors
	useEffect(() => {
		if (error) {
			toast.error(error);
			clearError();
		}
	}, [error, clearError]);

	// Debounced search
	const handleSearchChange = useCallback(
		(value: string) => {
			setSearch(value);
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => {
				fetchTransactions({
					page: 1,
					limit: pagination?.limit || 20,
					search: value || undefined,
					type: typeFilter !== "ALL" ? typeFilter : undefined,
					categoryId:
						categoryFilter !== "ALL" ? categoryFilter : undefined,
					accountId:
						accountFilter !== "ALL" ? accountFilter : undefined,
					startDate: dateRange.from?.toISOString(),
					endDate: dateRange.to?.toISOString(),
					sortBy: sort?.key as any,
					sortOrder: sort?.direction,
				});
			}, 300);
		},
		[
			fetchTransactions,
			pagination?.limit,
			typeFilter,
			categoryFilter,
			accountFilter,
			dateRange,
			sort,
		],
	);

	// Filter changes
	const handleTypeFilterChange = useCallback(
		(type: TransactionType | "ALL") => {
			setTypeFilter(type);
			fetchTransactions({
				page: 1,
				limit: pagination?.limit || 20,
				search: search || undefined,
				type: type !== "ALL" ? type : undefined,
				categoryId:
					categoryFilter !== "ALL" ? categoryFilter : undefined,
				accountId: accountFilter !== "ALL" ? accountFilter : undefined,
				startDate: dateRange.from?.toISOString(),
				endDate: dateRange.to?.toISOString(),
				sortBy: sort?.key as any,
				sortOrder: sort?.direction,
			});
		},
		[
			fetchTransactions,
			pagination?.limit,
			search,
			categoryFilter,
			accountFilter,
			dateRange,
			sort,
		],
	);

	const handleCategoryFilterChange = useCallback(
		(categoryId: string) => {
			setCategoryFilter(categoryId);
			fetchTransactions({
				page: 1,
				limit: pagination?.limit || 20,
				search: search || undefined,
				type: typeFilter !== "ALL" ? typeFilter : undefined,
				categoryId: categoryId !== "ALL" ? categoryId : undefined,
				accountId: accountFilter !== "ALL" ? accountFilter : undefined,
				startDate: dateRange.from?.toISOString(),
				endDate: dateRange.to?.toISOString(),
				sortBy: sort?.key as any,
				sortOrder: sort?.direction,
			});
		},
		[
			fetchTransactions,
			pagination?.limit,
			search,
			typeFilter,
			accountFilter,
			dateRange,
			sort,
		],
	);

	const handleAccountFilterChange = useCallback(
		(accountId: string) => {
			setAccountFilter(accountId);
			fetchTransactions({
				page: 1,
				limit: pagination?.limit || 20,
				search: search || undefined,
				type: typeFilter !== "ALL" ? typeFilter : undefined,
				categoryId:
					categoryFilter !== "ALL" ? categoryFilter : undefined,
				accountId: accountId !== "ALL" ? accountId : undefined,
				startDate: dateRange.from?.toISOString(),
				endDate: dateRange.to?.toISOString(),
				sortBy: sort?.key as any,
				sortOrder: sort?.direction,
			});
		},
		[
			fetchTransactions,
			pagination?.limit,
			search,
			typeFilter,
			categoryFilter,
			dateRange,
			sort,
		],
	);

	const handleDateRangeChange = useCallback(
		(from: Date | undefined, to: Date | undefined) => {
			setDateRange({ from, to });
			fetchTransactions({
				page: 1,
				limit: pagination?.limit || 20,
				search: search || undefined,
				type: typeFilter !== "ALL" ? typeFilter : undefined,
				categoryId:
					categoryFilter !== "ALL" ? categoryFilter : undefined,
				accountId: accountFilter !== "ALL" ? accountFilter : undefined,
				startDate: from?.toISOString(),
				endDate: to?.toISOString(),
				sortBy: sort?.key as any,
				sortOrder: sort?.direction,
			});
		},
		[
			fetchTransactions,
			pagination?.limit,
			search,
			typeFilter,
			categoryFilter,
			accountFilter,
			sort,
		],
	);

	// Sort change
	const handleSortChange = useCallback(
		(newSort: SortConfig) => {
			setSort(newSort);
			fetchTransactions({
				page: 1,
				limit: pagination?.limit || 20,
				search: search || undefined,
				type: typeFilter !== "ALL" ? typeFilter : undefined,
				categoryId:
					categoryFilter !== "ALL" ? categoryFilter : undefined,
				accountId: accountFilter !== "ALL" ? accountFilter : undefined,
				startDate: dateRange.from?.toISOString(),
				endDate: dateRange.to?.toISOString(),
				sortBy: newSort.key as any,
				sortOrder: newSort.direction,
			});
		},
		[
			fetchTransactions,
			pagination?.limit,
			search,
			typeFilter,
			categoryFilter,
			accountFilter,
			dateRange,
		],
	);

	// Page change
	const handlePageChange = useCallback(
		(page: number) => {
			fetchTransactions({
				page,
				limit: pagination?.limit || 20,
				search: search || undefined,
				type: typeFilter !== "ALL" ? typeFilter : undefined,
				categoryId:
					categoryFilter !== "ALL" ? categoryFilter : undefined,
				accountId: accountFilter !== "ALL" ? accountFilter : undefined,
				startDate: dateRange.from?.toISOString(),
				endDate: dateRange.to?.toISOString(),
				sortBy: sort?.key as any,
				sortOrder: sort?.direction,
			});
		},
		[
			fetchTransactions,
			pagination?.limit,
			search,
			typeFilter,
			categoryFilter,
			accountFilter,
			dateRange,
			sort,
		],
	);

	// Limit change
	const handleLimitChange = useCallback(
		(limit: number) => {
			fetchTransactions({
				page: 1,
				limit,
				search: search || undefined,
				type: typeFilter !== "ALL" ? typeFilter : undefined,
				categoryId:
					categoryFilter !== "ALL" ? categoryFilter : undefined,
				accountId: accountFilter !== "ALL" ? accountFilter : undefined,
				startDate: dateRange.from?.toISOString(),
				endDate: dateRange.to?.toISOString(),
				sortBy: sort?.key as any,
				sortOrder: sort?.direction,
			});
		},
		[
			fetchTransactions,
			search,
			typeFilter,
			categoryFilter,
			accountFilter,
			dateRange,
			sort,
		],
	);

	// Handle export
	const handleExport = useCallback(
		async (format: "csv" | "json") => {
			setIsExporting(true);
			try {
				const result = await exportTransactions({
					format,
					includeAttachments: false, // Add this required property
					startDate: dateRange.from?.toISOString(),
					endDate: dateRange.to?.toISOString(),
				});
				if (result) {
					toast.success(
						`Transactions exported as ${format.toUpperCase()}`,
					);
				}
			} finally {
				setIsExporting(false);
			}
		},
		[exportTransactions, dateRange],
	);

	// Handle refresh
	const handleRefresh = useCallback(async () => {
		await Promise.all([
			fetchTransactions({
				page: pagination?.page || 1,
				limit: pagination?.limit || 20,
				search: search || undefined,
				type: typeFilter !== "ALL" ? typeFilter : undefined,
				categoryId:
					categoryFilter !== "ALL" ? categoryFilter : undefined,
				accountId: accountFilter !== "ALL" ? accountFilter : undefined,
				startDate: dateRange.from?.toISOString(),
				endDate: dateRange.to?.toISOString(),
				sortBy: sort?.key as any,
				sortOrder: sort?.direction,
			}),
			fetchSummary(),
		]);
		toast.success("Transactions refreshed");
	}, [
		fetchTransactions,
		fetchSummary,
		pagination,
		search,
		typeFilter,
		categoryFilter,
		accountFilter,
		dateRange,
		sort,
	]);

	const handleDelete = useCallback(
		async (id: string) => {
			const success = await deleteTransaction(id);
			if (success) {
				toast.success("Transaction deleted successfully");
				await fetchTransactions({
					page: pagination?.page || 1,
					limit: pagination?.limit || 20,
				});
				await fetchSummary();
			}
			return success;
		},
		[deleteTransaction, fetchTransactions, fetchSummary, pagination],
	);

	const commonProps = {
		items: transactions,
		pagination: pagination ?? null,
		isLoading,
		onDelete: handleDelete,
		searchValue: search,
		onSearchChange: handleSearchChange,
		sortConfig: sort,
		onSortChange: handleSortChange,
		onPageChange: handlePageChange,
		onLimitChange: handleLimitChange,
		typeFilter,
		onTypeFilterChange: handleTypeFilterChange,
		categoryFilter,
		onCategoryFilterChange: handleCategoryFilterChange,
		accountFilter,
		onAccountFilterChange: handleAccountFilterChange,
		categories,
		accounts,
		tags,
		dateRange,
		onDateRangeChange: handleDateRangeChange,
	};

	if (isFirstLoad) {
		return <TransactionsSkeletons />;
	}

	return (
		<div className="container mx-auto py-6 space-y-6">
			<div className="flex items-center justify-between">
				<TransactionsHeader />
				<div className="flex items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" disabled={isExporting}>
								<Download className="h-4 w-4 mr-2" />
								{isExporting ? "Exporting..." : "Export"}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem
								onClick={() => handleExport("csv")}
							>
								Export as CSV
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => handleExport("json")}
							>
								Export as JSON
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<Button
						variant="outline"
						size="icon"
						onClick={handleRefresh}
						disabled={isLoading}
					>
						<RefreshCw
							className={cn(
								"h-4 w-4",
								isLoading && "animate-spin",
							)}
						/>
					</Button>
				</div>
			</div>

			{/* Summary Cards */}
			{summary && <TransactionSummaryCards summary={summary} />}

			{/* Transactions Table */}
			<TransactionsTable {...commonProps} />
		</div>
	);
}
