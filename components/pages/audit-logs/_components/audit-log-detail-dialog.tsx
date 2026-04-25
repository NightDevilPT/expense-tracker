// components/pages/audit-logs/_components/audit-log-detail-dialog.tsx
"use client";

import * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuditLogEntry } from "@/lib/audit-service/types";
import { AuditAction } from "@/generated/prisma/enums";
import { FileText, User, Globe, Monitor, Clock, Hash } from "lucide-react";

type BadgeVariant = "default" | "secondary" | "outline";

function getActionConfig(action: AuditAction): {
	label: string;
	variant: BadgeVariant;
} {
	const actionMap: Partial<
		Record<AuditAction, { label: string; variant: BadgeVariant }>
	> = {
		CREATE: { label: "Create", variant: "default" },
		UPDATE: { label: "Update", variant: "secondary" },
		DELETE: { label: "Delete", variant: "outline" },
		EXPORT: { label: "Export", variant: "secondary" },
		LOGIN: { label: "Login", variant: "default" },
		LOGOUT: { label: "Logout", variant: "outline" },
		SETTINGS_CHANGE: { label: "Settings Change", variant: "secondary" },
		BUDGET_ALERT: { label: "Budget Alert", variant: "outline" },
		GOAL_MILESTONE: { label: "Goal Milestone", variant: "default" },
	};

	return (
		actionMap[action] || {
			label: action.replace(/_/g, " "),
			variant: "outline",
		}
	);
}

function formatDateTime(date?: Date): string {
	if (!date) return "—";
	return new Intl.DateTimeFormat("en-US", {
		dateStyle: "full",
		timeStyle: "long",
	}).format(new Date(date));
}

function formatJson(data: Record<string, any> | null): string {
	if (!data) return "No data";
	try {
		return JSON.stringify(data, null, 2);
	} catch {
		return "Invalid data";
	}
}

interface AuditLogDetailDialogProps {
	auditLog: AuditLogEntry;
	trigger?: React.ReactNode;
}

export function AuditLogDetailDialog({
	auditLog,
	trigger,
}: AuditLogDetailDialogProps) {
	const actionConfig = getActionConfig(auditLog.action);

	return (
		<Dialog>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						Audit Log Detail
						<Badge variant={actionConfig.variant}>
							{actionConfig.label}
						</Badge>
					</DialogTitle>
					<DialogDescription>
						Detailed information about this activity
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Basic Information */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium">
								Basic Information
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center gap-2 text-sm">
								<Hash className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground">
									ID:
								</span>
								<span className="font-mono text-xs">
									{auditLog.id || "—"}
								</span>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<FileText className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground">
									Entity:
								</span>
								<span>{auditLog.entityType}</span>
								{auditLog.entityId && (
									<span className="font-mono text-xs text-muted-foreground">
										({auditLog.entityId.slice(0, 8)}...)
									</span>
								)}
							</div>
							<div className="flex items-center gap-2 text-sm">
								<Clock className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground">
									Date:
								</span>
								<span>
									{formatDateTime(auditLog.createdAt)}
								</span>
							</div>
						</CardContent>
					</Card>

					{/* Description */}
					{auditLog.description && (
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium">
									Description
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm">
									{auditLog.description}
								</p>
							</CardContent>
						</Card>
					)}

					{/* User Information */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium">
								User Information
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center gap-2 text-sm">
								<User className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground">
									User ID:
								</span>
								<span className="font-mono text-xs">
									{auditLog.userId}
								</span>
							</div>
							{auditLog.ipAddress && (
								<div className="flex items-center gap-2 text-sm">
									<Globe className="h-4 w-4 text-muted-foreground" />
									<span className="text-muted-foreground">
										IP Address:
									</span>
									<span className="font-mono text-xs">
										{auditLog.ipAddress}
									</span>
								</div>
							)}
							{auditLog.userAgent && (
								<div className="flex items-start gap-2 text-sm">
									<Monitor className="h-4 w-4 text-muted-foreground mt-0.5" />
									<span className="text-muted-foreground">
										User Agent:
									</span>
									<span className="text-xs break-all">
										{auditLog.userAgent}
									</span>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Changes (for UPDATE/SETTINGS_CHANGE actions) */}
					{(auditLog.action === "UPDATE" ||
						auditLog.action === "SETTINGS_CHANGE") &&
						(auditLog.oldValue || auditLog.newValue) && (
							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="text-sm font-medium">
										Changes
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{auditLog.oldValue && (
										<div>
											<p className="text-xs font-medium text-muted-foreground mb-1">
												Old Values
											</p>
											<pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-40">
												{formatJson(auditLog.oldValue)}
											</pre>
										</div>
									)}
									{auditLog.newValue && (
										<div>
											<p className="text-xs font-medium text-muted-foreground mb-1">
												New Values
											</p>
											<pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-40">
												{formatJson(auditLog.newValue)}
											</pre>
										</div>
									)}
								</CardContent>
							</Card>
						)}

					{/* Details for CREATE/DELETE actions */}
					{(auditLog.action === "CREATE" ||
						auditLog.action === "DELETE") &&
						auditLog.newValue && (
							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="text-sm font-medium">
										{auditLog.action === "CREATE"
											? "Created Data"
											: "Deleted Data"}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-40">
										{formatJson(auditLog.newValue)}
									</pre>
								</CardContent>
							</Card>
						)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
