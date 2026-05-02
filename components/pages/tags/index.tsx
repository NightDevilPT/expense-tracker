// components/pages/tags/index.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { TagsTable } from "./_components/tags-table";
import { TagsCards } from "./_components/tags-cards";
import { useTheme, IViewMode } from "@/components/context/theme-context";
import { useTags } from "@/components/context/tags-context/tags-context";
import type { SortConfig } from "@/components/shared/data-table";
import GenericPageHeader from "@/components/shared/page-header/page-header";
import { TagsFormDialog } from "./_components/tags-form-dialog";

export function TagsPage() {
	const {
		tags,
		pagination,
		isLoading,
		error,
		fetchTags,
		deleteTag,
		clearError,
	} = useTags();

	const { viewMode } = useTheme();
	const [isFirstLoad, setIsFirstLoad] = useState(true);
	const [isMobileView, setIsMobileView] = useState(false);

	// Search & Sort state — managed HERE, not in context
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<SortConfig | null>(null);
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
		fetchTags({ page: 1, limit: 20 }).finally(() => setIsFirstLoad(false));
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
				fetchTags({
					page: 1,
					limit: pagination?.limit || 20,
					search: value || undefined,
				});
			}, 300);
		},
		[fetchTags, pagination?.limit],
	);

	// Sort change
	const handleSortChange = useCallback(
		(newSort: SortConfig) => {
			setSort(newSort);
			fetchTags({
				page: 1,
				limit: pagination?.limit || 20,
				search: search || undefined,
				sortBy: newSort.key as
					| "name"
					| "transactionCount"
					| "createdAt",
				sortOrder: newSort.direction,
			});
		},
		[fetchTags, pagination?.limit, search],
	);

	// Page change
	const handlePageChange = useCallback(
		(page: number) => {
			fetchTags({
				page,
				limit: pagination?.limit || 20,
				search: search || undefined,
				sortBy: sort?.key as "name" | "transactionCount" | "createdAt",
				sortOrder: sort?.direction,
			});
		},
		[fetchTags, pagination?.limit, search, sort],
	);

	// Limit change
	const handleLimitChange = useCallback(
		(limit: number) => {
			fetchTags({
				page: 1,
				limit,
				search: search || undefined,
				sortBy: sort?.key as "name" | "transactionCount" | "createdAt",
				sortOrder: sort?.direction,
			});
		},
		[fetchTags, search, sort],
	);

	// Cleanup debounce on unmount
	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

	// Common props passed to BOTH table and cards
	const commonProps = {
		items: tags,
		pagination: pagination ?? null,
		isLoading: isLoading, // Skeletons only on first load
		onDelete: deleteTag,
		searchValue: search,
		onSearchChange: handleSearchChange,
		sortConfig: sort,
		onSortChange: handleSortChange,
		onPageChange: handlePageChange,
		onLimitChange: handleLimitChange,
	};

	// Determine which view to show
	const showCardView = isMobileView || viewMode === IViewMode.GRID;
	const showTableView = !isMobileView && viewMode === IViewMode.TABLE;

	return (
		<div className="h-full grid grid-rows-[auto_1fr]">
			<GenericPageHeader
				title="Tags"
				subtitle="Manage your transaction tags"
				showGridToggle={!isMobileView}
				form={<TagsFormDialog />}
			/>
			<div>
				{showTableView ? (
					<TagsTable {...commonProps} />
				) : (
					<TagsCards {...commonProps} />
				)}
			</div>
		</div>
	);
}
