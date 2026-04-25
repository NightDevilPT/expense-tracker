// components/pages/budgets/_components/budgets-table.tsx
"use client";

import {
	DataTable,
	type Column,
	type SortConfig,
} from "@/components/shared/data-table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog";
import type {
	BudgetWithProgress,
	BudgetPeriod,
} from "@/lib/budget-service/types";
import type { Pagination as PaginationType } from "@/lib/response-service";
import { BudgetFormDialog } from "./budgets-form-dialog";

const PERIOD_CONFIG: Record<
	BudgetPeriod,
	{ label: string; variant: "default" | "secondary" | "outline" }
> = {
	DAILY: { label: "Daily", variant: "default" },
	WEEKLY: { label: "Weekly", variant: "secondary" },
	MONTHLY: { label: "Monthly", variant: "outline" },
	YEARLY: { label: "Yearly", variant: "default" },
};

const PERIOD_OPTIONS = [
	{ value: "ALL", label: "All Periods" },
	{ value: "DAILY", label: "Daily" },
	{ value: "WEEKLY", label: "Weekly" },
	{ value: "MONTHLY", label: "Monthly" },
	{ value: "YEARLY", label: "Yearly" },
];

interface BudgetsTableProps {
	items: BudgetWithProgress[];
	pagination?: PaginationType | null;
	isLoading?: boolean;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onDelete: (id: string) => Promise<boolean>;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	sortConfig?: SortConfig | null;
	onSortChange?: (sort: SortConfig) => void;
	periodFilter?: BudgetPeriod | "ALL";
	onPeriodFilterChange?: (period: BudgetPeriod | "ALL") => void;
}

export function BudgetsTable({
	items,
	pagination,
	isLoading,
	onPageChange,
	onLimitChange,
	onDelete,
	searchValue = "",
	onSearchChange,
	sortConfig,
	onSortChange,
	periodFilter = "ALL",
	onPeriodFilterChange,
}: BudgetsTableProps) {
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(amount);
	};

	const columns: Column<BudgetWithProgress>[] = [
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
			key: "category",
			header: "Category",
			cell: (item) => (
				<div className="flex items-center gap-2">
					{item.category?.color && (
						<div
							className="w-3 h-3 rounded-full"
							style={{ backgroundColor: item.category.color }}
						/>
					)}
					<span className="font-medium">
						{item.category?.name || "All Categories"}
					</span>
				</div>
			),
		},
		{
			key: "period",
			header: "Period",
			sortable: true,
			cell: (item) => {
				const config = PERIOD_CONFIG[item.period];
				return <Badge variant={config.variant}>{config.label}</Badge>;
			},
			className: "w-28",
		},
		{
			key: "amount",
			header: "Budget",
			sortable: true,
			cell: (item) => (
				<span className="font-medium tabular-nums">
					{formatCurrency(item.amount)}
				</span>
			),
			className: "w-36",
		},
		{
			key: "spent",
			header: "Spent",
			sortable: true,
			cell: (item) => (
				<div className="space-y-1">
					<div className="flex items-center justify-between text-sm">
						<span className="tabular-nums">
							{formatCurrency(item.spent)}
						</span>
						<span
							className={`text-xs tabular-nums ${
								item.isOverBudget
									? "text-destructive font-medium"
									: "text-muted-foreground"
							}`}
						>
							{item.percentage.toFixed(1)}%
						</span>
					</div>
					<Progress
						value={Math.min(item.percentage, 100)}
						className={`h-2 ${
							item.isOverBudget
								? "[&>div]:bg-destructive"
								: item.isNearThreshold
									? "[&>div]:bg-amber-500"
									: "[&>div]:bg-primary"
						}`}
					/>
				</div>
			),
			className: "w-56",
		},
		{
			key: "remaining",
			header: "Remaining",
			sortable: true,
			cell: (item) => (
				<span
					className={`font-medium tabular-nums ${
						item.isOverBudget
							? "text-destructive"
							: item.isNearThreshold
								? "text-amber-500"
								: "text-emerald-600"
					}`}
				>
					{formatCurrency(item.remaining)}
				</span>
			),
			className: "w-36",
		},
		{
			key: "startDate",
			header: "Start Date",
			sortable: true,
			cell: (item) => (
				<div className="text-sm text-muted-foreground">
					{new Date(item.startDate).toLocaleDateString()}
				</div>
			),
			className: "w-32",
			hideOnMobile: true,
		},
		{
			key: "actions",
			header: "",
			cell: (item) => (
				<div className="flex items-center justify-end gap-1">
					<BudgetFormDialog
						mode="edit"
						item={item}
						trigger={
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
							>
								<Edit className="h-3.5 w-3.5" />
							</Button>
						}
						onSuccess={() => {
							onSearchChange?.(searchValue);
						}}
					/>
					<DeleteAlertDialog
						title="Delete Budget"
						itemName={item.category?.name || "All Categories"}
						itemType="budget"
						description="This will permanently delete this budget allocation and remove all associated tracking data."
						onDelete={() => onDelete(item.id)}
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
				</div>
			),
			className: "w-24 text-right",
		},
	];

	const filterSlot = onPeriodFilterChange ? (
		<Select
			value={periodFilter}
			onValueChange={(value) =>
				onPeriodFilterChange(value as BudgetPeriod | "ALL")
			}
		>
			<SelectTrigger className="w-[160px]">
				<SelectValue placeholder="Filter by period" />
			</SelectTrigger>
			<SelectContent>
				{PERIOD_OPTIONS.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	) : undefined;

	return (
		<DataTable
			data={items}
			columns={columns}
			pagination={pagination}
			isLoading={isLoading}
			onPageChange={onPageChange}
			onLimitChange={onLimitChange}
			emptyMessage="No budgets found"
			emptyDescription="Create your first budget to start tracking your spending."
			searchPlaceholder="Search by category name or ID..."
			searchValue={searchValue}
			onSearchChange={onSearchChange}
			sortConfig={sortConfig}
			onSortChange={onSortChange}
			filterSlot={filterSlot}
		/>
	);
}
