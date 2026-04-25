// prisma/seed/utils.ts

import { SEED_CONFIG } from "./config";

// ─── Random Helpers ───────────────────────────────────────────────────────────

export function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number, decimals = 2): number {
	const val = Math.random() * (max - min) + min;
	return parseFloat(val.toFixed(decimals));
}

export function randomItem<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

export function randomItems<T>(arr: T[], count: number): T[] {
	const shuffled = [...arr].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, Math.min(count, arr.length));
}

export function randomBool(trueProbability = 0.5): boolean {
	return Math.random() < trueProbability;
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

export function getSeedStartDate(): Date {
	const d = new Date();
	d.setFullYear(d.getFullYear() - SEED_CONFIG.yearsBack);
	d.setMonth(d.getMonth() - SEED_CONFIG.monthsBack);
	d.setDate(d.getDate() - SEED_CONFIG.daysBack);
	d.setHours(0, 0, 0, 0);
	return d;
}

export function isWeekend(date: Date): boolean {
	const day = date.getDay();
	return day === 0 || day === 6;
}

/** Iterate each calendar day from start to today */
export function* eachDayFrom(start: Date): Generator<Date> {
	const cur = new Date(start);
	const today = new Date();
	today.setHours(23, 59, 59, 999);
	while (cur <= today) {
		yield new Date(cur);
		cur.setDate(cur.getDate() + 1);
	}
}

export function randomTimeOnDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(randomInt(6, 22), randomInt(0, 59), randomInt(0, 59), 0);
	return d;
}

export function addDays(date: Date, days: number): Date {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}

export function addMonths(date: Date, months: number): Date {
	const d = new Date(date);
	d.setMonth(d.getMonth() + months);
	return d;
}

export function addYears(date: Date, years: number): Date {
	const d = new Date(date);
	d.setFullYear(d.getFullYear() + years);
	return d;
}

// ─── String Helpers ───────────────────────────────────────────────────────────

export function slugify(str: string): string {
	return str
		.toLowerCase()
		.replace(/\s+/g, "_")
		.replace(/[^a-z0-9_]/g, "");
}

export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Amount Helpers ───────────────────────────────────────────────────────────

export function randomAmount(min?: number, max?: number): number {
	return randomFloat(
		min ?? SEED_CONFIG.minTransactionAmount,
		max ?? SEED_CONFIG.maxTransactionAmount,
	);
}

export function randomBalance(): number {
	return randomFloat(
		SEED_CONFIG.minAccountBalance,
		SEED_CONFIG.maxAccountBalance,
	);
}

export function randomBudgetAmount(): number {
	return randomFloat(
		SEED_CONFIG.minBudgetAmount,
		SEED_CONFIG.maxBudgetAmount,
	);
}

export function randomGoalAmount(): number {
	return randomFloat(
		SEED_CONFIG.minSavingsGoalAmount,
		SEED_CONFIG.maxSavingsGoalAmount,
	);
}
