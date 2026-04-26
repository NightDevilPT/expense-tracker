// components/pages/recurring/_components/upcoming-recurring-list.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Calendar,
	Folder,
	Landmark,
	TrendingUp,
	TrendingDown,
} from "lucide-react";
import { formatCurrency, CurrencyType } from "@/lib/utils";
import type { UpcomingRecurring } from "@/lib/recurring-service/types";
import { cn } from "@/lib/utils";

interface UpcomingRecurringListProps {
	items: UpcomingRecurring[];
}

export function UpcomingRecurringList({ items }: UpcomingRecurringListProps) {
	if (items.length === 0) {
		return (
			<Card>
				<CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
					<Calendar className="h-12 w-12 opacity-20" />
					<p className="ml-3">
						No upcoming recurring transactions in the next 30 days
					</p>
				</CardContent>
			</Card>
		);
	}

	const sortedItems = [...items].sort(
		(a, b) => a.daysUntilDue - b.daysUntilDue,
	);

	return (
		<div className="space-y-4">
			{sortedItems.map((item) => (
				<Card
					key={item.id}
					className="hover:shadow-md transition-shadow"
				>
					<CardContent className="p-4">
						<div className="flex items-center justify-between flex-wrap gap-4">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1 flex-wrap">
									<h3 className="font-semibold">
										{item.name}
									</h3>
									<Badge
										variant={
											item.type === "INCOME"
												? "default"
												: "destructive"
										}
									>
										{item.type === "INCOME"
											? "Income"
											: "Expense"}
									</Badge>
									<Badge variant="outline">
										{item.frequency}
									</Badge>
								</div>
								<div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
									{item.categoryName && (
										<span className="flex items-center gap-1">
											<Folder className="h-3 w-3" />
											{item.categoryName}
										</span>
									)}
									{item.accountName && (
										<span className="flex items-center gap-1">
											<Landmark className="h-3 w-3" />
											{item.accountName}
										</span>
									)}
								</div>
							</div>
							<div className="text-right">
								<div
									className={cn(
										"text-xl font-bold",
										item.type === "INCOME"
											? "text-green-600 dark:text-green-400"
											: "text-red-600 dark:text-red-400",
									)}
								>
									{item.type === "INCOME" ? "+" : "-"}
									{formatCurrency(
										item.amount,
										CurrencyType.USD,
									)}
								</div>
								<div className="flex items-center gap-1 text-sm">
									<Calendar className="h-3 w-3" />
									<span>
										{new Date(
											item.nextDueDate,
										).toLocaleDateString()}
									</span>
									{item.daysUntilDue === 0 ? (
										<Badge
											variant="destructive"
											className="ml-2"
										>
											Due today
										</Badge>
									) : (
										<Badge
											variant="secondary"
											className="ml-2"
										>
											{item.daysUntilDue} days
										</Badge>
									)}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
