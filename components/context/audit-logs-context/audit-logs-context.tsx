// components/context/audit-logs-context/audit-logs-context.tsx
"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import { apiClient, ApiError } from "@/lib/api-client";
import type { AuditLogEntry, EntityType } from "@/lib/audit-service/types";
import { useAuth } from "@/components/context/auth-context/auth-context";
import { ErrorCode, type ApiMeta } from "@/lib/response-service";
import { AuditAction } from "@/generated/prisma/enums";

// ============================================
// TYPES
// ============================================

interface AuditLogsContextType {
	auditLogs: AuditLogEntry[];
	pagination: ApiMeta["pagination"] | null;
	isLoading: boolean;
	error: string | null;
	fetchAuditLogs: (params?: {
		page?: number;
		limit?: number;
		action?: AuditAction;
		entityType?: EntityType;
		entityId?: string;
		startDate?: string;
		endDate?: string;
	}) => Promise<void>;
	exportAuditLogs: (params?: {
		format?: "json" | "csv";
		startDate?: string;
		endDate?: string;
		action?: AuditAction;
		entityType?: EntityType;
	}) => Promise<AuditLogEntry[] | string | null>;
	getAuditLogById: (id: string) => Promise<AuditLogEntry | null>;
	getAuditLogsForEntity: (
		entityType: EntityType,
		entityId: string,
		limit?: number,
	) => Promise<AuditLogEntry[]>;
	clearError: () => void;
}

// ============================================
// CONTEXT
// ============================================

const AuditLogsContext = createContext<AuditLogsContextType | undefined>(
	undefined,
);

// ============================================
// PROVIDER
// ============================================

interface AuditLogsProviderProps {
	children: React.ReactNode;
}

export function AuditLogsProvider({ children }: AuditLogsProviderProps) {
	const { isAuthenticated } = useAuth();
	const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
	const [pagination, setPagination] = useState<ApiMeta["pagination"] | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => setError(null), []);

	const fetchAuditLogs = useCallback(
		async (
			params: {
				page?: number;
				limit?: number;
				action?: AuditAction;
				entityType?: EntityType;
				entityId?: string;
				startDate?: string;
				endDate?: string;
			} = {},
		) => {
			if (!isAuthenticated) return;

			setIsLoading(true);
			setError(null);

			try {
				const queryParams = new URLSearchParams();
				if (params.page)
					queryParams.set("page", params.page.toString());
				if (params.limit)
					queryParams.set("limit", params.limit.toString());
				if (params.action) queryParams.set("action", params.action);
				if (params.entityType)
					queryParams.set("entityType", params.entityType);
				if (params.entityId)
					queryParams.set("entityId", params.entityId);
				if (params.startDate)
					queryParams.set("startDate", params.startDate);
				if (params.endDate) queryParams.set("endDate", params.endDate);

				// ✅ apiClient.get returns ApiSuccessResponse<AuditLogEntry[]>
				const response = await apiClient.get<AuditLogEntry[]>(
					`/audit-logs?${queryParams.toString()}`,
				);

				setAuditLogs(response.data);
				setPagination(response.meta.pagination || null);
			} catch (error) {
				const errorMessage =
					error instanceof ApiError
						? error.message
						: "Failed to fetch audit logs";
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const exportAuditLogs = useCallback(
		async (
			params: {
				format?: "json" | "csv";
				startDate?: string;
				endDate?: string;
				action?: AuditAction;
				entityType?: EntityType;
			} = {},
		): Promise<AuditLogEntry[] | string | null> => {
			if (!isAuthenticated) return null;

			setIsLoading(true);
			setError(null);

			try {
				const queryParams = new URLSearchParams();
				queryParams.set("export", params.format || "json");
				if (params.startDate)
					queryParams.set("startDate", params.startDate);
				if (params.endDate) queryParams.set("endDate", params.endDate);
				if (params.action) queryParams.set("action", params.action);
				if (params.entityType)
					queryParams.set("entityType", params.entityType);

				const format = params.format || "json";

				if (format === "csv") {
					// For CSV, use raw fetch to handle blob download
					const response = await fetch(
						`/api/audit-logs?${queryParams.toString()}`,
						{
							credentials: "include",
						},
					);

					if (!response.ok) {
						const errorData = await response.json();
						throw new ApiError(
							errorData.error?.message || "Export failed",
							errorData.error?.code ||
								ErrorCode.INTERNAL_SERVER_ERROR,
							response.status,
						);
					}

					const csvData = await response.text();

					// Trigger download
					const blob = new Blob([csvData], { type: "text/csv" });
					const url = window.URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.href = url;
					a.download = `audit-logs-${Date.now()}.csv`;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					window.URL.revokeObjectURL(url);

					return csvData;
				} else {
					// ✅ JSON format - apiClient.get returns ApiSuccessResponse<AuditLogEntry[]>
					const response = await apiClient.get<AuditLogEntry[]>(
						`/audit-logs?${queryParams.toString()}`,
					);
					return response.data;
				}
			} catch (error) {
				const errorMessage =
					error instanceof ApiError
						? error.message
						: "Failed to export audit logs";
				setError(errorMessage);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const getAuditLogById = useCallback(
		async (id: string): Promise<AuditLogEntry | null> => {
			if (!isAuthenticated) return null;

			try {
				// ✅ apiClient.get returns ApiSuccessResponse<AuditLogEntry>
				const response = await apiClient.get<AuditLogEntry>(
					`/audit-logs/${id}`,
				);
				return response.data;
			} catch (error) {
				let errorMessage = "Failed to fetch audit log";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Audit log not found";
					} else {
						errorMessage = error.message;
					}
				}

				setError(errorMessage);
				return null;
			}
		},
		[isAuthenticated],
	);

	const getAuditLogsForEntity = useCallback(
		async (
			entityType: EntityType,
			entityId: string,
			limit: number = 50,
		): Promise<AuditLogEntry[]> => {
			if (!isAuthenticated) return [];

			try {
				const queryParams = new URLSearchParams();
				queryParams.set("entityType", entityType);
				queryParams.set("entityId", entityId);
				queryParams.set("limit", limit.toString());
				queryParams.set("page", "1");

				// ✅ apiClient.get returns ApiSuccessResponse<AuditLogEntry[]>
				const response = await apiClient.get<AuditLogEntry[]>(
					`/audit-logs?${queryParams.toString()}`,
				);

				return response.data;
			} catch (error) {
				const errorMessage =
					error instanceof ApiError
						? error.message
						: `Failed to fetch audit logs for ${entityType}`;
				setError(errorMessage);
				return [];
			}
		},
		[isAuthenticated],
	);

	// Initial fetch
	useEffect(() => {
		if (isAuthenticated) {
			fetchAuditLogs();
		}
	}, [isAuthenticated, fetchAuditLogs]);

	const value: AuditLogsContextType = {
		auditLogs,
		pagination,
		isLoading,
		error,
		fetchAuditLogs,
		exportAuditLogs,
		getAuditLogById,
		getAuditLogsForEntity,
		clearError,
	};

	return (
		<AuditLogsContext.Provider value={value}>
			{children}
		</AuditLogsContext.Provider>
	);
}

// ============================================
// HOOK
// ============================================

export function useAuditLogs() {
	const context = useContext(AuditLogsContext);
	if (context === undefined) {
		throw new Error("useAuditLogs must be used within a AuditLogsProvider");
	}
	return context;
}
