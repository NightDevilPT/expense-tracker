"use client";

import { Wallet } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useSidebar } from "@/components/ui/sidebar";
import { useTheme } from "@/components/context/theme-context";

interface IHeaderLogoProps {
	title?: string;
	subtitle?: string;
}

const HeaderLogo = ({ title, subtitle }: IHeaderLogoProps) => {
	const { state } = useSidebar();
	const { dictionary } = useTheme();

	if (!dictionary) {
		return (
			<div
				className={`w-full h-auto grid grid-cols-[40px_1fr] ${
					state === "collapsed" &&
					"grid-cols-1 place-content-center place-items-center"
				}`}
			>
				<div
					className={`w-full h-full flex justify-center items-center border-2 rounded-md border-foreground/20`}
				>
					<Wallet className="!h-8 text-foreground" />
				</div>
				<div
					className={`ml-3 overflow-hidden transition-all duration-300 text-nowrap ${
						state === "expanded" ? "w-full" : "w-0 hidden"
					}`}
				>
					<Label className="text-base">Loading...</Label>
					<Label className="text-xs text-muted-foreground">
						Loading...
					</Label>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`w-full h-auto grid grid-cols-[40px_1fr] ${
				state === "collapsed" &&
				"grid-cols-1 place-content-center place-items-center"
			}`}
		>
			<div
				className={`w-full h-full flex justify-center items-center border-2 rounded-md border-foreground/20`}
			>
				<Wallet className="!h-8 text-foreground" />
			</div>

			<div
				className={`ml-3 overflow-hidden transition-all duration-300 text-nowrap ${
					state === "expanded" ? "w-full pr-3" : "w-0 hidden"
				}`}
			>
				<Label className="text-base block truncate">{title}</Label>
				<Label className="text-xs text-muted-foreground block truncate">
					{subtitle}
				</Label>
			</div>
		</div>
	);
};

export default HeaderLogo;
