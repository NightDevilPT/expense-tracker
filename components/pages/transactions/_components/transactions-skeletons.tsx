// components/pages/transactions/_components/transactions-skeletons.tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function TransactionsSkeletons() {
	return (
		<div className="container mx-auto py-6 space-y-6">
			{/* Header Skeleton */}
			<div className="flex items-center justify-between">
				<div>
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-4 w-48 mt-2" />
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-10 w-24" />
					<Skeleton className="h-10 w-10" />
				</div>
			</div>

			{/* Summary Cards Skeleton */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i}>
						<CardHeader className="pb-2">
							<Skeleton className="h-4 w-24" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-32" />
						</CardContent>
					</Card>
				))}
			</div>

			{/* Filters Skeleton */}
			<div className="flex items-center gap-2 flex-wrap">
				<Skeleton className="h-10 w-[130px]" />
				<Skeleton className="h-10 w-[150px]" />
				<Skeleton className="h-10 w-[150px]" />
				<Skeleton className="h-10 w-[200px] ml-auto" />
			</div>

			{/* Table Skeleton */}
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{[1, 2, 3, 4, 5].map((i) => (
							<div
								key={i}
								className="flex items-center justify-between py-3"
							>
								<div className="flex items-center gap-3 flex-1">
									<Skeleton className="h-4 w-8" />
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-4 w-20" />
									<Skeleton className="h-5 w-16" />
									<Skeleton className="h-4 w-28" />
									<Skeleton className="h-4 w-32" />
								</div>
								<div className="flex gap-1">
									<Skeleton className="h-8 w-8" />
									<Skeleton className="h-8 w-8" />
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
