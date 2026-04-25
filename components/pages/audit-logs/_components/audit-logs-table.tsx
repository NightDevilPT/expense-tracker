// components/pages/audit-logs/_components/audit-logs-table.tsx
"use client";

import {
	DataTable,
	type Column,
	type SortConfig,
} from "@/components/shared/data-table";
import { Eye, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AuditLogEntry, EntityType } from "@/lib/audit-service/types";
import type { Pagination as PaginationType } from "@/lib/response-service";
import { AuditAction } from "@/generated/prisma/enums";
import { AuditLogDetailDialog } from "./audit-log-detail-dialog";

type BadgeVariant = "default" | "secondary" | "outline";

function getActionConfig(action: AuditAction): {
	label: string;
	variant: BadgeVariant;
} {
	const actionMap: Partial<
		Record<AuditAction, { label: string; variant: BadgeVariant }>
	> = {
		CREATE: { label: "Create", variant: "default" },
		UPDATE: { label: "Update", variant: "secondary" },
		DELETE: { label: "Delete", variant: "outline" },
		EXPORT: { label: "Export", variant: "secondary" },
		LOGIN: { label: "Login", variant: "default" },
		LOGOUT: { label: "Logout", variant: "outline" },
		SETTINGS_CHANGE: { label: "Settings Change", variant: "secondary" },
		BUDGET_ALERT: { label: "Budget Alert", variant: "outline" },
		GOAL_MILESTONE: { label: "Goal Milestone", variant: "default" },
	};

	return (
		actionMap[action] || {
			label: action.replace(/_/g, " "),
			variant: "outline",
		}
	);
}

const ENTITY_TYPE_OPTIONS: Array<{
	value: EntityType | "ALL";
	label: string;
}> = [
	{ value: "ALL", label: "All Entities" },
	{ value: "Transaction", label: "Transaction" },
	{ value: "Category", label: "Category" },
	{ value: "Budget", label: "Budget" },
	{ value: "Account", label: "Account" },
	{ value: "User", label: "User" },
	{ value: "Tag", label: "Tag" },
	{ value: "Attachment", label: "Attachment" },
	{ value: "SavingsGoal", label: "Savings Goal" },
	{ value: "RecurringTransaction", label: "Recurring Transaction" },
	{ value: "Export", label: "Export" },
	{ value: "Settings", label: "Settings" },
	{ value: "AuditLog", label: "Audit Log" },
];

interface AuditLogRow {
	id: string;
	action: AuditAction;
	entityType: string;
	entityId: string | null;
	oldValue: Record<string, any> | null;
	newValue: Record<string, any> | null;
	description: string | null;
	ipAddress: string | null;
	userAgent: string | null;
	userId: string;
	createdAt?: Date;
}

function formatDateTime(date?: Date): string {
	if (!date) return "—";
	return new Intl.DateTimeFormat("en-US", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(date));
}

interface AuditLogsTableProps {
	auditLogs: AuditLogEntry[];
	pagination?: PaginationType | null;
	isLoading?: boolean;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	sortConfig?: SortConfig | null;
	onSortChange?: (sort: SortConfig) => void;
	actionFilter?: AuditAction | "ALL";
	onActionFilterChange?: (action: AuditAction | "ALL") => void;
	entityTypeFilter?: EntityType | "ALL";
	onEntityTypeFilterChange?: (entityType: EntityType | "ALL") => void;
}

export function AuditLogsTable({
	auditLogs,
	pagination,
	isLoading,
	onPageChange,
	onLimitChange,
	sortConfig,
	onSortChange,
	actionFilter = "ALL",
	onActionFilterChange,
	entityTypeFilter = "ALL",
	onEntityTypeFilterChange,
}: AuditLogsTableProps) {
	const data: AuditLogRow[] = auditLogs.map((log) => ({
		...log,
		id: log.id || crypto.randomUUID(),
	}));

	const columns: Column<AuditLogRow>[] = [
		{
			key: "index",
			header: "#",
			cell: (_, index) => (
				<span className="text-xs text-muted-foreground tabular-nums">
					{((pagination?.page || 1) - 1) * (pagination?.limit || 20) +
						index +
						1}
				</span>
			),
			className: "w-12",
		},
		{
			key: "action",
			header: "Action",
			sortable: true,
			cell: (item) => {
				const config = getActionConfig(item.action);
				return <Badge variant={config.variant}>{config.label}</Badge>;
			},
			className: "w-28",
		},
		{
			key: "entityType",
			header: "Entity",
			sortable: true,
			cell: (item) => (
				<div className="flex items-center gap-1.5">
					<FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
					<span className="text-sm">{item.entityType}</span>
				</div>
			),
			className: "w-44",
			hideOnMobile: true,
		},
		{
			key: "description",
			header: "Description",
			cell: (item) => (
				<span className="text-sm line-clamp-1 max-w-[400px] block">
					{item.description || "—"}
				</span>
			),
		},
		{
			key: "userId",
			header: "User",
			cell: (item) => (
				<div className="flex items-center gap-1.5">
					<User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
					<span className="text-xs text-muted-foreground font-mono">
						{item.userId.slice(0, 8)}...
					</span>
				</div>
			),
			className: "w-32",
			hideOnMobile: true,
		},
		{
			key: "createdAt",
			header: "Date & Time",
			sortable: true,
			cell: (item) => (
				<div className="text-sm text-muted-foreground whitespace-nowrap">
					{formatDateTime(item.createdAt)}
				</div>
			),
			className: "w-44",
		},
		{
			key: "actions",
			header: "",
			cell: (item) => (
				<div className="flex items-center justify-end">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<AuditLogDetailDialog
									auditLog={item}
									trigger={
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8"
										>
											<Eye className="h-3.5 w-3.5" />
										</Button>
									}
								/>
							</TooltipTrigger>
							<TooltipContent>
								<p>View Details</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			),
			className: "w-16 text-right",
		},
	];

	const filterSlot = (
		<div className="flex items-center gap-2">
			{onActionFilterChange && (
				<Select
					value={actionFilter}
					onValueChange={(value) =>
						onActionFilterChange(value as AuditAction | "ALL")
					}
				>
					<SelectTrigger className="w-[150px]">
						<SelectValue placeholder="Filter by action" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="ALL">All Actions</SelectItem>
						{Object.values(AuditAction).map((action) => (
							<SelectItem key={action} value={action}>
								{getActionConfig(action).label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
			{onEntityTypeFilterChange && (
				<Select
					value={entityTypeFilter}
					onValueChange={(value) =>
						onEntityTypeFilterChange(value as EntityType | "ALL")
					}
				>
					<SelectTrigger className="w-[170px]">
						<SelectValue placeholder="Filter by entity" />
					</SelectTrigger>
					<SelectContent>
						{ENTITY_TYPE_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
		</div>
	);

	return (
		<DataTable
			data={data}
			columns={columns}
			pagination={pagination}
			isLoading={isLoading}
			onPageChange={onPageChange}
			onLimitChange={onLimitChange}
			emptyMessage="No audit logs found"
			emptyDescription="Audit logs will appear here as activities are performed."
			sortConfig={sortConfig}
			onSortChange={onSortChange}
			filterSlot={filterSlot}
		/>
	);
}
