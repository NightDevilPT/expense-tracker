// components/context/categories-context/categories-context.tsx
"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import type {
	CreateCategoryInput,
	UpdateCategoryInput,
} from "@/lib/category-service/validation";
import { apiClient, ApiError } from "@/lib/api-client";
import type { Category } from "@/lib/category-service/types";
import { useAuth } from "@/components/context/auth-context/auth-context";
import { ErrorCode, type ApiMeta } from "@/lib/response-service";

// ============================================
// TYPES
// ============================================

interface CategoriesContextType {
	categories: Category[];
	pagination: ApiMeta["pagination"] | null;
	isLoading: boolean;
	error: string | null;
	fetchCategories: (params?: {
		page?: number;
		limit?: number;
		search?: string;
		type?: "INCOME" | "EXPENSE" | "TRANSFER";
	}) => Promise<void>;
	createCategory: (data: CreateCategoryInput) => Promise<Category | null>;
	updateCategory: (
		id: string,
		data: UpdateCategoryInput,
	) => Promise<Category | null>;
	deleteCategory: (id: string) => Promise<boolean>;
	getCategoryById: (id: string) => Promise<Category | null>;
	clearError: () => void;
}

// ============================================
// CONTEXT
// ============================================

const CategoriesContext = createContext<CategoriesContextType | undefined>(
	undefined,
);

// ============================================
// PROVIDER
// ============================================

interface CategoriesProviderProps {
	children: React.ReactNode;
}

export function CategoriesProvider({ children }: CategoriesProviderProps) {
	const { isAuthenticated } = useAuth();
	const [categories, setCategories] = useState<Category[]>([]);
	const [pagination, setPagination] = useState<ApiMeta["pagination"] | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => setError(null), []);

	// components/context/categories-context/categories-context.tsx

	const fetchCategories = useCallback(
		async (
			params: {
				page?: number;
				limit?: number;
				search?: string;
				type?: "INCOME" | "EXPENSE" | "TRANSFER";
			} = {},
		) => {
			if (!isAuthenticated) return;

			setIsLoading(true);
			setError(null);

			try {
				const queryParams = new URLSearchParams();
				// ✅ Always set page and limit with defaults
				queryParams.set("page", String(params.page || 1));
				queryParams.set("limit", String(params.limit || 5));

				if (params.search) queryParams.set("search", params.search);
				if (params.type) queryParams.set("type", params.type);

				const response = await apiClient.get<Category[]>(
					`/categories?${queryParams.toString()}`,
				);

				setCategories(response.data);
				setPagination(response.meta.pagination || null);
			} catch (error) {
				const errorMessage =
					error instanceof ApiError
						? error.message
						: "Failed to fetch categories";
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const createCategory = useCallback(
		async (data: CreateCategoryInput): Promise<Category | null> => {
			if (!isAuthenticated) return null;

			setIsLoading(true);
			setError(null);

			try {
				// ✅ apiClient.post returns ApiSuccessResponse<Category>
				const response = await apiClient.post<Category>(
					"/categories",
					data,
				);
				// ✅ response.data = Category
				const newCategory = response.data;
				setCategories((prev) => [newCategory, ...prev]);
				return newCategory;
			} catch (error) {
				let errorMessage = "Failed to create category";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.ALREADY_EXISTS) {
						errorMessage = "Category with this name already exists";
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

	const updateCategory = useCallback(
		async (
			id: string,
			data: UpdateCategoryInput,
		): Promise<Category | null> => {
			if (!isAuthenticated) return null;

			setIsLoading(true);
			setError(null);

			try {
				// ✅ apiClient.put returns ApiSuccessResponse<Category>
				const response = await apiClient.put<Category>(
					`/categories/${id}`,
					data,
				);
				// ✅ response.data = Category
				const updatedCategory = response.data;
				setCategories((prev) =>
					prev.map((cat) => (cat.id === id ? updatedCategory : cat)),
				);
				return updatedCategory;
			} catch (error) {
				let errorMessage = "Failed to update category";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Category not found";
					} else if (error.code === ErrorCode.ALREADY_EXISTS) {
						errorMessage = "Category with this name already exists";
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

	const deleteCategory = useCallback(
		async (id: string): Promise<boolean> => {
			if (!isAuthenticated) return false;

			setIsLoading(true);
			setError(null);

			try {
				// ✅ apiClient.delete returns ApiSuccessResponse<null>
				await apiClient.delete<null>(`/categories/${id}`);
				setCategories((prev) => prev.filter((cat) => cat.id !== id));
				return true;
			} catch (error) {
				let errorMessage = "Failed to delete category";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Category not found";
					} else if (error.code === ErrorCode.FORBIDDEN) {
						errorMessage = "Cannot delete default categories";
					} else if (error.code === ErrorCode.CONFLICT) {
						errorMessage = error.message || "Cannot delete category with existing transactions";
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

	const getCategoryById = useCallback(
		async (id: string): Promise<Category | null> => {
			if (!isAuthenticated) return null;

			try {
				// ✅ apiClient.get returns ApiSuccessResponse<Category>
				const response = await apiClient.get<Category>(
					`/categories/${id}`,
				);
				// ✅ response.data = Category
				return response.data;
			} catch (error) {
				let errorMessage = "Failed to fetch category";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						errorMessage = "Category not found";
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
			fetchCategories();
		}
	}, [isAuthenticated, fetchCategories]);

	const value: CategoriesContextType = {
		categories,
		pagination,
		isLoading,
		error,
		fetchCategories,
		createCategory,
		updateCategory,
		deleteCategory,
		getCategoryById,
		clearError,
	};

	return (
		<CategoriesContext.Provider value={value}>
			{children}
		</CategoriesContext.Provider>
	);
}

// ============================================
// HOOK
// ============================================

export function useCategories() {
	const context = useContext(CategoriesContext);
	if (context === undefined) {
		throw new Error(
			"useCategories must be used within a CategoriesProvider",
		);
	}
	return context;
}
