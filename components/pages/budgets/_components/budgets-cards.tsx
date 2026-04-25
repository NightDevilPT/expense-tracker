// components/pages/budgets/_components/budgets-cards.tsx
"use client";

import { DataCard } from "@/components/shared/data-card";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog";
import { Edit, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

interface BudgetCardsProps {
	items: BudgetWithProgress[];
	pagination?: PaginationType | null;
	isLoading?: boolean;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onDelete: (id: string) => Promise<boolean>;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	periodFilter?: BudgetPeriod | "ALL";
	onPeriodFilterChange?: (period: BudgetPeriod | "ALL") => void;
}

export function BudgetCards({
	items,
	pagination,
	isLoading,
	onPageChange,
	onLimitChange,
	onDelete,
	searchValue = "",
	onSearchChange,
	periodFilter = "ALL",
	onPeriodFilterChange,
}: BudgetCardsProps) {
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(amount);
	};

	return (
		<DataCard
			data={items}
			pagination={pagination}
			isLoading={isLoading}
			onPageChange={onPageChange}
			onLimitChange={onLimitChange}
			emptyMessage="No budgets found"
			emptyDescription="Create your first budget to start tracking your spending."
			gridClassName="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
			renderCard={(item) => {
				const periodConfig = PERIOD_CONFIG[item.period];
				const isOverBudget = item.isOverBudget;
				const isNearThreshold = item.isNearThreshold;

				return (
					<Card
						className={`group hover:shadow-md transition-shadow ${
							isOverBudget
								? "border-destructive/50"
								: isNearThreshold
									? "border-amber-500/50"
									: ""
						}`}
					>
						<CardContent className="p-4">
							<div className="space-y-3">
								{/* Header */}
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-2 min-w-0">
										{item.category?.color && (
											<div
												className="w-3 h-3 rounded-full flex-shrink-0"
												style={{
													backgroundColor:
														item.category.color,
												}}
											/>
										)}
										<div className="min-w-0">
											<h3 className="font-medium truncate">
												{item.category?.name ||
													"All Categories"}
											</h3>
											<Badge
												variant={periodConfig.variant}
												className="mt-1"
											>
												{periodConfig.label}
											</Badge>
										</div>
									</div>
									<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
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
											itemName={
												item.category?.name ||
												"All Categories"
											}
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
								</div>

								{/* Progress Bar */}
								<div className="space-y-2">
									<Progress
										value={Math.min(item.percentage, 100)}
										className={`h-2.5 ${
											isOverBudget
												? "[&>div]:bg-destructive"
												: isNearThreshold
													? "[&>div]:bg-amber-500"
													: "[&>div]:bg-primary"
										}`}
									/>
									<div className="flex items-center justify-between text-xs">
										<span className="text-muted-foreground">
											{item.percentage.toFixed(1)}% spent
										</span>
										{item.rollover && (
											<Badge
												variant="secondary"
												className="text-[10px] px-1.5 py-0"
											>
												Rollover
											</Badge>
										)}
									</div>
								</div>

								{/* Amount Details */}
								<div className="grid grid-cols-2 gap-2 pt-2 border-t">
									<div>
										<p className="text-xs text-muted-foreground">
											Budget
										</p>
										<p className="text-sm font-medium tabular-nums">
											{formatCurrency(item.amount)}
										</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">
											Spent
										</p>
										<p className="text-sm font-medium tabular-nums">
											{formatCurrency(item.spent)}
										</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">
											Remaining
										</p>
										<p
											className={`text-sm font-medium tabular-nums ${
												isOverBudget
													? "text-destructive"
													: isNearThreshold
														? "text-amber-500"
														: "text-emerald-600"
											}`}
										>
											{formatCurrency(item.remaining)}
										</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">
											Alert At
										</p>
										<p className="text-sm tabular-nums">
											{item.alertThreshold}%
										</p>
									</div>
								</div>

								{/* Warnings */}
								{isOverBudget && (
									<div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 rounded-md p-2">
										<TrendingUp className="h-3.5 w-3.5" />
										<span>Over budget!</span>
									</div>
								)}
								{isNearThreshold && !isOverBudget && (
									<div className="flex items-center gap-1.5 text-xs text-amber-500 bg-amber-500/10 rounded-md p-2">
										<TrendingDown className="h-3.5 w-3.5" />
										<span>Near threshold</span>
									</div>
								)}

								{/* Date Info */}
								<div className="flex items-center justify-between text-xs text-muted-foreground">
									<span>
										From{" "}
										{new Date(
											item.startDate,
										).toLocaleDateString()}
									</span>
									{item.endDate && (
										<span>
											to{" "}
											{new Date(
												item.endDate,
											).toLocaleDateString()}
										</span>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				);
			}}
		/>
	);
}
