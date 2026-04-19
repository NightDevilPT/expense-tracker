import { AuditAction } from "@/generated/prisma/enums";
import { z } from "zod";

export const auditLogSchema = z.object({
	action: z.nativeEnum(AuditAction),
	entityType: z.string().min(1).max(50),
	entityId: z.string().nullable().optional(),
	oldValue: z.record(z.string(), z.any()).nullable().optional(),
	newValue: z.record(z.string(), z.any()).nullable().optional(),
	description: z.string().max(500).nullable().optional(),
	ipAddress: z.string().nullable().optional(),
	userAgent: z.string().max(255).nullable().optional(),
	userId: z.string().cuid(),
});

export const getAuditLogsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	action: z.nativeEnum(AuditAction).optional(),
	entityType: z.string().max(50).optional(),
	entityId: z.string().optional(),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
});

export const exportAuditLogsQuerySchema = z.object({
	format: z.enum(["json", "csv"]).default("json"),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
	action: z.nativeEnum(AuditAction).optional(),
	entityType: z.string().max(50).optional(),
});

export type AuditLogInput = z.infer<typeof auditLogSchema>;
export type GetAuditLogsQuery = z.infer<typeof getAuditLogsQuerySchema>;
export type ExportAuditLogsQuery = z.infer<typeof exportAuditLogsQuerySchema>;

export function validateAuditLog(data: unknown): AuditLogInput {
	return auditLogSchema.parse(data);
}

export function validateGetAuditLogsQuery(query: unknown): GetAuditLogsQuery {
	return getAuditLogsQuerySchema.parse(query);
}

export function validateExportAuditLogsQuery(
	query: unknown,
): ExportAuditLogsQuery {
	return exportAuditLogsQuerySchema.parse(query);
}
