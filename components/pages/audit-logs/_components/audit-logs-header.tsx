// components/pages/audit-logs/_components/audit-logs-header.tsx

"use client";

import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useAuditLogs } from "@/components/context/audit-logs-context/audit-logs-context";
import { useState } from "react";
import { toast } from "sonner";

export function AuditLogsHeader() {
	const { exportAuditLogs, isLoading } = useAuditLogs();
	const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
	const [isExporting, setIsExporting] = useState(false);

	async function handleExport() {
		setIsExporting(true);
		try {
			const result = await exportAuditLogs({ format: exportFormat });
			if (result) {
				toast.success(
					`Audit logs exported as ${exportFormat.toUpperCase()}`,
				);
			}
		} catch {
			// Error is handled in context
		} finally {
			setIsExporting(false);
		}
	}

	return (
		<div className="flex items-center justify-between">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					Audit Logs
				</h1>
				<p className="text-muted-foreground">
					Track all system activities and changes
				</p>
			</div>
			<div className="flex items-center gap-2">
				<Select
					value={exportFormat}
					onValueChange={(value) =>
						setExportFormat(value as "json" | "csv")
					}
				>
					<SelectTrigger className="w-[100px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="json">JSON</SelectItem>
						<SelectItem value="csv">CSV</SelectItem>
					</SelectContent>
				</Select>
				<Button
					variant="outline"
					onClick={handleExport}
					disabled={isExporting}
				>
					{isExporting ? (
						<Loader2 className="h-4 w-4 mr-2 animate-spin" />
					) : (
						<Download className="h-4 w-4 mr-2" />
					)}
					Export
				</Button>
			</div>
		</div>
	);
}
