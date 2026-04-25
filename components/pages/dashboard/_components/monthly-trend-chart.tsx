// components/pages/dashboard/_components/monthly-trend-chart.tsx
"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import * as React from "react";
import { CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, CurrencyType, cn } from "@/lib/utils";
import type { MonthlyTrend } from "@/lib/dashboard-service/types";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

// ============================================
// TYPES
// ============================================

interface MonthlyTrendChartProps {
	data: MonthlyTrend[];
	currency?: CurrencyType;
	isLoading?: boolean;
}

// Uses shadcn theme variables: --chart-1, --chart-2, --chart-3
const chartConfig = {
	income: {
		label: "Income",
		color: "var(--chart-2)",
	},
	expense: {
		label: "Expense",
		color: "var(--chart-1)",
	},
	savings: {
		label: "Savings",
		color: "var(--chart-3)",
	},
} satisfies ChartConfig;

// ============================================
// MAIN COMPONENT
// ============================================

export function MonthlyTrendChart({
	data,
	currency = CurrencyType.USD,
	isLoading = false,
}: MonthlyTrendChartProps) {
	// Calculate totals and averages
	const {
		totalIncome,
		totalExpense,
		totalSavings,
		averageIncome,
		averageExpense,
		highestMonth,
		lowestMonth,
	} = React.useMemo(() => {
		if (!data || data.length === 0) {
			return {
				totalIncome: 0,
				totalExpense: 0,
				totalSavings: 0,
				averageIncome: 0,
				averageExpense: 0,
				highestMonth: null,
				lowestMonth: null,
			};
		}

		const totalInc = data.reduce((sum, item) => sum + item.income, 0);
		const totalExp = data.reduce((sum, item) => sum + item.expense, 0);
		const totalSav = data.reduce((sum, item) => sum + item.savings, 0);

		const avgInc = totalInc / data.length;
		const avgExp = totalExp / data.length;

		const highest = [...data].sort((a, b) => b.savings - a.savings)[0];
		const lowest = [...data].sort((a, b) => a.savings - b.savings)[0];

		return {
			totalIncome: totalInc,
			totalExpense: totalExp,
			totalSavings: totalSav,
			averageIncome: avgInc,
			averageExpense: avgExp,
			highestMonth: highest,
			lowestMonth: lowest,
		};
	}, [data]);

	// Responsive margins based on screen size
	const [margin, setMargin] = React.useState({
		top: 20,
		right: 30,
		left: 20,
		bottom: 20,
	});

	React.useEffect(() => {
		const handleResize = () => {
			const width = window.innerWidth;
			if (width < 640) {
				setMargin({ top: 10, right: 10, left: 10, bottom: 10 });
			} else if (width < 768) {
				setMargin({ top: 15, right: 15, left: 15, bottom: 15 });
			} else {
				setMargin({ top: 20, right: 30, left: 20, bottom: 20 });
			}
		};

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32 sm:w-40" />
					<Skeleton className="h-4 w-48 sm:w-64" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[300px] sm:h-[350px] md:h-[400px] w-full" />
				</CardContent>
			</Card>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Monthly Trends</CardTitle>
					<CardDescription>
						No monthly data available for this period
					</CardDescription>
				</CardHeader>
				<CardContent className="flex items-center justify-center h-[300px] sm:h-[350px] md:h-[400px] text-muted-foreground">
					<CalendarDays className="h-10 w-10 sm:h-12 sm:w-12 opacity-20" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="hover:shadow-md transition-shadow">
			<CardHeader className="pb-2">
				<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-2">
					<div>
						<CardTitle className="text-lg sm:text-xl">
							Monthly Trends
						</CardTitle>
						<CardDescription className="text-xs sm:text-sm">
							Income vs Expenses over time
						</CardDescription>
					</div>
					<div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4 w-full md:w-auto">
						<div className="text-center min-w-[80px]">
							<p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
								Total Income
							</p>
							<p className="text-sm sm:text-lg font-bold text-green-600 dark:text-green-400 truncate">
								{formatCurrency(totalIncome, currency)}
							</p>
						</div>
						<div className="hidden sm:block w-px h-8 bg-border" />
						<div className="text-center min-w-[80px]">
							<p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
								Total Expense
							</p>
							<p className="text-sm sm:text-lg font-bold text-red-600 dark:text-red-400 truncate">
								{formatCurrency(totalExpense, currency)}
							</p>
						</div>
						<div className="hidden md:block w-px h-8 bg-border" />
						<div className="text-center min-w-[80px]">
							<p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
								Net Savings
							</p>
							<p
								className={cn(
									"text-sm sm:text-lg font-bold truncate",
									totalSavings >= 0
										? "text-green-600 dark:text-green-400"
										: "text-red-600 dark:text-red-400",
								)}
							>
								{formatCurrency(totalSavings, currency)}
							</p>
						</div>
						<div className="hidden lg:block w-px h-8 bg-border" />
						<div className="text-center min-w-[80px]">
							<p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
								Avg Income
							</p>
							<p className="text-sm sm:text-lg font-bold truncate">
								{formatCurrency(averageIncome, currency)}
							</p>
						</div>
						<div className="hidden lg:block w-px h-8 bg-border" />
						<div className="text-center min-w-[80px]">
							<p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
								Avg Expense
							</p>
							<p className="text-sm sm:text-lg font-bold truncate">
								{formatCurrency(averageExpense, currency)}
							</p>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-6 pt-4">
				{/* Chart */}
				<ChartContainer
					config={chartConfig}
					className="h-[300px] sm:h-[350px] md:h-[400px] w-full"
				>
					<AreaChart data={data} margin={margin}>
						<defs>
							<linearGradient
								id="fillIncome"
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop
									offset="5%"
									stopColor="var(--color-income)"
									stopOpacity={0.8}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-income)"
									stopOpacity={0.1}
								/>
							</linearGradient>
							<linearGradient
								id="fillExpense"
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop
									offset="5%"
									stopColor="var(--color-expense)"
									stopOpacity={0.8}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-expense)"
									stopOpacity={0.1}
								/>
							</linearGradient>
							<linearGradient
								id="fillSavings"
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop
									offset="5%"
									stopColor="var(--color-savings)"
									stopOpacity={0.8}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-savings)"
									stopOpacity={0.1}
								/>
							</linearGradient>
						</defs>
						<CartesianGrid
							strokeDasharray="3 3"
							className="stroke-muted"
							vertical={false}
						/>
						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							className="text-[10px] sm:text-xs md:text-sm font-medium"
							interval={0}
							angle={window.innerWidth < 640 ? -45 : 0}
							textAnchor={
								window.innerWidth < 640 ? "end" : "middle"
							}
							height={window.innerWidth < 640 ? 60 : 30}
						/>
						<YAxis
							tickFormatter={(value) =>
								formatCurrency(value, currency)
							}
							className="text-[10px] sm:text-xs"
							tickLine={false}
							axisLine={false}
							tickMargin={6}
							width={window.innerWidth < 640 ? 65 : 80}
						/>
						<ChartTooltip
							cursor={false}
							content={
								<ChartTooltipContent
									indicator="dot"
									formatter={(value) =>
										formatCurrency(Number(value), currency)
									}
									className="text-xs sm:text-sm"
								/>
							}
						/>
						<Area
							dataKey="income"
							type="monotone"
							fill="url(#fillIncome)"
							stroke="var(--color-income)"
							strokeWidth={2}
							stackId="1"
						/>
						<Area
							dataKey="expense"
							type="monotone"
							fill="url(#fillExpense)"
							stroke="var(--color-expense)"
							strokeWidth={2}
							stackId="2"
						/>
						<Area
							dataKey="savings"
							type="monotone"
							fill="url(#fillSavings)"
							stroke="var(--color-savings)"
							strokeWidth={2}
							stackId="3"
						/>
						<ChartLegend
							content={<ChartLegendContent />}
							className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4"
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
