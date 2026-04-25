// components/pages/dashboard/_components/dashboard-filter.tsx
"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
	Filter,
	X,
	TrendingUp,
	Tags,
	Calendar as CalendarLucide,
} from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { DashboardQueryParams } from "@/lib/dashboard-service/types";

// ============================================
// TYPES
// ============================================

export type Period = NonNullable<DashboardQueryParams["period"]>;

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
	{ value: "current-month", label: "Current Month" },
	{ value: "last-month", label: "Last Month" },
	{ value: "last-3-months", label: "Last 3 Months" },
	{ value: "last-6-months", label: "Last 6 Months" },
	{ value: "year-to-date", label: "Year to Date" },
	{ value: "custom", label: "Custom Range" },
];

interface DashboardFilterProps {
	// Current query params
	queryParams: DashboardQueryParams;

	// Callbacks
	onQueryParamsChange: (params: DashboardQueryParams) => void;

	// Loading state
	isLoading?: boolean;
}

export function DashboardFilter({
	queryParams,
	onQueryParamsChange,
	isLoading = false,
}: DashboardFilterProps) {
	const [isFilterOpen, setIsFilterOpen] = useState(false);

	// Local state for filter popover - initialize with current queryParams
	const [localPeriod, setLocalPeriod] = useState<Period>(
		queryParams.period || "last-6-months",
	);
	const [localCompareWithPrevious, setLocalCompareWithPrevious] = useState(
		queryParams.compareWithPrevious ?? true,
	);
	const [localIncludeTagAnalysis, setLocalIncludeTagAnalysis] = useState(
		queryParams.includeTagAnalysis ?? false,
	);
	const [localStartDate, setLocalStartDate] = useState<Date | undefined>();
	const [localEndDate, setLocalEndDate] = useState<Date | undefined>();

	// Parse string dates to Date objects
	const parseDate = (dateStr: string | undefined): Date | undefined => {
		if (!dateStr) return undefined;
		const date = new Date(dateStr);
		return isNaN(date.getTime()) ? undefined : date;
	};

	// Update local state when queryParams changes from outside (e.g., removing filters)
	useEffect(() => {
		setLocalPeriod(queryParams.period || "last-6-months");
		setLocalCompareWithPrevious(queryParams.compareWithPrevious ?? true);
		setLocalIncludeTagAnalysis(queryParams.includeTagAnalysis ?? false);

		if (
			queryParams.period === "custom" &&
			queryParams.startDate &&
			queryParams.endDate
		) {
			setLocalStartDate(parseDate(queryParams.startDate));
			setLocalEndDate(parseDate(queryParams.endDate));
		} else {
			setLocalStartDate(undefined);
			setLocalEndDate(undefined);
		}
	}, [queryParams]);

	// Initialize local state when filter popover opens
	useEffect(() => {
		if (isFilterOpen) {
			// Sync with current queryParams when opening
			setLocalPeriod(queryParams.period || "last-6-months");
			setLocalCompareWithPrevious(
				queryParams.compareWithPrevious ?? true,
			);
			setLocalIncludeTagAnalysis(queryParams.includeTagAnalysis ?? false);

			if (
				queryParams.period === "custom" &&
				queryParams.startDate &&
				queryParams.endDate
			) {
				setLocalStartDate(parseDate(queryParams.startDate));
				setLocalEndDate(parseDate(queryParams.endDate));
			} else {
				setLocalStartDate(undefined);
				setLocalEndDate(undefined);
			}
		}
	}, [isFilterOpen, queryParams]);

	// Check if any filters are active (non-default)
	const hasActiveFilters = useCallback((): boolean => {
		const defaultParams: DashboardQueryParams = {
			period: "last-6-months",
			compareWithPrevious: true,
			includeTagAnalysis: false,
		};

		return (
			queryParams.period !== defaultParams.period ||
			queryParams.compareWithPrevious !==
				defaultParams.compareWithPrevious ||
			queryParams.includeTagAnalysis !==
				defaultParams.includeTagAnalysis ||
			!!queryParams.startDate ||
			!!queryParams.endDate
		);
	}, [queryParams]);

	// Get active filters count
	const getActiveFiltersCount = useCallback((): number => {
		let count = 0;
		const defaultParams: DashboardQueryParams = {
			period: "last-6-months",
			compareWithPrevious: true,
			includeTagAnalysis: false,
		};

		if (queryParams.period !== defaultParams.period) count++;
		if (
			queryParams.compareWithPrevious !==
			defaultParams.compareWithPrevious
		)
			count++;
		if (queryParams.includeTagAnalysis !== defaultParams.includeTagAnalysis)
			count++;
		if (queryParams.startDate) count++;
		if (queryParams.endDate) count++;

		return count;
	}, [queryParams]);

	// Apply all filters
	const applyFilters = useCallback(() => {
		const newParams: DashboardQueryParams = {
			period: localPeriod,
			compareWithPrevious: localCompareWithPrevious,
			includeTagAnalysis: localIncludeTagAnalysis,
		};

		// Add custom date range if applicable
		if (localPeriod === "custom" && localStartDate && localEndDate) {
			newParams.startDate = format(localStartDate, "yyyy-MM-dd");
			newParams.endDate = format(localEndDate, "yyyy-MM-dd");
		}

		onQueryParamsChange(newParams);
		setIsFilterOpen(false);
	}, [
		localPeriod,
		localCompareWithPrevious,
		localIncludeTagAnalysis,
		localStartDate,
		localEndDate,
		onQueryParamsChange,
	]);

	// Reset all filters to defaults
	const resetFilters = useCallback(() => {
		const defaultParams: DashboardQueryParams = {
			period: "last-6-months",
			compareWithPrevious: true,
			includeTagAnalysis: false,
		};

		onQueryParamsChange(defaultParams);
		setIsFilterOpen(false);
	}, [onQueryParamsChange]);

	// Cancel filters without applying
	const cancelFilters = useCallback(() => {
		setIsFilterOpen(false);
	}, []);

	// Get display text for current period
	const getPeriodDisplayText = useCallback((): string => {
		if (
			queryParams.period === "custom" &&
			queryParams.startDate &&
			queryParams.endDate
		) {
			return `${format(new Date(queryParams.startDate), "MMM d, yyyy")} - ${format(
				new Date(queryParams.endDate),
				"MMM d, yyyy",
			)}`;
		}
		const period = queryParams.period || "last-6-months";
		return (
			PERIOD_OPTIONS.find((p) => p.value === period)?.label ||
			"Last 6 Months"
		);
	}, [queryParams]);

	// Remove a specific filter
	const removeFilter = useCallback(
		(filterType: "period" | "compare" | "tags" | "dateRange") => {
			const newParams = { ...queryParams };

			switch (filterType) {
				case "period":
					newParams.period = "last-6-months";
					newParams.startDate = undefined;
					newParams.endDate = undefined;
					break;
				case "compare":
					newParams.compareWithPrevious = true;
					break;
				case "tags":
					newParams.includeTagAnalysis = false;
					break;
				case "dateRange":
					newParams.startDate = undefined;
					newParams.endDate = undefined;
					if (newParams.period === "custom") {
						newParams.period = "last-6-months";
					}
					break;
			}

			onQueryParamsChange(newParams);
		},
		[queryParams, onQueryParamsChange],
	);

	return (
		<>
			{/* Filter Button */}
			<Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						size="default"
						className="gap-2"
						disabled={isLoading}
					>
						<Filter className="h-4 w-4" />
						Filters
						{hasActiveFilters() && (
							<Badge
								variant="secondary"
								className="ml-1 h-5 px-1.5"
							>
								{getActiveFiltersCount()}
							</Badge>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[480px] p-0" align="end">
					<div className="flex flex-col">
						{/* Header */}
						<div className="flex items-center justify-between p-4 border-b">
							<h3 className="font-semibold text-lg">
								Filter Dashboard
							</h3>
							{hasActiveFilters() && (
								<Button
									variant="ghost"
									size="sm"
									onClick={resetFilters}
									className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
								>
									<X className="h-3 w-3 mr-1" />
									Reset all
								</Button>
							)}
						</div>

						{/* Filter Options */}
						<div className="p-4 space-y-4">
							{/* Period Selection */}
							<div className="space-y-2">
								<Label className="text-sm font-medium">
									Time Period
								</Label>
								<Select
									value={localPeriod}
									onValueChange={(value) =>
										setLocalPeriod(value as Period)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select period" />
									</SelectTrigger>
									<SelectContent>
										{PERIOD_OPTIONS.map((option) => (
											<SelectItem
												key={option.value}
												value={option.value}
											>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Custom Date Range (shown when custom period is selected) */}
							{localPeriod === "custom" && (
								<div className="space-y-2">
									<Label className="text-sm font-medium">
										Custom Date Range
									</Label>
									<div className="border rounded-md p-3">
										<div className="flex items-center gap-2 mb-3">
											<CalendarLucide className="h-4 w-4 text-muted-foreground" />
											<span className="text-sm text-muted-foreground">
												Select start and end dates
											</span>
										</div>
										<Calendar
											mode="range"
											selected={{
												from: localStartDate,
												to: localEndDate,
											}}
											onSelect={(range) => {
												setLocalStartDate(range?.from);
												setLocalEndDate(range?.to);
											}}
											numberOfMonths={2}
											className="rounded-md border"
										/>
										{(localStartDate || localEndDate) && (
											<div className="flex items-center justify-between mt-3 pt-3 border-t">
												<div className="text-sm">
													{localStartDate && (
														<span>
															From:{" "}
															{format(
																localStartDate,
																"MMM d, yyyy",
															)}
														</span>
													)}
													{localEndDate &&
														localStartDate && (
															<span className="mx-2">
																→
															</span>
														)}
													{localEndDate && (
														<span>
															To:{" "}
															{format(
																localEndDate,
																"MMM d, yyyy",
															)}
														</span>
													)}
												</div>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => {
														setLocalStartDate(
															undefined,
														);
														setLocalEndDate(
															undefined,
														);
													}}
												>
													Clear
												</Button>
											</div>
										)}
									</div>
								</div>
							)}

							<Separator />

							{/* Compare with Previous Period */}
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label
										htmlFor="compare-toggle"
										className="text-sm font-medium"
									>
										<TrendingUp className="inline h-4 w-4 mr-2" />
										Compare with Previous Period
									</Label>
									<p className="text-xs text-muted-foreground">
										Show percentage change compared to
										previous period
									</p>
								</div>
								<Switch
									id="compare-toggle"
									checked={localCompareWithPrevious}
									onCheckedChange={
										setLocalCompareWithPrevious
									}
								/>
							</div>

							<Separator />

							{/* Include Tag Analysis */}
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label
										htmlFor="tag-toggle"
										className="text-sm font-medium"
									>
										<Tags className="inline h-4 w-4 mr-2" />
										Include Tag Analysis
									</Label>
									<p className="text-xs text-muted-foreground">
										Show spending breakdown by tags
									</p>
								</div>
								<Switch
									id="tag-toggle"
									checked={localIncludeTagAnalysis}
									onCheckedChange={setLocalIncludeTagAnalysis}
								/>
							</div>
						</div>

						{/* Footer Actions */}
						<div className="flex items-center justify-end gap-2 p-4 border-t bg-muted/50">
							<Button variant="outline" onClick={cancelFilters}>
								Cancel
							</Button>
							<Button onClick={applyFilters}>
								Apply Filters
							</Button>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</>
	);
}
