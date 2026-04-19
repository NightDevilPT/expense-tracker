import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/logger-service";
import { getAccountById } from "@/lib/account-service";
import { getCategoryById } from "@/lib/category-service";
import { getTagById } from "@/lib/tag-service";
import {
	validateCreateTransaction,
	validateUpdateTransaction,
	validateGetTransactionsQuery,
	validateTransactionSummaryQuery,
	validateBulkCreateTransaction,
	validateBulkDeleteTransaction,
	validateExportOptions,
	validateTransactionId,
	type CreateTransactionInput,
	type UpdateTransactionInput,
	type GetTransactionsQueryInput,
	type TransactionSummaryQueryInput,
	type BulkCreateTransactionInput,
	type BulkDeleteTransactionInput,
	type ExportOptionsInput,
} from "./validation";
import type {
	Transaction,
	GetTransactionsParams,
	PaginatedResult,
	TransactionSummary,
	CategoryBreakdown,
	DailyTotal,
	AccountBalance,
	BulkCreateResult,
	BulkDeleteResult,
} from "./types";
import { logCreate, logUpdate, logDelete } from "@/lib/audit-service";

const logger = new Logger("TRANSACTION-SERVICE");

// Helper: Update account balance with history
async function updateAccountBalance(
	accountId: string,
	userId: string,
	changeAmount: number,
	changeType: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER" | "ADJUSTMENT",
	description?: string,
	referenceId?: string,
): Promise<void> {
	// Verify account exists and belongs to user
	const account = await getAccountById(accountId, userId);

	const newBalance = account.balance + changeAmount;

	if (newBalance < 0) {
		throw new Error("INSUFFICIENT_BALANCE");
	}

	await prisma.$transaction(async (tx) => {
		await tx.account.update({
			where: { id: accountId },
			data: { balance: newBalance },
		});

		await tx.accountBalanceHistory.create({
			data: {
				accountId,
				balance: newBalance,
				changeAmount,
				changeType,
				description:
					description || `${changeType}: ${Math.abs(changeAmount)}`,
				referenceId,
			},
		});
	});

	logger.info("Account balance updated", {
		accountId,
		changeAmount,
		newBalance,
	});
}

// Helper: Verify category access
async function verifyCategoryAccess(
	categoryId: string,
	userId: string,
): Promise<void> {
	try {
		await getCategoryById(categoryId, userId);
	} catch (error) {
		throw new Error("CATEGORY_NOT_FOUND");
	}
}

// Helper: Verify tags access
async function verifyTagsAccess(
	tagIds: string[],
	userId: string,
): Promise<void> {
	for (const tagId of tagIds) {
		try {
			await getTagById(tagId, userId);
		} catch (error) {
			throw new Error(`TAG_NOT_FOUND: ${tagId}`);
		}
	}
}

// Get all transactions with filters
export async function getAllTransactions(
	userId: string,
	params: GetTransactionsParams = {},
): Promise<PaginatedResult<Transaction>> {
	logger.info("Fetching all transactions", { userId, params });

	const validatedParams = validateGetTransactionsQuery(params);
	const page = validatedParams.page;
	const limit = validatedParams.limit;
	const skip = (page - 1) * limit;

	const where: any = { userId };

	if (validatedParams.startDate) {
		where.date = { gte: new Date(validatedParams.startDate) };
	}

	if (validatedParams.endDate) {
		where.date = { ...where.date, lte: new Date(validatedParams.endDate) };
	}

	if (validatedParams.type) {
		where.type = validatedParams.type;
	}

	if (validatedParams.categoryId) {
		where.categoryId = validatedParams.categoryId;
	}

	if (validatedParams.accountId) {
		where.accountId = validatedParams.accountId;
	}

	if (validatedParams.search) {
		where.OR = [
			{
				description: {
					contains: validatedParams.search,
					mode: "insensitive",
				},
			},
			{
				notes: {
					contains: validatedParams.search,
					mode: "insensitive",
				},
			},
		];
	}

	if (validatedParams.minAmount || validatedParams.maxAmount) {
		where.amount = {};
		if (validatedParams.minAmount)
			where.amount.gte = validatedParams.minAmount;
		if (validatedParams.maxAmount)
			where.amount.lte = validatedParams.maxAmount;
	}

	if (validatedParams.tagIds && validatedParams.tagIds.length > 0) {
		where.tags = { some: { tagId: { in: validatedParams.tagIds } } };
	}

	const orderBy: any = {
		[validatedParams.sortBy]: validatedParams.sortOrder,
	};

	const [total, transactions] = await Promise.all([
		prisma.transaction.count({ where }),
		prisma.transaction.findMany({
			where,
			skip,
			take: limit,
			orderBy,
			include: {
				category: true,
				account: true,
				tags: { include: { tag: true } },
				attachments: true,
			},
		}),
	]);

	logger.info("Transactions fetched successfully", {
		count: transactions.length,
		total,
		page,
		limit,
	});

	return {
		data: transactions as Transaction[],
		total,
		page,
		limit,
	};
}

// Get transaction by ID
export async function getTransactionById(
	id: string,
	userId: string,
): Promise<Transaction> {
	logger.info("Fetching transaction by ID", { id, userId });

	validateTransactionId(id);

	const transaction = await prisma.transaction.findFirst({
		where: { id, userId },
		include: {
			category: true,
			account: true,
			tags: { include: { tag: true } },
			attachments: true,
		},
	});

	if (!transaction) {
		logger.warn("Transaction not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	logger.info("Transaction fetched successfully", { id });
	return transaction as Transaction;
}

// Create transaction
export async function createTransaction(
	userId: string,
	data: CreateTransactionInput,
): Promise<Transaction> {
	logger.info("Creating new transaction", { userId, ...data });

	const validatedData = validateCreateTransaction(data);

	// Verify category if provided
	if (validatedData.categoryId) {
		await verifyCategoryAccess(validatedData.categoryId, userId);
	}

	// Verify tags if provided
	if (validatedData.tagIds && validatedData.tagIds.length > 0) {
		await verifyTagsAccess(validatedData.tagIds, userId);
	}

	// Handle transfer between accounts
	if (validatedData.type === "TRANSFER" && validatedData.toAccountId) {
		logger.info("Processing transfer transaction", {
			fromAccount: validatedData.accountId,
			toAccount: validatedData.toAccountId,
			amount: validatedData.amount,
		});

		if (!validatedData.accountId) {
			throw new Error("SOURCE_ACCOUNT_REQUIRED");
		}

		// Ensure toAccountId is defined (TypeScript guard)
		const toAccountId = validatedData.toAccountId;
		if (!toAccountId) {
			throw new Error("DESTINATION_ACCOUNT_REQUIRED");
		}

		// Verify both accounts exist
		await getAccountById(validatedData.accountId, userId);
		await getAccountById(toAccountId, userId);

		const totalDeduction =
			validatedData.amount + (validatedData.transferFee || 0);

		const result = await prisma.$transaction(async (tx) => {
			// Create source transaction (money leaving)
			const sourceTransaction = await tx.transaction.create({
				data: {
					amount: validatedData.amount,
					type: "EXPENSE",
					description: validatedData.description || "Transfer",
					date: validatedData.date
						? new Date(validatedData.date)
						: new Date(),
					notes: validatedData.notes,
					userId,
					accountId: validatedData.accountId,
					categoryId: validatedData.categoryId,
				},
				include: {
					category: true,
					account: true,
					tags: { include: { tag: true } },
					attachments: true,
				},
			});

			// Update source account balance
			await updateAccountBalance(
				validatedData.accountId as string,
				userId,
				-totalDeduction,
				"TRANSFER",
				`Transfer to account ${toAccountId}`,
				sourceTransaction.id,
			);

			// Create destination transaction (money arriving)
			const destTransaction = await tx.transaction.create({
				data: {
					amount: validatedData.amount,
					type: "INCOME",
					description:
						validatedData.description || "Transfer received",
					date: validatedData.date
						? new Date(validatedData.date)
						: new Date(),
					notes: validatedData.notes,
					userId,
					accountId: toAccountId,
				},
				include: {
					category: true,
					account: true,
					tags: { include: { tag: true } },
					attachments: true,
				},
			});

			// Update destination account balance
			await updateAccountBalance(
				toAccountId,
				userId,
				validatedData.amount,
				"TRANSFER",
				`Transfer from account ${validatedData.accountId}`,
				destTransaction.id,
			);

			// Add tags to source transaction if provided
			if (validatedData.tagIds && validatedData.tagIds.length > 0) {
				await tx.transactionTag.createMany({
					data: validatedData.tagIds.map((tagId) => ({
						transactionId: sourceTransaction.id,
						tagId,
					})),
				});
			}

			logger.info("Transfer created successfully", {
				sourceId: sourceTransaction.id,
				destId: destTransaction.id,
			});

			// Fetch the complete transaction with relations
			const completeTransaction = await tx.transaction.findUnique({
				where: { id: sourceTransaction.id },
				include: {
					category: true,
					account: true,
					tags: { include: { tag: true } },
					attachments: true,
				},
			});

			return { completeTransaction, sourceTransaction, destTransaction };
		});

		// Audit log for transfer (source)
		await logCreate(
			userId,
			"Transaction",
			result.sourceTransaction.id,
			{
				amount: result.sourceTransaction.amount,
				type: "TRANSFER_OUT",
				description: result.sourceTransaction.description,
				fromAccountId: validatedData.accountId,
				toAccountId: toAccountId,
				fee: validatedData.transferFee,
			},
			{
				description: `Transfer of ${validatedData.amount} from account to ${toAccountId}`,
			},
		);

		// Audit log for transfer (destination)
		await logCreate(
			userId,
			"Transaction",
			result.destTransaction.id,
			{
				amount: result.destTransaction.amount,
				type: "TRANSFER_IN",
				description: result.destTransaction.description,
				fromAccountId: validatedData.accountId,
				toAccountId: toAccountId,
			},
			{
				description: `Transfer of ${validatedData.amount} received from account ${validatedData.accountId}`,
			},
		);

		return result.completeTransaction as Transaction;
	} else {
		// Regular transaction (income/expense)
		const transaction = await prisma.$transaction(async (tx) => {
			const newTransaction = await tx.transaction.create({
				data: {
					amount: validatedData.amount,
					type: validatedData.type,
					description: validatedData.description,
					date: validatedData.date
						? new Date(validatedData.date)
						: new Date(),
					notes: validatedData.notes,
					userId,
					accountId: validatedData.accountId,
					categoryId: validatedData.categoryId,
				},
				include: {
					category: true,
					account: true,
					tags: { include: { tag: true } },
					attachments: true,
				},
			});

			// Update account balance if account is provided
			if (validatedData.accountId) {
				const changeAmount =
					validatedData.type === "INCOME"
						? validatedData.amount
						: -validatedData.amount;

				await updateAccountBalance(
					validatedData.accountId,
					userId,
					changeAmount,
					validatedData.type === "INCOME" ? "DEPOSIT" : "WITHDRAWAL",
					validatedData.description ||
						`Transaction: ${newTransaction.id}`,
					newTransaction.id,
				);
			}

			// Add tags if provided
			if (validatedData.tagIds && validatedData.tagIds.length > 0) {
				await tx.transactionTag.createMany({
					data: validatedData.tagIds.map((tagId) => ({
						transactionId: newTransaction.id,
						tagId,
					})),
				});
			}

			logger.info("Transaction created successfully", {
				id: newTransaction.id,
			});

			// Fetch the complete transaction with relations
			const completeTransaction = await tx.transaction.findUnique({
				where: { id: newTransaction.id },
				include: {
					category: true,
					account: true,
					tags: { include: { tag: true } },
					attachments: true,
				},
			});

			return completeTransaction;
		});

		// Audit log for transaction creation
		await logCreate(
			userId,
			"Transaction",
			transaction!.id,
			{
				amount: transaction!.amount,
				type: transaction!.type,
				description: transaction!.description,
				date: transaction!.date,
				categoryId: transaction!.categoryId,
				accountId: transaction!.accountId,
				tagIds: validatedData.tagIds,
			},
			{
				description: `${transaction!.type === "INCOME" ? "Income" : "Expense"} of ${transaction!.amount} created: ${transaction!.description}`,
			},
		);

		return transaction as Transaction;
	}
}

// Update transaction
export async function updateTransaction(
	id: string,
	userId: string,
	data: UpdateTransactionInput,
): Promise<Transaction> {
	logger.info("Updating transaction", { id, userId, ...data });

	validateTransactionId(id);
	const validatedData = validateUpdateTransaction(data);

	// Verify category if provided
	if (validatedData.categoryId) {
		await verifyCategoryAccess(validatedData.categoryId, userId);
	}

	// Verify tags if provided
	if (validatedData.tagIds) {
		await verifyTagsAccess(validatedData.tagIds, userId);
	}

	const result = await prisma.$transaction(async (tx) => {
		const existingTransaction = await tx.transaction.findFirst({
			where: { id, userId },
			include: { account: true },
		});

		if (!existingTransaction) {
			throw new Error("NOT_FOUND");
		}

		// Revert old account balance if account existed
		if (existingTransaction.accountId) {
			const oldChange =
				existingTransaction.type === "INCOME"
					? -existingTransaction.amount
					: existingTransaction.amount;

			await updateAccountBalance(
				existingTransaction.accountId,
				userId,
				oldChange,
				"ADJUSTMENT",
				`Reverted: Transaction ${id} update`,
				id,
			);
		}

		// Apply new changes
		const updateData: any = {};
		if (validatedData.amount !== undefined)
			updateData.amount = validatedData.amount;
		if (validatedData.type !== undefined)
			updateData.type = validatedData.type;
		if (validatedData.description !== undefined)
			updateData.description = validatedData.description;
		if (validatedData.date !== undefined)
			updateData.date = new Date(validatedData.date);
		if (validatedData.notes !== undefined)
			updateData.notes = validatedData.notes;
		if (validatedData.categoryId !== undefined)
			updateData.categoryId = validatedData.categoryId;
		if (validatedData.accountId !== undefined)
			updateData.accountId = validatedData.accountId;

		const updatedTransaction = await tx.transaction.update({
			where: { id },
			data: updateData,
			include: {
				category: true,
				account: true,
				tags: { include: { tag: true } },
				attachments: true,
			},
		});

		// Apply new account balance if account exists
		if (updatedTransaction.accountId) {
			const newChange =
				updatedTransaction.type === "INCOME"
					? updatedTransaction.amount
					: -updatedTransaction.amount;

			await updateAccountBalance(
				updatedTransaction.accountId,
				userId,
				newChange,
				"ADJUSTMENT",
				`Updated: Transaction ${id}`,
				id,
			);
		}

		// Update tags if provided
		if (validatedData.tagIds !== undefined) {
			await tx.transactionTag.deleteMany({
				where: { transactionId: id },
			});
			if (validatedData.tagIds.length > 0) {
				await tx.transactionTag.createMany({
					data: validatedData.tagIds.map((tagId) => ({
						transactionId: id,
						tagId,
					})),
				});
			}
		}

		logger.info("Transaction updated successfully", { id });
		return { updatedTransaction, existingTransaction };
	});

	// Prepare old and new data for audit (only changed fields)
	const oldDataForAudit: Record<string, any> = {};
	const newDataForAudit: Record<string, any> = {};

	for (const key of Object.keys(validatedData)) {
		if (key in result.existingTransaction) {
			const oldValue = (result.existingTransaction as any)[key];
			const newValue = (result.updatedTransaction as any)[key];

			if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
				oldDataForAudit[key] = oldValue;
				newDataForAudit[key] = newValue;
			}
		}
	}

	// Audit log for transaction update
	if (Object.keys(oldDataForAudit).length > 0) {
		await logUpdate(
			userId,
			"Transaction",
			id,
			oldDataForAudit,
			newDataForAudit,
			{
				description: `Transaction ${id} updated`,
				excludeFields: ["id", "createdAt", "updatedAt", "userId"],
			},
		);
	}

	return result.updatedTransaction as Transaction;
}

// Delete transaction
export async function deleteTransaction(
	id: string,
	userId: string,
): Promise<void> {
	logger.info("Deleting transaction", { id, userId });

	validateTransactionId(id);

	let transactionForAudit: any = null;

	await prisma.$transaction(async (tx) => {
		const transaction = await tx.transaction.findFirst({
			where: { id, userId },
			include: {
				account: true,
				category: true,
				tags: { include: { tag: true } },
			},
		});

		if (!transaction) {
			throw new Error("NOT_FOUND");
		}

		transactionForAudit = transaction;

		// Revert account balance if transaction was linked to an account
		if (transaction.accountId) {
			const changeAmount =
				transaction.type === "INCOME"
					? -transaction.amount
					: transaction.amount;

			await updateAccountBalance(
				transaction.accountId,
				userId,
				changeAmount,
				"ADJUSTMENT",
				`Deleted transaction: ${transaction.description || id}`,
				undefined,
			);
		}

		// Delete transaction (cascades to tags and attachments)
		await tx.transaction.delete({ where: { id } });

		logger.info("Transaction deleted successfully", { id });
	});

	// Audit log for transaction deletion
	if (transactionForAudit) {
		await logDelete(
			userId,
			"Transaction",
			id,
			{
				amount: transactionForAudit.amount,
				type: transactionForAudit.type,
				description: transactionForAudit.description,
				date: transactionForAudit.date,
				categoryName: transactionForAudit.category?.name,
				accountName: transactionForAudit.account?.name,
				tags: transactionForAudit.tags.map((tt: any) => tt.tag.name),
			},
			{
				description: `${transactionForAudit.type === "INCOME" ? "Income" : "Expense"} of ${transactionForAudit.amount} deleted: ${transactionForAudit.description}`,
			},
		);
	}
}

// Get transaction summary
export async function getTransactionSummary(
	userId: string,
	params: TransactionSummaryQueryInput,
): Promise<TransactionSummary> {
	logger.info("Fetching transaction summary", { userId, ...params });

	const validatedParams = validateTransactionSummaryQuery(params);

	const where: any = { userId };

	if (validatedParams.startDate) {
		where.date = { gte: new Date(validatedParams.startDate) };
	}
	if (validatedParams.endDate) {
		where.date = { ...where.date, lte: new Date(validatedParams.endDate) };
	}
	if (validatedParams.categoryIds && validatedParams.categoryIds.length > 0) {
		where.categoryId = { in: validatedParams.categoryIds };
	}
	if (validatedParams.accountIds && validatedParams.accountIds.length > 0) {
		where.accountId = { in: validatedParams.accountIds };
	}

	const transactions = await prisma.transaction.findMany({
		where,
		include: {
			category: true,
			account: true,
		},
		orderBy: { date: "asc" },
	});

	// Calculate totals
	const totalIncome = transactions
		.filter((t) => t.type === "INCOME")
		.reduce((sum, t) => sum + t.amount, 0);

	const totalExpense = transactions
		.filter((t) => t.type === "EXPENSE")
		.reduce((sum, t) => sum + t.amount, 0);

	const totalTransfer = transactions
		.filter((t) => t.type === "TRANSFER")
		.reduce((sum, t) => sum + t.amount, 0);

	// Category breakdown
	const categoryMap = new Map<string, CategoryBreakdown>();
	transactions.forEach((t) => {
		if (t.categoryId && t.category) {
			const existing = categoryMap.get(t.categoryId) || {
				categoryId: t.categoryId,
				categoryName: t.category.name,
				amount: 0,
				percentage: 0,
				transactionCount: 0,
			};
			existing.amount += t.amount;
			existing.transactionCount++;
			categoryMap.set(t.categoryId, existing);
		}
	});

	const categoryBreakdown = Array.from(categoryMap.values()).map((c) => ({
		...c,
		percentage: totalExpense > 0 ? (c.amount / totalExpense) * 100 : 0,
	}));

	// Daily totals
	const dailyMap = new Map<string, DailyTotal>();
	transactions.forEach((t) => {
		const dateKey = t.date.toISOString().split("T")[0];
		const existing = dailyMap.get(dateKey) || {
			date: dateKey,
			income: 0,
			expense: 0,
			net: 0,
		};
		if (t.type === "INCOME") existing.income += t.amount;
		if (t.type === "EXPENSE") existing.expense += t.amount;
		existing.net = existing.income - existing.expense;
		dailyMap.set(dateKey, existing);
	});

	const dailyTotals = Array.from(dailyMap.values());

	// Account balances
	const accounts = await prisma.account.findMany({ where: { userId } });
	const accountBalances: AccountBalance[] = accounts.map((a) => ({
		accountId: a.id,
		accountName: a.name,
		balance: a.balance,
		type: a.type,
		currency: a.currency,
	}));

	logger.info("Transaction summary fetched successfully");

	return {
		totalIncome,
		totalExpense,
		totalTransfer,
		netBalance: totalIncome - totalExpense,
		categoryBreakdown,
		dailyTotals,
		accountBalances,
	};
}

// Bulk create transactions
export async function bulkCreateTransactions(
	userId: string,
	data: BulkCreateTransactionInput,
): Promise<BulkCreateResult> {
	logger.info("Bulk creating transactions", {
		userId,
		count: data.transactions.length,
	});

	const validatedData = validateBulkCreateTransaction(data);
	const result: BulkCreateResult = {
		success: true,
		created: 0,
		failed: 0,
		errors: [],
		transactions: [],
	};

	for (let i = 0; i < validatedData.transactions.length; i++) {
		try {
			const transaction = await createTransaction(
				userId,
				validatedData.transactions[i],
			);
			result.transactions.push(transaction);
			result.created++;
		} catch (error: any) {
			result.failed++;
			result.errors.push({
				index: i,
				error: error.message,
			});
		}
	}

	result.success = result.failed === 0;
	logger.info("Bulk create completed", {
		created: result.created,
		failed: result.failed,
	});

	return result;
}

// Bulk delete transactions
export async function bulkDeleteTransactions(
	userId: string,
	data: BulkDeleteTransactionInput,
): Promise<BulkDeleteResult> {
	logger.info("Bulk deleting transactions", {
		userId,
		count: data.transactionIds.length,
	});

	const validatedData = validateBulkDeleteTransaction(data);
	const result: BulkDeleteResult = {
		success: true,
		deleted: 0,
		failed: 0,
		errors: [],
	};

	for (const id of validatedData.transactionIds) {
		try {
			await deleteTransaction(id, userId);
			result.deleted++;
		} catch (error: any) {
			result.failed++;
			result.errors.push({ id, error: error.message });
		}
	}

	result.success = result.failed === 0;
	logger.info("Bulk delete completed", {
		deleted: result.deleted,
		failed: result.failed,
	});

	return result;
}

// Export transactions
export async function exportTransactions(
	userId: string,
	options: ExportOptionsInput,
): Promise<string | any[]> {
	logger.info("Exporting transactions", { userId, ...options });

	const validatedOptions = validateExportOptions(options);

	const where: any = { userId };

	if (validatedOptions.startDate) {
		where.date = { gte: new Date(validatedOptions.startDate) };
	}
	if (validatedOptions.endDate) {
		where.date = { ...where.date, lte: new Date(validatedOptions.endDate) };
	}

	const transactions = await prisma.transaction.findMany({
		where,
		include: {
			category: true,
			account: true,
			tags: { include: { tag: true } },
			...(validatedOptions.includeAttachments && { attachments: true }),
		},
		orderBy: { date: "desc" },
	});

	// Audit log for export
	await logCreate(
		userId,
		"Export",
		"export-" + Date.now().toString(),
		{
			format: validatedOptions.format,
			startDate: validatedOptions.startDate,
			endDate: validatedOptions.endDate,
			includeAttachments: validatedOptions.includeAttachments,
			transactionCount: transactions.length,
		},
		{
			description: `Exported ${transactions.length} transactions as ${validatedOptions.format.toUpperCase()}`,
		},
	);

	if (validatedOptions.format === "json") {
		return transactions;
	} else if (validatedOptions.format === "csv") {
		const headers = [
			"ID",
			"Date",
			"Type",
			"Amount",
			"Description",
			"Category",
			"Account",
			"Notes",
			"Tags",
		];
		const rows = transactions.map((t: any) => [
			t.id,
			t.date.toISOString(),
			t.type,
			t.amount.toString(),
			t.description || "",
			t.category?.name || "",
			t.account?.name || "",
			t.notes || "",
			t.tags.map((tt: any) => tt.tag.name).join(", "),
		]);
		return [headers, ...rows].map((row) => row.join(",")).join("\n");
	} else {
		throw new Error("PDF_EXPORT_NOT_IMPLEMENTED");
	}
}
