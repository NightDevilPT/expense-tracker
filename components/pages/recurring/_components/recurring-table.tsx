// components/pages/recurring/_components/recurring-table.tsx
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
import { Edit, Trash2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog";
import type {
	RecurringWithNextDue,
	TransactionType,
	RecurringFrequency,
} from "@/lib/recurring-service/types";
import type { Pagination as PaginationType } from "@/lib/response-service";
import { RecurringFormDialog } from "./recurring-form-dialog";
import { formatCurrency, CurrencyType } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<
	TransactionType,
	{
		label: string;
		variant: "default" | "secondary" | "destructive" | "outline";
	}
> = {
	INCOME: { label: "Income", variant: "default" },
	EXPENSE: { label: "Expense", variant: "destructive" },
	TRANSFER: { label: "Transfer", variant: "secondary" },
};

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
	DAILY: "Daily",
	WEEKLY: "Weekly",
	MONTHLY: "Monthly",
	YEARLY: "Yearly",
	CUSTOM: "Custom",
};

const TYPE_OPTIONS = [
	{ value: "ALL", label: "All Types" },
	{ value: "INCOME", label: "Income" },
	{ value: "EXPENSE", label: "Expense" },
	{ value: "TRANSFER", label: "Transfer" },
];

const FREQUENCY_OPTIONS = [
	{ value: "ALL", label: "All Frequencies" },
	{ value: "DAILY", label: "Daily" },
	{ value: "WEEKLY", label: "Weekly" },
	{ value: "MONTHLY", label: "Monthly" },
	{ value: "YEARLY", label: "Yearly" },
	{ value: "CUSTOM", label: "Custom" },
];

const STATUS_OPTIONS = [
	{ value: "ALL", label: "All" },
	{ value: "ACTIVE", label: "Active" },
	{ value: "PAUSED", label: "Paused" },
];

interface RecurringTableProps {
	items: RecurringWithNextDue[];
	pagination?: PaginationType | null;
	isLoading?: boolean;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onDelete: (id: string) => Promise<boolean>;
	onPause: (id: string) => Promise<void>;
	onResume: (id: string) => Promise<void>;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	sortConfig?: SortConfig | null;
	onSortChange?: (sort: SortConfig) => void;
	typeFilter?: TransactionType | "ALL";
	onTypeFilterChange?: (type: TransactionType | "ALL") => void;
	frequencyFilter?: RecurringFrequency | "ALL";
	onFrequencyFilterChange?: (frequency: RecurringFrequency | "ALL") => void;
	statusFilter?: "ACTIVE" | "PAUSED" | "ALL";
	onStatusFilterChange?: (status: "ACTIVE" | "PAUSED" | "ALL") => void;
}

export function RecurringTable({
	items,
	pagination,
	isLoading,
	onPageChange,
	onLimitChange,
	onDelete,
	onPause,
	onResume,
	searchValue = "",
	onSearchChange,
	sortConfig,
	onSortChange,
	typeFilter = "ALL",
	onTypeFilterChange,
	frequencyFilter = "ALL",
	onFrequencyFilterChange,
	statusFilter = "ALL",
	onStatusFilterChange,
}: RecurringTableProps) {
	const columns: Column<RecurringWithNextDue>[] = [
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
			cell: (item) => (
				<div className="space-y-1">
					<div className="font-medium">{item.name}</div>
					{item.description && (
						<div className="text-xs text-muted-foreground truncate max-w-[200px]">
							{item.description}
						</div>
					)}
				</div>
			),
		},
		{
			key: "amount",
			header: "Amount",
			sortable: true,
			cell: (item) => (
				<span
					className={cn(
						"font-medium",
						item.type === "INCOME"
							? "text-green-600"
							: "text-red-600",
					)}
				>
					{formatCurrency(item.amount, CurrencyType.USD)}
				</span>
			),
			className: "w-32",
		},
		{
			key: "type",
			header: "Type",
			sortable: true,
			cell: (item) => {
				const config = TYPE_CONFIG[item.type];
				return <Badge variant={config.variant}>{config.label}</Badge>;
			},
			className: "w-24",
		},
		{
			key: "frequency",
			header: "Frequency",
			sortable: true,
			cell: (item) => (
				<span className="text-sm">
					{FREQUENCY_LABELS[item.frequency]}
					{item.interval > 1 && ` (every ${item.interval})`}
				</span>
			),
			className: "w-32",
		},
		{
			key: "nextDueDate",
			header: "Next Due",
			sortable: true,
			cell: (item) => (
				<div className="space-y-1">
					<div className="text-sm">
						{new Date(item.nextDueDate).toLocaleDateString()}
					</div>
					{item.daysUntilDue <= 7 && item.isActive && (
						<Badge variant="outline" className="text-xs">
							{item.daysUntilDue === 0
								? "Due today"
								: `${item.daysUntilDue} days`}
						</Badge>
					)}
				</div>
			),
			className: "w-36",
		},
		{
			key: "status",
			header: "Status",
			cell: (item) => (
				<Badge variant={item.isActive ? "default" : "secondary"}>
					{item.isActive ? "Active" : "Paused"}
				</Badge>
			),
			className: "w-24",
		},
		{
			key: "actions",
			header: "",
			cell: (item) => (
				<div className="flex items-center justify-end gap-1">
					{item.isActive ? (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={() => onPause(item.id)}
						>
							<Pause className="h-3.5 w-3.5" />
						</Button>
					) : (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={() => onResume(item.id)}
						>
							<Play className="h-3.5 w-3.5" />
						</Button>
					)}
					<RecurringFormDialog
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
						title="Delete Recurring Transaction"
						itemName={item.name}
						itemType="recurring transaction"
						description="This will permanently delete this recurring transaction and all associated records."
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

	const filterSlot = (
		<div className="flex items-center gap-2">
			{onTypeFilterChange && (
				<Select
					value={typeFilter}
					onValueChange={(value) =>
						onTypeFilterChange(value as TransactionType | "ALL")
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
			)}
			{onFrequencyFilterChange && (
				<Select
					value={frequencyFilter}
					onValueChange={(value) =>
						onFrequencyFilterChange(
							value as RecurringFrequency | "ALL",
						)
					}
				>
					<SelectTrigger className="w-[160px]">
						<SelectValue placeholder="Filter by frequency" />
					</SelectTrigger>
					<SelectContent>
						{FREQUENCY_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
			{onStatusFilterChange && (
				<Select
					value={statusFilter}
					onValueChange={(value) =>
						onStatusFilterChange(
							value as "ACTIVE" | "PAUSED" | "ALL",
						)
					}
				>
					<SelectTrigger className="w-[130px]">
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
			)}
		</div>
	);

	return (
		<DataTable
			data={items}
			columns={columns}
			pagination={pagination}
			isLoading={isLoading}
			onPageChange={onPageChange}
			onLimitChange={onLimitChange}
			emptyMessage="No recurring transactions found"
			emptyDescription="Create your first recurring transaction to get started."
			searchPlaceholder="Search by name..."
			searchValue={searchValue}
			onSearchChange={onSearchChange}
			sortConfig={sortConfig}
			onSortChange={onSortChange}
			filterSlot={filterSlot}
		/>
	);
}
