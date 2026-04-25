// components/pages/dashboard/_components/dashboard-skeletons.tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardSkeletons() {
	return (
		<div className="flex flex-col gap-6 px-1 py-5">
			{/* KPI Cards Skeleton - 4 cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i} className="hover:shadow-md transition-shadow">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-4 rounded-full" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-32 mb-1" />
							<Skeleton className="h-3 w-40" />
							<Skeleton className="h-3 w-24 mt-2" />
						</CardContent>
					</Card>
				))}
			</div>

			{/* Summary Cards Skeleton */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i} className="hover:shadow-md transition-shadow">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-4 rounded-full" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-32 mb-1" />
							<Skeleton className="h-3 w-40" />
							<Skeleton className="h-3 w-24 mt-2" />
						</CardContent>
					</Card>
				))}
			</div>

			{/* Charts Grid Skeleton - Monthly Trend & Weekly Spending */}
			<div className="grid gap-6">
				{/* Monthly Trend Chart Skeleton */}
				<Card className="hover:shadow-md transition-shadow">
					<CardHeader>
						<div className="flex items-center justify-between flex-wrap gap-4">
							<div>
								<Skeleton className="h-6 w-32" />
								<Skeleton className="h-4 w-48 mt-1" />
							</div>
							<div className="flex items-center gap-4">
								{[1, 2, 3, 4, 5].map((i) => (
									<div key={i} className="text-center">
										<Skeleton className="h-3 w-16" />
										<Skeleton className="h-5 w-20 mt-1" />
									</div>
								))}
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<Skeleton className="h-[400px] w-full" />
					</CardContent>
				</Card>

				{/* Weekly Spending Chart Skeleton */}
				<Card className="hover:shadow-md transition-shadow">
					<CardHeader>
						<div className="flex items-center justify-between flex-wrap gap-4">
							<div>
								<Skeleton className="h-6 w-40" />
								<Skeleton className="h-4 w-64 mt-1" />
							</div>
							<div className="flex items-center gap-4">
								{[1, 2, 3, 4].map((i) => (
									<div key={i} className="text-center">
										<Skeleton className="h-3 w-16" />
										<Skeleton className="h-5 w-20 mt-1" />
									</div>
								))}
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<Skeleton className="h-[400px] w-full" />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
