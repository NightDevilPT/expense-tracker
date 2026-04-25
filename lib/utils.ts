import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// lib/utils.ts

export enum CurrencyType {
	USD = "USD",
	EUR = "EUR",
	GBP = "GBP",
	INR = "INR",
	JPY = "JPY",
	AUD = "AUD",
	CAD = "CAD",
}

const CURRENCY_LOCALES: Record<CurrencyType, string> = {
	[CurrencyType.USD]: "en-US",
	[CurrencyType.EUR]: "de-DE",
	[CurrencyType.GBP]: "en-GB",
	[CurrencyType.INR]: "en-IN",
	[CurrencyType.JPY]: "ja-JP",
	[CurrencyType.AUD]: "en-AU",
	[CurrencyType.CAD]: "en-CA",
};

const CURRENCY_FORMAT_OPTIONS: Record<
	CurrencyType,
	{ minimumFractionDigits?: number; maximumFractionDigits?: number }
> = {
	[CurrencyType.USD]: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
	[CurrencyType.EUR]: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
	[CurrencyType.GBP]: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
	[CurrencyType.INR]: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
	[CurrencyType.JPY]: { minimumFractionDigits: 0, maximumFractionDigits: 0 },
	[CurrencyType.AUD]: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
	[CurrencyType.CAD]: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
};

export function formatCurrency(
	amount: number,
	currency: CurrencyType = CurrencyType.USD,
): string {
	const locale = CURRENCY_LOCALES[currency];
	const fractionOptions = CURRENCY_FORMAT_OPTIONS[currency];

	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
		...fractionOptions,
	}).format(amount);
}
