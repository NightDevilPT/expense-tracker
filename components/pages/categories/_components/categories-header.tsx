// components/pages/categories/_components/categories-header.tsx

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CategoryFormDialog } from "./category-form-dialog";

export function CategoriesHeader() {
	return (
		<div className="flex items-center justify-between flex-1">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					Categories
				</h1>
				<p className="text-muted-foreground">
					Manage your income and expense categories
				</p>
			</div>
			<CategoryFormDialog />
		</div>
	);
}
