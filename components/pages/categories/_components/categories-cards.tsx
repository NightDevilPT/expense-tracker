// components/pages/categories/_components/categories-cards.tsx
"use client";

import {
	Edit,
	Trash2,
	TrendingDown,
	TrendingUp,
	ArrowRightLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getIconByName } from "@/lib/icon-utils";
import { Card, CardContent } from "@/components/ui/card";
import { DataCard } from "@/components/shared/data-card";
import { CategoryFormDialog } from "./category-form-dialog";
import type { Category } from "@/lib/category-service/types";
import type { Pagination as PaginationType } from "@/lib/response-service";
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog";

interface CategoriesCardsProps {
	categories: Category[];
	pagination?: PaginationType | null;
	isLoading?: boolean;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onDelete: (id: string) => Promise<boolean>;
}

const typeConfig = {
	INCOME: { label: "Income", variant: "default" as const, icon: TrendingUp },
	EXPENSE: {
		label: "Expense",
		variant: "destructive" as const,
		icon: TrendingDown,
	},
	TRANSFER: {
		label: "Transfer",
		variant: "secondary" as const,
		icon: ArrowRightLeft,
	},
};

export function CategoriesCards({
	categories,
	pagination,
	isLoading,
	onPageChange,
	onLimitChange,
	onDelete,
}: CategoriesCardsProps) {
	return (
		<DataCard
			data={categories}
			pagination={pagination}
			isLoading={isLoading}
			onPageChange={onPageChange}
			onLimitChange={onLimitChange}
			emptyMessage="No categories found"
			emptyDescription="Create your first category to get started."
			gridClassName="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
			renderCard={(category) => {
				const config = typeConfig[category.type] || typeConfig.EXPENSE;
				const TypeIcon = config.icon;
				const CategoryIcon = getIconByName(category.icon);

				return (
					<Card className="group hover:shadow-md transition-shadow">
						<CardContent className="p-4">
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-3">
									<div
										className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
										style={{
											backgroundColor: category.color
												? `${category.color}18`
												: "#f3f4f6",
										}}
									>
										<CategoryIcon
											className="h-5 w-5"
											style={{
												color:
													category.color || "#71717a",
											}}
										/>
									</div>
									<div>
										<h3 className="font-medium text-sm">
											{category.name}
										</h3>
										<Badge
											variant={config.variant}
											className="gap-1 mt-1 text-xs"
										>
											<TypeIcon className="h-3 w-3" />
											{config.label}
										</Badge>
									</div>
								</div>
								<div className="flex items-center gap-1">
									{/* Edit Dialog */}
									<CategoryFormDialog
										mode="edit"
										category={category}
										trigger={
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
											>
												<Edit className="h-3.5 w-3.5" />
											</Button>
										}
									/>

									{/* Delete Dialog */}
									{!category.isDefault && (
										<DeleteAlertDialog
											title="Delete Category"
											itemName={category.name}
											itemType="category"
											onDelete={() =>
												onDelete(category.id)
											}
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
									)}
								</div>
							</div>
							{category.color && (
								<div className="flex items-center gap-2 mt-3 pt-3 border-t">
									<div
										className="h-4 w-4 rounded ring-1 ring-inset ring-black/10"
										style={{
											backgroundColor: category.color,
										}}
									/>
									<code className="text-xs text-muted-foreground">
										{category.color}
									</code>
								</div>
							)}
						</CardContent>
					</Card>
				);
			}}
		/>
	);
}
