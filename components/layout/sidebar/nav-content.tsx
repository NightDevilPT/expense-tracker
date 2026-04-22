"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { IRoute } from "./route";

interface NavContentProps {
	items: IRoute[];
}

export function NavContent({ items }: NavContentProps) {
	const pathname = usePathname();
	const { state } = useSidebar();
	const isCollapsed = state === "collapsed";

	const isActive = (href: string) => {
		if (href === "/dashboard") {
			return pathname === href;
		}
		if (href !== "/") {
			return pathname === href || pathname.startsWith(href + "/");
		}
		return pathname === href;
	};

	const isChildActive = (children?: IRoute[]) => {
		if (!children) return false;
		return children.some((child) => isActive(child.href));
	};

	return (
		<SidebarMenu className="px-2">
			{items.map((item) => {
				const hasChildren = item.children && item.children.length > 0;
				const active = isActive(item.href);
				const childActive = isChildActive(item.children);

				if (hasChildren) {
					return (
						<Collapsible
							key={item.href}
							defaultOpen={active || childActive}
							className="group/collapsible"
						>
							<SidebarMenuItem>
								<CollapsibleTrigger asChild>
									<SidebarMenuButton
										isActive={active}
										className={`w-full justify-start gap-3 ${
											active
												? "!bg-secondary"
												: "!bg-transparent"
										}`}
									>
										{item.icon && (
											<item.icon className="h-4 w-4 shrink-0" />
										)}
										{!isCollapsed && (
											<>
												<span className="flex-1 text-left">
													{item.label}
												</span>
												<ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
											</>
										)}
									</SidebarMenuButton>
								</CollapsibleTrigger>
								{!isCollapsed && (
									<CollapsibleContent>
										<SidebarMenuSub className="px-4">
											{item.children?.map((child) => (
												<SidebarMenuSubItem
													key={child.href}
												>
													<SidebarMenuSubButton
														asChild
														isActive={isActive(
															child.href,
														)}
														className={`w-full justify-start ${
															isActive(child.href)
																? "!bg-secondary"
																: "!bg-transparent"
														}`}
													>
														<Link href={child.href}>
															<span>
																{child.label}
															</span>
														</Link>
													</SidebarMenuSubButton>
												</SidebarMenuSubItem>
											))}
										</SidebarMenuSub>
									</CollapsibleContent>
								)}
							</SidebarMenuItem>
						</Collapsible>
					);
				}

				return (
					<SidebarMenuItem key={item.href}>
						<SidebarMenuButton
							asChild
							isActive={active}
							className={`w-full justify-start gap-3 ${
								active ? "!bg-secondary" : "!bg-transparent"
							}`}
						>
							<Link href={item.href}>
								{item.icon && (
									<item.icon className="h-4 w-4 shrink-0" />
								)}
								{!isCollapsed && (
									<span className="flex-1 text-left">
										{item.label}
									</span>
								)}
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				);
			})}
		</SidebarMenu>
	);
}
