// components/layout/sidebar/route.ts

import {
	LayoutDashboard,
	Wallet,
	ChartBarStacked,
	ArrowLeftRight,
	Target,
	Tag,
	FileText,
	Settings,
	Bell,
	BarChart3,
	TrendingUp,
	Repeat,
	User,
} from "lucide-react";
import { ElementType } from "react";

export interface IRoute {
	href: string;
	label: string;
	icon?: ElementType;
	children?: IRoute[];
	active?: boolean;
	disabled?: boolean;
}

export const routes: IRoute[] = [
	// MAIN DASHBOARD
	{
		href: "/dashboard",
		label: "Dashboard",
		icon: LayoutDashboard,
	},

	// FINANCIAL CORE
	{
		href: "/transactions",
		label: "Transactions",
		icon: ArrowLeftRight,
	},
	{
		href: "/accounts",
		label: "Accounts",
		icon: Wallet,
	},
	{
		href: "/categories",
		label: "Categories",
		icon: ChartBarStacked,
	},

	// BUDGET & PLANNING
	{
		href: "/budgets",
		label: "Budgets",
		icon: TrendingUp,
	},
	{
		href: "/recurring",
		label: "Recurring",
		icon: Repeat,
	},
	{
		href: "/savings-goals",
		label: "Savings Goals",
		icon: Target,
	},

	// ORGANIZATION
	{
		href: "/tags",
		label: "Tags",
		icon: Tag,
	},

	// REPORTS & HISTORY
	{
		href: "/reports",
		label: "Reports",
		icon: BarChart3,
	},
	{
		href: "/audit-logs",
		label: "Audit Logs",
		icon: FileText,
	},
];
