// components/pages/savings-goals/_components/savings-goals-cards.tsx
"use client";

import { DataCard } from "@/components/shared/data-card";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog";
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

interface SavingsGoalsCardsProps {
	goals: SavingsGoalWithProgress[];
	pagination?: PaginationType | null;
	isLoading?: boolean;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onDelete: (id: string) => Promise<boolean>;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	statusFilter?: SavingsGoalStatus | "ALL";
	onStatusFilterChange?: (status: SavingsGoalStatus | "ALL") => void;
}

export function SavingsGoalsCards({
	goals,
	pagination,
	isLoading,
	onPageChange,
	onLimitChange,
	onDelete,
	searchValue = "",
	onSearchChange,
	statusFilter = "ALL",
	onStatusFilterChange,
}: SavingsGoalsCardsProps) {
	return (
		<DataCard
			data={goals}
			pagination={pagination}
			isLoading={isLoading}
			onPageChange={onPageChange}
			onLimitChange={onLimitChange}
			emptyMessage="No savings goals found"
			emptyDescription="Create your first savings goal to start tracking your progress."
			gridClassName="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
			renderCard={(item) => {
				const statusConfig = STATUS_CONFIG[item.status];
				const isActive = item.status === "ACTIVE";

				return (
					<Card className="group hover:shadow-md transition-shadow">
						<CardContent className="p-5">
							<div className="space-y-4">
								{/* Header */}
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-2 min-w-0">
										<div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
											<PiggyBank className="h-5 w-5 text-primary" />
										</div>
										<div className="min-w-0">
											<h3 className="font-semibold truncate">
												{item.name}
											</h3>
											{item.linkedCategory && (
												<p className="text-xs text-muted-foreground truncate">
													{item.linkedCategory.name}
												</p>
											)}
										</div>
									</div>
									<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
										{isActive && (
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
													onSearchChange?.(
														searchValue,
													);
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

								{/* Progress */}
								<div className="space-y-2">
									<div className="flex items-center justify-between text-sm">
										<span className="font-medium">
											{item.progress.toFixed(1)}%
										</span>
										<span className="text-muted-foreground">
											$
											{item.currentAmount.toLocaleString()}{" "}
											/ $
											{item.targetAmount.toLocaleString()}
										</span>
									</div>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Progress
													value={item.progress}
													className="h-2.5"
												/>
											</TooltipTrigger>
											<TooltipContent>
												<p>
													$
													{item.currentAmount.toLocaleString()}{" "}
													of $
													{item.targetAmount.toLocaleString()}
												</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</div>

								{/* Details */}
								<div className="grid grid-cols-2 gap-3 pt-2 border-t">
									<div className="flex items-center gap-1.5 text-sm">
										<Target className="h-3.5 w-3.5 text-muted-foreground" />
										<div>
											<p className="text-xs text-muted-foreground">
												Remaining
											</p>
											<p className="font-medium">
												$
												{item.remaining.toLocaleString()}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-1.5 text-sm">
										<Clock className="h-3.5 w-3.5 text-muted-foreground" />
										<div>
											<p className="text-xs text-muted-foreground">
												Deadline
											</p>
											<p
												className={`font-medium text-xs ${item.isOverdue ? "text-destructive" : ""}`}
											>
												{new Date(
													item.deadline,
												).toLocaleDateString()}
											</p>
										</div>
									</div>
								</div>

								{/* Suggested Contribution & Status */}
								<div className="flex items-center justify-between pt-2 border-t">
									<div className="text-xs text-muted-foreground">
										{isActive && (
											<span>
												Suggested: $
												{item.suggestedMonthlyContribution.toFixed(
													2,
												)}
												/mo
											</span>
										)}
									</div>
									<Badge variant={statusConfig.variant}>
										{statusConfig.label}
									</Badge>
								</div>
							</div>
						</CardContent>
					</Card>
				);
			}}
		/>
	);
}
