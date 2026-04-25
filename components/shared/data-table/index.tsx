// components/shared/data-table/data-table.tsx
"use client";

import * as React from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Inbox,
	Search,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	X,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { Pagination as PaginationType } from "@/lib/response-service";

// ============================================
// TYPES
// ============================================

export interface SortConfig {
	key: string;
	direction: "asc" | "desc";
}

export interface Column<T> {
	key: string;
	header: string;
	cell: (item: T, index: number) => React.ReactNode;
	className?: string;
	headerClassName?: string;
	hideOnMobile?: boolean;
	sortable?: boolean;
}

interface DataTableProps<T> {
	data: T[];
	columns: Column<T>[];
	pagination?: PaginationType | null;
	isLoading?: boolean;
	emptyMessage?: string;
	emptyDescription?: string;
	emptyIcon?: React.ReactNode;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	showPagination?: boolean;
	pageSizeOptions?: number[];
	skeletonRowCount?: number;

	// Filter/Search
	searchPlaceholder?: string;
	searchValue?: string;
	onSearchChange?: (value: string) => void;

	// Sort
	sortConfig?: SortConfig | null;
	onSortChange?: (sort: SortConfig) => void;

	// Extra filters slot
	filterSlot?: React.ReactNode;
}

// ============================================
// COMPONENT
// ============================================

export function DataTable<T extends { id: string }>({
	data,
	columns,
	pagination,
	isLoading = false,
	emptyMessage = "No data found",
	emptyDescription = "There are no items to display.",
	emptyIcon,
	onPageChange,
	onLimitChange,
	showPagination = true,
	pageSizeOptions = [5, 10, 20, 50, 100],
	skeletonRowCount = 5,
	searchPlaceholder = "Search...",
	searchValue = "",
	onSearchChange,
	sortConfig,
	onSortChange,
	filterSlot,
}: DataTableProps<T>) {
	// Calculate min width based on columns
	const minTableWidth = React.useMemo(() => {
		// Each column has a minimum width
		return `${columns.length * 100}px`;
	}, [columns.length]);

	return (
		<div className="flex flex-col h-full w-full rounded-lg border bg-background">
			{/* Header: Search + Filters */}
			{(onSearchChange || filterSlot) && (
				<div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/10 shrink-0">
					{onSearchChange && (
						<div className="relative flex-1 max-w-sm">
							<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder={searchPlaceholder}
								value={searchValue}
								onChange={(e) => onSearchChange(e.target.value)}
								className="pl-9 h-8 text-xs"
							/>
							{searchValue && (
								<Button
									variant="ghost"
									size="icon"
									className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
									onClick={() => onSearchChange("")}
								>
									<X className="h-3 w-3" />
								</Button>
							)}
						</div>
					)}
					{filterSlot && (
						<div className="flex items-center gap-2 ml-auto flex-shrink-0">
							{filterSlot}
						</div>
					)}
				</div>
			)}

			{/* Scrollable Table Container */}
			<div className="flex-1 min-h-0 overflow-auto">
				{/* Skeleton Loading State */}
				{isLoading && data.length === 0 ? (
					<div className="w-full">
						<Table>
							<TableHeader>
								<TableRow className="bg-muted/30 border-b">
									{columns.map((column) => (
										<TableHead
											key={column.key}
											className={`${
												column.hideOnMobile
													? "hidden md:table-cell"
													: ""
											} ${column.headerClassName || ""}`}
										>
											<Skeleton className="h-3 w-16" />
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{Array.from({ length: skeletonRowCount }).map(
									(_, rowIndex) => (
										<TableRow
											key={`skeleton-row-${rowIndex}`}
											className="border-b last:border-0"
										>
											{columns.map((column, colIndex) => (
												<TableCell
													key={`skeleton-cell-${rowIndex}-${colIndex}`}
													className={`${
														column.hideOnMobile
															? "hidden md:table-cell"
															: ""
													} ${column.className || ""}`}
												>
													<Skeleton
														className={`h-4 ${
															colIndex === 0
																? "w-6"
																: colIndex ===
																	  columns.length -
																			1
																	? "w-16 ml-auto"
																	: "w-full max-w-[120px]"
														}`}
													/>
												</TableCell>
											))}
										</TableRow>
									),
								)}
							</TableBody>
						</Table>
					</div>
				) : !data || data.length === 0 ? (
					/* Empty state */
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
				) : (
					<div className="w-full">
						<Table style={{ minWidth: minTableWidth }}>
							<TableHeader>
								<TableRow className="bg-muted/30 border-b">
									{columns.map((column) => {
										const isSorted =
											sortConfig?.key === column.key;
										const isAsc =
											isSorted &&
											sortConfig?.direction === "asc";

										return (
											<TableHead
												key={column.key}
												className={`text-xs font-medium text-muted-foreground whitespace-nowrap ${
													column.hideOnMobile
														? "hidden md:table-cell"
														: ""
												} ${column.headerClassName || ""} ${
													column.sortable
														? "cursor-pointer select-none"
														: ""
												}`}
												onClick={() => {
													if (
														column.sortable &&
														onSortChange
													) {
														onSortChange({
															key: column.key,
															direction:
																isSorted &&
																isAsc
																	? "desc"
																	: "asc",
														});
													}
												}}
											>
												<div className="flex items-center gap-1">
													{column.header}
													{column.sortable && (
														<span className="inline-flex flex-shrink-0">
															{isSorted ? (
																isAsc ? (
																	<ArrowUp className="h-3 w-3" />
																) : (
																	<ArrowDown className="h-3 w-3" />
																)
															) : (
																<ArrowUpDown className="h-3 w-3 opacity-40" />
															)}
														</span>
													)}
												</div>
											</TableHead>
										);
									})}
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.map((item, index) => (
									<TableRow
										key={item.id}
										className="border-b last:border-0"
									>
										{columns.map((column) => (
											<TableCell
												key={`${item.id}-${column.key}`}
												className={`whitespace-nowrap ${
													column.hideOnMobile
														? "hidden md:table-cell"
														: ""
												} ${column.className || ""}`}
											>
												{column.cell(item, index)}
											</TableCell>
										))}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</div>

			{/* Pagination Footer - Fixed to bottom */}
			{showPagination &&
				pagination &&
				pagination.totalPages > 0 &&
				onPageChange && (
					<div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10 shrink-0">
						<div className="flex items-center gap-3 flex-shrink-0">
							{onLimitChange && (
								<div className="flex items-center gap-2">
									<span className="text-xs text-muted-foreground">
										Rows
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
											{pageSizeOptions.map((size) => (
												<SelectItem
													key={size}
													value={String(size)}
												>
													{size}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}
							<p className="text-xs text-muted-foreground whitespace-nowrap">
								{pagination.total > 0
									? `Showing ${(pagination.page - 1) * pagination.limit + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total}`
									: "No results"}
							</p>
						</div>
						<div className="flex-shrink-0">
							<TablePagination
								pagination={pagination}
								onPageChange={onPageChange}
							/>
						</div>
					</div>
				)}
		</div>
	);
}

// ============================================
// TABLE PAGINATION
// ============================================

interface TablePaginationProps {
	pagination: PaginationType;
	onPageChange: (page: number) => void;
}

function TablePagination({ pagination, onPageChange }: TablePaginationProps) {
	const { page, totalPages, hasNext, hasPrev } = pagination;

	const getPageNumbers = (): (number | "ellipsis")[] => {
		const pages: (number | "ellipsis")[] = [];
		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
		} else {
			pages.push(1);
			if (page > 3) pages.push("ellipsis");
			const start = Math.max(2, page - 1);
			const end = Math.min(totalPages - 1, page + 1);
			for (let i = start; i <= end; i++) pages.push(i);
			if (page < totalPages - 2) pages.push("ellipsis");
			pages.push(totalPages);
		}
		return pages;
	};

	const pageNumbers = getPageNumbers();

	return (
		<Pagination className="w-auto justify-end">
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						onClick={() => {
							if (hasPrev) onPageChange(page - 1);
						}}
						className={`h-8 text-xs ${!hasPrev ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
						aria-disabled={!hasPrev}
						tabIndex={hasPrev ? 0 : -1}
						aria-label="Go to previous page"
					/>
				</PaginationItem>
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
				<PaginationItem>
					<PaginationNext
						onClick={() => {
							if (hasNext) onPageChange(page + 1);
						}}
						className={`h-8 text-xs ${!hasNext ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
						aria-disabled={!hasNext}
						tabIndex={hasNext ? 0 : -1}
						aria-label="Go to next page"
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
