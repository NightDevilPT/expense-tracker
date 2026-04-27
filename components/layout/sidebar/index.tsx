"use client";

import { RouteBreadcrumb } from "@/components/shared/route-breadcrumb";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Separator } from "@/components/ui/separator";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import HeaderLogo from "./header-logo";
import { UserNav } from "./user-nav";
import { NavContent } from "./nav-content";
import { routes } from "./route";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SidebarLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SidebarProvider>
			<Sidebar
				variant="floating"
				collapsible="icon"
				className="!space-y-5"
			>
				<SidebarHeader>
					<HeaderLogo
						title="Expense Tracker"
						subtitle="Manage your own expense tracker"
					/>
				</SidebarHeader>
				<Separator className="w-full h-[1px]" />
				<SidebarContent className="py-5">
					<NavContent items={routes} />
				</SidebarContent>
				<SidebarFooter>Footer</SidebarFooter>
			</Sidebar>
			<SidebarInset className="w-full h-screen grid grid-rows-[60px_1px_1fr]">
				<div className="w-full flex justify-between items-center px-4">
					<div className="flex justify-center items-center gap-5">
						<SidebarTrigger />
						<RouteBreadcrumb />
					</div>
					<div className="flex justify-center items-center gap-3">
						<ThemeToggle />
						<UserNav />
					</div>
				</div>
				<Separator />
				<ScrollArea className="px-5 pt-5 h-full overflow-auto">{children}</ScrollArea>
			</SidebarInset>
		</SidebarProvider>
	);
}
