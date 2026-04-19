import { AuditAction } from "@/generated/prisma/enums";

export interface AuditLogEntry {
	id?: string;
	action: AuditAction;
	entityType: string;
	entityId: string | null;
	oldValue: Record<string, any> | null;
	newValue: Record<string, any> | null;
	description: string | null;
	ipAddress: string | null;
	userAgent: string | null;
	userId: string;
	createdAt?: Date;
}

export interface AuditLogOptions {
	skip?: boolean;
	description?: string | ((data: any) => string);
	excludeFields?: string[];
	includeFullObject?: boolean;
}

export interface FieldChange {
	field: string;
	oldValue: any;
	newValue: any;
}

export type EntityType =
	| "Transaction"
	| "Category"
	| "Budget"
	| "Account"
	| "User"
	| "Tag"
	| "Attachment"
	| "SavingsGoal"
	| "RecurringTransaction"
	| "Export"
	| "Settings"
	| "AuditLog";

export interface GetAuditLogsParams {
	page?: number;
	limit?: number;
	action?: AuditAction;
	entityType?: string;
	entityId?: string;
	startDate?: string;
	endDate?: string;
}

export interface ExportAuditLogsParams {
	format?: "json" | "csv";
	startDate?: string;
	endDate?: string;
	action?: AuditAction;
	entityType?: string;
}

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
}
