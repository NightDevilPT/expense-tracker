// components/pages/transactions/_components/transactions-table.tsx
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
import { Edit, Trash2, Eye, Folder, Landmark, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog";
import type {
	Transaction,
	TransactionType,
	Category,
	Account,
	Tag as TagType,
} from "@/lib/transaction-service/types";
import type { Pagination as PaginationType } from "@/lib/response-service";
import { TransactionsFormDialog } from "./transactions-form-dialog";
import { formatCurrency, CurrencyType, cn } from "@/lib/utils";

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

const TYPE_OPTIONS = [
	{ value: "ALL", label: "All Types" },
	{ value: "INCOME", label: "Income" },
	{ value: "EXPENSE", label: "Expense" },
	{ value: "TRANSFER", label: "Transfer" },
];

interface TransactionsTableProps {
	items: Transaction[];
	pagination?: PaginationType | null;
	isLoading?: boolean;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onDelete: (id: string) => Promise<boolean>;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	sortConfig?: SortConfig | null;
	onSortChange?: (sort: SortConfig) => void;
	typeFilter?: TransactionType | "ALL";
	onTypeFilterChange?: (type: TransactionType | "ALL") => void;
	categoryFilter?: string;
	onCategoryFilterChange?: (categoryId: string) => void;
	accountFilter?: string;
	onAccountFilterChange?: (accountId: string) => void;
	categories?: Category[];
	accounts?: Account[];
	tags?: TagType[];
	dateRange?: { from: Date | undefined; to: Date | undefined };
	onDateRangeChange?: (from: Date | undefined, to: Date | undefined) => void;
}

export function TransactionsTable({
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
	typeFilter = "ALL",
	onTypeFilterChange,
	categoryFilter = "ALL",
	onCategoryFilterChange,
	accountFilter = "ALL",
	onAccountFilterChange,
	categories = [],
	accounts = [],
}: TransactionsTableProps) {
	const columns: Column<Transaction>[] = [
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
			key: "date",
			header: "Date",
			sortable: true,
			cell: (item) => (
				<div className="text-sm">
					{new Date(item.date).toLocaleDateString()}
				</div>
			),
			className: "w-32",
		},
		{
			key: "description",
			header: "Description",
			sortable: true,
			cell: (item) => (
				<div className="space-y-1">
					<div className="font-medium">
						{item.description || "No description"}
					</div>
					{item.notes && (
						<div className="text-xs text-muted-foreground truncate max-w-[200px]">
							{item.notes}
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
							? "text-green-600 dark:text-green-400"
							: "text-red-600 dark:text-red-400",
					)}
				>
					{item.type === "INCOME" ? "+" : "-"}
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
			key: "category",
			header: "Category",
			cell: (item) => (
				<div className="flex items-center gap-2">
					{item.category?.color && (
						<div
							className="h-2 w-2 rounded-full"
							style={{ backgroundColor: item.category.color }}
						/>
					)}
					<span className="text-sm">
						{item.category?.name || "Uncategorized"}
					</span>
				</div>
			),
			className: "w-36",
		},
		{
			key: "account",
			header: "Account",
			cell: (item) => (
				<div className="flex items-center gap-2">
					<Landmark className="h-3 w-3 text-muted-foreground" />
					<span className="text-sm">
						{item.account?.name || "Unknown"}
					</span>
				</div>
			),
			className: "w-36",
			hideOnMobile: true,
		},
		{
			key: "tags",
			header: "Tags",
			cell: (item) => (
				<div className="flex items-center gap-1 flex-wrap">
					{item.tags?.map((t) => (
						<Badge
							key={t.tagId}
							variant="outline"
							className="text-xs"
						>
							<Tag className="h-2 w-2 mr-1" />
							{t.tag?.name}
						</Badge>
					))}
				</div>
			),
			className: "w-40",
			hideOnMobile: true,
		},
		{
			key: "actions",
			header: "",
			cell: (item) => (
				<div className="flex items-center justify-end gap-1">
					<TransactionsFormDialog
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
						title="Delete Transaction"
						itemName={item.description || "this transaction"}
						itemType="transaction"
						description="This action cannot be undone. The transaction will be permanently deleted."
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
			className: "w-16 text-right",
		},
	];

	const categoryOptions = [
		{ value: "ALL", label: "All Categories" },
		...categories.map((c) => ({ value: c.id, label: c.name })),
	];

	const accountOptions = [
		{ value: "ALL", label: "All Accounts" },
		...accounts.map((a) => ({ value: a.id, label: a.name })),
	];

	const filterSlot = (
		<div className="flex items-center gap-2 flex-wrap">
			{onTypeFilterChange && (
				<Select
					value={typeFilter}
					onValueChange={(value) =>
						onTypeFilterChange(value as TransactionType | "ALL")
					}
				>
					<SelectTrigger className="w-[130px]">
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
			{onCategoryFilterChange && (
				<Select
					value={categoryFilter}
					onValueChange={onCategoryFilterChange}
				>
					<SelectTrigger className="w-[150px]">
						<SelectValue placeholder="Filter by category" />
					</SelectTrigger>
					<SelectContent>
						{categoryOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
			{onAccountFilterChange && (
				<Select
					value={accountFilter}
					onValueChange={onAccountFilterChange}
				>
					<SelectTrigger className="w-[150px]">
						<SelectValue placeholder="Filter by account" />
					</SelectTrigger>
					<SelectContent>
						{accountOptions.map((option) => (
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
			emptyMessage="No transactions found"
			emptyDescription="Create your first transaction to get started."
			searchPlaceholder="Search by description..."
			searchValue={searchValue}
			onSearchChange={onSearchChange}
			sortConfig={sortConfig}
			onSortChange={onSortChange}
			filterSlot={filterSlot}
		/>
	);
}
