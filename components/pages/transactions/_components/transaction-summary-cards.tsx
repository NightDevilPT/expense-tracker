// components/pages/transactions/_components/transaction-summary-cards.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	TrendingUp,
	TrendingDown,
	ArrowRightLeft,
	DollarSign,
} from "lucide-react";
import { formatCurrency, CurrencyType, cn } from "@/lib/utils";
import type { TransactionSummary } from "@/lib/transaction-service/types";

interface TransactionSummaryCardsProps {
	summary: TransactionSummary;
	currency?: CurrencyType;
}

export function TransactionSummaryCards({
	summary,
	currency = CurrencyType.USD,
}: TransactionSummaryCardsProps) {
	const cards = [
		{
			title: "Total Income",
			value: summary.totalIncome,
			icon: TrendingUp,
			color: "text-green-600",
			bgColor: "bg-green-50 dark:bg-green-950/20",
		},
		{
			title: "Total Expense",
			value: summary.totalExpense,
			icon: TrendingDown,
			color: "text-red-600",
			bgColor: "bg-red-50 dark:bg-red-950/20",
		},
		{
			title: "Net Balance",
			value: summary.netBalance,
			icon: DollarSign,
			color: summary.netBalance >= 0 ? "text-green-600" : "text-red-600",
			bgColor: "bg-blue-50 dark:bg-blue-950/20",
		},
		{
			title: "Total Transfers",
			value: summary.totalTransfer,
			icon: ArrowRightLeft,
			color: "text-blue-600",
			bgColor: "bg-purple-50 dark:bg-purple-950/20",
		},
	];

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			{cards.map((card) => (
				<Card
					key={card.title}
					className="hover:shadow-md transition-shadow"
				>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							{card.title}
						</CardTitle>
						<div className={cn("p-2 rounded-full", card.bgColor)}>
							<card.icon className={cn("h-4 w-4", card.color)} />
						</div>
					</CardHeader>
					<CardContent>
						<div className={cn("text-2xl font-bold", card.color)}>
							{card.title === "Net Balance" && card.value >= 0
								? "+"
								: ""}
							{formatCurrency(Math.abs(card.value), currency)}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
