// components/pages/audit-logs/index.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { AuditLogsTable } from "./_components/audit-logs-table";
import { useAuditLogs } from "@/components/context/audit-logs-context/audit-logs-context";
import type { SortConfig } from "@/components/shared/data-table";
import type { EntityType } from "@/lib/audit-service/types";
import { AuditAction } from "@/generated/prisma/enums";
import GenericPageHeader from "@/components/shared/page-header/page-header";

export function AuditLogsPage() {
	const {
		auditLogs,
		pagination,
		isLoading,
		error,
		fetchAuditLogs,
		clearError,
	} = useAuditLogs();

	const [isFirstLoad, setIsFirstLoad] = useState(true);
	const [actionFilter, setActionFilter] = useState<AuditAction | "ALL">(
		"ALL",
	);
	const [entityTypeFilter, setEntityTypeFilter] = useState<
		EntityType | "ALL"
	>("ALL");
	const [sort, setSort] = useState<SortConfig | null>(null);

	useEffect(() => {
		fetchAuditLogs({ page: 1, limit: 20 }).finally(() =>
			setIsFirstLoad(false),
		);
	}, []);

	useEffect(() => {
		if (error) {
			toast.error(error);
			clearError();
		}
	}, [error, clearError]);

	const handleSortChange = useCallback(
		(newSort: SortConfig) => {
			setSort(newSort);
			fetchAuditLogs({
				page: 1,
				limit: pagination?.limit || 20,
				action: actionFilter !== "ALL" ? actionFilter : undefined,
				entityType:
					entityTypeFilter !== "ALL" ? entityTypeFilter : undefined,
			});
		},
		[fetchAuditLogs, pagination?.limit, actionFilter, entityTypeFilter],
	);

	const handleActionFilterChange = useCallback(
		(action: AuditAction | "ALL") => {
			setActionFilter(action);
			fetchAuditLogs({
				page: 1,
				limit: pagination?.limit || 20,
				action: action !== "ALL" ? action : undefined,
				entityType:
					entityTypeFilter !== "ALL" ? entityTypeFilter : undefined,
			});
		},
		[fetchAuditLogs, pagination?.limit, entityTypeFilter],
	);

	const handleEntityTypeFilterChange = useCallback(
		(entityType: EntityType | "ALL") => {
			setEntityTypeFilter(entityType);
			fetchAuditLogs({
				page: 1,
				limit: pagination?.limit || 20,
				action: actionFilter !== "ALL" ? actionFilter : undefined,
				entityType: entityType !== "ALL" ? entityType : undefined,
			});
		},
		[fetchAuditLogs, pagination?.limit, actionFilter],
	);

	const handlePageChange = useCallback(
		(page: number) => {
			fetchAuditLogs({
				page,
				limit: pagination?.limit || 20,
				action: actionFilter !== "ALL" ? actionFilter : undefined,
				entityType:
					entityTypeFilter !== "ALL" ? entityTypeFilter : undefined,
			});
		},
		[fetchAuditLogs, pagination?.limit, actionFilter, entityTypeFilter],
	);

	const handleLimitChange = useCallback(
		(limit: number) => {
			fetchAuditLogs({
				page: 1,
				limit,
				action: actionFilter !== "ALL" ? actionFilter : undefined,
				entityType:
					entityTypeFilter !== "ALL" ? entityTypeFilter : undefined,
			});
		},
		[fetchAuditLogs, actionFilter, entityTypeFilter],
	);

	return (
		<div className="h-full grid grid-rows-[auto_1fr]">
			<GenericPageHeader
				title="Audit Logs"
				subtitle="Track all system activity and changes"
			/>
			<div className="flex-1 overflow-auto min-h-0">
				<AuditLogsTable
					auditLogs={auditLogs}
					pagination={pagination ?? null}
					isLoading={isLoading}
					sortConfig={sort}
					onSortChange={handleSortChange}
					onPageChange={handlePageChange}
					onLimitChange={handleLimitChange}
					actionFilter={actionFilter}
					onActionFilterChange={handleActionFilterChange}
					entityTypeFilter={entityTypeFilter}
					onEntityTypeFilterChange={handleEntityTypeFilterChange}
				/>
			</div>
		</div>
	);
}
