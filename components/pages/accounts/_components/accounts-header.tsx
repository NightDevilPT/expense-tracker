// components/pages/accounts/_components/accounts-header.tsx

import { AccountsFormDialog } from "./accounts-form-dialog";


export function AccountsHeader() {
	return (
		<div className="flex items-center justify-between flex-1">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
				<p className="text-muted-foreground">
					Manage your financial accounts and track balances
				</p>
			</div>
			<AccountsFormDialog />
		</div>
	);
}
