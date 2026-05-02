// components/pages/recurring/index.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useRecurring } from "@/components/context/recurring-context/recurring-context";
import type { SortConfig } from "@/components/shared/data-table";
import type {
	TransactionType,
	RecurringFrequency,
} from "@/lib/recurring-service/types";
import { RecurringTable } from "./_components/recurring-table";
import { UpcomingRecurringList } from "./_components/upcoming-recurring-list";
import { RecurringSkeletons } from "./_components/recurring-skeletons";
import { cn } from "@/lib/utils";
import GenericPageHeader from "@/components/shared/page-header/page-header";
import { RecurringFormDialog } from "./_components/recurring-form-dialog";

export default function RecurringPage() {
	const {
		recurringTransactions,
		pagination,
		isLoading,
		error,
		fetchRecurring,
		deleteRecurring,
		pauseRecurring,
		resumeRecurring,
		upcomingRecurring,
		fetchUpcomingRecurring,
		clearError,
	} = useRecurring();

	const [isFirstLoad, setIsFirstLoad] = useState(true);
	const [activeView, setActiveView] = useState<"all" | "upcoming">("all");
	const [search, setSearch] = useState("");
	const [typeFilter, setTypeFilter] = useState<TransactionType | "ALL">(
		"ALL",
	);
	const [frequencyFilter, setFrequencyFilter] = useState<
		RecurringFrequency | "ALL"
	>("ALL");
	const [statusFilter, setStatusFilter] = useState<
		"ACTIVE" | "PAUSED" | "ALL"
	>("ALL");
	const [sort, setSort] = useState<SortConfig | null>(null);
	const debounceRef = useRef<NodeJS.Timeout | null>(null);

	// Initial fetch
	useEffect(() => {
		Promise.all([
			fetchRecurring({ page: 1, limit: 20 }),
			fetchUpcomingRecurring(30),
		]).finally(() => setIsFirstLoad(false));
	}, [fetchRecurring, fetchUpcomingRecurring]);

	// Toast errors
	useEffect(() => {
		if (error) {
			toast.error(error);
			clearError();
		}
	}, [error, clearError]);

	// Debounced search
	const handleSearchChange = useCallback(
		(value: string) => {
			setSearch(value);
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => {
				fetchRecurring({
					page: 1,
					limit: pagination?.limit || 20,
					search: value || undefined,
					type: typeFilter !== "ALL" ? typeFilter : undefined,
					frequency:
						frequencyFilter !== "ALL" ? frequencyFilter : undefined,
					isActive:
						statusFilter === "ACTIVE"
							? true
							: statusFilter === "PAUSED"
								? false
								: undefined,
					sortBy: sort?.key as any,
					sortOrder: sort?.direction,
				});
			}, 300);
		},
		[
			fetchRecurring,
			pagination?.limit,
			typeFilter,
			frequencyFilter,
			statusFilter,
			sort,
		],
	);

	// Filter changes
	const handleTypeFilterChange = useCallback(
		(type: TransactionType | "ALL") => {
			setTypeFilter(type);
			fetchRecurring({
				page: 1,
				limit: pagination?.limit || 20,
				search: search || undefined,
				type: type !== "ALL" ? type : undefined,
				frequency:
					frequencyFilter !== "ALL" ? frequencyFilter : undefined,
				isActive:
					statusFilter === "ACTIVE"
						? true
						: statusFilter === "PAUSED"
							? false
							: undefined,
				sortBy: sort?.key as any,
				sortOrder: sort?.direction,
			});
		},
		[
			fetchRecurring,
			pagination?.limit,
			search,
			frequencyFilter,
			statusFilter,
			sort,
		],
	);

	const handleFrequencyFilterChange = useCallback(
		(frequency: RecurringFrequency | "ALL") => {
			setFrequencyFilter(frequency);
			fetchRecurring({
				page: 1,
				limit: pagination?.limit || 20,
				search: search || undefined,
				type: typeFilter !== "ALL" ? typeFilter : undefined,
				frequency: frequency !== "ALL" ? frequency : undefined,
				isActive:
					statusFilter === "ACTIVE"
						? true
						: statusFilter === "PAUSED"
							? false
							: undefined,
				sortBy: sort?.key as any,
				sortOrder: sort?.direction,
			});
		},
		[
			fetchRecurring,
			pagination?.limit,
			search,
			typeFilter,
			statusFilter,
			sort,
		],
	);

	const handleStatusFilterChange = useCallback(
		(status: "ACTIVE" | "PAUSED" | "ALL") => {
			setStatusFilter(status);
			fetchRecurring({
				page: 1,
				limit: pagination?.limit || 20,
				search: search || undefined,
				type: typeFilter !== "ALL" ? typeFilter : undefined,
				frequency:
					frequencyFilter !== "ALL" ? frequencyFilter : undefined,
				isActive:
					status === "ACTIVE"
						? true
						: status === "PAUSED"
							? false
							: undefined,
				sortBy: sort?.key as any,
				sortOrder: sort?.direction,
			});
		},
		[
			fetchRecurring,
			pagination?.limit,
			search,
			typeFilter,
			frequencyFilter,
			sort,
		],
	);

	// Sort change
	const handleSortChange = useCallback(
		(newSort: SortConfig) => {
			setSort(newSort);
			fetchRecurring({
				page: 1,
				limit: pagination?.limit || 20,
				search: search || undefined,
				type: typeFilter !== "ALL" ? typeFilter : undefined,
				frequency:
					frequencyFilter !== "ALL" ? frequencyFilter : undefined,
				isActive:
					statusFilter === "ACTIVE"
						? true
						: statusFilter === "PAUSED"
							? false
							: undefined,
				sortBy: newSort.key as any,
				sortOrder: newSort.direction,
			});
		},
		[
			fetchRecurring,
			pagination?.limit,
			search,
			typeFilter,
			frequencyFilter,
			statusFilter,
		],
	);

	// Page change
	const handlePageChange = useCallback(
		(page: number) => {
			fetchRecurring({
				page,
				limit: pagination?.limit || 20,
				search: search || undefined,
				type: typeFilter !== "ALL" ? typeFilter : undefined,
				frequency:
					frequencyFilter !== "ALL" ? frequencyFilter : undefined,
				isActive:
					statusFilter === "ACTIVE"
						? true
						: statusFilter === "PAUSED"
							? false
							: undefined,
				sortBy: sort?.key as any,
				sortOrder: sort?.direction,
			});
		},
		[
			fetchRecurring,
			pagination?.limit,
			search,
			typeFilter,
			frequencyFilter,
			statusFilter,
			sort,
		],
	);

	// Limit change
	const handleLimitChange = useCallback(
		(limit: number) => {
			fetchRecurring({
				page: 1,
				limit,
				search: search || undefined,
				type: typeFilter !== "ALL" ? typeFilter : undefined,
				frequency:
					frequencyFilter !== "ALL" ? frequencyFilter : undefined,
				isActive:
					statusFilter === "ACTIVE"
						? true
						: statusFilter === "PAUSED"
							? false
							: undefined,
				sortBy: sort?.key as any,
				sortOrder: sort?.direction,
			});
		},
		[
			fetchRecurring,
			search,
			typeFilter,
			frequencyFilter,
			statusFilter,
			sort,
		],
	);

	// Cleanup debounce
	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

	const handleDelete = useCallback(
		async (id: string) => {
			const success = await deleteRecurring(id);
			if (success) {
				toast.success("Recurring transaction deleted successfully");
				await fetchRecurring({
					page: pagination?.page || 1,
					limit: pagination?.limit || 20,
				});
			}
			return success;
		},
		[deleteRecurring, fetchRecurring, pagination],
	);

	const handlePause = useCallback(
		async (id: string) => {
			const result = await pauseRecurring(id);
			if (result) {
				toast.success("Recurring transaction paused");
				await fetchRecurring({
					page: pagination?.page || 1,
					limit: pagination?.limit || 20,
				});
			}
		},
		[pauseRecurring, fetchRecurring, pagination],
	);

	const handleResume = useCallback(
		async (id: string) => {
			const result = await resumeRecurring(id);
			if (result) {
				toast.success("Recurring transaction resumed");
				await fetchRecurring({
					page: pagination?.page || 1,
					limit: pagination?.limit || 20,
				});
			}
		},
		[resumeRecurring, fetchRecurring, pagination],
	);

	const commonProps = {
		items: recurringTransactions,
		pagination: pagination ?? null,
		isLoading,
		onDelete: handleDelete,
		onPause: handlePause,
		onResume: handleResume,
		searchValue: search,
		onSearchChange: handleSearchChange,
		sortConfig: sort,
		onSortChange: handleSortChange,
		onPageChange: handlePageChange,
		onLimitChange: handleLimitChange,
		typeFilter,
		onTypeFilterChange: handleTypeFilterChange,
		frequencyFilter,
		onFrequencyFilterChange: handleFrequencyFilterChange,
		statusFilter,
		onStatusFilterChange: handleStatusFilterChange,
	};

	if (isFirstLoad) {
		return <RecurringSkeletons />;
	}

	return (
		<div className="container mx-auto space-y-6">
			<GenericPageHeader
				title="Recurring Transactions"
				subtitle="Manage your recurring income and expenses"
				showGridToggle={false}
				form={<RecurringFormDialog />}
			/>
			{/* Simple Button Toggle */}
			<div className="flex gap-2 border-b">
				<button
					onClick={() => setActiveView("all")}
					className={cn(
						"px-4 py-2 text-sm font-medium transition-colors relative",
						activeView === "all"
							? "text-primary border-b-2 border-primary"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					All Transactions
				</button>
				<button
					onClick={() => setActiveView("upcoming")}
					className={cn(
						"px-4 py-2 text-sm font-medium transition-colors relative",
						activeView === "upcoming"
							? "text-primary border-b-2 border-primary"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					Upcoming ({upcomingRecurring.length})
				</button>
			</div>

			{/* Content */}
			<div className="mt-6 px-1">
				{activeView === "all" ? (
					<RecurringTable {...commonProps} />
				) : (
					<UpcomingRecurringList items={upcomingRecurring} />
				)}
			</div>
		</div>
	);
}
