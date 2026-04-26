// components/pages/transactions/_components/transactions-header.tsx
"use client";

import { TransactionsFormDialog } from "./transactions-form-dialog";

export function TransactionsHeader() {
	return (
		<div className="flex items-center justify-between w-full">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					Transactions
				</h1>
				<p className="text-muted-foreground">
					Manage and track all your financial transactions
				</p>
			</div>
			<TransactionsFormDialog />
		</div>
	);
}
