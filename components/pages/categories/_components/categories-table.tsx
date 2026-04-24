// components/pages/categories/_components/categories-table.tsx
"use client";

import {
	DataTable,
	type Column,
	type SortConfig,
} from "@/components/shared/data-table";
import {
	Edit,
	Trash2,
	TrendingDown,
	TrendingUp,
	ArrowRightLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getIconByName } from "@/lib/icon-utils";
import { CategoryFormDialog } from "./category-form-dialog";
import type { Category } from "@/lib/category-service/types";
import type { Pagination as PaginationType } from "@/lib/response-service";
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog";

interface CategoriesTableProps {
	categories: Category[];
	pagination?: PaginationType | null;
	isLoading?: boolean;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onDelete: (id: string) => Promise<boolean>;
	// Search & Sort
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	sortConfig?: SortConfig | null;
	onSortChange?: (sort: SortConfig) => void;
}

const typeConfig = {
	INCOME: { label: "Income", variant: "success" as const, icon: TrendingUp },
	EXPENSE: {
		label: "Expense",
		variant: "destructive" as const,
		icon: TrendingDown,
	},
	TRANSFER: {
		label: "Transfer",
		variant: "outline" as const,
		icon: ArrowRightLeft,
	},
};

export function CategoriesTable({
	categories,
	pagination,
	isLoading,
	onPageChange,
	onLimitChange,
	onDelete,
	searchValue = "",
	onSearchChange,
	sortConfig,
	onSortChange,
}: CategoriesTableProps) {
	const columns: Column<Category>[] = [
		{
			key: "index",
			header: "#",
			cell: (_, index) => (
				<span className="text-xs text-muted-foreground tabular-nums">
					{((pagination?.page || 1) - 1) * (pagination?.limit || 20) +
						index +
						1}
				</span>
			),
			className: "w-12",
		},
		{
			key: "name",
			header: "Name",
			sortable: true, // ✅ Sortable
			cell: (category) => {
				const Icon = getIconByName(category.icon);
				return (
					<div className="flex items-center gap-2.5">
						<div
							className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
							style={{
								backgroundColor: category.color
									? `${category.color}18`
									: "transparent",
							}}
						>
							<Icon
								className="h-3.5 w-3.5"
								style={{ color: category.color || "#71717a" }}
							/>
						</div>
						<span className="text-sm font-medium">
							{category.name}
						</span>
					</div>
				);
			},
		},
		{
			key: "type",
			header: "Type",
			sortable: true, // ✅ Sortable
			cell: (category) => {
				const config = typeConfig[category.type] || typeConfig.EXPENSE;
				const TypeIcon = config.icon;
				return (
					<Badge
						variant={config.variant}
						className={`gap-1 ${
							config.variant === "destructive"
								? "text-destructive-foreground"
								: ""
						}`}
					>
						<TypeIcon className="h-3 w-3" />
						{config.label}
					</Badge>
				);
			},
		},
		{
			key: "color",
			header: "Color",
			cell: (category) =>
				category.color ? (
					<div className="flex items-center gap-2">
						<div
							className="h-4 w-4 rounded ring-1 ring-inset ring-black/10"
							style={{ backgroundColor: category.color }}
						/>
						<code className="text-xs text-muted-foreground">
							{category.color}
						</code>
					</div>
				) : (
					<span className="text-xs text-muted-foreground">—</span>
				),
			hideOnMobile: true,
		},
		{
			key: "actions",
			header: "",
			cell: (category) => (
				<div className="flex items-center justify-end gap-1">
					<CategoryFormDialog
						mode="edit"
						category={category}
						trigger={
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
							>
								<Edit className="h-3.5 w-3.5" />
							</Button>
						}
						onSuccess={() => onPageChange?.(pagination?.page || 1)}
					/>
					{!category.isDefault && (
						<DeleteAlertDialog
							title="Delete Category"
							itemName={category.name}
							itemType="category"
							onDelete={() => onDelete(category.id)}
							onSuccess={() =>
								onPageChange?.(pagination?.page || 1)
							}
							trigger={
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
								>
									<Trash2 className="h-3.5 w-3.5 text-destructive" />
								</Button>
							}
						/>
					)}
				</div>
			),
			className: "w-24 text-right",
		},
	];

	return (
		<DataTable
			data={categories}
			columns={columns}
			pagination={pagination}
			isLoading={isLoading}
			onPageChange={onPageChange}
			onLimitChange={onLimitChange}
			emptyMessage="No categories found"
			emptyDescription="Create your first category to get started."
			searchPlaceholder="Search categories..."
			searchValue={searchValue}
			onSearchChange={onSearchChange}
			sortConfig={sortConfig}
			onSortChange={onSortChange}
		/>
	);
}
