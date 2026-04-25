// components/pages/dashboard/_components/kpi-cards-grid.tsx
"use client";

import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { DashboardCards, KPICard } from "@/lib/dashboard-service/types";

interface KPICardsGridProps {
	cards: DashboardCards;
}

function KPICardComponent({
	title,
	description,
	data,
	formatter,
}: {
	title: string;
	description: string;
	data: KPICard;
	formatter?: (value: number) => string;
}) {
	const formatValue = formatter || formatCurrency;
	const isPositive = data.trend === "up";
	const isNeutral = data.trend === "neutral";
	const TrendIcon = isNeutral
		? Minus
		: isPositive
			? TrendingUp
			: TrendingDown;

	return (
		<Card className="@container/card">
			<CardHeader>
				<CardDescription>{title}</CardDescription>
				<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
					{formatValue(data.current)}
				</CardTitle>
				<div className="flex items-center gap-2">
					<Badge
						variant="outline"
						className={cn(
							isPositive && "text-green-600",
							!isPositive && !isNeutral && "text-red-600",
						)}
					>
						<TrendIcon className="mr-1 h-3 w-3" />
						{data.changePercent > 0 ? "+" : ""}
						{data.changePercent.toFixed(1)}%
					</Badge>
				</div>
			</CardHeader>
			<div className="px-6 pb-4">
				<div className="line-clamp-1 flex gap-2 text-sm">
					<span className="font-medium">
						{isPositive
							? "Increased"
							: isNeutral
								? "No change"
								: "Decreased"}{" "}
						from previous period
					</span>
					<TrendIcon
						className={cn(
							"h-4 w-4",
							isPositive && "text-green-600",
							!isPositive && !isNeutral && "text-red-600",
						)}
					/>
				</div>
				<div className="text-sm text-muted-foreground">
					{description}
				</div>
			</div>
		</Card>
	);
}

export function KPICardsGrid({ cards }: KPICardsGridProps) {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
			<KPICardComponent
				title="Total Income"
				description="Total income for the period"
				data={cards.totalIncome}
			/>
			<KPICardComponent
				title="Total Expenses"
				description="Total expenses for the period"
				data={cards.totalExpense}
			/>
			<KPICardComponent
				title="Net Savings"
				description="Income minus expenses"
				data={cards.netSavings}
			/>
			<KPICardComponent
				title="Transactions"
				description="Total number of transactions"
				data={cards.totalTransactions}
				formatter={(value) => value.toLocaleString()}
			/>
		</div>
	);
}
