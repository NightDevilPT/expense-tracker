// components/context/index.tsx
"use client";

import React from "react";
import { ThemeContextProvider } from "./theme-context";
import { TagsProvider } from "./tags-context/tags-context";
import { AuthProvider } from "./auth-context/auth-context";
import { BudgetsProvider } from "./budgets-context/budgets-context";
import { AccountsProvider } from "./accounts-context/accounts-context";
import { RecurringProvider } from "./recurring-context/recurring-context";
import { AuditLogsProvider } from "./audit-logs-context/audit-logs-context";
import { CategoriesProvider } from "./categories-context/categories-context";
import { TransactionsProvider } from "./transactions-context/transactions-context";
import { SavingsGoalsProvider } from "./savings-goals-context/savings-goals-context";
import { DashboardProvider } from "./dashboard-context/dashboard-context";

// ============================================
// CENTRALIZED PROVIDER COMPOSITION
// ============================================

interface AppProvidersProps {
	children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
	return (
		<AuthProvider>
			<CategoriesProvider>
				<TagsProvider>
					<AccountsProvider>
						<BudgetsProvider>
							<RecurringProvider>
								<SavingsGoalsProvider>
									<TransactionsProvider>
										<DashboardProvider>
											<AuditLogsProvider>
												<ThemeContextProvider>
													{children}
												</ThemeContextProvider>
											</AuditLogsProvider>
										</DashboardProvider>
									</TransactionsProvider>
								</SavingsGoalsProvider>
							</RecurringProvider>
						</BudgetsProvider>
					</AccountsProvider>
				</TagsProvider>
			</CategoriesProvider>
		</AuthProvider>
	);
}

// ============================================
// CENTRALIZED STORE HOOK (Redux-like)
// ============================================

export function useAppStore() {
	const auth = require("./auth-context/auth-context").useAuth();
	const categories =
		require("./categories-context/categories-context").useCategories();
	const tags = require("./tags-context/tags-context").useTags();
	const accounts =
		require("./accounts-context/accounts-context").useAccounts();
	const budgets = require("./budgets-context/budgets-context").useBudgets();
	const recurring =
		require("./recurring-context/recurring-context").useRecurring();
	const auditLogs =
		require("./audit-logs-context/audit-logs-context").useAuditLogs();
	const savingsGoals =
		require("./savings-goals-context/savings-goals-context").useSavingsGoals();
	const dashboard =
		require("./dashboard-context/dashboard-context").useDashboard();
	const transactions =
		require("./transactions-context/transactions-context").useTransactions();

	return {
		auth,
		categories,
		tags,
		accounts,
		budgets,
		recurring,
		auditLogs,
		savingsGoals,
		transactions,
		dashboard,
	};
}

// ============================================
// RE-EXPORT ALL HOOKS (Convenience)
// ============================================

export { useTags } from "./tags-context/tags-context";
export { useAuth } from "./auth-context/auth-context";
export { useBudgets } from "./budgets-context/budgets-context";
export { useAccounts } from "./accounts-context/accounts-context";
export { useRecurring } from "./recurring-context/recurring-context";
export { useAuditLogs } from "./audit-logs-context/audit-logs-context";
export { useCategories } from "./categories-context/categories-context";
export { useDashboard } from "./dashboard-context/dashboard-context";
export { useTransactions } from "./transactions-context/transactions-context";
export { useSavingsGoals } from "./savings-goals-context/savings-goals-context";
