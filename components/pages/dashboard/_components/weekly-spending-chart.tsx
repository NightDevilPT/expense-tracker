// components/pages/dashboard/_components/weekly-spending-chart.tsx
"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	XAxis,
	YAxis,
	ResponsiveContainer,
	Cell,
	Tooltip,
} from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, CurrencyType } from "@/lib/utils";
import type { WeeklySpending } from "@/lib/dashboard-service/types";
import { TrendingUp, TrendingDown, CalendarDays } from "lucide-react";

// ============================================
// TYPES
// ============================================

interface WeeklySpendingChartProps {
	data: WeeklySpending[];
	currency?: CurrencyType;
	isLoading?: boolean;
}

// Day of week mapping
const DAY_NAMES: Record<number, string> = {
	0: "Sunday",
	1: "Monday",
	2: "Tuesday",
	3: "Wednesday",
	4: "Thursday",
	5: "Friday",
	6: "Saturday",
};

const DAY_ABBREVIATIONS: Record<number, string> = {
	0: "Sun",
	1: "Mon",
	2: "Tue",
	3: "Wed",
	4: "Thu",
	5: "Fri",
	6: "Sat",
};

// Color gradient for bars
const getBarColor = (
	dayOfWeek: number,
	amount: number,
	maxAmount: number,
): string => {
	const intensity = amount / maxAmount;

	// Different colors for weekdays vs weekends
	if (dayOfWeek === 0 || dayOfWeek === 6) {
		// Weekend colors (purple/indigo)
		if (intensity > 0.8) return "#8b5cf6";
		if (intensity > 0.6) return "#a78bfa";
		if (intensity > 0.4) return "#c4b5fd";
		return "#ddd6fe";
	} else {
		// Weekday colors (blue)
		if (intensity > 0.8) return "#3b82f6";
		if (intensity > 0.6) return "#60a5fa";
		if (intensity > 0.4) return "#93c5fd";
		return "#bfdbfe";
	}
};

// Custom tooltip component - no color change on hover
const CustomTooltip = ({ active, payload, currency }: any) => {
	if (!active || !payload || !payload.length) {
		return null;
	}

	const data = payload[0].payload;
	const amount = data.amount;
	const dayName = DAY_NAMES[data.dayOfWeek] || data.date;

	return (
		<div className="rounded-lg border bg-background p-3 shadow-md">
			<div className="flex flex-col gap-1.5">
				<p className="text-sm font-semibold">{dayName}</p>
				<div className="flex items-center gap-2">
					<div
						className="h-3 w-3 rounded-full"
						style={{ backgroundColor: payload[0].fill }}
					/>
					<span className="text-sm text-muted-foreground">
						Spending:
					</span>
					<span className="text-sm font-medium">
						{formatCurrency(amount, currency)}
					</span>
				</div>
			</div>
		</div>
	);
};

// ============================================
// MAIN COMPONENT
// ============================================

export function WeeklySpendingChart({
	data,
	currency = CurrencyType.USD,
	isLoading = false,
}: WeeklySpendingChartProps) {
	// Sort data by day of week (Sunday to Saturday)
	const sortedData = React.useMemo(() => {
		return [...(data || [])].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
	}, [data]);

	// Calculate total spending and average
	const { totalSpending, averageSpending, maxAmount, highestDay, lowestDay } =
		React.useMemo(() => {
			const total = sortedData.reduce(
				(sum, item) => sum + item.amount,
				0,
			);
			const avg = total / sortedData.length;
			const max = Math.max(...sortedData.map((item) => item.amount));
			const highest = sortedData.find((item) => item.amount === max);
			const min = Math.min(...sortedData.map((item) => item.amount));
			const lowest = sortedData.find((item) => item.amount === min);
			return {
				totalSpending: total,
				averageSpending: avg,
				maxAmount: max,
				highestDay: highest,
				lowestDay: lowest,
			};
		}, [sortedData]);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-40" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[400px] w-full" />
				</CardContent>
			</Card>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Weekly Spending Pattern</CardTitle>
					<CardDescription>
						No spending data available for this period
					</CardDescription>
				</CardHeader>
				<CardContent className="flex items-center justify-center h-[400px] text-muted-foreground">
					<CalendarDays className="h-12 w-12 opacity-20" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="hover:shadow-md transition-shadow">
			<CardHeader>
				<div className="flex items-center justify-between flex-wrap gap-4 border-b pb-2">
					<div>
						<CardTitle>Weekly Spending Pattern</CardTitle>
						<CardDescription>
							Spending distribution across days of the week
						</CardDescription>
					</div>
					<div className="flex items-center gap-4 flex-wrap">
						<div className="text-center">
							<p className="text-xs text-muted-foreground">
								Total Weekly
							</p>
							<p className="text-lg font-bold">
								{formatCurrency(totalSpending, currency)}
							</p>
						</div>
						<div className="w-px h-8 bg-border" />
						<div className="text-center">
							<p className="text-xs text-muted-foreground">
								Daily Average
							</p>
							<p className="text-lg font-bold">
								{formatCurrency(averageSpending, currency)}
							</p>
						</div>
						<div className="w-px h-8 bg-border" />
						<div className="text-center">
							<p className="text-xs text-muted-foreground">
								Highest Day
							</p>
							<div className="flex items-center gap-1">
								<TrendingUp className="h-4 w-4 text-red-500" />
								<p className="text-lg font-bold">
									{highestDay
										? DAY_ABBREVIATIONS[
												highestDay.dayOfWeek
											]
										: "N/A"}
								</p>
							</div>
						</div>
						<div className="w-px h-8 bg-border" />
						<div className="text-center">
							<p className="text-xs text-muted-foreground">
								Lowest Day
							</p>
							<div className="flex items-center gap-1">
								<TrendingDown className="h-4 w-4 text-green-500" />
								<p className="text-lg font-bold">
									{lowestDay
										? DAY_ABBREVIATIONS[lowestDay.dayOfWeek]
										: "N/A"}
								</p>
							</div>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Chart */}
				<div className="h-[400px] w-full">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart
							data={sortedData}
							margin={{
								top: 20,
								right: 30,
								left: 20,
								bottom: 20,
							}}
							barSize={60}
						>
							<CartesianGrid
								strokeDasharray="3 3"
								className="stroke-muted"
							/>
							<XAxis
								dataKey="dayOfWeek"
								tickFormatter={(value) =>
									DAY_ABBREVIATIONS[value] || value
								}
								className="text-sm font-medium"
								tickLine={false}
								axisLine={false}
								tickMargin={10}
							/>
							<YAxis
								tickFormatter={(value) =>
									formatCurrency(value, currency)
								}
								className="text-xs"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								width={80}
							/>
							<Tooltip
								content={<CustomTooltip currency={currency} />}
								cursor={false}
							/>
							<Bar dataKey="amount" radius={[8, 8, 0, 0]}>
								{sortedData.map((entry, index) => (
									<Cell
										key={`cell-${index}`}
										fill={getBarColor(
											entry.dayOfWeek,
											entry.amount,
											maxAmount,
										)}
									/>
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}
