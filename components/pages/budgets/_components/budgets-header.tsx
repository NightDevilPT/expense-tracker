// components/pages/budgets/_components/budgets-header.tsx

import { BudgetFormDialog } from "./budgets-form-dialog";

export function BudgetsHeader() {
	return (
		<div className="flex items-center justify-between flex-1">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
				<p className="text-muted-foreground">
					Manage your budget allocations and track spending
				</p>
			</div>
			<BudgetFormDialog />
		</div>
	);
}
