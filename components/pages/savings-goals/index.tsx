// components/pages/savings-goals/index.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { SavingsGoalsHeader } from "./_components/savings-goals-header";
import { useTheme, IViewMode } from "@/components/context/theme-context";
import { useSavingsGoals } from "@/components/context/savings-goals-context/savings-goals-context";
import type { SortConfig } from "@/components/shared/data-table";
import type { SavingsGoalStatus } from "@/lib/savings-goal-service/types";
import ToggleView from "@/components/shared/toggle-view";
import { SavingsGoalsTable } from "./_components/savings-goals-table";
import { SavingsGoalsCards } from "./_components/savings-goals-cards";

export function SavingsGoalsPage() {
	const {
		goals,
		pagination,
		isLoading,
		error,
		fetchGoals,
		deleteGoal,
		clearError,
	} = useSavingsGoals();

	const { viewMode } = useTheme();
	const [isFirstLoad, setIsFirstLoad] = useState(true);
	const [isMobileView, setIsMobileView] = useState(false);

	// Search & Sort state
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<SortConfig | null>(null);
	const [statusFilter, setStatusFilter] = useState<SavingsGoalStatus | "ALL">(
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
		fetchGoals({ page: 1, limit: 20 }).finally(() => setIsFirstLoad(false));
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
				fetchGoals({
					page: 1,
					limit: pagination?.limit || 20,
					status: statusFilter !== "ALL" ? statusFilter : undefined,
					sortBy: sort?.key as
						| "deadline"
						| "targetAmount"
						| "currentAmount"
						| "progress"
						| "createdAt"
						| undefined,
					sortOrder: sort?.direction,
				});
			}, 300);
		},
		[fetchGoals, pagination?.limit, statusFilter, sort],
	);

	// Sort change
	const handleSortChange = useCallback(
		(newSort: SortConfig) => {
			setSort(newSort);
			fetchGoals({
				page: 1,
				limit: pagination?.limit || 20,
				status: statusFilter !== "ALL" ? statusFilter : undefined,
				sortBy: newSort.key as
					| "deadline"
					| "targetAmount"
					| "currentAmount"
					| "progress"
					| "createdAt"
					| undefined,
				sortOrder: newSort.direction,
			});
		},
		[fetchGoals, pagination?.limit, statusFilter],
	);

	// Status filter change
	const handleStatusFilterChange = useCallback(
		(status: SavingsGoalStatus | "ALL") => {
			setStatusFilter(status);
			fetchGoals({
				page: 1,
				limit: pagination?.limit || 20,
				status: status !== "ALL" ? status : undefined,
				sortBy: sort?.key as
					| "deadline"
					| "targetAmount"
					| "currentAmount"
					| "progress"
					| "createdAt"
					| undefined,
				sortOrder: sort?.direction,
			});
		},
		[fetchGoals, pagination?.limit, sort],
	);

	// Page change
	const handlePageChange = useCallback(
		(page: number) => {
			fetchGoals({
				page,
				limit: pagination?.limit || 20,
				status: statusFilter !== "ALL" ? statusFilter : undefined,
				sortBy: sort?.key as
					| "deadline"
					| "targetAmount"
					| "currentAmount"
					| "progress"
					| "createdAt"
					| undefined,
				sortOrder: sort?.direction,
			});
		},
		[fetchGoals, pagination?.limit, statusFilter, sort],
	);

	// Limit change
	const handleLimitChange = useCallback(
		(limit: number) => {
			fetchGoals({
				page: 1,
				limit,
				status: statusFilter !== "ALL" ? statusFilter : undefined,
				sortBy: sort?.key as
					| "deadline"
					| "targetAmount"
					| "currentAmount"
					| "progress"
					| "createdAt"
					| undefined,
				sortOrder: sort?.direction,
			});
		},
		[fetchGoals, statusFilter, sort],
	);

	// Cleanup debounce
	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

	// Common props passed to BOTH table and cards
	const commonProps = {
		goals,
		pagination: pagination ?? null,
		isLoading,
		onDelete: deleteGoal,
		searchValue: search,
		onSearchChange: handleSearchChange,
		sortConfig: sort,
		onSortChange: handleSortChange,
		onPageChange: handlePageChange,
		onLimitChange: handleLimitChange,
		statusFilter,
		onStatusFilterChange: handleStatusFilterChange,
	};

	// Determine which view to show
	const showCardView = isMobileView || viewMode === IViewMode.GRID;
	const showTableView = !isMobileView && viewMode === IViewMode.TABLE;

	return (
		<div className="h-full grid grid-rows-[auto_1fr]">
			<div className="flex items-center justify-between">
				<SavingsGoalsHeader />
				{!isMobileView && <ToggleView />}
			</div>
			<div className="px-1">
				{showTableView ? (
					<SavingsGoalsTable {...commonProps} />
				) : (
					<SavingsGoalsCards {...commonProps} />
				)}
			</div>
		</div>
	);
}
