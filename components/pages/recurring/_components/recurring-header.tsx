// components/pages/recurring/_components/recurring-header.tsx
"use client";

import { RecurringFormDialog } from "./recurring-form-dialog";

export function RecurringHeader() {
	return (
		<div className="flex items-center justify-between">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					Recurring Transactions
				</h1>
				<p className="text-muted-foreground">
					Manage your recurring income and expenses
				</p>
			</div>
			<RecurringFormDialog />
		</div>
	);
}
