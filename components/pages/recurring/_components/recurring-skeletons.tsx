// components/pages/recurring/_components/recurring-skeletons.tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function RecurringSkeletons() {
	return (
		<div className="flex flex-col gap-6 p-6">
			{/* Header Skeleton */}
			<div className="flex items-center justify-between">
				<div>
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-64 mt-2" />
				</div>
				<Skeleton className="h-10 w-32" />
			</div>

			{/* Tabs Skeleton */}
			<Skeleton className="h-10 w-[400px]" />

			{/* Filters Skeleton */}
			<div className="flex items-center gap-2">
				<Skeleton className="h-10 w-[140px]" />
				<Skeleton className="h-10 w-[160px]" />
				<Skeleton className="h-10 w-[130px]" />
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
									<div>
										<Skeleton className="h-4 w-32" />
										<Skeleton className="h-3 w-48 mt-1" />
									</div>
								</div>
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-5 w-16" />
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-5 w-16" />
								<div className="flex gap-1">
									<Skeleton className="h-8 w-8" />
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
