// components/pages/dashboard/_components/summary-cards.tsx
"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	TrendingUp,
	TrendingDown,
	PiggyBank,
	BarChart3,
	ArrowUpRight,
	ArrowDownRight,
} from "lucide-react";
import { cn, formatCurrency, CurrencyType } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardSummary } from "@/lib/dashboard-service/types";

// ============================================
// TYPES
// ============================================

interface SummaryCardsProps {
	summary: DashboardSummary;
	currency?: CurrencyType;
	isLoading?: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatAmount = (amount: number, currency: CurrencyType): string => {
	return formatCurrency(Math.abs(amount), currency);
};

const formatPercentage = (value: number): string => {
	const absValue = Math.abs(value);
	return `${absValue.toFixed(2)}%`;
};

const getTrend = (value: number): "up" | "down" => {
	return value > 0 ? "up" : "down";
};

// ============================================
// SUMMARY CARD ITEM
// ============================================

interface SummaryCardItemProps {
	title: string;
	value: string | number;
	description?: string;
	icon: React.ElementType;
	trend?: "up" | "down";
	trendValue?: string;
	trendIcon?: boolean;
}

function SummaryCardItem({
	title,
	value,
	description,
	icon: Icon,
	trend,
	trendValue,
	trendIcon = false,
}: SummaryCardItemProps) {
	return (
		<Card className="hover:shadow-md transition-shadow">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					{title}
				</CardTitle>
				<Icon className="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">{value}</div>
				{description && (
					<CardDescription className="text-xs mt-1">
						{description}
					</CardDescription>
				)}
				{trend && trendValue && (
					<div className="flex items-center gap-1 mt-2">
						{trendIcon &&
							(trend === "up" ? (
								<ArrowUpRight className="h-3 w-3 text-green-500" />
							) : (
								<ArrowDownRight className="h-3 w-3 text-red-500" />
							))}
						<span
							className={cn(
								"text-xs font-medium",
								trend === "up"
									? "text-green-500"
									: "text-red-500",
							)}
						>
							{trendValue}
						</span>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SummaryCards({
	summary,
	currency = CurrencyType.USD,
	isLoading = false,
}: SummaryCardsProps) {
	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<Skeleton className="h-7 w-32" />
						<Skeleton className="h-4 w-48 mt-1" />
					</div>
					<Skeleton className="h-6 w-24" />
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{[...Array(4)].map((_, i) => (
						<Card key={i}>
							<CardHeader className="pb-2">
								<Skeleton className="h-4 w-32" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-8 w-28 mb-2" />
								<Skeleton className="h-3 w-40 mb-2" />
								<Skeleton className="h-3 w-24" />
							</CardContent>
						</Card>
					))}
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{[...Array(3)].map((_, i) => (
						<Card key={i}>
							<CardHeader className="pb-2">
								<Skeleton className="h-4 w-24" />
							</CardHeader>
							<CardContent>
								<div className="flex justify-between">
									<Skeleton className="h-8 w-20" />
									<Skeleton className="h-6 w-16" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	// Get trend for monthly change
	const monthlyChangeTrend = getTrend(summary?.monthlyChange || 0);
	const savingsRateTrend = getTrend(summary?.savingsRate || 0);

	return (
		<div className="space-y-4">
			{/* First Row - Daily Averages & Rates */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{/* Average Daily Expense */}
				<SummaryCardItem
					title="Average Daily Expense"
					value={formatAmount(
						summary?.averageDailyExpense || 0,
						currency,
					)}
					description="Typical daily spending"
					icon={TrendingDown}
					trend="down"
					trendValue="vs previous period"
					trendIcon={false}
				/>

				{/* Average Daily Income */}
				<SummaryCardItem
					title="Average Daily Income"
					value={formatAmount(
						summary?.averageDailyIncome || 0,
						currency,
					)}
					description="Typical daily earnings"
					icon={TrendingUp}
					trend="up"
					trendValue="vs previous period"
					trendIcon={false}
				/>

				{/* Savings Rate */}
				<SummaryCardItem
					title="Savings Rate"
					value={formatPercentage(
						Math.abs(summary?.savingsRate || 0),
					)}
					description="Income saved after expenses"
					icon={PiggyBank}
					trend={savingsRateTrend}
					trendValue={
						summary?.savingsRate > 0
							? "Positive savings"
							: "Negative savings"
					}
					trendIcon={true}
				/>

				{/* Monthly Change */}
				<SummaryCardItem
					title="Monthly Change"
					value={formatPercentage(
						Math.abs(summary?.monthlyChange || 0),
					)}
					description="Change vs previous month"
					icon={BarChart3}
					trend={monthlyChangeTrend}
					trendValue={
						summary?.monthlyChange > 0 ? "Increase" : "Decrease"
					}
					trendIcon={true}
				/>
			</div>
		</div>
	);
}
