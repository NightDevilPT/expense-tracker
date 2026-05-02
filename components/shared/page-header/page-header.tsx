import React from "react";
import ToggleView from "../toggle-view";

const GenericPageHeader = ({
	title,
	subtitle,
	form,
	showGridToggle,
}: {
	title: string;
	subtitle: string;
	form?: React.ReactNode;
	showGridToggle?: boolean;
}) => {
	return (
		<div className="flex-1 flex items-center justify-between mb-4">
			<div className="flex items-center justify-between flex-1">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						{title}
					</h1>
					<p className="text-muted-foreground">{subtitle}</p>
				</div>
				{form && <div className="mr-4">{form}</div>}
			</div>
			{showGridToggle && <ToggleView />}
		</div>
	);
};

export default GenericPageHeader;
