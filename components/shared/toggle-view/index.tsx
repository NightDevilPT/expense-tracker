import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IViewMode, useTheme } from "@/components/context/theme-context";

const ToggleView = () => {
	const { viewMode, setViewMode } = useTheme();
	return (
		<div className="flex items-center gap-1 border rounded-md p-1">
			<Button
				variant={viewMode === IViewMode.TABLE ? "secondary" : "ghost"}
				size="icon"
				className="h-8 w-8"
				onClick={() => setViewMode(IViewMode.TABLE)}
			>
				<List className="h-4 w-4" />
			</Button>
			<Button
				variant={viewMode === IViewMode.GRID ? "secondary" : "ghost"}
				size="icon"
				className="h-8 w-8"
				onClick={() => setViewMode(IViewMode.GRID)}
			>
				<LayoutGrid className="h-4 w-4" />
			</Button>
		</div>
	);
};

export default ToggleView;
