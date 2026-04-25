// components/pages/accounts/_components/accounts-cards.tsx
"use client";

import { DataCard } from "@/components/shared/data-card";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog";
import { Edit, Trash2, PlusCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Account, AccountType } from "@/lib/account-service/types";
import type { Pagination as PaginationType } from "@/lib/response-service";
import { AccountsFormDialog } from "./accounts-form-dialog";
import { AddBalanceDialog } from "./add-balance-dialog";

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

interface AccountsCardsProps {
	accounts: Account[];
	pagination?: PaginationType | null;
	isLoading?: boolean;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onDelete: (id: string) => Promise<boolean>;
	typeFilter?: AccountType | "ALL";
	onTypeFilterChange?: (type: AccountType | "ALL") => void;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
}

export function AccountsCards({
	accounts,
	pagination,
	isLoading,
	onPageChange,
	onLimitChange,
	onDelete,
	typeFilter = "ALL",
	onTypeFilterChange,
	searchValue = "",
	onSearchChange,
}: AccountsCardsProps) {
	return (
		<div className="space-y-4">
			{/* Search and Filter Row */}
			<div className="flex items-center gap-2">
				{onSearchChange && (
					<Input
						type="text"
						value={searchValue}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder="Search accounts..."
						className="max-w-sm"
					/>
				)}
				{onTypeFilterChange && (
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
								<SelectItem
									key={option.value}
									value={option.value}
								>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			</div>

			<DataCard
				data={accounts}
				pagination={pagination}
				isLoading={isLoading}
				onPageChange={onPageChange}
				onLimitChange={onLimitChange}
				emptyMessage="No accounts found"
				emptyDescription="Create your first account to start tracking your finances."
				// Responsive grid:
				// - Below 600px: 1 column (single card per row)
				// - Between 600px and 900px: 2 columns
				// - Above 900px: 3 columns (desktop)
				gridClassName="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
				renderCard={(account) => {
					const typeConfig = ACCOUNT_TYPE_CONFIG[account.type];
					return (
						<Card className="group hover:shadow-md transition-shadow h-full">
							<CardContent className="p-4 h-full">
								<div className="flex flex-col h-full">
									<div className="flex items-start justify-between mb-3">
										<div className="flex items-center gap-2 flex-1 min-w-0">
											{account.color && (
												<div
													className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-background"
													style={{
														backgroundColor:
															account.color,
													}}
												/>
											)}
											<div className="min-w-0 flex-1">
												<h3 className="font-medium flex items-center gap-1 truncate">
													<span className="truncate">
														{account.name}
													</span>
													{account.isDefault && (
														<Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
													)}
												</h3>
												<Badge
													variant={typeConfig.variant}
													className="mt-1"
												>
													{typeConfig.label}
												</Badge>
											</div>
										</div>
										<div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
											<AddBalanceDialog
												account={account}
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
												account={account}
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
											<DeleteAlertDialog
												title="Delete Account"
												itemName={account.name}
												itemType="account"
												description="This will permanently delete the account and cannot be undone."
												onDelete={() =>
													onDelete(account.id)
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
										</div>
									</div>

									<div className="mt-auto pt-3 border-t">
										<div className="flex items-baseline justify-between">
											<span className="text-sm text-muted-foreground">
												Balance
											</span>
											<span
												className={`text-lg font-mono font-semibold tabular-nums ${
													account.balance < 0
														? "text-destructive"
														: ""
												}`}
											>
												{formatCurrency(
													account.balance,
													account.currency,
												)}
											</span>
										</div>
									</div>

									{account.notes && (
										<p className="text-xs text-muted-foreground mt-2 line-clamp-2">
											{account.notes}
										</p>
									)}

									{account.createdAt && (
										<p className="text-xs text-muted-foreground mt-2">
											Created{" "}
											{new Date(
												account.createdAt,
											).toLocaleDateString()}
										</p>
									)}
								</div>
							</CardContent>
						</Card>
					);
				}}
			/>
		</div>
	);
}
