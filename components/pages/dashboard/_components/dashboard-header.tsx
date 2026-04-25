// components/pages/dashboard/_components/dashboard-header.tsx
"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardFilter } from "./dashboard-filter";
import type { DashboardQueryParams } from "@/lib/dashboard-service/types";

interface DashboardHeaderProps {
	queryParams: DashboardQueryParams;
	onQueryParamsChange: (params: DashboardQueryParams) => void;
	onRefresh: () => void;
	isLoading: boolean;
}

export function DashboardHeader({
	queryParams,
	onQueryParamsChange,
	onRefresh,
	isLoading,
}: DashboardHeaderProps) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Dashboard
					</h1>
					<p className="text-muted-foreground">
						Your financial overview and insights
					</p>
				</div>
				<div className="flex items-center gap-2">
					<DashboardFilter
						queryParams={queryParams}
						onQueryParamsChange={onQueryParamsChange}
						isLoading={isLoading}
					/>
					<Button
						variant="outline"
						size="icon"
						onClick={onRefresh}
						disabled={isLoading}
					>
						<RefreshCw
							className={cn(
								"h-4 w-4",
								isLoading && "animate-spin",
							)}
						/>
					</Button>
				</div>
			</div>
		</div>
	);
}
