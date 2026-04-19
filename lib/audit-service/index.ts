import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/logger-service";
import { AuditAction } from "@/generated/prisma/enums";
import {
	validateAuditLog,
	validateGetAuditLogsQuery,
	validateExportAuditLogsQuery,
	type AuditLogInput,
} from "./validation";
import type {
	AuditLogEntry,
	AuditLogOptions,
	FieldChange,
	EntityType,
	GetAuditLogsParams,
	ExportAuditLogsParams,
	PaginatedResult,
} from "./types";

const logger = new Logger("AUDIT-SERVICE");

// Helper: Compare two objects and return only changed fields
function getChangedFields(
	oldObj: Record<string, any> | null,
	newObj: Record<string, any> | null,
	excludeFields: string[] = [],
): {
	oldValue: Record<string, any> | null;
	newValue: Record<string, any> | null;
} {
	if (!oldObj && !newObj) return { oldValue: null, newValue: null };
	if (!oldObj && newObj) return { oldValue: null, newValue: newObj };
	if (oldObj && !newObj) return { oldValue: oldObj, newValue: null };

	const changedFields: FieldChange[] = [];
	const allKeys = new Set([...Object.keys(oldObj!), ...Object.keys(newObj!)]);

	for (const key of allKeys) {
		// Skip excluded fields
		if (excludeFields.includes(key)) continue;

		// Skip internal fields
		if (key === "id" || key === "createdAt" || key === "updatedAt")
			continue;

		const oldValue = oldObj![key];
		const newValue = newObj![key];

		// Compare values (handle dates, nested objects)
		if (!areEqual(oldValue, newValue)) {
			changedFields.push({ field: key, oldValue, newValue });
		}
	}

	if (changedFields.length === 0) {
		return { oldValue: null, newValue: null };
	}

	const oldValue: Record<string, any> = {};
	const newValue: Record<string, any> = {};

	for (const change of changedFields) {
		oldValue[change.field] = change.oldValue;
		newValue[change.field] = change.newValue;
	}

	return { oldValue, newValue };
}

// Helper: Deep equality check
function areEqual(a: any, b: any): boolean {
	// Handle null/undefined
	if (a === b) return true;
	if (a === null || b === null) return false;
	if (a === undefined || b === undefined) return false;

	// Handle Date objects
	if (a instanceof Date && b instanceof Date) {
		return a.getTime() === b.getTime();
	}

	// Handle arrays
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		return a.every((item, index) => areEqual(item, b[index]));
	}

	// Handle objects
	if (typeof a === "object" && typeof b === "object") {
		return JSON.stringify(a) === JSON.stringify(b);
	}

	// Handle primitive types
	return a === b;
}

// Helper: Sanitize data to remove sensitive information
function sanitizeData(
	data: Record<string, any> | null,
): Record<string, any> | null {
	if (!data) return null;

	const sanitized = { ...data };

	// Remove sensitive fields
	const sensitiveFields = [
		"passwordHash",
		"token",
		"refreshToken",
		"accessToken",
		"otpCode",
	];
	for (const field of sensitiveFields) {
		delete sanitized[field];
	}

	// Handle large arrays (truncate)
	for (const key in sanitized) {
		if (Array.isArray(sanitized[key]) && sanitized[key].length > 10) {
			sanitized[key] = {
				_truncated: true,
				count: sanitized[key].length,
				first: sanitized[key][0],
			};
		}
	}

	return sanitized;
}

// Helper: Generate description based on action
function generateDescription(
	action: AuditAction,
	entityType: string,
	changes: { oldValue: any; newValue: any },
	customDescription?: string | ((data: any) => string),
): string {
	if (typeof customDescription === "string") return customDescription;
	if (typeof customDescription === "function")
		return customDescription(changes);

	switch (action) {
		case "CREATE":
			return `${entityType} created`;
		case "UPDATE":
			if (changes.oldValue && Object.keys(changes.oldValue).length > 0) {
				const changedFields = Object.keys(changes.oldValue).join(", ");
				return `${entityType} updated: ${changedFields} changed`;
			}
			return `${entityType} updated`;
		case "DELETE":
			return `${entityType} deleted`;
		case "EXPORT":
			return `Data exported as ${entityType}`;
		case "LOGIN":
			return `User logged in`;
		case "LOGOUT":
			return `User logged out`;
		case "SETTINGS_CHANGE":
			const changedSettings = changes.newValue
				? Object.keys(changes.newValue).join(", ")
				: "";
			return `Settings changed: ${changedSettings}`;
		case "BUDGET_ALERT":
			return `Budget alert triggered for ${entityType}`;
		case "GOAL_MILESTONE":
			return `Savings goal milestone reached for ${entityType}`;
		default:
			return `${action} performed on ${entityType}`;
	}
}

// Main function: Create audit log entry
export async function createAuditLog(
	userId: string,
	action: AuditAction,
	entityType: EntityType,
	entityId: string | null,
	oldData: Record<string, any> | null,
	newData: Record<string, any> | null,
	options: AuditLogOptions = {},
): Promise<AuditLogEntry> {
	logger.info("Creating audit log", {
		userId,
		action,
		entityType,
		entityId,
		options,
	});

	// Skip logging if requested
	if (options.skip) {
		logger.debug("Audit log skipped", { action, entityType });
		return {} as AuditLogEntry;
	}

	// Get request context (should be set from proxy or middleware)
	const ipAddress = (global as any).__requestIpAddress || null;
	const userAgent = (global as any).__requestUserAgent || null;

	let oldValue: Record<string, any> | null = null;
	let newValue: Record<string, any> | null = null;

	// Handle different action types
	switch (action) {
		case "CREATE":
			oldValue = null;
			newValue =
				options.includeFullObject !== false
					? sanitizeData(newData)
					: newData;
			break;

		case "DELETE":
			oldValue =
				options.includeFullObject !== false
					? sanitizeData(oldData)
					: oldData;
			newValue = null;
			break;

		case "UPDATE":
			const changes = getChangedFields(
				oldData,
				newData,
				options.excludeFields,
			);
			oldValue = changes.oldValue;
			newValue = changes.newValue;
			break;

		default:
			oldValue = oldData ? sanitizeData(oldData) : null;
			newValue = newData ? sanitizeData(newData) : null;
			break;
	}

	// Skip if no changes (for UPDATE)
	if (action === "UPDATE" && !oldValue && !newValue) {
		logger.debug("No changes detected, skipping audit log", {
			entityType,
			entityId,
		});
		return {} as AuditLogEntry;
	}

	// Generate description
	const description = generateDescription(
		action,
		entityType,
		{ oldValue, newValue },
		options.description,
	);

	// Validate audit log data
	const auditData = validateAuditLog({
		action,
		entityType,
		entityId,
		oldValue,
		newValue,
		description,
		ipAddress,
		userAgent,
		userId,
	});

	// Create audit log entry
	const auditLog = await prisma.auditLog.create({
		data: auditData as any,
	});

	logger.info("Audit log created successfully", {
		id: auditLog.id,
		action,
		entityType,
	});

	return auditLog as AuditLogEntry;
}

// Convenience methods for common actions

export async function logCreate(
	userId: string,
	entityType: EntityType,
	entityId: string,
	newData: Record<string, any>,
	options?: AuditLogOptions,
): Promise<AuditLogEntry> {
	return createAuditLog(
		userId,
		AuditAction.CREATE,
		entityType,
		entityId,
		null,
		newData,
		options,
	);
}

export async function logUpdate(
	userId: string,
	entityType: EntityType,
	entityId: string,
	oldData: Record<string, any>,
	newData: Record<string, any>,
	options?: AuditLogOptions,
): Promise<AuditLogEntry> {
	return createAuditLog(
		userId,
		AuditAction.UPDATE,
		entityType,
		entityId,
		oldData,
		newData,
		options,
	);
}

export async function logDelete(
	userId: string,
	entityType: EntityType,
	entityId: string,
	oldData: Record<string, any>,
	options?: AuditLogOptions,
): Promise<AuditLogEntry> {
	return createAuditLog(
		userId,
		AuditAction.DELETE,
		entityType,
		entityId,
		oldData,
		null,
		options,
	);
}

export async function logExport(
	userId: string,
	entityType: EntityType,
	exportParams: Record<string, any>,
	options?: AuditLogOptions,
): Promise<AuditLogEntry> {
	return createAuditLog(
		userId,
		AuditAction.EXPORT,
		entityType,
		null,
		null,
		exportParams,
		options,
	);
}

export async function logLogin(
	userId: string,
	sessionInfo: Record<string, any>,
	options?: AuditLogOptions,
): Promise<AuditLogEntry> {
	return createAuditLog(
		userId,
		AuditAction.LOGIN,
		"User",
		null,
		null,
		sessionInfo,
		options,
	);
}

export async function logLogout(
	userId: string,
	sessionInfo: Record<string, any>,
	options?: AuditLogOptions,
): Promise<AuditLogEntry> {
	return createAuditLog(
		userId,
		AuditAction.LOGOUT,
		"User",
		null,
		sessionInfo,
		null,
		options,
	);
}

export async function logSettingsChange(
	userId: string,
	oldSettings: Record<string, any>,
	newSettings: Record<string, any>,
	options?: AuditLogOptions,
): Promise<AuditLogEntry> {
	return createAuditLog(
		userId,
		AuditAction.SETTINGS_CHANGE,
		"Settings",
		null,
		oldSettings,
		newSettings,
		options,
	);
}

export async function logBudgetAlert(
	userId: string,
	budgetId: string,
	budgetData: Record<string, any>,
	alertInfo: Record<string, any>,
	options?: AuditLogOptions,
): Promise<AuditLogEntry> {
	return createAuditLog(
		userId,
		AuditAction.BUDGET_ALERT,
		"Budget",
		budgetId,
		budgetData,
		alertInfo,
		options,
	);
}

export async function logGoalMilestone(
	userId: string,
	goalId: string,
	goalData: Record<string, any>,
	milestoneInfo: Record<string, any>,
	options?: AuditLogOptions,
): Promise<AuditLogEntry> {
	return createAuditLog(
		userId,
		AuditAction.GOAL_MILESTONE,
		"SavingsGoal",
		goalId,
		goalData,
		milestoneInfo,
		options,
	);
}

// Helper to set request context (to be used in proxy or middleware)
export function setAuditContext(
	ipAddress: string | null,
	userAgent: string | null,
) {
	(global as any).__requestIpAddress = ipAddress;
	(global as any).__requestUserAgent = userAgent;
}

// Get audit logs for a specific entity
export async function getAuditLogsForEntity(
	userId: string,
	entityType: string,
	entityId: string,
	limit: number = 50,
	offset: number = 0,
): Promise<AuditLogEntry[]> {
	logger.info("Fetching audit logs for entity", {
		userId,
		entityType,
		entityId,
	});

	const logs = await prisma.auditLog.findMany({
		where: {
			userId,
			entityType,
			entityId,
		},
		orderBy: { createdAt: "desc" },
		take: limit,
		skip: offset,
	});

	return logs as AuditLogEntry[];
}

// Get audit logs for a user with pagination
export async function getUserAuditLogs(
	userId: string,
	limit: number = 50,
	offset: number = 0,
	action?: AuditAction,
): Promise<{ data: AuditLogEntry[]; total: number }> {
	logger.info("Fetching user audit logs", { userId, limit, offset, action });

	const where: any = { userId };
	if (action) {
		where.action = action;
	}

	const [total, logs] = await Promise.all([
		prisma.auditLog.count({ where }),
		prisma.auditLog.findMany({
			where,
			orderBy: { createdAt: "desc" },
			take: limit,
			skip: offset,
		}),
	]);

	return { data: logs as AuditLogEntry[], total };
}

// Get audit logs with filters and pagination
export async function getAuditLogs(
	userId: string,
	params: GetAuditLogsParams = {},
): Promise<PaginatedResult<AuditLogEntry>> {
	logger.info("Fetching audit logs", { userId, params });

	const validatedParams = validateGetAuditLogsQuery(params);
	const page = validatedParams.page;
	const limit = validatedParams.limit;
	const skip = (page - 1) * limit;

	const where: any = { userId };

	if (validatedParams.action) {
		where.action = validatedParams.action;
	}

	if (validatedParams.entityType) {
		where.entityType = validatedParams.entityType;
	}

	if (validatedParams.entityId) {
		where.entityId = validatedParams.entityId;
	}

	if (validatedParams.startDate) {
		where.createdAt = { gte: new Date(validatedParams.startDate) };
	}

	if (validatedParams.endDate) {
		where.createdAt = {
			...where.createdAt,
			lte: new Date(validatedParams.endDate),
		};
	}

	const [total, logs] = await Promise.all([
		prisma.auditLog.count({ where }),
		prisma.auditLog.findMany({
			where,
			skip,
			take: limit,
			orderBy: { createdAt: "desc" },
		}),
	]);

	logger.info("Audit logs fetched successfully", {
		count: logs.length,
		total,
		page,
		limit,
	});

	return {
		data: logs as AuditLogEntry[],
		total,
		page,
		limit,
	};
}

// Get audit log by ID
export async function getAuditLogById(
	id: string,
	userId: string,
): Promise<AuditLogEntry> {
	logger.info("Fetching audit log by ID", { id, userId });

	const auditLog = await prisma.auditLog.findFirst({
		where: { id, userId },
	});

	if (!auditLog) {
		logger.warn("Audit log not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	logger.info("Audit log fetched successfully", { id });
	return auditLog as AuditLogEntry;
}

// Export audit logs
export async function exportAuditLogs(
	userId: string,
	params: ExportAuditLogsParams = {},
): Promise<string | AuditLogEntry[]> {
	logger.info("Exporting audit logs", { userId, params });

	const validatedParams = validateExportAuditLogsQuery(params);

	const where: any = { userId };

	if (validatedParams.action) {
		where.action = validatedParams.action;
	}

	if (validatedParams.entityType) {
		where.entityType = validatedParams.entityType;
	}

	if (validatedParams.startDate) {
		where.createdAt = { gte: new Date(validatedParams.startDate) };
	}

	if (validatedParams.endDate) {
		where.createdAt = {
			...where.createdAt,
			lte: new Date(validatedParams.endDate),
		};
	}

	const logs = await prisma.auditLog.findMany({
		where,
		orderBy: { createdAt: "desc" },
	});

	// Create audit log for export
	await logExport(
		userId,
		"AuditLog",
		{
			format: validatedParams.format,
			startDate: validatedParams.startDate,
			endDate: validatedParams.endDate,
			action: validatedParams.action,
			entityType: validatedParams.entityType,
			recordCount: logs.length,
		},
		{
			description: `Exported ${logs.length} audit logs as ${validatedParams.format.toUpperCase()}`,
		},
	);

	if (validatedParams.format === "json") {
		return logs as AuditLogEntry[];
	} else if (validatedParams.format === "csv") {
		const headers = [
			"ID",
			"Action",
			"Entity Type",
			"Entity ID",
			"Description",
			"IP Address",
			"User Agent",
			"Created At",
		];
		const rows = logs.map((log) => [
			log.id,
			log.action,
			log.entityType,
			log.entityId || "",
			log.description || "",
			log.ipAddress || "",
			log.userAgent || "",
			log.createdAt.toISOString(),
		]);
		return [headers, ...rows].map((row) => row.join(",")).join("\n");
	}

	throw new Error("INVALID_FORMAT");
}
