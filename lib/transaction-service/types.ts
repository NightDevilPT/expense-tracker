// lib/transaction-service/types.ts

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type AccountType =
	| "CASH"
	| "BANK_ACCOUNT"
	| "SAVINGS_ACCOUNT"
	| "CREDIT_CARD"
	| "DIGITAL_WALLET"
	| "OTHER";

export interface Category {
	id: string;
	name: string;
	type: TransactionType;
	icon: string | null;
	color: string | null;
	isDefault: boolean;
	order: number;
	userId: string | null;
}

export interface Account {
	id: string;
	name: string;
	type: AccountType;
	balance: number;
	currency: string | null;
	isDefault: boolean;
	color: string | null;
	notes: string | null;
	userId: string;
}

export interface Tag {
	id: string;
	name: string;
	color: string | null;
	userId: string;
}

export interface Attachment {
	id: string;
	filename: string;
	originalName: string;
	mimeType: string;
	size: number;
	url: string;
	thumbnailUrl: string | null;
	uploadedAt: Date;
	transactionId: string;
	userId: string;
}

export interface TransactionTag {
	transactionId: string;
	tagId: string;
	tag?: Tag;
}

export interface Transaction {
	id: string;
	amount: number;
	type: TransactionType;
	description: string | null;
	date: Date;
	notes: string | null;
	userId: string;
	categoryId: string | null;
	category: Category | null;
	accountId: string | null;
	account: Account | null;
	recurringTxnId: string | null;
	attachments: Attachment[];
	tags: TransactionTag[];
	createdAt?: Date;
	updatedAt?: Date;
}

export interface AccountBalanceHistory {
	id: string;
	accountId: string;
	balance: number;
	changeAmount: number;
	changeType: "DEPOSIT" | "WITHDRAWAL" | "ADJUSTMENT" | "TRANSFER";
	description: string | null;
	referenceId: string | null;
	createdAt: Date;
}

// Query Parameters
export interface GetTransactionsParams {
	page?: number;
	limit?: number;
	startDate?: Date;
	endDate?: Date;
	type?: TransactionType;
	categoryId?: string;
	accountId?: string;
	search?: string;
	minAmount?: number;
	maxAmount?: number;
	tagIds?: string[];
	sortBy?: "date" | "amount" | "description";
	sortOrder?: "asc" | "desc";
}

export interface TransactionSummary {
	totalIncome: number;
	totalExpense: number;
	totalTransfer: number;
	netBalance: number;
	categoryBreakdown: CategoryBreakdown[];
	dailyTotals: DailyTotal[];
	accountBalances: AccountBalance[];
}

export interface CategoryBreakdown {
	categoryId: string;
	categoryName: string;
	amount: number;
	percentage: number;
	transactionCount: number;
}

export interface DailyTotal {
	date: string;
	income: number;
	expense: number;
	net: number;
}

export interface AccountBalance {
	accountId: string;
	accountName: string;
	balance: number;
	type: AccountType;
	currency: string | null;
}

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
}

export interface BulkCreateResult {
	success: boolean;
	created: number;
	failed: number;
	errors: Array<{ index: number; error: string }>;
	transactions: Transaction[];
}

export interface BulkDeleteResult {
	success: boolean;
	deleted: number;
	failed: number;
	errors: Array<{ id: string; error: string }>;
}

export interface ExportOptions {
	format: "csv" | "json" | "pdf";
	startDate?: Date;
	endDate?: Date;
	includeAttachments?: boolean;
}
