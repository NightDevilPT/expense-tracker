// components/pages/savings-goals/_components/savings-goals-table.tsx
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
import { Edit, Trash2, PiggyBank, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog";
import type {
	SavingsGoalWithProgress,
	SavingsGoalStatus,
} from "@/lib/savings-goal-service/types";
import type { Pagination as PaginationType } from "@/lib/response-service";
import { ContributeDialog } from "./contribute-dialog";
import { SavingsGoalFormDialog } from "./savings-goal-form-dialog";

const STATUS_CONFIG: Record<
	SavingsGoalStatus,
	{
		label: string;
		variant: "default" | "secondary" | "outline" | "destructive";
	}
> = {
	ACTIVE: { label: "Active", variant: "default" },
	COMPLETED: { label: "Completed", variant: "secondary" },
	FAILED: { label: "Failed", variant: "destructive" },
	CANCELLED: { label: "Cancelled", variant: "outline" },
};

const STATUS_OPTIONS = [
	{ value: "ALL", label: "All Status" },
	{ value: "ACTIVE", label: "Active" },
	{ value: "COMPLETED", label: "Completed" },
	{ value: "FAILED", label: "Failed" },
	{ value: "CANCELLED", label: "Cancelled" },
];

interface SavingsGoalsTableProps {
	goals: SavingsGoalWithProgress[];
	pagination?: PaginationType | null;
	isLoading?: boolean;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onDelete: (id: string) => Promise<boolean>;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	sortConfig?: SortConfig | null;
	onSortChange?: (sort: SortConfig) => void;
	statusFilter?: SavingsGoalStatus | "ALL";
	onStatusFilterChange?: (status: SavingsGoalStatus | "ALL") => void;
}

export function SavingsGoalsTable({
	goals,
	pagination,
	isLoading,
	onPageChange,
	onLimitChange,
	onDelete,
	searchValue = "",
	onSearchChange,
	sortConfig,
	onSortChange,
	statusFilter = "ALL",
	onStatusFilterChange,
}: SavingsGoalsTableProps) {
	const columns: Column<SavingsGoalWithProgress>[] = [
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
			header: "Goal",
			sortable: true,
			cell: (item) => (
				<div className="flex items-center gap-2">
					<div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
						<PiggyBank className="h-4 w-4 text-primary" />
					</div>
					<div className="min-w-0">
						<p className="font-medium truncate">{item.name}</p>
						{item.linkedCategory && (
							<p className="text-xs text-muted-foreground truncate">
								{item.linkedCategory.name}
							</p>
						)}
					</div>
				</div>
			),
		},
		{
			key: "progress",
			header: "Progress",
			sortable: true,
			cell: (item) => (
				<div className="w-32">
					<div className="flex items-center justify-between mb-1">
						<span className="text-sm font-medium">
							{item.progress.toFixed(1)}%
						</span>
						<span className="text-xs text-muted-foreground">
							${item.currentAmount.toLocaleString()}
						</span>
					</div>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Progress
									value={item.progress}
									className="h-2"
								/>
							</TooltipTrigger>
							<TooltipContent>
								<p>
									${item.currentAmount.toLocaleString()} of $
									{item.targetAmount.toLocaleString()}
								</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			),
			className: "w-36",
		},
		{
			key: "targetAmount",
			header: "Target",
			sortable: true,
			cell: (item) => (
				<div className="flex items-center gap-1 text-sm">
					<Target className="h-3.5 w-3.5 text-muted-foreground" />
					<span>${item.targetAmount.toLocaleString()}</span>
				</div>
			),
			className: "w-28",
			hideOnMobile: true,
		},
		{
			key: "deadline",
			header: "Deadline",
			sortable: true,
			cell: (item) => (
				<div className="flex items-center gap-1 text-sm">
					<Clock className="h-3.5 w-3.5 text-muted-foreground" />
					<span
						className={
							item.isOverdue ? "text-destructive font-medium" : ""
						}
					>
						{new Date(item.deadline).toLocaleDateString()}
						{item.daysRemaining > 0 && (
							<span className="text-xs text-muted-foreground ml-1">
								({item.daysRemaining}d)
							</span>
						)}
					</span>
				</div>
			),
			className: "w-40",
			hideOnMobile: true,
		},
		{
			key: "status",
			header: "Status",
			sortable: true,
			cell: (item) => {
				const config = STATUS_CONFIG[item.status];
				return <Badge variant={config.variant}>{config.label}</Badge>;
			},
			className: "w-28",
		},
		{
			key: "actions",
			header: "",
			cell: (item) => (
				<div className="flex items-center justify-end gap-1">
					{item.status === "ACTIVE" && (
						<ContributeDialog
							goal={item}
							trigger={
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
								>
									<PiggyBank className="h-3.5 w-3.5 text-green-600" />
								</Button>
							}
							onSuccess={() => {
								onSearchChange?.(searchValue);
							}}
						/>
					)}
					<SavingsGoalFormDialog
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
						title="Delete Savings Goal"
						itemName={item.name}
						itemType="savings goal"
						description="This will permanently delete this savings goal and all its progress data."
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
			className: "w-32 text-right",
		},
	];

	const filterSlot = onStatusFilterChange ? (
		<Select
			value={statusFilter}
			onValueChange={(value) =>
				onStatusFilterChange(value as SavingsGoalStatus | "ALL")
			}
		>
			<SelectTrigger className="w-[160px]">
				<SelectValue placeholder="Filter by status" />
			</SelectTrigger>
			<SelectContent>
				{STATUS_OPTIONS.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	) : undefined;

	return (
		<DataTable
			data={goals}
			columns={columns}
			pagination={pagination}
			isLoading={isLoading}
			onPageChange={onPageChange}
			onLimitChange={onLimitChange}
			emptyMessage="No savings goals found"
			emptyDescription="Create your first savings goal to start tracking your progress."
			searchPlaceholder="Search goals..."
			searchValue={searchValue}
			onSearchChange={onSearchChange}
			sortConfig={sortConfig}
			onSortChange={onSortChange}
			filterSlot={filterSlot}
		/>
	);
}
