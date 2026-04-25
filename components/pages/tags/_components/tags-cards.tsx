// components/pages/tags/_components/tags-cards.tsx
"use client";

import { DataCard } from "@/components/shared/data-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog";
import { Edit, Trash2, Hash, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TagWithCount } from "@/lib/tag-service/types";
import type { Pagination as PaginationType } from "@/lib/response-service";
import { TagsFormDialog } from "./tags-form-dialog";

interface TagsCardsProps {
	items: TagWithCount[];
	pagination?: PaginationType | null;
	isLoading?: boolean;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onDelete: (id: string) => Promise<boolean>;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
}

export function TagsCards({
	items,
	pagination,
	isLoading,
	onPageChange,
	onLimitChange,
	onDelete,
	searchValue = "",
	onSearchChange,
}: TagsCardsProps) {
	return (
		<DataCard
			data={items}
			pagination={pagination}
			isLoading={isLoading}
			onPageChange={onPageChange}
			onLimitChange={onLimitChange}
			emptyMessage="No tags found"
			emptyDescription="Create your first tag to organize your transactions."
			gridClassName="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
			renderCard={(item) => (
				<Card className="group hover:shadow-md transition-shadow">
					<CardContent className="p-4">
						<div className="flex items-start justify-between">
							<div className="flex items-center gap-3 flex-1 min-w-0">
								{item.color && (
									<div
										className="w-4 h-4 rounded-full shrink-0"
										style={{ backgroundColor: item.color }}
									/>
								)}
								<h3 className="font-medium text-sm truncate">
									{item.name}
								</h3>
							</div>
							<div className="flex items-center gap-1 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
										onSearchChange?.(searchValue);
									}}
								/>
								<DeleteAlertDialog
									title="Delete Tag"
									itemName={item.name}
									itemType="tag"
									description={
										item.transactionCount &&
										item.transactionCount > 0
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
						</div>

						<div className="space-y-2 mt-3 pt-3 border-t">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground flex items-center gap-1">
									<Hash className="h-3 w-3" />
									Usage count
								</span>
								<Badge variant="secondary">
									{item.transactionCount || 0}
								</Badge>
							</div>

							{item.createdAt && (
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground flex items-center gap-1">
										<Calendar className="h-3 w-3" />
										Created
									</span>
									<span className="text-xs text-muted-foreground">
										{new Date(
											item.createdAt,
										).toLocaleDateString()}
									</span>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}
		/>
	);
}
