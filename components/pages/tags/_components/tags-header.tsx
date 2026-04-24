// components/pages/tags/_components/tags-header.tsx
"use client";

import { TagsFormDialog } from "./tags-form-dialog";

export function TagsHeader() {
	return (
		<div className="flex items-center justify-between flex-1">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Tags</h1>
				<p className="text-muted-foreground">
					Organize your transactions with color-coded tags
				</p>
			</div>
			<TagsFormDialog />
		</div>
	);
}
