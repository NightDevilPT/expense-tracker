// components/context/tags-context/tags-context.tsx
"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import type {
	CreateTagInput,
	UpdateTagInput,
	GetTagsParams,
} from "@/lib/tag-service/validation";
import { apiClient, ApiError } from "@/lib/api-client";
import type { Tag, TagWithCount, PopularTag } from "@/lib/tag-service/types";
import { useAuth } from "@/components/context/auth-context/auth-context";
import { ErrorCode, type ApiMeta } from "@/lib/response-service";

// ============================================
// TYPES
// ============================================

interface TagsContextType {
	tags: TagWithCount[];
	pagination: ApiMeta["pagination"] | null;
	popularTags: PopularTag[];
	isLoading: boolean;
	error: string | null;
	fetchTags: (params?: Partial<GetTagsParams>) => Promise<void>;
	fetchPopularTags: (limit?: number) => Promise<void>;
	createTag: (data: CreateTagInput) => Promise<Tag | null>;
	updateTag: (id: string, data: UpdateTagInput) => Promise<Tag | null>;
	deleteTag: (id: string) => Promise<boolean>;
	getTagById: (id: string) => Promise<Tag | null>;
	clearError: () => void;
}

// ============================================
// CONTEXT
// ============================================

const TagsContext = createContext<TagsContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

interface TagsProviderProps {
	children: React.ReactNode;
}

export function TagsProvider({ children }: TagsProviderProps) {
	const { isAuthenticated } = useAuth();
	const [tags, setTags] = useState<TagWithCount[]>([]);
	const [pagination, setPagination] = useState<ApiMeta["pagination"] | null>(
		null,
	);
	const [popularTags, setPopularTags] = useState<PopularTag[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => setError(null), []);

	const fetchTags = useCallback(
		async (params: Partial<GetTagsParams> = {}) => {
			if (!isAuthenticated) return;

			setIsLoading(true);
			setError(null);

			try {
				const queryParams = new URLSearchParams();
				if (params.page)
					queryParams.set("page", params.page.toString());
				if (params.limit)
					queryParams.set("limit", params.limit.toString());
				if (params.search) queryParams.set("search", params.search);
				if (params.sortBy) queryParams.set("sortBy", params.sortBy);
				if (params.sortOrder)
					queryParams.set("sortOrder", params.sortOrder);

				// ✅ apiClient.get returns ApiSuccessResponse<TagWithCount[]>
				const response = await apiClient.get<TagWithCount[]>(
					`/tags?${queryParams.toString()}`,
				);

				setTags(response.data);
				setPagination(response.meta.pagination || null);
			} catch (error) {
				const errorMessage =
					error instanceof ApiError
						? error.message
						: "Failed to fetch tags";
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const fetchPopularTags = useCallback(
		async (limit: number = 10) => {
			if (!isAuthenticated) return;

			setIsLoading(true);
			setError(null);

			try {
				// ✅ apiClient.get returns ApiSuccessResponse<PopularTag[]>
				const response = await apiClient.get<PopularTag[]>(
					`/tags/popular?limit=${limit}`,
				);

				setPopularTags(response.data);
			} catch (error) {
				const errorMessage =
					error instanceof ApiError
						? error.message
						: "Failed to fetch popular tags";
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const createTag = useCallback(
		async (data: CreateTagInput): Promise<Tag | null> => {
			if (!isAuthenticated) return null;

			setIsLoading(true);
			setError(null);

			try {
				// ✅ apiClient.post returns ApiSuccessResponse<Tag>
				const response = await apiClient.post<Tag>("/tags", data);
				const newTag = response.data;
				setTags((prev) => [newTag as TagWithCount, ...prev]);
				return newTag;
			} catch (error) {
				let errorMessage = "Failed to create tag";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.ALREADY_EXISTS) {
						errorMessage = "A tag with this name already exists";
					} else {
						errorMessage = error.message;
					}
				}

				setError(errorMessage);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const updateTag = useCallback(
		async (id: string, data: UpdateTagInput): Promise<Tag | null> => {
			if (!isAuthenticated) return null;

			setIsLoading(true);
			setError(null);

			try {
				// ✅ apiClient.put returns ApiSuccessResponse<Tag>
				const response = await apiClient.put<Tag>(`/tags/${id}`, data);
				const updatedTag = response.data;
				setTags((prev) =>
					prev.map((tag) =>
						tag.id === id ? { ...tag, ...updatedTag } : tag,
					),
				);
				return updatedTag;
			} catch (error) {
				let errorMessage = "Failed to update tag";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Tag not found";
					} else if (error.code === ErrorCode.ALREADY_EXISTS) {
						errorMessage = "A tag with this name already exists";
					} else {
						errorMessage = error.message;
					}
				}

				setError(errorMessage);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const deleteTag = useCallback(
		async (id: string): Promise<boolean> => {
			if (!isAuthenticated) return false;

			setIsLoading(true);
			setError(null);

			try {
				// ✅ apiClient.delete returns ApiSuccessResponse<null>
				await apiClient.delete<null>(`/tags/${id}`);
				setTags((prev) => prev.filter((tag) => tag.id !== id));
				setPopularTags((prev) => prev.filter((tag) => tag.id !== id));
				return true;
			} catch (error) {
				let errorMessage = "Failed to delete tag";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Tag not found";
					} else if (error.code === ErrorCode.CONFLICT) {
						errorMessage =
							"Cannot delete tag that is used in transactions";
					} else {
						errorMessage = error.message;
					}
				}

				setError(errorMessage);
				return false;
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const getTagById = useCallback(
		async (id: string): Promise<Tag | null> => {
			if (!isAuthenticated) return null;

			try {
				// ✅ apiClient.get returns ApiSuccessResponse<Tag>
				const response = await apiClient.get<Tag>(`/tags/${id}`);
				return response.data;
			} catch (error) {
				let errorMessage = "Failed to fetch tag";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Tag not found";
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

	useEffect(() => {
		if (isAuthenticated) {
			fetchTags();
			fetchPopularTags();
		}
	}, [isAuthenticated, fetchTags, fetchPopularTags]);

	const value: TagsContextType = {
		tags,
		pagination,
		popularTags,
		isLoading,
		error,
		fetchTags,
		fetchPopularTags,
		createTag,
		updateTag,
		deleteTag,
		getTagById,
		clearError,
	};

	return (
		<TagsContext.Provider value={value}>{children}</TagsContext.Provider>
	);
}

// ============================================
// HOOK
// ============================================

export function useTags() {
	const context = useContext(TagsContext);
	if (context === undefined) {
		throw new Error("useTags must be used within a TagsProvider");
	}
	return context;
}
