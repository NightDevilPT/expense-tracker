// components\layout\sidebar\route.ts

import { ChartBarStacked, LayoutDashboard } from "lucide-react";
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
	{
		href: "/dashboard",
		label: "Dashboard",
		icon: LayoutDashboard,
	},
	{
		href: "/categories",
		label: "Categories",
		icon: ChartBarStacked,
	},
	{
		href: "/transactions",
		label: "Transactions",
		icon: LayoutDashboard,
	},
];
