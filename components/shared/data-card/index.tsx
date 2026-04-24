// components/shared/data-card/data-card.tsx
"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox } from "lucide-react";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Pagination as PaginationType } from "@/lib/response-service";

// ============================================
// TYPES
// ============================================

interface DataCardProps<T> {
	data: T[];
	renderCard: (item: T, index: number) => React.ReactNode;
	pagination?: PaginationType | null;
	isLoading?: boolean;
	emptyMessage?: string;
	emptyDescription?: string;
	emptyIcon?: React.ReactNode;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	showPagination?: boolean;
	pageSizeOptions?: number[];
	gridClassName?: string;
	skeletonCount?: number;
}

// ============================================
// SKELETON CARD
// ============================================

function SkeletonCard() {
	return (
		<div className="rounded-lg border bg-card p-4 space-y-3">
			<div className="flex items-start justify-between">
				<div className="flex items-center gap-3">
					<Skeleton className="h-10 w-10 rounded-lg shrink-0" />
					<div className="space-y-1.5">
						<Skeleton className="h-4 w-28" />
						<Skeleton className="h-5 w-16" />
					</div>
				</div>
				<div className="flex gap-1">
					<Skeleton className="h-8 w-8 rounded-md" />
					<Skeleton className="h-8 w-8 rounded-md" />
				</div>
			</div>
			<div className="flex items-center gap-2 pt-3 border-t">
				<Skeleton className="h-4 w-4 rounded" />
				<Skeleton className="h-4 w-20" />
			</div>
		</div>
	);
}

// ============================================
// COMPONENT
// ============================================

export function DataCard<T>({
	data,
	renderCard,
	pagination,
	isLoading = false,
	emptyMessage = "No data found",
	emptyDescription = "There are no items to display.",
	emptyIcon,
	onPageChange,
	onLimitChange,
	showPagination = true,
	pageSizeOptions = [5, 10, 20, 50, 100],
	gridClassName = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
	skeletonCount = 6,
}: DataCardProps<T>) {
	return (
		<div className="space-y-4">
			{/* Skeleton Loading State */}
			{isLoading && data.length === 0 ? (
				<div className={gridClassName}>
					{Array.from({ length: skeletonCount }).map((_, index) => (
						<SkeletonCard key={`skeleton-card-${index}`} />
					))}
				</div>
			) : !data || data.length === 0 ? (
				/* Empty state */
				<div className="rounded-lg border">
					<div className="flex flex-col items-center justify-center py-16 text-center px-4">
						{emptyIcon || (
							<div className="rounded-full bg-muted p-3 mb-3">
								<Inbox className="h-5 w-5 text-muted-foreground" />
							</div>
						)}
						<p className="text-sm font-medium">{emptyMessage}</p>
						<p className="text-xs text-muted-foreground mt-1 max-w-sm">
							{emptyDescription}
						</p>
					</div>
				</div>
			) : (
				<>
					{/* Card Grid */}
					<div className={gridClassName}>
						{data.map((item, index) => (
							<div key={(item as any).id || index}>
								{renderCard(item, index)}
							</div>
						))}
					</div>

					{/* Pagination Footer */}
					{showPagination &&
						pagination &&
						pagination.totalPages > 0 &&
						onPageChange && (
							<div className="flex items-center justify-between px-4 py-3 border rounded-lg bg-muted/10">
								{/* Left: Info */}
								<div className="flex items-center gap-3">
									{onLimitChange && (
										<div className="flex items-center gap-2">
											<span className="text-xs text-muted-foreground">
												Show
											</span>
											<Select
												value={String(pagination.limit)}
												onValueChange={(value) =>
													onLimitChange(Number(value))
												}
											>
												<SelectTrigger className="h-7 w-[65px] text-xs">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{pageSizeOptions.map(
														(size) => (
															<SelectItem
																key={size}
																value={String(
																	size,
																)}
															>
																{size}
															</SelectItem>
														),
													)}
												</SelectContent>
											</Select>
										</div>
									)}
									<p className="text-xs text-muted-foreground">
										{pagination.total > 0
											? `Showing ${(pagination.page - 1) * pagination.limit + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total}`
											: "No results"}
									</p>
								</div>

								{/* Right: Pagination */}
								<CardPagination
									pagination={pagination}
									onPageChange={onPageChange}
								/>
							</div>
						)}
				</>
			)}
		</div>
	);
}

// ============================================
// CARD PAGINATION
// ============================================

interface CardPaginationProps {
	pagination: PaginationType;
	onPageChange: (page: number) => void;
}

function CardPagination({ pagination, onPageChange }: CardPaginationProps) {
	const { page, totalPages, hasNext, hasPrev } = pagination;

	const getPageNumbers = (): (number | "ellipsis")[] => {
		const pages: (number | "ellipsis")[] = [];

		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			pages.push(1);
			if (page > 3) pages.push("ellipsis");

			const start = Math.max(2, page - 1);
			const end = Math.min(totalPages - 1, page + 1);

			for (let i = start; i <= end; i++) {
				pages.push(i);
			}

			if (page < totalPages - 2) pages.push("ellipsis");
			pages.push(totalPages);
		}

		return pages;
	};

	const pageNumbers = getPageNumbers();

	return (
		<Pagination className="w-auto justify-end">
			<PaginationContent>
				{/* Previous */}
				<PaginationItem>
					<PaginationPrevious
						onClick={() => {
							if (hasPrev) onPageChange(page - 1);
						}}
						className={`h-8 text-xs ${
							!hasPrev
								? "pointer-events-none opacity-50"
								: "cursor-pointer"
						}`}
						aria-disabled={!hasPrev}
						tabIndex={hasPrev ? 0 : -1}
						aria-label="Go to previous page"
					/>
				</PaginationItem>

				{/* Page Numbers */}
				{pageNumbers.map((pageNum, idx) =>
					pageNum === "ellipsis" ? (
						<PaginationItem key={`ellipsis-${idx}`}>
							<PaginationEllipsis className="h-8 w-8" />
						</PaginationItem>
					) : (
						<PaginationItem key={pageNum}>
							<PaginationLink
								onClick={() => onPageChange(pageNum as number)}
								isActive={page === pageNum}
								className="h-8 w-8 text-xs"
							>
								{pageNum}
							</PaginationLink>
						</PaginationItem>
					),
				)}

				{/* Next */}
				<PaginationItem>
					<PaginationNext
						onClick={() => {
							if (hasNext) onPageChange(page + 1);
						}}
						className={`h-8 text-xs ${
							!hasNext
								? "pointer-events-none opacity-50"
								: "cursor-pointer"
						}`}
						aria-disabled={!hasNext}
						tabIndex={hasNext ? 0 : -1}
						aria-label="Go to next page"
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
