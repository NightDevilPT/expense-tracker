// prisma/seed/db-source/users.ts

import { PrismaClient } from "@/generated/prisma/client";
import { SEED_CONFIG } from "../config";
import { randomItem } from "../utils";

const THEMES = ["light", "dark"] as const;
const DATE_FORMATS = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"] as const;
const NUMBER_FORMATS = ["1,000.00", "1.000,00", "1 000.00"] as const;

const FIRST_NAMES = [
	"Pawan",
	"Priya",
	"Rohan",
	"Sneha",
	"Vikram",
	"Ananya",
	"Karan",
	"Meera",
	"Arjun",
	"Divya",
];

const LAST_NAMES = [
	"Kumar",
	"Patel",
	"Gupta",
	"Singh",
	"Kumar",
	"Verma",
	"Joshi",
	"Mehta",
	"Shah",
	"Rao",
];

function buildEmail(first: string, last: string, index: number): string {
	const domain = SEED_CONFIG.emailDomain;
	return `${first.toLowerCase()}.${last.toLowerCase()}${domain}`;
}

export async function seedUsers(prisma: PrismaClient) {
	const users: Awaited<ReturnType<typeof prisma.user.create>>[] = [];

	for (let i = 0; i < SEED_CONFIG.userCount; i++) {
		const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
		const lastName = LAST_NAMES[i % LAST_NAMES.length];
		const email = buildEmail(firstName, lastName, i + 1);

		const user = await prisma.user.create({
			data: {
				email,
				// In a real app this would be bcrypt hashed; for seed we use a placeholder
				passwordHash: `$2b$10$seedhash${i}placeholderpasswordhashvalue`,
				name: `${firstName} ${lastName}`,
				avatar: null,
				currency: "USD",
				theme: randomItem([...THEMES]),
				firstDayOfWeek: randomItem([0, 1]),
				dateFormat: randomItem([...DATE_FORMATS]),
				numberFormat: randomItem([...NUMBER_FORMATS]),
				emailNotifications: true,
			},
		});

		users.push(user);
	}

	return users;
}
