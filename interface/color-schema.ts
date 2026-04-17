// Color schema definitions for different themes
export interface ColorPalette {
	primary: string;
	secondary: string;
	accent: string;
	background: string;
	foreground: string;
	muted: string;
	mutedForeground: string;
	border: string;
	card: string;
	cardForeground: string;
	popover: string;
	popoverForeground: string;
}

export interface ColorSchemas {
	default: {
		light: ColorPalette;
		dark: ColorPalette;
	};
	red: {
		light: ColorPalette;
		dark: ColorPalette;
	};
	rose: {
		light: ColorPalette;
		dark: ColorPalette;
	};
	orange: {
		light: ColorPalette;
		dark: ColorPalette;
	};
	blue: {
		light: ColorPalette;
		dark: ColorPalette;
	};
	green: {
		light: ColorPalette;
		dark: ColorPalette;
	};
	violet: {
		light: ColorPalette;
		dark: ColorPalette;
	};
	yellow: {
		light: ColorPalette;
		dark: ColorPalette;
	};
}

// Default color schemas - you can customize these values
export const ColorSchemas: ColorSchemas = {
	default: {
		light: {
			primary: "#000000",
			secondary: "#737373",
			accent: "#171717",
			background: "#ffffff",
			foreground: "#0a0a0a",
			muted: "#f5f5f5",
			mutedForeground: "#737373",
			border: "#e5e5e5",
			card: "#ffffff",
			cardForeground: "#0a0a0a",
			popover: "#ffffff",
			popoverForeground: "#0a0a0a",
		},
		dark: {
			primary: "#fafafa",
			secondary: "#a3a3a3",
			accent: "#e5e5e5",
			background: "#000000",
			foreground: "#fafafa",
			muted: "#262626",
			mutedForeground: "#a3a3a3",
			border: "#262626",
			card: "#000000",
			cardForeground: "#fafafa",
			popover: "#000000",
			popoverForeground: "#fafafa",
		},
	},
	red: {
		light: {
			primary: "#dc2626",
			secondary: "#f87171",
			accent: "#ef4444",
			background: "#ffffff",
			foreground: "#000000",
			muted: "#fee2e2",
			mutedForeground: "#991b1b",
			border: "#fecaca",
			card: "#ffffff",
			cardForeground: "#000000",
			popover: "#ffffff",
			popoverForeground: "#000000",
		},
		dark: {
			primary: "#f87171",
			secondary: "#dc2626",
			accent: "#ef4444",
			background: "#000000",
			foreground: "#ffffff",
			muted: "#7f1d1d",
			mutedForeground: "#fecaca",
			border: "#991b1b",
			card: "#000000",
			cardForeground: "#ffffff",
			popover: "#000000",
			popoverForeground: "#ffffff",
		},
	},
	rose: {
		light: {
			primary: "#e11d48",
			secondary: "#f472b6",
			accent: "#ec4899",
			background: "#ffffff",
			foreground: "#000000",
			muted: "#fce7f3",
			mutedForeground: "#881337",
			border: "#fbcfe8",
			card: "#ffffff",
			cardForeground: "#000000",
			popover: "#ffffff",
			popoverForeground: "#000000",
		},
		dark: {
			primary: "#f472b6",
			secondary: "#e11d48",
			accent: "#ec4899",
			background: "#000000",
			foreground: "#ffffff",
			muted: "#881337",
			mutedForeground: "#fbcfe8",
			border: "#881337",
			card: "#000000",
			cardForeground: "#ffffff",
			popover: "#000000",
			popoverForeground: "#ffffff",
		},
	},
	orange: {
		light: {
			primary: "#ea580c",
			secondary: "#fb923c",
			accent: "#f97316",
			background: "#ffffff",
			foreground: "#000000",
			muted: "#ffedd5",
			mutedForeground: "#9a3412",
			border: "#fed7aa",
			card: "#ffffff",
			cardForeground: "#000000",
			popover: "#ffffff",
			popoverForeground: "#000000",
		},
		dark: {
			primary: "#fb923c",
			secondary: "#ea580c",
			accent: "#f97316",
			background: "#000000",
			foreground: "#ffffff",
			muted: "#9a3412",
			mutedForeground: "#fed7aa",
			border: "#9a3412",
			card: "#000000",
			cardForeground: "#ffffff",
			popover: "#000000",
			popoverForeground: "#ffffff",
		},
	},
	blue: {
		light: {
			primary: "#2563eb",
			secondary: "#60a5fa",
			accent: "#3b82f6",
			background: "#ffffff",
			foreground: "#000000",
			muted: "#dbeafe",
			mutedForeground: "#1e3a8a",
			border: "#bfdbfe",
			card: "#ffffff",
			cardForeground: "#000000",
			popover: "#ffffff",
			popoverForeground: "#000000",
		},
		dark: {
			primary: "#60a5fa",
			secondary: "#2563eb",
			accent: "#3b82f6",
			background: "#000000",
			foreground: "#ffffff",
			muted: "#1e3a8a",
			mutedForeground: "#bfdbfe",
			border: "#1e3a8a",
			card: "#000000",
			cardForeground: "#ffffff",
			popover: "#000000",
			popoverForeground: "#ffffff",
		},
	},
	green: {
		light: {
			primary: "#16a34a",
			secondary: "#4ade80",
			accent: "#22c55e",
			background: "#ffffff",
			foreground: "#000000",
			muted: "#dcfce7",
			mutedForeground: "#15803d",
			border: "#bbf7d0",
			card: "#ffffff",
			cardForeground: "#000000",
			popover: "#ffffff",
			popoverForeground: "#000000",
		},
		dark: {
			primary: "#4ade80",
			secondary: "#16a34a",
			accent: "#22c55e",
			background: "#000000",
			foreground: "#ffffff",
			muted: "#15803d",
			mutedForeground: "#bbf7d0",
			border: "#15803d",
			card: "#000000",
			cardForeground: "#ffffff",
			popover: "#000000",
			popoverForeground: "#ffffff",
		},
	},
	violet: {
		light: {
			primary: "#7c3aed",
			secondary: "#a78bfa",
			accent: "#8b5cf6",
			background: "#ffffff",
			foreground: "#000000",
			muted: "#ede9fe",
			mutedForeground: "#5b21b6",
			border: "#ddd6fe",
			card: "#ffffff",
			cardForeground: "#000000",
			popover: "#ffffff",
			popoverForeground: "#000000",
		},
		dark: {
			primary: "#a78bfa",
			secondary: "#7c3aed",
			accent: "#8b5cf6",
			background: "#000000",
			foreground: "#ffffff",
			muted: "#5b21b6",
			mutedForeground: "#ddd6fe",
			border: "#5b21b6",
			card: "#000000",
			cardForeground: "#ffffff",
			popover: "#000000",
			popoverForeground: "#ffffff",
		},
	},
	yellow: {
		light: {
			primary: "#ca8a04",
			secondary: "#facc15",
			accent: "#eab308",
			background: "#ffffff",
			foreground: "#000000",
			muted: "#fef9c3",
			mutedForeground: "#854d0e",
			border: "#fef08a",
			card: "#ffffff",
			cardForeground: "#000000",
			popover: "#ffffff",
			popoverForeground: "#000000",
		},
		dark: {
			primary: "#facc15",
			secondary: "#ca8a04",
			accent: "#eab308",
			background: "#000000",
			foreground: "#ffffff",
			muted: "#854d0e",
			mutedForeground: "#fef08a",
			border: "#854d0e",
			card: "#000000",
			cardForeground: "#ffffff",
			popover: "#000000",
			popoverForeground: "#ffffff",
		},
	},
};
