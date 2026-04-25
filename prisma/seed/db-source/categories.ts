// prisma/seed/db-source/categories.ts
import { TransactionType } from "@/generated/prisma/enums";
import { SEED_CONFIG } from "../config";
import { randomItems } from "../utils";
import { PrismaClient } from "@/generated/prisma/client";

// Must match the ICON_MAP keys from icon-utils.ts
const ICONS = [
	"Banknote",
	"Wallet",
	"CreditCard",
	"DollarSign",
	"TrendingUp",
	"TrendingDown",
	"ArrowRightLeft",
	"Receipt",
	"PiggyBank",
	"Landmark",
	"Coins",
	"CircleDollarSign",
	"Utensils",
	"UtensilsCrossed",
	"ShoppingBag",
	"ShoppingCart",
	"Coffee",
	"Wine",
	"Beer",
	"Pizza",
	"Beef",
	"Apple",
	"Car",
	"CarFront",
	"Bus",
	"Train",
	"Plane",
	"Bike",
	"Fuel",
	"ParkingCircle",
	"Home",
	"Building",
	"Lightbulb",
	"Zap",
	"Droplets",
	"Wifi",
	"Phone",
	"Tv",
	"Monitor",
	"Wrench",
	"Hammer",
	"PaintBucket",
	"Stethoscope",
	"HeartPulse",
	"Pill",
	"Activity",
	"Clapperboard",
	"Gamepad2",
	"Music",
	"Headphones",
	"Dumbbell",
	"Trophy",
	"BookOpen",
	"GraduationCap",
	"Briefcase",
	"Laptop",
	"Globe",
	"Gift",
	"Star",
	"Heart",
	"Shield",
	"Settings",
] as const;

const COLORS = [
	"#ef4444",
	"#f97316",
	"#eab308",
	"#22c55e",
	"#14b8a6",
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
	"#64748b",
	"#78716c",
];

interface CategoryTemplate {
	name: string;
	type: TransactionType;
	icon: (typeof ICONS)[number];
	color: string;
	isDefault: boolean;
}

const DEFAULT_CATEGORIES: CategoryTemplate[] = [
	{
		name: "Food & Dining",
		type: "EXPENSE",
		icon: "Utensils",
		color: "#f97316",
		isDefault: true,
	},
	{
		name: "Transportation",
		type: "EXPENSE",
		icon: "Car",
		color: "#3b82f6",
		isDefault: true,
	},
	{
		name: "Shopping",
		type: "EXPENSE",
		icon: "ShoppingBag",
		color: "#ec4899",
		isDefault: true,
	},
	{
		name: "Housing",
		type: "EXPENSE",
		icon: "Home",
		color: "#8b5cf6",
		isDefault: true,
	},
	{
		name: "Healthcare",
		type: "EXPENSE",
		icon: "Stethoscope",
		color: "#ef4444",
		isDefault: true,
	},
	{
		name: "Entertainment",
		type: "EXPENSE",
		icon: "Clapperboard",
		color: "#eab308",
		isDefault: true,
	},
	{
		name: "Salary",
		type: "INCOME",
		icon: "Banknote",
		color: "#22c55e",
		isDefault: true,
	},
	{
		name: "Freelance",
		type: "INCOME",
		icon: "Laptop",
		color: "#14b8a6",
		isDefault: true,
	},
];

const EXTRA_CATEGORIES: CategoryTemplate[] = [
	{
		name: "Coffee",
		type: "EXPENSE",
		icon: "Coffee",
		color: "#78716c",
		isDefault: false,
	},
	{
		name: "Groceries",
		type: "EXPENSE",
		icon: "ShoppingCart",
		color: "#22c55e",
		isDefault: false,
	},
	{
		name: "Fuel",
		type: "EXPENSE",
		icon: "Fuel",
		color: "#64748b",
		isDefault: false,
	},
	{
		name: "Internet",
		type: "EXPENSE",
		icon: "Wifi",
		color: "#3b82f6",
		isDefault: false,
	},
	{
		name: "Phone Bill",
		type: "EXPENSE",
		icon: "Phone",
		color: "#8b5cf6",
		isDefault: false,
	},
	{
		name: "Gym",
		type: "EXPENSE",
		icon: "Dumbbell",
		color: "#ef4444",
		isDefault: false,
	},
	{
		name: "Education",
		type: "EXPENSE",
		icon: "BookOpen",
		color: "#eab308",
		isDefault: false,
	},
	{
		name: "Investment Return",
		type: "INCOME",
		icon: "TrendingUp",
		color: "#22c55e",
		isDefault: false,
	},
	{
		name: "Gift Received",
		type: "INCOME",
		icon: "Gift",
		color: "#ec4899",
		isDefault: false,
	},
	{
		name: "Rent Income",
		type: "INCOME",
		icon: "Building",
		color: "#14b8a6",
		isDefault: false,
	},
];

export async function seedCategories(
	prisma: PrismaClient,
	userId: string,
): Promise<Awaited<ReturnType<typeof prisma.category.create>>[]> {
	const categories: Awaited<ReturnType<typeof prisma.category.create>>[] = [];

	// Always seed defaults first
	for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
		const t = DEFAULT_CATEGORIES[i];
		const cat = await prisma.category.create({
			data: {
				name: t.name,
				type: t.type,
				icon: t.icon,
				color: t.color,
				isDefault: t.isDefault,
				order: i,
				userId,
			},
		});
		categories.push(cat);
	}

	// Fill up to categoriesPerUser with extras
	const remaining = SEED_CONFIG.categoriesPerUser - DEFAULT_CATEGORIES.length;
	const extras = randomItems(EXTRA_CATEGORIES, Math.max(0, remaining));
	for (let i = 0; i < extras.length; i++) {
		const t = extras[i];
		const cat = await prisma.category.create({
			data: {
				name: t.name,
				type: t.type,
				icon: t.icon,
				color: t.color,
				isDefault: t.isDefault,
				order: DEFAULT_CATEGORIES.length + i,
				userId,
			},
		});
		categories.push(cat);
	}

	return categories;
}
