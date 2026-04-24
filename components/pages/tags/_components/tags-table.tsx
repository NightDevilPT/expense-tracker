// components/pages/tags/_components/tags-table.tsx
"use client";

import {
	DataTable,
	type Column,
	type SortConfig,
} from "@/components/shared/data-table";
import { Edit, Trash2, Hash, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog";
import type { TagWithCount } from "@/lib/tag-service/types";
import type { Pagination as PaginationType } from "@/lib/response-service";
import { TagsFormDialog } from "./tags-form-dialog";

interface TagsTableProps {
	items: TagWithCount[];
	pagination?: PaginationType | null;
	isLoading?: boolean;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onDelete: (id: string) => Promise<boolean>;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	sortConfig?: SortConfig | null;
	onSortChange?: (sort: SortConfig) => void;
}

export function TagsTable({
	items,
	pagination,
	isLoading,
	onPageChange,
	onLimitChange,
	onDelete,
	searchValue = "",
	onSearchChange,
	sortConfig,
	onSortChange,
}: TagsTableProps) {
	const columns: Column<TagWithCount>[] = [
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
			key: "name",
			header: "Name",
			sortable: true,
			cell: (item) => (
				<div className="flex items-center gap-2">
					{item.color && (
						<div
							className="w-3 h-3 rounded-full"
							style={{ backgroundColor: item.color }}
						/>
					)}
					<span className="font-medium">{item.name}</span>
				</div>
			),
		},
		{
			key: "transactionCount",
			header: "Usage",
			sortable: true,
			cell: (item) => (
				<Badge variant="secondary" className="gap-1">
					<Hash className="h-3 w-3" />
					{item.transactionCount || 0}
				</Badge>
			),
			className: "w-24",
		},
		{
			key: "createdAt",
			header: "Created",
			sortable: true,
			cell: (item) => {
				return (
					<div className="flex items-center gap-1 text-sm text-muted-foreground">
						<Calendar className="h-3 w-3" />
						<span>
							{item.createdAt
								? new Date(item.createdAt).toLocaleDateString()
								: "—"}
						</span>
					</div>
				);
			},
			className: "w-32",
			hideOnMobile: true,
		},
		{
			key: "actions",
			header: "",
			cell: (item) => (
				<div className="flex items-center justify-end gap-1">
					<TagsFormDialog
						mode="edit"
						item={item}
						trigger={
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
							>
								<Edit className="h-3.5 w-3.5" />
							</Button>
						}
						onSuccess={() => {
							// Refresh the list after edit
							onSearchChange?.(searchValue);
						}}
					/>
					<DeleteAlertDialog
						title="Delete Tag"
						itemName={item.name}
						itemType="tag"
						description={
							item.transactionCount && item.transactionCount > 0
								? `This tag is used in ${item.transactionCount} transaction(s). Deleting it will remove the tag from those transactions.`
								: undefined
						}
						onDelete={() => onDelete(item.id)}
						trigger={
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
							>
								<Trash2 className="h-3.5 w-3.5 text-destructive" />
							</Button>
						}
					/>
				</div>
			),
			className: "w-24 text-right",
		},
	];

	return (
		<DataTable
			data={items}
			columns={columns}
			pagination={pagination}
			isLoading={isLoading}
			onPageChange={onPageChange}
			onLimitChange={onLimitChange}
			emptyMessage="No tags found"
			emptyDescription="Create your first tag to organize your transactions."
			searchPlaceholder="Search tags..."
			searchValue={searchValue}
			onSearchChange={onSearchChange}
			sortConfig={sortConfig}
			onSortChange={onSortChange}
		/>
	);
}
