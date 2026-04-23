// lib/icon-utils.ts

import {
	Banknote,
	Wallet,
	CreditCard,
	DollarSign,
	TrendingUp,
	TrendingDown,
	ArrowRightLeft,
	Receipt,
	PiggyBank,
	Landmark,
	Coins,
	CircleDollarSign,
	Utensils,
	UtensilsCrossed,
	ShoppingBag,
	ShoppingCart,
	Coffee,
	Wine,
	Beer,
	Pizza,
	Beef,
	Apple,
	Car,
	CarFront,
	Bus,
	Train,
	Plane,
	Bike,
	Fuel,
	ParkingCircle,
	Home,
	Building,
	Lightbulb,
	Zap,
	Droplets,
	Wifi,
	Phone,
	Tv,
	Monitor,
	Wrench,
	Hammer,
	PaintBucket,
	Stethoscope,
	HeartPulse,
	Pill,
	Activity,
	Clapperboard,
	Gamepad2,
	Music,
	Headphones,
	Dumbbell,
	Trophy,
	BookOpen,
	GraduationCap,
	Briefcase,
	Laptop,
	Globe,
	Gift,
	Star,
	Heart,
	Shield,
	Settings,
	type LucideIcon,
} from "lucide-react";

// ============================================
// TYPE
// ============================================

export interface IconOption {
	value: string;
	label: string;
	keywords: string[];
}

// ============================================
// ICON MAP - String to Lucide Component
// ============================================

const ICON_MAP: Record<string, LucideIcon> = {
	// Finance
	Banknote,
	Wallet,
	CreditCard,
	DollarSign,
	TrendingUp,
	TrendingDown,
	ArrowRightLeft,
	Receipt,
	PiggyBank,
	Landmark,
	Coins,
	CircleDollarSign,
	// Food & Dining
	Utensils,
	UtensilsCrossed,
	ShoppingBag,
	ShoppingCart,
	Coffee,
	Wine,
	Beer,
	Pizza,
	Beef,
	Apple,
	// Transportation
	Car,
	CarFront,
	Bus,
	Train,
	Plane,
	Bike,
	Fuel,
	ParkingCircle,
	// Home & Utilities
	Home,
	Building,
	Lightbulb,
	Zap,
	Droplets,
	Wifi,
	Phone,
	Tv,
	Monitor,
	Wrench,
	Hammer,
	PaintBucket,
	// Healthcare
	Stethoscope,
	HeartPulse,
	Pill,
	Activity,
	// Entertainment
	Clapperboard,
	Gamepad2,
	Music,
	Headphones,
	// Fitness
	Dumbbell,
	Trophy,
	// Education
	BookOpen,
	GraduationCap,
	// Work
	Briefcase,
	Laptop,
	// Other
	Globe,
	Gift,
	Star,
	Heart,
	Shield,
	Settings,
};

// ============================================
// ICON OPTIONS - For selection dropdown
// ============================================

export const ICON_OPTIONS: IconOption[] = [
	// Finance
	{
		value: "Banknote",
		label: "Banknote",
		keywords: ["money", "cash", "salary", "income"],
	},
	{ value: "Wallet", label: "Wallet", keywords: ["money", "cash"] },
	{
		value: "CreditCard",
		label: "Credit Card",
		keywords: ["card", "payment"],
	},
	{
		value: "DollarSign",
		label: "Dollar Sign",
		keywords: ["money", "currency"],
	},
	{
		value: "TrendingUp",
		label: "Trending Up",
		keywords: ["growth", "profit", "investment"],
	},
	{
		value: "TrendingDown",
		label: "Trending Down",
		keywords: ["loss", "decline", "expense"],
	},
	{
		value: "ArrowRightLeft",
		label: "Arrow Right Left",
		keywords: ["transfer", "exchange"],
	},
	{ value: "Receipt", label: "Receipt", keywords: ["bill", "invoice"] },
	{ value: "PiggyBank", label: "Piggy Bank", keywords: ["savings", "money"] },
	{ value: "Landmark", label: "Landmark", keywords: ["bank", "building"] },
	{ value: "Coins", label: "Coins", keywords: ["money", "change"] },
	{ value: "CircleDollarSign", label: "Circle Dollar", keywords: ["money"] },
	// Food & Dining
	{
		value: "Utensils",
		label: "Utensils",
		keywords: ["food", "dining", "restaurant"],
	},
	{
		value: "UtensilsCrossed",
		label: "Utensils Crossed",
		keywords: ["food", "dining"],
	},
	{
		value: "ShoppingBag",
		label: "Shopping Bag",
		keywords: ["shopping", "retail"],
	},
	{
		value: "ShoppingCart",
		label: "Shopping Cart",
		keywords: ["shopping", "groceries"],
	},
	{ value: "Coffee", label: "Coffee", keywords: ["drink", "cafe"] },
	{ value: "Wine", label: "Wine", keywords: ["drink", "alcohol"] },
	{ value: "Beer", label: "Beer", keywords: ["drink", "alcohol"] },
	{ value: "Pizza", label: "Pizza", keywords: ["food", "fast food"] },
	{ value: "Beef", label: "Beef", keywords: ["food", "meat"] },
	{ value: "Apple", label: "Apple", keywords: ["food", "fruit"] },
	// Transportation
	{ value: "Car", label: "Car", keywords: ["vehicle", "transport"] },
	{ value: "CarFront", label: "Car Front", keywords: ["vehicle"] },
	{ value: "Bus", label: "Bus", keywords: ["transport", "public"] },
	{ value: "Train", label: "Train", keywords: ["transport", "rail"] },
	{ value: "Plane", label: "Plane", keywords: ["travel", "flight"] },
	{ value: "Bike", label: "Bike", keywords: ["bicycle", "cycling"] },
	{ value: "Fuel", label: "Fuel", keywords: ["gas", "petrol"] },
	{ value: "ParkingCircle", label: "Parking", keywords: ["car", "parking"] },
	// Home & Utilities
	{ value: "Home", label: "Home", keywords: ["house", "living", "rent"] },
	{ value: "Building", label: "Building", keywords: ["apartment", "office"] },
	{
		value: "Lightbulb",
		label: "Lightbulb",
		keywords: ["electricity", "utility"],
	},
	{
		value: "Zap",
		label: "Zap",
		keywords: ["electricity", "power", "energy"],
	},
	{ value: "Droplets", label: "Droplets", keywords: ["water", "utility"] },
	{ value: "Wifi", label: "Wifi", keywords: ["internet", "network"] },
	{ value: "Phone", label: "Phone", keywords: ["mobile", "cell", "telecom"] },
	{ value: "Tv", label: "TV", keywords: ["television", "entertainment"] },
	{ value: "Monitor", label: "Monitor", keywords: ["computer", "screen"] },
	{ value: "Wrench", label: "Wrench", keywords: ["repair", "maintenance"] },
	{ value: "Hammer", label: "Hammer", keywords: ["tools", "repair"] },
	{
		value: "PaintBucket",
		label: "Paint Bucket",
		keywords: ["paint", "decorate"],
	},
	// Healthcare
	{
		value: "Stethoscope",
		label: "Stethoscope",
		keywords: ["health", "medical", "doctor"],
	},
	{
		value: "HeartPulse",
		label: "Heart Pulse",
		keywords: ["health", "heart"],
	},
	{ value: "Pill", label: "Pill", keywords: ["medicine", "pharmacy"] },
	{ value: "Activity", label: "Activity", keywords: ["health", "fitness"] },
	// Entertainment
	{
		value: "Clapperboard",
		label: "Clapperboard",
		keywords: ["movie", "film", "cinema"],
	},
	{ value: "Gamepad2", label: "Gamepad", keywords: ["gaming", "games"] },
	{ value: "Music", label: "Music", keywords: ["audio", "song"] },
	{ value: "Headphones", label: "Headphones", keywords: ["audio", "music"] },
	// Fitness
	{
		value: "Dumbbell",
		label: "Dumbbell",
		keywords: ["gym", "fitness", "exercise"],
	},
	{ value: "Trophy", label: "Trophy", keywords: ["achievement", "sports"] },
	// Education
	{
		value: "BookOpen",
		label: "Book Open",
		keywords: ["education", "reading"],
	},
	{
		value: "GraduationCap",
		label: "Graduation Cap",
		keywords: ["education", "student"],
	},
	// Work
	{
		value: "Briefcase",
		label: "Briefcase",
		keywords: ["work", "business", "job"],
	},
	{
		value: "Laptop",
		label: "Laptop",
		keywords: ["work", "computer", "freelance"],
	},
	// Other
	{ value: "Globe", label: "Globe", keywords: ["world", "travel"] },
	{ value: "Gift", label: "Gift", keywords: ["present", "holiday"] },
	{ value: "Star", label: "Star", keywords: ["favorite", "important"] },
	{
		value: "Heart",
		label: "Heart",
		keywords: ["favorite", "love", "charity"],
	},
	{ value: "Shield", label: "Shield", keywords: ["insurance", "protection"] },
	{ value: "Settings", label: "Settings", keywords: ["config", "other"] },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get a Lucide icon component by its string name
 */
export function getIconByName(iconName: string | null | undefined): LucideIcon {
	if (!iconName) return CircleDollarSign;
	return ICON_MAP[iconName] || CircleDollarSign;
}

/**
 * Get icon options filtered by search query
 */
export function searchIcons(query: string): IconOption[] {
	if (!query) return ICON_OPTIONS;

	const lowerQuery = query.toLowerCase();
	return ICON_OPTIONS.filter(
		(icon) =>
			icon.label.toLowerCase().includes(lowerQuery) ||
			icon.keywords.some((keyword) => keyword.includes(lowerQuery)),
	);
}

/**
 * Get icon option by value
 */
export function getIconOption(value: string): IconOption | undefined {
	return ICON_OPTIONS.find((icon) => icon.value === value);
}

/**
 * Get all available icon names
 */
export function getIconNames(): string[] {
	return Object.keys(ICON_MAP);
}
