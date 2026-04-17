"use client";

import {
	useTheme as useNextTheme,
	ThemeProvider as NextThemesProvider,
} from "next-themes";
import * as React from "react";
import { getDictionary } from "@/i18n";

// Define available themes and colors
enum IThemeMode {
	LIGHT = "light",
	DARK = "dark",
	SYSTEM = "system",
}

enum IColorScheme {
	DEFAULT = "default",
	RED = "red",
	ROSE = "rose",
	ORANGE = "orange",
	BLUE = "blue",
	GREEN = "green",
	VIOLET = "violet",
	YELLOW = "yellow",
}

enum IViewMode {
	GRID = "grid",
	TABLE = "table",
}

enum ISidebarCollapsible {
	OFFCANVAS = "offcanvas",
	ICON = "icon",
	NONE = "none",
}

enum ISidebarVariant {
	SIDEBAR = "sidebar",
	FLOATING = "floating",
	INSET = "inset",
}

enum ISidebarView {
	LEFT = "left",
	RIGHT = "right",
}

enum ILanguage {
	EN = "en",
	FR = "fr",
	ES = "es",
	JA = "ja",
	DE = "de",
}

export type Dictionary = Record<string, any>;

interface IThemeContextType {
	themeMode: IThemeMode;
	setThemeMode: (theme: IThemeMode) => void;
	colorScheme: IColorScheme;
	setColorScheme: (color: IColorScheme) => void;
	viewMode: IViewMode;
	setViewMode: (view: IViewMode) => void;
	sidebarCollapsible: ISidebarCollapsible;
	setSidebarCollapsible: (collapsible: ISidebarCollapsible) => void;
	sidebarState: "collapsed" | "expanded";
	setSidebarState: (state: "collapsed" | "expanded") => void;
	sidebarVariant: ISidebarVariant;
	setSidebarVariant: (variant: ISidebarVariant) => void;
	sidebarView: ISidebarView;
	setSidebarView: (view: ISidebarView) => void;
	resolvedTheme?: IThemeMode.LIGHT | IThemeMode.DARK;
	language: ILanguage;
	setLanguage: (language: ILanguage) => void;
	dictionary: Dictionary | null;
	isLoading: boolean;
}

const ThemeContext = React.createContext<IThemeContextType | undefined>(
	undefined,
);

interface IThemeProviderProps {
	children: React.ReactNode;
	defaultTheme?: IThemeMode;
	defaultColorScheme?: IColorScheme;
	defaultViewMode?: IViewMode;
	defaultSidebarCollapsible?: ISidebarCollapsible;
	defaultSidebarState?: "collapsed" | "expanded";
	defaultSidebarVariant?: ISidebarVariant;
	defaultSidebarView?: ISidebarView;
	defaultLanguage?: ILanguage;
	storageKey?: string;
	colorStorageKey?: string;
	viewStorageKey?: string;
	sidebarCollapsibleStorageKey?: string;
	sidebarStateStorageKey?: string;
	sidebarVariantStorageKey?: string;
	sidebarViewStorageKey?: string;
	languageStorageKey?: string;
}

function ThemeProvider({
	children,
	defaultTheme = IThemeMode.SYSTEM,
	defaultColorScheme = IColorScheme.DEFAULT,
	defaultViewMode = IViewMode.GRID,
	defaultSidebarCollapsible = ISidebarCollapsible.ICON,
	defaultSidebarState = "expanded",
	defaultSidebarVariant = ISidebarVariant.INSET,
	defaultSidebarView = ISidebarView.LEFT,
	defaultLanguage = ILanguage.EN,
	storageKey = "ui-theme",
	colorStorageKey = "ui-color-scheme",
	viewStorageKey = "ui-view-mode",
	sidebarCollapsibleStorageKey = "ui-sidebar-collapsible",
	sidebarStateStorageKey = "ui-sidebar-state",
	sidebarVariantStorageKey = "ui-sidebar-variant",
	sidebarViewStorageKey = "ui-sidebar-view",
	languageStorageKey = "ui-language",
}: IThemeProviderProps) {
	const { theme, setTheme, resolvedTheme } = useNextTheme();
	const [colorScheme, setColorSchemeState] =
		React.useState<IColorScheme>(defaultColorScheme);
	const [viewMode, setViewModeState] =
		React.useState<IViewMode>(defaultViewMode);
	const [sidebarCollapsible, setSidebarCollapsibleState] =
		React.useState<ISidebarCollapsible>(defaultSidebarCollapsible);
	const [sidebarState, setSidebarStateInternal] = React.useState<
		"collapsed" | "expanded"
	>(defaultSidebarState);
	const [sidebarVariant, setSidebarVariantState] =
		React.useState<ISidebarVariant>(defaultSidebarVariant);
	const [sidebarView, setSidebarViewState] =
		React.useState<ISidebarView>(defaultSidebarView);
	const [language, setLanguageState] =
		React.useState<ILanguage>(defaultLanguage);
	const [dictionary, setDictionary] = React.useState<Dictionary | null>(null);
	const [isLoading, setIsLoading] = React.useState(true);
	const [isInitialized, setIsInitialized] = React.useState(false);

	// Initialize all preferences from localStorage or use defaults
	React.useEffect(() => {
		// Get theme from localStorage
		const storedTheme = localStorage.getItem(storageKey);
		if (
			storedTheme &&
			Object.values(IThemeMode).includes(storedTheme as IThemeMode)
		) {
			setTheme(storedTheme as IThemeMode);
		} else {
			localStorage.setItem(storageKey, defaultTheme);
			setTheme(defaultTheme);
		}

		// Get color scheme from localStorage
		const storedColorScheme = localStorage.getItem(colorStorageKey);
		if (
			storedColorScheme &&
			Object.values(IColorScheme).includes(
				storedColorScheme as IColorScheme,
			)
		) {
			setColorSchemeState(storedColorScheme as IColorScheme);
		} else {
			localStorage.setItem(colorStorageKey, defaultColorScheme);
		}

		// Get view mode from localStorage
		const storedViewMode = localStorage.getItem(viewStorageKey);
		if (
			storedViewMode &&
			Object.values(IViewMode).includes(storedViewMode as IViewMode)
		) {
			setViewModeState(storedViewMode as IViewMode);
		} else {
			localStorage.setItem(viewStorageKey, defaultViewMode);
		}

		// Get sidebar collapsible from localStorage
		const storedSidebarCollapsible = localStorage.getItem(
			sidebarCollapsibleStorageKey,
		);
		if (
			storedSidebarCollapsible &&
			Object.values(ISidebarCollapsible).includes(
				storedSidebarCollapsible as ISidebarCollapsible,
			)
		) {
			setSidebarCollapsibleState(
				storedSidebarCollapsible as ISidebarCollapsible,
			);
		} else {
			localStorage.setItem(
				sidebarCollapsibleStorageKey,
				defaultSidebarCollapsible,
			);
		}

		// Get sidebar state from localStorage
		const storedSidebarState = localStorage.getItem(sidebarStateStorageKey);
		if (
			storedSidebarState &&
			["collapsed", "expanded"].includes(storedSidebarState)
		) {
			setSidebarStateInternal(
				storedSidebarState as "collapsed" | "expanded",
			);
		} else {
			localStorage.setItem(sidebarStateStorageKey, defaultSidebarState);
		}

		// Get sidebar variant from localStorage
		const storedSidebarVariant = localStorage.getItem(
			sidebarVariantStorageKey,
		);
		if (
			storedSidebarVariant &&
			Object.values(ISidebarVariant).includes(
				storedSidebarVariant as ISidebarVariant,
			)
		) {
			setSidebarVariantState(storedSidebarVariant as ISidebarVariant);
		} else {
			localStorage.setItem(
				sidebarVariantStorageKey,
				defaultSidebarVariant,
			);
		}

		// Get sidebar view from localStorage
		const storedSidebarView = localStorage.getItem(sidebarViewStorageKey);
		if (
			storedSidebarView &&
			Object.values(ISidebarView).includes(
				storedSidebarView as ISidebarView,
			)
		) {
			setSidebarViewState(storedSidebarView as ISidebarView);
		} else {
			localStorage.setItem(sidebarViewStorageKey, defaultSidebarView);
		}

		// Get language from localStorage
		const storedLanguage = localStorage.getItem(languageStorageKey);
		if (
			storedLanguage &&
			Object.values(ILanguage).includes(storedLanguage as ILanguage)
		) {
			setLanguageState(storedLanguage as ILanguage);
		} else {
			localStorage.setItem(languageStorageKey, defaultLanguage);
		}

		setIsInitialized(true);
	}, [
		storageKey,
		colorStorageKey,
		viewStorageKey,
		sidebarCollapsibleStorageKey,
		sidebarStateStorageKey,
		sidebarVariantStorageKey,
		sidebarViewStorageKey,
		languageStorageKey,
		setTheme,
		defaultTheme,
		defaultColorScheme,
		defaultViewMode,
		defaultSidebarCollapsible,
		defaultSidebarState,
		defaultSidebarVariant,
		defaultSidebarView,
		defaultLanguage,
	]);

	// Load dictionary when language changes
	React.useEffect(() => {
		const loadDictionary = async () => {
			setIsLoading(true);
			try {
				const dict = await getDictionary(language as any);
				setDictionary(dict);
			} catch (error) {
				console.error("Failed to load dictionary:", error);
				// Fallback to English if the requested language fails
				if (language !== ILanguage.EN) {
					const fallbackDict = await getDictionary(ILanguage.EN);
					setDictionary(fallbackDict);
					setLanguageState(ILanguage.EN);
					localStorage.setItem(languageStorageKey, ILanguage.EN);
				}
			} finally {
				setIsLoading(false);
			}
		};

		loadDictionary();
	}, [language, languageStorageKey]);

	// Update document class based on theme, color scheme, and sidebar state
	React.useEffect(() => {
		if (!isInitialized) return;

		const root = window.document.documentElement;

		// Remove all color classes
		Object.values(IColorScheme).forEach((color) => {
			if (color !== IColorScheme.DEFAULT) {
				root.classList.remove(color);
			}
		});

		// Remove theme classes
		root.classList.remove(IThemeMode.LIGHT, IThemeMode.DARK);

		// Remove sidebar state classes
		root.classList.remove("sidebar-collapsed", "sidebar-expanded");

		// Add current color scheme class
		if (colorScheme !== IColorScheme.DEFAULT) {
			root.classList.add(colorScheme);
		}

		// Add theme class (light/dark)
		if (resolvedTheme) {
			root.classList.add(resolvedTheme);
		} else if (theme && theme !== IThemeMode.SYSTEM) {
			root.classList.add(theme);
		}

		// Add sidebar state class
		root.classList.add(`sidebar-${sidebarState}`);
	}, [colorScheme, resolvedTheme, theme, sidebarState, isInitialized]);

	// Set theme mode and persist to localStorage
	const setThemeMode = React.useCallback(
		(theme: IThemeMode) => {
			setTheme(theme);
			localStorage.setItem(storageKey, theme);
		},
		[setTheme, storageKey],
	);

	// Set color scheme and persist to localStorage
	const setColorScheme = React.useCallback(
		(color: IColorScheme) => {
			setColorSchemeState(color);
			localStorage.setItem(colorStorageKey, color);
		},
		[colorStorageKey],
	);

	// Set view mode and persist to localStorage
	const setViewMode = React.useCallback(
		(view: IViewMode) => {
			setViewModeState(view);
			localStorage.setItem(viewStorageKey, view);
		},
		[viewStorageKey],
	);

	// Set sidebar collapsible and persist to localStorage
	const setSidebarCollapsible = React.useCallback(
		(collapsible: ISidebarCollapsible) => {
			setSidebarCollapsibleState(collapsible);
			localStorage.setItem(sidebarCollapsibleStorageKey, collapsible);
		},
		[sidebarCollapsibleStorageKey],
	);

	// Set sidebar state and persist to localStorage
	const setSidebarState = React.useCallback(
		(state: "collapsed" | "expanded") => {
			setSidebarStateInternal(state);
			localStorage.setItem(sidebarStateStorageKey, state);
		},
		[sidebarStateStorageKey],
	);

	// Set sidebar variant and persist to localStorage
	const setSidebarVariant = React.useCallback(
		(variant: ISidebarVariant) => {
			setSidebarVariantState(variant);
			localStorage.setItem(sidebarVariantStorageKey, variant);
		},
		[sidebarVariantStorageKey],
	);

	// Set sidebar view and persist to localStorage
	const setSidebarView = React.useCallback(
		(view: ISidebarView) => {
			setSidebarViewState(view);
			localStorage.setItem(sidebarViewStorageKey, view);
		},
		[sidebarViewStorageKey],
	);

	// Set language and persist to localStorage
	const setLanguage = React.useCallback(
		(lang: ILanguage) => {
			console.log("Setting language to:", lang);
			setLanguageState(lang);
			localStorage.setItem(languageStorageKey, lang);
		},
		[languageStorageKey],
	);

	// Get the resolved theme (light/dark, not system)
	const currentResolvedTheme: IThemeMode.LIGHT | IThemeMode.DARK | undefined =
		resolvedTheme === IThemeMode.LIGHT
			? IThemeMode.LIGHT
			: resolvedTheme === IThemeMode.DARK
				? IThemeMode.DARK
				: undefined;

	const value: IThemeContextType = {
		themeMode: (theme as IThemeMode) || defaultTheme,
		setThemeMode,
		colorScheme,
		setColorScheme,
		viewMode,
		setViewMode,
		sidebarCollapsible,
		setSidebarCollapsible,
		sidebarState,
		setSidebarState,
		sidebarVariant,
		setSidebarVariant,
		sidebarView,
		setSidebarView,
		resolvedTheme: currentResolvedTheme,
		language,
		setLanguage,
		dictionary,
		isLoading,
	};

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

// Root provider that wraps both next-themes and our custom theme context
const ThemeContextProvider = ({ children }: { children: React.ReactNode }) => {
	return (
		<NextThemesProvider
			attribute="class"
			defaultTheme={IThemeMode.SYSTEM}
			enableSystem
			disableTransitionOnChange
		>
			<ThemeProvider>{children}</ThemeProvider>
		</NextThemesProvider>
	);
};

// Custom hook to use the theme context
const useTheme = () => {
	const context = React.useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
};

export {
	useTheme,
	ThemeContextProvider,
	IThemeMode,
	IColorScheme,
	IViewMode,
	ISidebarCollapsible,
	ISidebarVariant,
	ISidebarView,
	ILanguage,
};
