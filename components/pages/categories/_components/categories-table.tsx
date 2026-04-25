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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	sortConfig?: SortConfig | null;
	onSortChange?: (sort: SortConfig) => void;
	typeFilter?: "INCOME" | "EXPENSE" | "TRANSFER" | "ALL";
	onTypeFilterChange?: (
		type: "INCOME" | "EXPENSE" | "TRANSFER" | "ALL",
	) => void;
}

const typeConfig = {
	INCOME: { label: "Income", variant: "default" as const, icon: TrendingUp },
	EXPENSE: {
		label: "Expense",
		variant: "destructive" as const,
		icon: TrendingDown,
	},
	TRANSFER: {
		label: "Transfer",
		variant: "secondary" as const,
		icon: ArrowRightLeft,
	},
};

const TYPE_OPTIONS = [
	{ value: "ALL", label: "All Types" },
	{ value: "INCOME", label: "Income" },
	{ value: "EXPENSE", label: "Expense" },
	{ value: "TRANSFER", label: "Transfer" },
];

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
	typeFilter = "ALL",
	onTypeFilterChange,
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
			sortable: true,
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
						{category.isDefault && (
							<Badge variant="outline" className="text-xs">
								Default
							</Badge>
						)}
					</div>
				);
			},
		},
		{
			key: "type",
			header: "Type",
			sortable: true,
			cell: (category) => {
				const config = typeConfig[category.type] || typeConfig.EXPENSE;
				const TypeIcon = config.icon;
				return (
					<Badge variant={config.variant} className="gap-1">
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
					/>
					{!category.isDefault && (
						<DeleteAlertDialog
							title="Delete Category"
							itemName={category.name}
							itemType="category"
							description="Transactions using this category will be affected."
							onDelete={() => onDelete(category.id)}
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

	const filterSlot = onTypeFilterChange ? (
		<Select
			value={typeFilter}
			onValueChange={(value) =>
				onTypeFilterChange(
					value as "INCOME" | "EXPENSE" | "TRANSFER" | "ALL",
				)
			}
		>
			<SelectTrigger className="w-[140px]">
				<SelectValue placeholder="Filter by type" />
			</SelectTrigger>
			<SelectContent>
				{TYPE_OPTIONS.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	) : undefined;

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
			filterSlot={filterSlot}
		/>
	);
}
