// components/pages/categories/index.tsx
"use client";

import { toast } from "sonner";
import { useEffect, useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoriesTable } from "./_components/categories-table";
import { CategoriesCards } from "./_components/categories-cards";
import { CategoriesHeader } from "./_components/categories-header";
import { CategoriesSkeleton } from "./_components/categories-skeleton";
import { useTheme, IViewMode } from "@/components/context/theme-context";
import { useCategories } from "@/components/context/categories-context/categories-context";

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

	const { viewMode, setViewMode } = useTheme();
	const [isFirstLoad, setIsFirstLoad] = useState(true);

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

	// ✅ Only show full skeleton on first load
	if (isFirstLoad && isLoading) {
		return <CategoriesSkeleton />;
	}

	const commonProps = {
		categories,
		pagination: pagination ?? null,
		isLoading: isLoading && !isFirstLoad,
		onPageChange: (page: number) =>
			fetchCategories({
				page,
				limit: pagination?.limit || 20,
			}),
		onLimitChange: (limit: number) => fetchCategories({ page: 1, limit }),
		// ✅ Pass deleteCategory function
		onDelete: deleteCategory,
	};

	return (
		<div className="container mx-auto px-1 space-y-6">
			<div className="flex items-center justify-between gap-5">
				<CategoriesHeader />
				{/* View Toggle */}
				<div className="flex items-center gap-1 border rounded-md p-1">
					<Button
						variant={
							viewMode === IViewMode.TABLE ? "secondary" : "ghost"
						}
						size="icon"
						className="h-8 w-8"
						onClick={() => setViewMode(IViewMode.TABLE)}
					>
						<List className="h-4 w-4" />
					</Button>
					<Button
						variant={
							viewMode === IViewMode.GRID ? "secondary" : "ghost"
						}
						size="icon"
						className="h-8 w-8"
						onClick={() => setViewMode(IViewMode.GRID)}
					>
						<LayoutGrid className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{viewMode === IViewMode.TABLE ? (
				<CategoriesTable {...commonProps} />
			) : (
				<CategoriesCards {...commonProps} />
			)}
		</div>
	);
}
