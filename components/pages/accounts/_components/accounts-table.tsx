// components/pages/accounts/_components/accounts-table.tsx
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AccountsFormDialog } from "./accounts-form-dialog";
import { Edit, Trash2, PlusCircle, Star } from "lucide-react";
import { AddBalanceDialog } from "./add-balance-dialog";
import type { Account, AccountType } from "@/lib/account-service/types";
import type { Pagination as PaginationType } from "@/lib/response-service";
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog";

const ACCOUNT_TYPE_CONFIG: Record<
	AccountType,
	{
		label: string;
		variant: "default" | "secondary" | "outline";
	}
> = {
	CASH: { label: "Cash", variant: "default" },
	BANK_ACCOUNT: { label: "Bank Account", variant: "secondary" },
	SAVINGS_ACCOUNT: { label: "Savings", variant: "outline" },
	CREDIT_CARD: { label: "Credit Card", variant: "secondary" },
	DIGITAL_WALLET: { label: "Digital Wallet", variant: "outline" },
	OTHER: { label: "Other", variant: "outline" },
};

const ACCOUNT_TYPE_OPTIONS: Array<{
	value: AccountType | "ALL";
	label: string;
}> = [
	{ value: "ALL", label: "All Types" },
	{ value: "CASH", label: "Cash" },
	{ value: "BANK_ACCOUNT", label: "Bank Account" },
	{ value: "SAVINGS_ACCOUNT", label: "Savings" },
	{ value: "CREDIT_CARD", label: "Credit Card" },
	{ value: "DIGITAL_WALLET", label: "Digital Wallet" },
	{ value: "OTHER", label: "Other" },
];

function formatCurrency(amount: number, currency?: string | null): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: currency || "USD",
	}).format(amount);
}

interface AccountsTableProps {
	accounts: Account[];
	pagination?: PaginationType | null;
	isLoading?: boolean;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onDelete: (id: string) => Promise<boolean>;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	sortConfig?: SortConfig | null;
	onSortChange?: (sort: SortConfig) => void;
	typeFilter?: AccountType | "ALL";
	onTypeFilterChange?: (type: AccountType | "ALL") => void;
}

export function AccountsTable({
	accounts,
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
}: AccountsTableProps) {
	const columns: Column<Account>[] = [
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
			header: "Account Name",
			sortable: true,
			cell: (item) => (
				<div className="flex items-center gap-2">
					{item.color && (
						<div
							className="w-3 h-3 rounded-full flex-shrink-0"
							style={{ backgroundColor: item.color }}
						/>
					)}
					<span className="font-medium">{item.name}</span>
					{item.isDefault && (
						<Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
					)}
				</div>
			),
		},
		{
			key: "type",
			header: "Type",
			sortable: true,
			cell: (item) => {
				const config = ACCOUNT_TYPE_CONFIG[item.type];
				return <Badge variant={config.variant}>{config.label}</Badge>;
			},
			className: "w-36",
			hideOnMobile: true,
		},
		{
			key: "balance",
			header: "Balance",
			sortable: true,
			cell: (item) => (
				<span
					className={`font-mono font-medium tabular-nums ${
						item.balance < 0 ? "text-destructive" : ""
					}`}
				>
					{formatCurrency(item.balance, item.currency)}
				</span>
			),
			className: "w-40 text-right",
		},
		{
			key: "createdAt",
			header: "Created",
			sortable: true,
			cell: (item) => (
				<div className="text-sm text-muted-foreground">
					{item.createdAt
						? new Date(item.createdAt).toLocaleDateString()
						: "—"}
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
					<AddBalanceDialog
						account={item}
						trigger={
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
							>
								<PlusCircle className="h-3.5 w-3.5 text-green-600" />
							</Button>
						}
					/>
					<AccountsFormDialog
						mode="edit"
						account={item}
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
						title="Delete Account"
						itemName={item.name}
						itemType="account"
						description="This will permanently delete the account and cannot be undone. Accounts with existing transactions cannot be deleted."
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
			className: "w-36 text-right",
		},
	];

	const filterSlot = onTypeFilterChange ? (
		<Select
			value={typeFilter}
			onValueChange={(value) =>
				onTypeFilterChange(value as AccountType | "ALL")
			}
		>
			<SelectTrigger className="w-[160px]">
				<SelectValue placeholder="Filter by type" />
			</SelectTrigger>
			<SelectContent>
				{ACCOUNT_TYPE_OPTIONS.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	) : undefined;

	return (
		<DataTable
			data={accounts}
			columns={columns}
			pagination={pagination}
			isLoading={isLoading}
			onPageChange={onPageChange}
			onLimitChange={onLimitChange}
			emptyMessage="No accounts found"
			emptyDescription="Create your first account to start tracking your finances."
			searchPlaceholder="Search accounts..."
			searchValue={searchValue}
			onSearchChange={onSearchChange}
			sortConfig={sortConfig}
			onSortChange={onSortChange}
			filterSlot={filterSlot}
		/>
	);
}
