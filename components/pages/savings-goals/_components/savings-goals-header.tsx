// components/pages/savings-goals/_components/savings-goals-header.tsx

import { SavingsGoalFormDialog } from "./savings-goal-form-dialog";

export function SavingsGoalsHeader() {
	return (
		<div className="flex items-center justify-between flex-1">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					Savings Goals
				</h1>
				<p className="text-muted-foreground">
					Track and manage your savings targets
				</p>
			</div>
			<SavingsGoalFormDialog />
		</div>
	);
}
