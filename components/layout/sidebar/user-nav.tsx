// components/layout/user-nav/index.tsx

"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/components/context/auth-context/auth-context";

interface UserNavProps {
	compact?: boolean;
}

export function UserNav({ compact = false }: UserNavProps) {
	const { user, isLoading, logout } = useAuth();
	const router = useRouter();

	const getUserInitial = () => {
		if (!user?.name) return "?";
		return user.name.charAt(0).toUpperCase();
	};

	const handleLogout = async () => {
		await logout();
		router.push("/");
		router.refresh();
	};

	const handleSettings = () => {
		router.push("/settings");
	};

	// Loading state
	if (isLoading) {
		return (
			<div className="flex items-center gap-3">
				<Skeleton className="h-8 w-8 rounded-full" />
			</div>
		);
	}

	// No user - don't render
	if (!user) {
		return <Button>Sign in</Button>;
	}

	console.log(user, "CCCC");

	// Compact mode (icon only)
	if (compact) {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="relative h-8 w-8 rounded-full"
						aria-label="User menu"
					>
						<Avatar className="h-8 w-8">
							<AvatarFallback className="bg-primary text-primary-foreground text-sm">
								{getUserInitial()}
							</AvatarFallback>
						</Avatar>
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent
					className="w-56"
					align="end"
					sideOffset={8}
				>
					<DropdownMenuLabel className="font-normal grid grid-cols-[40px_1fr]">
						<Avatar className="h-8 w-8">
							<AvatarFallback className="bg-primary text-primary-foreground text-sm">
								{getUserInitial()}
							</AvatarFallback>
						</Avatar>
						<div className="flex flex-col space-y-1">
							<p className="text-sm font-medium leading-none">
								{user.name}
							</p>
							<p className="text-xs leading-none text-muted-foreground">
								{user.email}
							</p>
						</div>
					</DropdownMenuLabel>

					<DropdownMenuSeparator />

					<DropdownMenuItem
						onClick={handleSettings}
						className="cursor-pointer"
					>
						<Settings className="mr-2 h-4 w-4" />
						Settings
					</DropdownMenuItem>

					<DropdownMenuItem
						onClick={handleLogout}
						className="cursor-pointer text-destructive focus:text-destructive"
					>
						<LogOut className="mr-2 h-4 w-4" />
						Sign out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}

	// Full mode (with user info)
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="relative h-auto p-0 hover:bg-transparent"
					aria-label="User menu"
				>
					<div className="flex items-center gap-3 rounded-lg p-1 transition-colors hover:bg-accent">
						<Avatar className="h-8 w-8">
							<AvatarFallback className="bg-primary text-primary-foreground text-sm">
								{getUserInitial()}
							</AvatarFallback>
						</Avatar>
					</div>
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent className="w-56" align="end" sideOffset={8}>
				<DropdownMenuLabel className="font-normal grid grid-cols-[40px_1fr]">
					<Avatar className="h-8 w-8">
						<AvatarFallback className="bg-primary text-primary-foreground text-sm">
							{getUserInitial()}
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">
							{user.name}
						</p>
						<p className="text-xs leading-none text-muted-foreground">
							{user.email}
						</p>
					</div>
				</DropdownMenuLabel>

				<DropdownMenuSeparator />

				<DropdownMenuItem
					onClick={handleSettings}
					className="cursor-pointer"
				>
					<Settings className="mr-2 h-4 w-4" />
					Settings
				</DropdownMenuItem>

				<DropdownMenuItem
					onClick={handleLogout}
					className="cursor-pointer text-destructive focus:text-destructive"
				>
					<LogOut className="mr-2 h-4 w-4" />
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
