// components/pages/categories/_components/categories-skeleton.tsx

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CategoriesSkeleton() {
	return (
		<div className="container mx-auto py-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-64 mt-2" />
				</div>
				<Skeleton className="h-10 w-36" />
			</div>

			<div className="rounded-md border">
				<div className="p-4 border-b">
					<div className="flex gap-4">
						<Skeleton className="h-4 w-8" />
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-4 w-16" />
					</div>
				</div>
				{[1, 2, 3, 4, 5].map((i) => (
					<div
						key={i}
						className="p-4 border-b flex items-center gap-4"
					>
						<Skeleton className="h-4 w-8" />
						<div className="flex items-center gap-3 flex-1">
							<Skeleton className="h-4 w-4 rounded-full" />
							<Skeleton className="h-4 w-32" />
						</div>
						<Skeleton className="h-5 w-20" />
						<Skeleton className="h-6 w-16" />
						<Skeleton className="h-5 w-14" />
						<div className="flex gap-1">
							<Skeleton className="h-8 w-8" />
							<Skeleton className="h-8 w-8" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
