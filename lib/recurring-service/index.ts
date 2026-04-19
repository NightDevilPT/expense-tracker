import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/logger-service";
import { getCategoryById } from "@/lib/category-service";
import { getAccountById } from "@/lib/account-service";
import {
	validateCreateRecurring,
	validateUpdateRecurring,
	validateGetRecurringQuery,
	validateRecurringId,
	type CreateRecurringInput,
	type UpdateRecurringInput,
	type GetRecurringQueryInput,
} from "./validation";
import type {
	RecurringTransaction,
	RecurringWithNextDue,
	UpcomingRecurring,
	GetRecurringParams,
	PaginatedResult,
} from "./types";
import { RecurringFrequency, TransactionType } from "@/generated/prisma/enums";
import { logCreate, logUpdate, logDelete } from "@/lib/audit-service";

const logger = new Logger("RECURRING-SERVICE");

// Helper: Calculate next due date
function calculateNextDueDate(
	startDate: Date,
	frequency: RecurringFrequency,
	interval: number,
): Date {
	const nextDate = new Date(startDate);

	switch (frequency) {
		case RecurringFrequency.DAILY:
			nextDate.setDate(nextDate.getDate() + interval);
			break;
		case RecurringFrequency.WEEKLY:
			nextDate.setDate(nextDate.getDate() + interval * 7);
			break;
		case RecurringFrequency.MONTHLY:
			nextDate.setMonth(nextDate.getMonth() + interval);
			break;
		case RecurringFrequency.YEARLY:
			nextDate.setFullYear(nextDate.getFullYear() + interval);
			break;
		case RecurringFrequency.CUSTOM:
			nextDate.setMonth(nextDate.getMonth() + interval);
			break;
	}

	return nextDate;
}

// Helper: Calculate days until due
function calculateDaysUntilDue(nextDueDate: Date): number {
	const now = new Date();
	const diffTime = nextDueDate.getTime() - now.getTime();
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Helper: Enhance recurring with metrics
function enhanceRecurringWithMetrics(
	recurring: RecurringTransaction,
): RecurringWithNextDue {
	const daysUntilDue = calculateDaysUntilDue(new Date(recurring.nextDueDate));
	const isOverdue = daysUntilDue < 0;
	const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 7;

	// Calculate yearly total and monthly average
	let yearlyTotal = 0;
	switch (recurring.frequency) {
		case "DAILY":
			yearlyTotal = recurring.amount * 365 * recurring.interval;
			break;
		case "WEEKLY":
			yearlyTotal = recurring.amount * 52 * recurring.interval;
			break;
		case "MONTHLY":
			yearlyTotal = recurring.amount * 12 * recurring.interval;
			break;
		case "YEARLY":
			yearlyTotal = recurring.amount * recurring.interval;
			break;
		case "CUSTOM":
			yearlyTotal = recurring.amount * 12 * recurring.interval;
			break;
	}

	const monthlyAverage = yearlyTotal / 12;

	return {
		...recurring,
		daysUntilDue,
		isOverdue,
		isDueSoon,
		yearlyTotal,
		monthlyAverage,
	};
}

// Verify category access
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

// Verify account access
async function verifyAccountAccess(
	accountId: string,
	userId: string,
): Promise<void> {
	try {
		await getAccountById(accountId, userId);
	} catch (error) {
		throw new Error("ACCOUNT_NOT_FOUND");
	}
}

// Get all recurring transactions
export async function getAllRecurring(
	userId: string,
	params: GetRecurringParams = {},
): Promise<PaginatedResult<RecurringWithNextDue>> {
	logger.info("Fetching all recurring transactions", { userId, params });

	const validatedParams = validateGetRecurringQuery(params);
	const page = validatedParams.page;
	const limit = validatedParams.limit;
	const skip = (page - 1) * limit;

	const where: any = { userId };

	if (validatedParams.type) {
		where.type = validatedParams.type;
	}
	if (validatedParams.frequency) {
		where.frequency = validatedParams.frequency;
	}
	if (validatedParams.isActive !== undefined) {
		where.isActive = validatedParams.isActive;
	}
	if (validatedParams.categoryId) {
		where.categoryId = validatedParams.categoryId;
	}
	if (validatedParams.accountId) {
		where.accountId = validatedParams.accountId;
	}
	if (validatedParams.search) {
		where.OR = [
			{ name: { contains: validatedParams.search, mode: "insensitive" } },
			{
				description: {
					contains: validatedParams.search,
					mode: "insensitive",
				},
			},
		];
	}

	const orderBy: any = {
		[validatedParams.sortBy]: validatedParams.sortOrder,
	};

	const [total, recurringTransactions] = await Promise.all([
		prisma.recurringTransaction.count({ where }),
		prisma.recurringTransaction.findMany({
			where,
			skip,
			take: limit,
			orderBy,
			include: { category: true, account: true },
		}),
	]);

	const enhancedTransactions = recurringTransactions.map((rt) =>
		enhanceRecurringWithMetrics(rt as RecurringTransaction),
	);

	logger.info("Recurring transactions fetched", {
		count: recurringTransactions.length,
		total,
	});
	return { data: enhancedTransactions, total, page, limit };
}

// Get recurring by ID
export async function getRecurringById(
	id: string,
	userId: string,
): Promise<RecurringWithNextDue> {
	logger.info("Fetching recurring transaction by ID", { id, userId });

	validateRecurringId(id);

	const recurring = await prisma.recurringTransaction.findFirst({
		where: { id, userId },
		include: { category: true, account: true },
	});

	if (!recurring) {
		logger.warn("Recurring transaction not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	return enhanceRecurringWithMetrics(recurring as RecurringTransaction);
}

// Get upcoming recurring transactions
export async function getUpcomingRecurring(
	userId: string,
	days: number = 30,
): Promise<UpcomingRecurring[]> {
	logger.info("Fetching upcoming recurring transactions", { userId, days });

	const now = new Date();
	const futureDate = new Date();
	futureDate.setDate(futureDate.getDate() + days);

	const recurringTransactions = await prisma.recurringTransaction.findMany({
		where: {
			userId,
			isActive: true,
			nextDueDate: { lte: futureDate },
			OR: [{ endDate: null }, { endDate: { gte: now } }],
		},
		include: { category: true, account: true },
		orderBy: { nextDueDate: "asc" },
	});

	const upcoming = recurringTransactions.map((rt) => ({
		id: rt.id,
		name: rt.name,
		amount: rt.amount,
		type: rt.type as "INCOME" | "EXPENSE" | "TRANSFER",
		nextDueDate: rt.nextDueDate,
		daysUntilDue: calculateDaysUntilDue(rt.nextDueDate),
		frequency: rt.frequency as RecurringFrequency,
		categoryName: rt.category?.name || null,
		accountName: rt.account?.name || null,
	}));

	logger.info("Upcoming recurring fetched", { count: upcoming.length });
	return upcoming;
}

// Create recurring transaction
export async function createRecurring(
	userId: string,
	data: CreateRecurringInput,
): Promise<RecurringTransaction> {
	logger.info("Creating recurring transaction", { userId, name: data.name });

	const validatedData = validateCreateRecurring(data);

	if (validatedData.categoryId) {
		await verifyCategoryAccess(validatedData.categoryId, userId);
	}
	if (validatedData.accountId) {
		await verifyAccountAccess(validatedData.accountId, userId);
	}

	const startDate = new Date(validatedData.startDate);
	const nextDueDate = calculateNextDueDate(
		startDate,
		validatedData.frequency as RecurringFrequency,
		validatedData.interval,
	);

	const recurring = await prisma.recurringTransaction.create({
		data: {
			name: validatedData.name,
			amount: validatedData.amount,
			type: validatedData.type as TransactionType,
			frequency: validatedData.frequency as RecurringFrequency,
			interval: validatedData.interval,
			startDate,
			endDate: validatedData.endDate
				? new Date(validatedData.endDate)
				: null,
			nextDueDate,
			isActive: validatedData.isActive,
			description: validatedData.description,
			userId,
			categoryId: validatedData.categoryId,
			accountId: validatedData.accountId,
		},
		include: { category: true, account: true },
	});

	logger.info("Recurring transaction created", {
		id: recurring.id,
		name: recurring.name,
	});

	// Audit log for recurring transaction creation
	await logCreate(
		userId,
		"RecurringTransaction",
		recurring.id,
		{
			name: recurring.name,
			amount: recurring.amount,
			type: recurring.type,
			frequency: recurring.frequency,
			interval: recurring.interval,
			startDate: recurring.startDate,
			endDate: recurring.endDate,
			nextDueDate: recurring.nextDueDate,
			isActive: recurring.isActive,
			description: recurring.description,
			categoryId: recurring.categoryId,
			accountId: recurring.accountId,
		},
		{
			description: `Recurring ${recurring.type.toLowerCase()} "${recurring.name}" created with amount ${recurring.amount} (${recurring.frequency})`,
		},
	);

	return recurring as RecurringTransaction;
}

// Update recurring transaction
export async function updateRecurring(
	id: string,
	userId: string,
	data: UpdateRecurringInput,
): Promise<RecurringTransaction> {
	logger.info("Updating recurring transaction", { id, userId });

	validateRecurringId(id);
	const validatedData = validateUpdateRecurring(data);

	const existing = await prisma.recurringTransaction.findFirst({
		where: { id, userId },
	});

	if (!existing) {
		logger.warn("Recurring transaction not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	if (validatedData.categoryId) {
		await verifyCategoryAccess(validatedData.categoryId, userId);
	}
	if (validatedData.accountId) {
		await verifyAccountAccess(validatedData.accountId, userId);
	}

	const updateData: any = { ...validatedData };

	if (validatedData.startDate) {
		updateData.startDate = new Date(validatedData.startDate);
	}
	if (validatedData.endDate !== undefined) {
		updateData.endDate = validatedData.endDate
			? new Date(validatedData.endDate)
			: null;
	}

	// Recalculate next due date if frequency, interval, or startDate changed
	if (
		validatedData.frequency ||
		validatedData.interval ||
		validatedData.startDate
	) {
		const startDate = validatedData.startDate
			? new Date(validatedData.startDate)
			: existing.startDate;
		const frequency = (validatedData.frequency ||
			existing.frequency) as RecurringFrequency;
		const interval = validatedData.interval || existing.interval;

		updateData.nextDueDate = calculateNextDueDate(
			startDate,
			frequency,
			interval,
		);
	}

	const recurring = await prisma.recurringTransaction.update({
		where: { id },
		data: updateData,
		include: { category: true, account: true },
	});

	logger.info("Recurring transaction updated", { id });

	// Prepare old and new data for audit (only changed fields)
	const oldDataForAudit: Record<string, any> = {};
	const newDataForAudit: Record<string, any> = {};

	for (const key of Object.keys(validatedData)) {
		if (key in existing) {
			const oldValue = (existing as any)[key];
			const newValue = (recurring as any)[key];

			if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
				oldDataForAudit[key] = oldValue;
				newDataForAudit[key] = newValue;
			}
		}
	}

	// Audit log for recurring transaction update
	if (Object.keys(oldDataForAudit).length > 0) {
		await logUpdate(
			userId,
			"RecurringTransaction",
			id,
			oldDataForAudit,
			newDataForAudit,
			{
				description: `Recurring transaction "${recurring.name}" updated`,
				excludeFields: ["id", "createdAt", "updatedAt", "userId"],
			},
		);
	}

	return recurring as RecurringTransaction;
}

// Delete recurring transaction
export async function deleteRecurring(
	id: string,
	userId: string,
): Promise<void> {
	logger.info("Deleting recurring transaction", { id, userId });

	validateRecurringId(id);

	const recurring = await prisma.recurringTransaction.findFirst({
		where: { id, userId },
	});

	if (!recurring) {
		logger.warn("Recurring transaction not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	// Prepare recurring data for audit
	const recurringDataForAudit = {
		name: recurring.name,
		amount: recurring.amount,
		type: recurring.type,
		frequency: recurring.frequency,
		interval: recurring.interval,
		startDate: recurring.startDate,
		endDate: recurring.endDate,
		isActive: recurring.isActive,
	};

	await prisma.recurringTransaction.delete({ where: { id } });

	logger.info("Recurring transaction deleted", { id });

	// Audit log for recurring transaction deletion
	await logDelete(userId, "RecurringTransaction", id, recurringDataForAudit, {
		description: `Recurring ${recurring.type.toLowerCase()} "${recurring.name}" deleted`,
	});
}

// Pause recurring transaction
export async function pauseRecurring(
	id: string,
	userId: string,
): Promise<RecurringTransaction> {
	logger.info("Pausing recurring transaction", { id, userId });

	validateRecurringId(id);

	const recurring = await prisma.recurringTransaction.findFirst({
		where: { id, userId },
	});

	if (!recurring) {
		logger.warn("Recurring transaction not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	if (!recurring.isActive) {
		throw new Error("ALREADY_PAUSED");
	}

	const updated = await prisma.recurringTransaction.update({
		where: { id },
		data: { isActive: false },
		include: { category: true, account: true },
	});

	logger.info("Recurring transaction paused", { id });

	// Audit log for pause action
	await logCreate(
		userId,
		"RecurringTransaction",
		id,
		{
			action: "PAUSED",
			previousStatus: "ACTIVE",
			newStatus: "PAUSED",
			pausedAt: new Date().toISOString(),
		},
		{
			description: `Recurring transaction "${recurring.name}" paused`,
		},
	);

	return updated as RecurringTransaction;
}

// Resume recurring transaction
export async function resumeRecurring(
	id: string,
	userId: string,
): Promise<RecurringTransaction> {
	logger.info("Resuming recurring transaction", { id, userId });

	validateRecurringId(id);

	const recurring = await prisma.recurringTransaction.findFirst({
		where: { id, userId },
	});

	if (!recurring) {
		logger.warn("Recurring transaction not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	if (recurring.isActive) {
		throw new Error("ALREADY_ACTIVE");
	}

	// Check if end date has passed
	if (recurring.endDate && new Date(recurring.endDate) < new Date()) {
		throw new Error("END_DATE_PASSED");
	}

	// Recalculate next due date from now
	const nextDueDate = calculateNextDueDate(
		new Date(),
		recurring.frequency,
		recurring.interval,
	);

	const updated = await prisma.recurringTransaction.update({
		where: { id },
		data: {
			isActive: true,
			nextDueDate,
		},
		include: { category: true, account: true },
	});

	logger.info("Recurring transaction resumed", { id });

	// Audit log for resume action
	await logCreate(
		userId,
		"RecurringTransaction",
		id,
		{
			action: "RESUMED",
			previousStatus: "PAUSED",
			newStatus: "ACTIVE",
			resumedAt: new Date().toISOString(),
			nextDueDate: nextDueDate,
		},
		{
			description: `Recurring transaction "${recurring.name}" resumed. Next due: ${nextDueDate.toLocaleDateString()}`,
		},
	);

	return updated as RecurringTransaction;
}
