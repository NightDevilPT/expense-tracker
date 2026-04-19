import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/logger-service";
import {
	validateCreateAccount,
	validateUpdateAccount,
	validateAccountId,
	validateAddBalance,
	validateGetBalanceHistory,
	type CreateAccountInput,
	type UpdateAccountInput,
	type AddBalanceInput,
	type GetBalanceHistoryInput,
} from "./validation";
import type {
	Account,
	GetAccountsParams,
	PaginatedResult,
	AccountBalanceHistory,
	GetBalanceHistoryParams,
	PaginatedHistoryResult,
} from "./types";
import { logCreate, logUpdate, logDelete } from "@/lib/audit-service";

// lib/utils/ip-address.ts

import { NextRequest } from "next/server";

export function getIpAddress(req: NextRequest): string | undefined {
	const forwardedFor = req.headers.get("x-forwarded-for");
	const realIp = req.headers.get("x-real-ip");

	if (forwardedFor) {
		return forwardedFor.split(",")[0].trim();
	}

	if (realIp) {
		return realIp;
	}

	return undefined;
}

const logger = new Logger("ACCOUNT-SERVICE");

export async function getAllAccounts(
	userId: string,
	params: GetAccountsParams = {},
): Promise<PaginatedResult<Account>> {
	const page = Math.max(1, params.page || 1);
	const limit = Math.min(100, Math.max(1, params.limit || 20));
	const skip = (page - 1) * limit;

	logger.info("Fetching all accounts", { userId, page, limit });

	const where: any = { userId };

	if (params.search) {
		where.name = { contains: params.search, mode: "insensitive" };
	}

	if (params.type) {
		where.type = params.type;
	}

	if (params.isDefault !== undefined) {
		where.isDefault = params.isDefault;
	}

	const [total, accounts] = await Promise.all([
		prisma.account.count({ where }),
		prisma.account.findMany({
			where,
			skip,
			take: limit,
			orderBy: [{ isDefault: "desc" }, { name: "asc" }],
		}),
	]);

	logger.info("Accounts fetched successfully", {
		count: accounts.length,
		total,
	});

	return { data: accounts as Account[], total, page, limit };
}

export async function getAccountById(
	id: string,
	userId: string,
): Promise<Account> {
	logger.info("Fetching account by ID", { id, userId });

	validateAccountId(id);

	const account = await prisma.account.findFirst({
		where: { id, userId },
	});

	if (!account) {
		logger.warn("Account not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	return account as Account;
}

export async function createAccount(
	userId: string,
	data: CreateAccountInput,
	ipAddress?: string,
	userAgent?: string,
): Promise<Account> {
	logger.info("Creating new account", { userId, name: data.name });

	const validatedData = validateCreateAccount(data);

	const existingAccount = await prisma.account.findFirst({
		where: { userId, name: validatedData.name },
	});

	if (existingAccount) {
		logger.warn("Account with this name already exists", {
			userId,
			name: validatedData.name,
		});
		throw new Error("ALREADY_EXISTS");
	}

	const accountCount = await prisma.account.count({ where: { userId } });
	const shouldBeDefault = accountCount === 0;

	const account = await prisma.$transaction(async (tx) => {
		const newAccount = await tx.account.create({
			data: {
				name: validatedData.name,
				type: validatedData.type,
				balance: validatedData.balance,
				currency: validatedData.currency || null,
				color: validatedData.color || null,
				notes: validatedData.notes || null,
				isDefault: shouldBeDefault,
				userId,
			},
		});

		// ALWAYS create balance history record (even if balance is 0)
		await tx.accountBalanceHistory.create({
			data: {
				accountId: newAccount.id,
				balance: validatedData.balance,
				changeAmount: validatedData.balance,
				changeType:
					validatedData.balance === 0 ? "INITIAL_ZERO" : "INITIAL",
				description:
					validatedData.balance === 0
						? "Account created with zero balance"
						: `Initial balance: ${validatedData.balance}`,
			},
		});

		return newAccount;
	});

	logger.info("Account created successfully", {
		id: account.id,
		name: account.name,
		initialBalance: account.balance,
	});

	// Audit log for account creation
	await logCreate(
		userId,
		"Account",
		account.id,
		{
			name: account.name,
			type: account.type,
			balance: account.balance,
			currency: account.currency,
			color: account.color,
			notes: account.notes,
			isDefault: account.isDefault,
		},
		{
			description: `Account "${account.name}" created with initial balance ${account.balance}`,
		},
	);

	return account as Account;
}

export async function updateAccount(
	id: string,
	userId: string,
	data: UpdateAccountInput,
	ipAddress?: string,
	userAgent?: string,
): Promise<Account> {
	logger.info("Updating account", { id, userId });

	validateAccountId(id);
	const validatedData = validateUpdateAccount(data);

	const existingAccount = await prisma.account.findFirst({
		where: { id, userId },
	});

	if (!existingAccount) {
		logger.warn("Account not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	if (validatedData.name && validatedData.name !== existingAccount.name) {
		const duplicateAccount = await prisma.account.findFirst({
			where: { userId, name: validatedData.name, id: { not: id } },
		});

		if (duplicateAccount) {
			logger.warn("Account name already exists", {
				userId,
				name: validatedData.name,
			});
			throw new Error("ALREADY_EXISTS");
		}
	}

	const updatedAccount = await prisma.account.update({
		where: { id },
		data: validatedData,
	});

	logger.info("Account updated successfully", {
		id,
		name: updatedAccount.name,
	});

	// Prepare old and new data for audit (only changed fields)
	const oldDataForAudit: Record<string, any> = {};
	const newDataForAudit: Record<string, any> = {};

	for (const key of Object.keys(validatedData)) {
		if (key in existingAccount) {
			const oldValue = (existingAccount as any)[key];
			const newValue = (updatedAccount as any)[key];

			if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
				oldDataForAudit[key] = oldValue;
				newDataForAudit[key] = newValue;
			}
		}
	}

	// Audit log for account update
	if (Object.keys(oldDataForAudit).length > 0) {
		await logUpdate(
			userId,
			"Account",
			id,
			oldDataForAudit,
			newDataForAudit,
			{
				description: `Account "${updatedAccount.name}" updated`,
				excludeFields: [
					"id",
					"createdAt",
					"updatedAt",
					"userId",
					"balance",
				],
			},
		);
	}

	return updatedAccount as Account;
}

export async function deleteAccount(
	id: string,
	userId: string,
	ipAddress?: string,
	userAgent?: string,
): Promise<void> {
	logger.info("Deleting account", { id, userId });

	validateAccountId(id);

	const account = await prisma.account.findFirst({
		where: { id, userId },
		include: { transactions: { take: 1 } },
	});

	if (!account) {
		logger.warn("Account not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	if (account.transactions.length > 0) {
		logger.warn("Account has transactions, cannot delete", { id });
		throw new Error("CONFLICT");
	}

	// Prepare account data for audit
	const accountDataForAudit = {
		name: account.name,
		type: account.type,
		balance: account.balance,
		currency: account.currency,
		isDefault: account.isDefault,
	};

	await prisma.account.delete({ where: { id } });

	logger.info("Account deleted successfully", { id });

	// Audit log for account deletion
	await logDelete(userId, "Account", id, accountDataForAudit, {
		description: `Account "${account.name}" deleted`,
	});
}

export async function addBalanceToAccount(
	id: string,
	userId: string,
	data: AddBalanceInput,
	ipAddress?: string,
	userAgent?: string,
): Promise<Account> {
	logger.info("Updating account balance", {
		id,
		userId,
		amount: data.amount,
		type: data.type,
	});

	validateAccountId(id);
	const validatedData = validateAddBalance(data);

	const account = await prisma.account.findFirst({
		where: { id, userId },
	});

	if (!account) {
		logger.warn("Account not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	const changeAmount =
		validatedData.type === "ADD"
			? validatedData.amount
			: -validatedData.amount;
	const newBalance = account.balance + changeAmount;

	if (newBalance < 0) {
		logger.warn("Insufficient balance", {
			id,
			currentBalance: account.balance,
			requestedAmount: validatedData.amount,
		});
		throw new Error("INSUFFICIENT_BALANCE");
	}

	const result = await prisma.$transaction(async (tx) => {
		const updatedAccount = await tx.account.update({
			where: { id },
			data: { balance: newBalance },
		});

		await tx.accountBalanceHistory.create({
			data: {
				accountId: id,
				balance: newBalance,
				changeAmount: changeAmount,
				changeType:
					validatedData.type === "ADD" ? "DEPOSIT" : "WITHDRAWAL",
				description:
					validatedData.description ||
					`${validatedData.type === "ADD" ? "Added" : "Subtracted"} ${validatedData.amount}`,
			},
		});

		return updatedAccount;
	});

	logger.info("Balance updated successfully", {
		id,
		previousBalance: account.balance,
		newBalance,
	});

	// Audit log for balance change
	await logCreate(
		userId,
		"Account",
		id,
		{
			previousBalance: account.balance,
			newBalance: newBalance,
			changeAmount: changeAmount,
			changeType: validatedData.type === "ADD" ? "DEPOSIT" : "WITHDRAWAL",
			description: validatedData.description,
		},
		{
			description: `${validatedData.type === "ADD" ? "Added" : "Withdrawn"} ${validatedData.amount} ${account.currency} to account "${account.name}". New balance: ${newBalance}`,
		},
	);

	return result as Account;
}

export async function getBalanceHistory(
	id: string,
	userId: string,
	params: GetBalanceHistoryParams = {},
): Promise<PaginatedHistoryResult> {
	const page = Math.max(1, params.page || 1);
	const limit = Math.min(100, Math.max(1, params.limit || 20));
	const skip = (page - 1) * limit;
	const days = params.days || 30;

	logger.info("Fetching balance history", {
		id,
		userId,
		page,
		limit,
		days,
	});

	validateAccountId(id);

	const account = await prisma.account.findFirst({
		where: { id, userId },
	});

	if (!account) {
		logger.warn("Account not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	const startDate = new Date();
	startDate.setDate(startDate.getDate() - days);
	startDate.setHours(0, 0, 0, 0);

	const where = {
		accountId: id,
		createdAt: { gte: startDate },
	};

	const [total, history] = await Promise.all([
		prisma.accountBalanceHistory.count({ where }),
		prisma.accountBalanceHistory.findMany({
			where,
			skip,
			take: limit,
			orderBy: { createdAt: "desc" },
		}),
	]);

	const totalPages = Math.ceil(total / limit);

	logger.info("Balance history fetched successfully", {
		accountId: id,
		count: history.length,
		total,
		page,
		limit,
		totalPages,
	});

	return {
		data: history as AccountBalanceHistory[],
		total,
		page,
		limit,
		totalPages,
	};
}
