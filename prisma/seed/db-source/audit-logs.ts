// prisma/seed/db-source/audit-logs.ts

import { AuditAction } from "@/generated/prisma/enums";
import { randomItem } from "../utils";
import { PrismaClient } from "@/generated/prisma/client";

const AUDIT_ENTRIES: {
	action: AuditAction;
	entityType: string;
	description: string;
}[] = [
	{ action: "LOGIN", entityType: "User", description: "User logged in" },
	{
		action: "CREATE",
		entityType: "Transaction",
		description: "Transaction created",
	},
	{
		action: "UPDATE",
		entityType: "Transaction",
		description: "Transaction updated",
	},
	{ action: "CREATE", entityType: "Budget", description: "Budget created" },
	{
		action: "BUDGET_ALERT",
		entityType: "Budget",
		description: "Budget threshold reached",
	},
	{
		action: "GOAL_MILESTONE",
		entityType: "SavingsGoal",
		description: "Goal milestone reached",
	},
	{
		action: "EXPORT",
		entityType: "Report",
		description: "Data exported to CSV",
	},
	{
		action: "SETTINGS_CHANGE",
		entityType: "User",
		description: "User settings updated",
	},
	{ action: "LOGOUT", entityType: "User", description: "User logged out" },
];

export async function seedAuditLogs(
	prisma: PrismaClient,
	userId: string,
	entityId: string,
): Promise<void> {
	for (const entry of AUDIT_ENTRIES) {
		await prisma.auditLog.create({
			data: {
				action: entry.action,
				entityType: entry.entityType,
				entityId,
				description: entry.description,
				ipAddress: `192.168.${randomItem([1, 2, 3])}.${Math.floor(Math.random() * 254) + 1}`,
				userAgent: "Mozilla/5.0 (Seed Script)",
				userId,
			},
		});
	}
}
