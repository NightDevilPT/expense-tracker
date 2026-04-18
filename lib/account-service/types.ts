// lib/account-service/types.ts

export type AccountType =
	| "CASH"
	| "BANK_ACCOUNT"
	| "SAVINGS_ACCOUNT"
	| "CREDIT_CARD"
	| "DIGITAL_WALLET"
	| "OTHER";

export type BalanceChangeType = "ADD" | "SUBTRACT";

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
	createdAt?: Date;
	updatedAt?: Date;
}

export interface AccountBalanceHistory {
	id: string;
	accountId: string;
	balance: number;
	changeAmount: number;
	changeType: string;
	description: string | null;
	referenceId: string | null;
	createdAt: Date;
}

export interface GetAccountsParams {
	page?: number;
	limit?: number;
	search?: string;
	type?: AccountType;
	isDefault?: boolean;
}

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
}

export interface AddBalanceInput {
	amount: number;
	type: BalanceChangeType;
	description?: string;
}

export interface GetBalanceHistoryParams {
	page?: number;
	limit?: number;
	days?: number;
}

export interface PaginatedHistoryResult {
	data: AccountBalanceHistory[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}
