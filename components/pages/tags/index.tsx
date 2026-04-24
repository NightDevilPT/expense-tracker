// components/pages/tags/index.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TagsTable } from "./_components/tags-table";
import { useTheme, IViewMode } from "@/components/context/theme-context";
import { useTags } from "@/components/context/tags-context/tags-context";
import type { SortConfig } from "@/components/shared/data-table";
import { TagsHeader } from "./_components/tags-header";
import { TagsCards } from "./_components/tags-cards";
import ToggleView from "@/components/shared/toggle-view";

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

	const { viewMode, setViewMode } = useTheme();
	const [isFirstLoad, setIsFirstLoad] = useState(true);

	// Search & Sort state — managed HERE, not in context
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<SortConfig | null>(null);
	const debounceRef = useRef<NodeJS.Timeout | null>(null);

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

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<TagsHeader />
				<ToggleView />
			</div>

			<div className="px-1">
				{viewMode === IViewMode.TABLE ? (
					<TagsTable {...commonProps} />
				) : (
					<TagsCards {...commonProps} />
				)}
			</div>
		</div>
	);
}
