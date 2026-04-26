// prisma/seed/db-source/categories.ts
import { SEED_CONFIG } from "../config";
import { PrismaClient } from "@/generated/prisma/client";
import { TransactionType } from "@/generated/prisma/enums";

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
		name: "Coffee & Cafe",
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
		name: "Fuel & Gas",
		type: "EXPENSE",
		icon: "Fuel",
		color: "#64748b",
		isDefault: false,
	},
	{
		name: "Internet Bill",
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
		name: "Gym & Fitness",
		type: "EXPENSE",
		icon: "Dumbbell",
		color: "#ef4444",
		isDefault: false,
	},
	{
		name: "Education & Books",
		type: "EXPENSE",
		icon: "BookOpen",
		color: "#eab308",
		isDefault: false,
	},
	{
		name: "Investment Returns",
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
		name: "Rental Income",
		type: "INCOME",
		icon: "Building",
		color: "#14b8a6",
		isDefault: false,
	},
	{
		name: "Subscription Services",
		type: "EXPENSE",
		icon: "Tv",
		color: "#8b5cf6",
		isDefault: false,
	},
	{
		name: "Pet Care",
		type: "EXPENSE",
		icon: "Heart",
		color: "#ec4899",
		isDefault: false,
	},
	{
		name: "Home Maintenance",
		type: "EXPENSE",
		icon: "Wrench",
		color: "#64748b",
		isDefault: false,
	},
	{
		name: "Travel & Vacation",
		type: "EXPENSE",
		icon: "Plane",
		color: "#14b8a6",
		isDefault: false,
	},
	{
		name: "Insurance",
		type: "EXPENSE",
		icon: "Shield",
		color: "#3b82f6",
		isDefault: false,
	},
];

// Track used category names to prevent duplicates for the same user
const getUniqueExtras = (userId: string, count: number): CategoryTemplate[] => {
	// Create a copy of EXTRA_CATEGORIES to shuffle
	const shuffled = [...EXTRA_CATEGORIES];

	// Fisher-Yates shuffle
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}

	// Return first 'count' items (unique selection)
	return shuffled.slice(0, count);
};

export async function seedCategories(
	prisma: PrismaClient,
	userId: string,
): Promise<Awaited<ReturnType<typeof prisma.category.create>>[]> {
	const categories: Awaited<ReturnType<typeof prisma.category.create>>[] = [];

	// Check existing categories for this user to avoid duplicates
	const existingCategories = await prisma.category.findMany({
		where: { userId },
		select: { name: true },
	});

	const existingNames = new Set(existingCategories.map((c) => c.name));

	// Always seed defaults first (only if not already existing)
	for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
		const t = DEFAULT_CATEGORIES[i];

		// Skip if category already exists for this user
		if (existingNames.has(t.name)) {
			continue;
		}

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
		existingNames.add(t.name);
	}

	// Calculate remaining needed categories
	const currentCount = categories.length;
	const remainingNeeded = SEED_CONFIG.categoriesPerUser - currentCount;

	if (remainingNeeded > 0) {
		// Get unique extra categories (no duplicates within this user)
		const uniqueExtras = getUniqueExtras(userId, remainingNeeded);

		for (let i = 0; i < uniqueExtras.length; i++) {
			const t = uniqueExtras[i];

			// Double-check we're not creating a duplicate
			if (existingNames.has(t.name)) {
				continue;
			}

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
			existingNames.add(t.name);
		}
	}

	console.log(
		`  ✅ Created ${categories.length} categories for user ${userId}`,
	);
	return categories;
}
