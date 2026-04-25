// components/pages/accounts/index.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { AccountsHeader } from "./_components/accounts-header";
import { useTheme, IViewMode } from "@/components/context/theme-context";
import { useAccounts } from "@/components/context/accounts-context/accounts-context";
import type { SortConfig } from "@/components/shared/data-table";
import type { AccountType } from "@/lib/account-service/types";
import ToggleView from "@/components/shared/toggle-view";
import { AccountsTable } from "./_components/accounts-table";
import { AccountsCards } from "./_components/accounts-cards";

export function AccountsPage() {
	const {
		accounts,
		pagination,
		isLoading,
		error,
		fetchAccounts,
		deleteAccount,
		clearError,
	} = useAccounts();

	const { viewMode } = useTheme();
	const [isFirstLoad, setIsFirstLoad] = useState(true);
	const [isMobileView, setIsMobileView] = useState(false);

	// Search, Sort & Filter state — managed HERE, not in context
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<SortConfig | null>(null);
	const [typeFilter, setTypeFilter] = useState<AccountType | "ALL">("ALL");
	const debounceRef = useRef<NodeJS.Timeout | null>(null);

	// Check screen size (900px or below = mobile view - show cards only)
	useEffect(() => {
		const checkScreenSize = () => {
			setIsMobileView(window.innerWidth <= 900);
		};

		checkScreenSize();
		window.addEventListener("resize", checkScreenSize);

		return () => window.removeEventListener("resize", checkScreenSize);
	}, []);

	// Initial fetch
	useEffect(() => {
		fetchAccounts({ page: 1, limit: 20 }).finally(() =>
			setIsFirstLoad(false),
		);
	}, []);

	// Toast errors
	useEffect(() => {
		if (error) {
			toast.error(error);
			clearError();
		}
	}, [error, clearError]);

	// Debounced search (300ms)
	const handleSearchChange = useCallback(
		(value: string) => {
			setSearch(value);
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => {
				fetchAccounts({
					page: 1,
					limit: pagination?.limit || 20,
					search: value || undefined,
					type: typeFilter !== "ALL" ? typeFilter : undefined,
				});
			}, 300);
		},
		[fetchAccounts, pagination?.limit, typeFilter],
	);

	// Sort change
	const handleSortChange = useCallback(
		(newSort: SortConfig) => {
			setSort(newSort);
			fetchAccounts({
				page: 1,
				limit: pagination?.limit || 20,
				search: search || undefined,
				type: typeFilter !== "ALL" ? typeFilter : undefined,
			});
		},
		[fetchAccounts, pagination?.limit, search, typeFilter],
	);

	// Type filter change
	const handleTypeFilterChange = useCallback(
		(type: AccountType | "ALL") => {
			setTypeFilter(type);
			fetchAccounts({
				page: 1,
				limit: pagination?.limit || 20,
				search: search || undefined,
				type: type !== "ALL" ? type : undefined,
			});
		},
		[fetchAccounts, pagination?.limit, search],
	);

	// Page change
	const handlePageChange = useCallback(
		(page: number) => {
			fetchAccounts({
				page,
				limit: pagination?.limit || 20,
				search: search || undefined,
				type: typeFilter !== "ALL" ? typeFilter : undefined,
			});
		},
		[fetchAccounts, pagination?.limit, search, typeFilter],
	);

	// Limit change
	const handleLimitChange = useCallback(
		(limit: number) => {
			fetchAccounts({
				page: 1,
				limit,
				search: search || undefined,
				type: typeFilter !== "ALL" ? typeFilter : undefined,
			});
		},
		[fetchAccounts, search, typeFilter],
	);

	// Cleanup debounce on unmount
	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

	// Common props passed to BOTH table and cards
	const commonProps = {
		accounts,
		pagination: pagination ?? null,
		isLoading,
		onDelete: deleteAccount,
		searchValue: search,
		onSearchChange: handleSearchChange,
		sortConfig: sort,
		onSortChange: handleSortChange,
		onPageChange: handlePageChange,
		onLimitChange: handleLimitChange,
		typeFilter,
		onTypeFilterChange: handleTypeFilterChange,
	};

	// Determine which view to show
	// On mobile view (<=900px): Always show cards (never table)
	// On desktop (>900px): Show table view (respect user's preference)
	const showCardView = isMobileView || viewMode === IViewMode.GRID;
	const showTableView = !isMobileView && viewMode === IViewMode.TABLE;

	return (
		<div className="h-full grid grid-rows-[auto_1fr]">
			<div className="flex items-center justify-between">
				<AccountsHeader />
				{/* Hide ToggleView on mobile screens since only cards are shown */}
				{!isMobileView && <ToggleView />}
			</div>
			<div>
				{showTableView ? (
					<AccountsTable {...commonProps} />
				) : (
					<AccountsCards {...commonProps} />
				)}
			</div>
		</div>
	);
}
