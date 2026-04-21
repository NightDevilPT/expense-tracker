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

export default function SidebarLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SidebarProvider>
			<Sidebar variant="floating" collapsible="icon">
				<SidebarHeader>
					<HeaderLogo
						title="Expense Tracker"
						subtitle="Manage your own expense tracker"
					/>
				</SidebarHeader>
				<SidebarContent>Content</SidebarContent>
				<SidebarFooter>Footer</SidebarFooter>
			</Sidebar>
			<SidebarInset className="w-full h-screen grid grid-rows-[60px_1px_1fr]">
				<div className="w-full flex justify-between items-center px-5">
					<div className="flex justify-center items-center gap-5">
						<SidebarTrigger />
						<RouteBreadcrumb />
					</div>
					<div className="flex justify-center items-center gap-5">
						<ThemeToggle />
						<UserNav />
					</div>
				</div>
				<Separator />
				<div className="px-5 pt-5">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
