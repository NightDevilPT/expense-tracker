// components/pages/categories/index.tsx
"use client";

import { toast } from "sonner";
import { useEffect, useState, useCallback, useRef } from "react";
import { CategoriesTable } from "./_components/categories-table";
import { CategoriesCards } from "./_components/categories-cards";
import { CategoriesHeader } from "./_components/categories-header";
import { useTheme, IViewMode } from "@/components/context/theme-context";
import { useCategories } from "@/components/context/categories-context/categories-context";
import type { SortConfig } from "@/components/shared/data-table";
import ToggleView from "@/components/shared/toggle-view";

export function CategoriesPage() {
	const {
		categories,
		pagination,
		isLoading,
		error,
		fetchCategories,
		deleteCategory,
		clearError,
	} = useCategories();

	const { viewMode } = useTheme();
	const [isFirstLoad, setIsFirstLoad] = useState(true);
	const [isMobileView, setIsMobileView] = useState(false);

	// Search & Sort state
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<SortConfig | null>(null);

	// Debounce timer for search
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
		fetchCategories({ page: 1, limit: 20 }).finally(() => {
			setIsFirstLoad(false);
		});
	}, []);

	// Error handling
	useEffect(() => {
		if (error) {
			toast.error(error);
			clearError();
		}
	}, [error, clearError]);

	// Handle search with debounce
	const handleSearchChange = useCallback(
		(value: string) => {
			setSearch(value);

			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}

			debounceRef.current = setTimeout(() => {
				fetchCategories({
					page: 1,
					limit: pagination?.limit || 20,
					search: value || undefined,
				});
			}, 300);
		},
		[fetchCategories, pagination?.limit],
	);

	// Handle sort change
	const handleSortChange = useCallback(
		(newSort: SortConfig) => {
			setSort(newSort);
			fetchCategories({
				page: 1,
				limit: pagination?.limit || 20,
				search: search || undefined,
			});
		},
		[fetchCategories, pagination?.limit, search],
	);

	// Handle page change
	const handlePageChange = useCallback(
		(page: number) => {
			fetchCategories({
				page,
				limit: pagination?.limit || 20,
				search: search || undefined,
			});
		},
		[fetchCategories, pagination?.limit, search],
	);

	// Handle limit change
	const handleLimitChange = useCallback(
		(limit: number) => {
			fetchCategories({
				page: 1,
				limit,
				search: search || undefined,
			});
		},
		[fetchCategories, search],
	);

	// Cleanup debounce on unmount
	useEffect(() => {
		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, []);

	const commonProps = {
		categories,
		pagination: pagination ?? null,
		// ✅ Built-in skeleton on first load, no spinner on subsequent loads
		isLoading: isFirstLoad && isLoading,
		onDelete: deleteCategory,
		// Search
		searchValue: search,
		onSearchChange: handleSearchChange,
		// Sort
		sortConfig: sort,
		onSortChange: handleSortChange,
		// Pagination
		onPageChange: handlePageChange,
		onLimitChange: handleLimitChange,
	};

	// Determine which view to show
	const showCardView = isMobileView || viewMode === IViewMode.GRID;
	const showTableView = !isMobileView && viewMode === IViewMode.TABLE;

	return (
		<div className="h-full grid grid-rows-[auto_1fr]">
			<div className="flex items-center justify-between">
				<CategoriesHeader />
				{!isMobileView && <ToggleView />}
			</div>
			<div>
				{showTableView ? (
					<CategoriesTable {...commonProps} />
				) : (
					<CategoriesCards {...commonProps} />
				)}
			</div>
		</div>
	);
}
