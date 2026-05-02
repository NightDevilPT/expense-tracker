// components/pages/budgets/index.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useTheme, IViewMode } from "@/components/context/theme-context";
import { useBudgets } from "@/components/context/budgets-context/budgets-context";
import type { SortConfig } from "@/components/shared/data-table";
import type { BudgetPeriod } from "@/lib/budget-service/types";
import { BudgetsTable } from "./_components/budgets-table";
import { BudgetCards } from "./_components/budgets-cards";
import GenericPageHeader from "@/components/shared/page-header/page-header";
import { BudgetFormDialog } from "./_components/budgets-form-dialog";

export function BudgetsPage() {
	const {
		budgets,
		pagination,
		isLoading,
		error,
		fetchBudgets,
		deleteBudget,
		clearError,
	} = useBudgets();

	const { viewMode } = useTheme();
	const [isFirstLoad, setIsFirstLoad] = useState(true);
	const [isMobileView, setIsMobileView] = useState(false);

	// Search & Sort state — managed HERE, not in context
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<SortConfig | null>(null);
	const [periodFilter, setPeriodFilter] = useState<BudgetPeriod | "ALL">(
		"ALL",
	);
	const debounceRef = useRef<NodeJS.Timeout | null>(null);

	// Check screen size for responsive behavior
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
		fetchBudgets({ page: 1, limit: 20 }).finally(() =>
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
				fetchBudgets({
					page: 1,
					limit: pagination?.limit || 20,
					period: periodFilter !== "ALL" ? periodFilter : undefined,
					categoryId: value || undefined,
				});
			}, 300);
		},
		[fetchBudgets, pagination?.limit, periodFilter],
	);

	// Sort change
	const handleSortChange = useCallback(
		(newSort: SortConfig) => {
			setSort(newSort);
			fetchBudgets({
				page: 1,
				limit: pagination?.limit || 20,
				period: periodFilter !== "ALL" ? periodFilter : undefined,
				categoryId: search || undefined,
				sortBy: newSort.key as
					| "startDate"
					| "amount"
					| "spent"
					| "remaining",
				sortOrder: newSort.direction,
			});
		},
		[fetchBudgets, pagination?.limit, search, periodFilter],
	);

	// Period filter change
	const handlePeriodFilterChange = useCallback(
		(period: BudgetPeriod | "ALL") => {
			setPeriodFilter(period);
			fetchBudgets({
				page: 1,
				limit: pagination?.limit || 20,
				period: period !== "ALL" ? period : undefined,
				categoryId: search || undefined,
			});
		},
		[fetchBudgets, pagination?.limit, search],
	);

	// Page change
	const handlePageChange = useCallback(
		(page: number) => {
			fetchBudgets({
				page,
				limit: pagination?.limit || 20,
				period: periodFilter !== "ALL" ? periodFilter : undefined,
				categoryId: search || undefined,
			});
		},
		[fetchBudgets, pagination?.limit, search, periodFilter],
	);

	// Limit change
	const handleLimitChange = useCallback(
		(limit: number) => {
			fetchBudgets({
				page: 1,
				limit,
				period: periodFilter !== "ALL" ? periodFilter : undefined,
				categoryId: search || undefined,
			});
		},
		[fetchBudgets, search, periodFilter],
	);

	// Cleanup debounce
	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

	// Common props passed to BOTH table and cards
	const commonProps = {
		items: budgets,
		pagination: pagination ?? null,
		isLoading: isFirstLoad && isLoading,
		onDelete: deleteBudget,
		searchValue: search,
		onSearchChange: handleSearchChange,
		sortConfig: sort,
		onSortChange: handleSortChange,
		onPageChange: handlePageChange,
		onLimitChange: handleLimitChange,
		periodFilter,
		onPeriodFilterChange: handlePeriodFilterChange,
	};

	// Determine which view to show
	const showCardView = isMobileView || viewMode === IViewMode.GRID;
	const showTableView = !isMobileView && viewMode === IViewMode.TABLE;

	return (
		<div className="h-full grid grid-rows-[auto_1fr]">
			<GenericPageHeader
				title="Budgets"
				subtitle="Manage your budget allocations and track spending"
				showGridToggle={!isMobileView}
				form={<BudgetFormDialog />}
			/>
			<div>
				{showTableView ? (
					<BudgetsTable {...commonProps} />
				) : (
					<BudgetCards {...commonProps} />
				)}
			</div>
		</div>
	);
}
