# Frontend Rulebook — Next.js Client Components

**Version:** 4.0 | **Stack:** Next.js · TypeScript · Tailwind CSS · Shadcn/ui · Lucide Icons · API Client · Zod

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [File Responsibilities](#2-file-responsibilities)
3. [API Client & Response Service](#3-api-client--response-service)
4. [Context Store Creation Pattern](#4-context-store-creation-pattern)
5. [Centralized Context System](#5-centralized-context-system)
6. [Page Creation Pattern (The Orchestrator)](#6-page-creation-pattern-the-orchestrator)
7. [Shared Component Rules](#7-shared-component-rules)
8. [Form Dialog Pattern](#8-form-dialog-pattern)
9. [Loading & Error Handling](#9-loading--error-handling)
10. [Quick Reference Cheatsheet](#10-quick-reference-cheatsheet)

---

## 1. Project Structure

```
components/
├── context/                              # React Context providers — state & API calls
│   ├── auth-context/
│   │   └── auth-context.tsx              # Authentication state + operations
│   ├── categories-context/
│   │   └── categories-context.tsx        # Categories state + CRUD
│   ├── tags-context/
│   │   └── tags-context.tsx              # Tags state + CRUD
│   ├── accounts-context/
│   │   └── accounts-context.tsx          # Accounts state + CRUD
│   ├── budgets-context/
│   │   └── budgets-context.tsx           # Budgets state + CRUD
│   ├── recurring-context/
│   │   └── recurring-context.tsx         # Recurring transactions state + CRUD
│   ├── audit-logs-context/
│   │   └── audit-logs-context.tsx        # Audit logs state
│   ├── theme-context/
│   │   └── index.tsx                     # Theme & view mode preferences
│   └── index.tsx                         # ROOT PROVIDER + useAppStore + re-exports
│
├── pages/                                # Page components — orchestrators
│   └── <feature>/
│       ├── index.tsx                     # Main page (smart component, the ONLY stateful one)
│       └── _components/                  # Page-specific presentational components
│           ├── <feature>-header.tsx      # Title + create button
│           ├── <feature>-table.tsx       # Table view (uses DataTable shared)
│           ├── <feature>-cards.tsx       # Card/grid view (uses DataCard shared)
│           └── <feature>-form-dialog.tsx # Create/Edit form dialog
│
├── shared/                               # Reusable across MULTIPLE pages
│   ├── data-table/
│   │   └── data-table.tsx                # Generic table with search/sort/pagination/skeleton
│   ├── data-card/
│   │   └── data-card.tsx                 # Generic card grid with pagination/skeleton
│   ├── delete-alert-dialog/
│   │   └── index.tsx                     # Reusable delete confirmation dialog
│   ├── toggle-view/
│   │   └── index.tsx                     # Table/Grid view toggle button
│   ├── route-breadcrumb/
│   ├── theme-toggle/
│   └── confirm-dialog/
│
├── layout/                               # Layout components (global)
│   ├── header/
│   ├── footer/
│   └── sidebar/
│
└── ui/                                   # shadcn/ui components (DO NOT MODIFY)
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── input.tsx
    ├── skeleton.tsx
    ├── badge.tsx
    └── ...

lib/
├── api-client/
│   └── index.ts                          # Centralized API client with type-safe methods
├── response-service/
│   └── index.ts                          # Response types, error codes, HTTP status constants
├── logger-service/
│   └── index.ts                          # Optional: frontend logger
└── <feature>-service/                    # Shared with backend: types + validation
    ├── types.ts                          # Domain types (Category, Tag, Account, etc.)
    └── validation.ts                     # Zod schemas + input types
```

---

## 2. File Responsibilities

| Layer                        | File                                       | Responsibility                                                                              |
| ---------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| **Context**                  | `components/context/<feature>-context.tsx` | State management, API calls via `apiClient`, error handling, optimistic updates             |
| **Root Provider**            | `components/context/index.tsx`             | Composes all providers, exports `useAppStore`, re-exports all hooks                         |
| **Page**                     | `components/pages/<feature>/index.tsx`     | Orchestrator — manages search/sort/filter state, wires context to presentational components |
| **Header**                   | `_components/<feature>-header.tsx`         | Page title, description, create button                                                      |
| **Table**                    | `_components/<feature>-table.tsx`          | Defines columns, wires DataTable shared component                                           |
| **Cards**                    | `_components/<feature>-cards.tsx`          | Defines card renderer, wires DataCard shared component                                      |
| **Form Dialog**              | `_components/<feature>-form-dialog.tsx`    | Create/Edit form with Zod validation, calls context methods                                 |
| **DataTable (Shared)**       | `components/shared/data-table/`            | Generic table — handles search, sort, pagination, skeleton loading, empty state             |
| **DataCard (Shared)**        | `components/shared/data-card/`             | Generic card grid — handles pagination, skeleton loading, empty state                       |
| **DeleteAlertDialog**        | `components/shared/delete-alert-dialog/`   | Reusable delete confirmation with loading state and toast notifications                     |
| **ToggleView (Shared)**      | `components/shared/toggle-view/`           | Reusable table/grid view mode toggle button                                                 |
| **API Client**               | `lib/api-client/`                          | Type-safe HTTP client — never use raw `fetch()`                                             |
| **Response Service**         | `lib/response-service/`                    | `ErrorCode` enum, `ApiMeta` type, pagination types                                          |
| **Types (Backend Lib)**      | `lib/<feature>-service/types.ts`           | Domain types shared with backend                                                            |
| **Validation (Backend Lib)** | `lib/<feature>-service/validation.ts`      | Zod schemas + input types shared with backend                                               |

### Hard Rules

- **Skeletons are built into `DataTable` and `DataCard`** — never create page-specific skeleton components.
- **Context files must never contain UI logic** — search, sort, and filter state belong in the Page orchestrator.
- **`_components` are purely presentational** — they receive all data and callbacks as props.
- **Always use `apiClient`** — never use raw `fetch()` in any component or context.
- **Always use `DeleteAlertDialog` from shared** — never create custom delete dialogs.
- **Always use `DataTable` and `DataCard` from shared** — never build custom tables or card grids.
- **Always use `ToggleView` from shared** — never create inline view toggle buttons.
- **Always use shadcn/ui components** — never create custom UI components.
- **Always use Lucide React icons** — never use SVG or emoji icons.
- **Import order in `_components`** — shared components first, then types, then relative imports (`./component`).

---

## 3. API Client & Response Service

### 3.1 Core Rule

**NEVER use raw `fetch()` calls directly in contexts or components. ALWAYS use the `apiClient`.**

### 3.2 Import Patterns

```tsx
// API client
import { apiClient, ApiError } from "@/lib/api-client";

// Response types and error codes
import { ErrorCode, HttpStatus, type ApiMeta } from "@/lib/response-service";

// Pagination type (used in table/cards props)
import type { Pagination as PaginationType } from "@/lib/response-service";

// Shared table component
import {
	DataTable,
	type Column,
	type SortConfig,
} from "@/components/shared/data-table";

// Shared card component
import { DataCard } from "@/components/shared/data-card";

// Shared delete dialog
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog";

// Shared toggle view
import ToggleView from "@/components/shared/toggle-view";
```

### 3.3 API Client Usage

```tsx
// ✅ GET request — apiClient returns ApiSuccessResponse<T>
const response = await apiClient.get<Category[]>("/categories");
// response.data = Category[]
// response.meta = { pagination, ... }

// ✅ GET with query params (always use URLSearchParams)
const queryParams = new URLSearchParams();
queryParams.set("page", String(params.page || 1));
queryParams.set("limit", String(params.limit || 20));
if (params.search) queryParams.set("search", params.search);

const response = await apiClient.get<Category[]>(
	`/categories?${queryParams.toString()}`,
);

// ✅ POST request
const response = await apiClient.post<Category>("/categories", data);
const newCategory = response.data;

// ✅ PUT request
const response = await apiClient.put<Category>(`/categories/${id}`, data);
const updatedCategory = response.data;

// ✅ DELETE request
await apiClient.delete<null>(`/categories/${id}`);

// ✅ PATCH request
const response = await apiClient.patch<Category>(`/categories/${id}`, data);
```

### 3.4 Error Handling Pattern

```tsx
import { apiClient, ApiError } from "@/lib/api-client";
import { ErrorCode } from "@/lib/response-service";

try {
	const response = await apiClient.get<Category[]>("/categories");
	// Handle success
} catch (error) {
	if (error instanceof ApiError) {
		switch (error.code) {
			case ErrorCode.UNAUTHORIZED:
			case ErrorCode.INVALID_TOKEN:
			case ErrorCode.TOKEN_EXPIRED:
				router.push("/login");
				break;

			case ErrorCode.NOT_FOUND:
			case ErrorCode.RESOURCE_NOT_FOUND:
				toast.error("Resource not found");
				break;

			case ErrorCode.ALREADY_EXISTS:
			case ErrorCode.DUPLICATE_ENTRY:
				toast.error("This item already exists");
				break;

			case ErrorCode.FORBIDDEN:
				toast.error("You don't have permission");
				break;

			case ErrorCode.CONFLICT:
				toast.error(error.message || "Operation conflicted");
				break;

			default:
				toast.error(error.message);
		}
	} else {
		toast.error("An unexpected error occurred");
	}
}
```

### 3.5 What NOT to Do

```tsx
// ❌ NEVER use raw fetch
const response = await fetch("/api/categories");
const data = await response.json();

// ❌ NEVER use axios directly
import axios from "axios";
const { data } = await axios.get("/api/categories");

// ✅ ALWAYS use apiClient
import { apiClient } from "@/lib/api-client";
const response = await apiClient.get<Category[]>("/categories");
```

---

## 4. Context Store Creation Pattern

### 4.1 File Structure

```
components/context/<feature>-context/
└── <feature>-context.tsx    # Single file — no sub-components
```

### 4.2 Context File Template

**Every context MUST follow this exact structure. The Auth Context is the canonical template.**

```tsx
// components/context/<feature>-context/<feature>-context.tsx
"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import type {
	CreateFeatureInput,
	UpdateFeatureInput,
} from "@/lib/<feature>-service/validation";
import { apiClient, ApiError } from "@/lib/api-client";
import type { Feature } from "@/lib/<feature>-service/types";
import { useAuth } from "@/components/context/auth-context/auth-context";
import { ErrorCode, type ApiMeta } from "@/lib/response-service";

// ============================================
// TYPES
// ============================================

interface FeatureContextType {
	// State
	items: Feature[];
	pagination: ApiMeta["pagination"] | null;
	isLoading: boolean;
	error: string | null;

	// Operations
	fetchItems: (params?: {
		page?: number;
		limit?: number;
		search?: string;
		// + feature-specific filters
	}) => Promise<void>;
	createItem: (data: CreateFeatureInput) => Promise<Feature | null>;
	updateItem: (
		id: string,
		data: UpdateFeatureInput,
	) => Promise<Feature | null>;
	deleteItem: (id: string) => Promise<boolean>;
	getItemById?: (id: string) => Promise<Feature | null>;
	clearError: () => void;
}

// ============================================
// CONTEXT
// ============================================

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

interface FeatureProviderProps {
	children: React.ReactNode;
}

export function FeatureProvider({ children }: FeatureProviderProps) {
	const { isAuthenticated } = useAuth();
	const [items, setItems] = useState<Feature[]>([]);
	const [pagination, setPagination] = useState<ApiMeta["pagination"] | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => setError(null), []);

	// --- FETCH ---
	const fetchItems = useCallback(
		async (params: any = {}) => {
			if (!isAuthenticated) return;
			setIsLoading(true);
			setError(null);

			try {
				const queryParams = new URLSearchParams();
				queryParams.set("page", String(params.page || 1));
				queryParams.set("limit", String(params.limit || 20));
				if (params.search) queryParams.set("search", params.search);
				if (params.sortBy) queryParams.set("sortBy", params.sortBy);
				if (params.sortOrder)
					queryParams.set("sortOrder", params.sortOrder);

				const response = await apiClient.get<Feature[]>(
					`/<feature>?${queryParams.toString()}`,
				);
				setItems(response.data);
				setPagination(response.meta.pagination || null);
			} catch (error) {
				setError(
					error instanceof ApiError
						? error.message
						: "Failed to fetch",
				);
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	// --- CREATE ---
	const createItem = useCallback(
		async (data: CreateFeatureInput): Promise<Feature | null> => {
			if (!isAuthenticated) return null;
			setIsLoading(true);
			setError(null);

			try {
				const response = await apiClient.post<Feature>(
					"/<feature>",
					data,
				);
				const newItem = response.data;
				setItems((prev) => [newItem, ...prev]);
				return newItem;
			} catch (error) {
				let message = "Failed to create";
				if (error instanceof ApiError) {
					if (error.code === ErrorCode.ALREADY_EXISTS) {
						message = "Already exists";
					} else {
						message = error.message;
					}
				}
				setError(message);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	// --- UPDATE ---
	const updateItem = useCallback(
		async (
			id: string,
			data: UpdateFeatureInput,
		): Promise<Feature | null> => {
			if (!isAuthenticated) return null;
			setIsLoading(true);
			setError(null);

			try {
				const response = await apiClient.put<Feature>(
					`/<feature>/${id}`,
					data,
				);
				const updatedItem = response.data;
				setItems((prev) =>
					prev.map((item) => (item.id === id ? updatedItem : item)),
				);
				return updatedItem;
			} catch (error) {
				let message = "Failed to update";
				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						message = "Not found";
					} else if (error.code === ErrorCode.ALREADY_EXISTS) {
						message = "Already exists";
					} else {
						message = error.message;
					}
				}
				setError(message);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	// --- DELETE ---
	const deleteItem = useCallback(
		async (id: string): Promise<boolean> => {
			if (!isAuthenticated) return false;
			setIsLoading(true);
			setError(null);

			try {
				await apiClient.delete<null>(`/<feature>/${id}`);
				setItems((prev) => prev.filter((item) => item.id !== id));
				return true;
			} catch (error) {
				let message = "Failed to delete";
				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						message = "Not found";
					} else if (error.code === ErrorCode.CONFLICT) {
						message = "Cannot delete: item is in use";
					} else {
						message = error.message;
					}
				}
				setError(message);
				return false;
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	// --- GET BY ID (Optional) ---
	const getItemById = useCallback(
		async (id: string): Promise<Feature | null> => {
			if (!isAuthenticated) return null;

			try {
				const response = await apiClient.get<Feature>(
					`/<feature>/${id}`,
				);
				return response.data;
			} catch (error) {
				let message = "Failed to fetch item";
				if (error instanceof ApiError) {
					if (error.code === ErrorCode.NOT_FOUND) {
						message = "Not found";
					} else {
						message = error.message;
					}
				}
				setError(message);
				return null;
			}
		},
		[isAuthenticated],
	);

	// Initial fetch on auth
	useEffect(() => {
		if (isAuthenticated) {
			fetchItems();
		}
	}, [isAuthenticated, fetchItems]);

	const value: FeatureContextType = {
		items,
		pagination,
		isLoading,
		error,
		fetchItems,
		createItem,
		updateItem,
		deleteItem,
		clearError,
	};

	return (
		<FeatureContext.Provider value={value}>
			{children}
		</FeatureContext.Provider>
	);
}

// ============================================
// HOOK
// ============================================

export function useFeature() {
	const context = useContext(FeatureContext);
	if (context === undefined) {
		throw new Error("useFeature must be used within a FeatureProvider");
	}
	return context;
}
```

### 4.3 Context Checklist

| Step | Action                                | Details                                                                                               |
| ---- | ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1    | Read backend lib files                | `lib/<feature>-service/types.ts`, `validation.ts`, `index.ts`                                         |
| 2    | Copy Auth/Categories Context          | Use as exact structural template                                                                      |
| 3    | Replace types                         | Feature types from `types.ts`, Create/Update inputs from `validation.ts`                              |
| 4    | Map operations                        | `fetchItems`, `createItem`, `updateItem`, `deleteItem`, `getItemById` (optional)                      |
| 5    | Handle specific ErrorCodes            | Per operation, add granular error messages for `ALREADY_EXISTS`, `NOT_FOUND`, `CONFLICT`, `FORBIDDEN` |
| 6    | Add to `components/context/index.tsx` | AppProviders composition + useAppStore + re-export hook                                               |

---

## 5. Centralized Context System

### 5.1 Root Provider File (`components/context/index.tsx`)

**EVERY new context MUST be added to the Root Provider AND `useAppStore`.**

```tsx
// components/context/index.tsx
"use client";

import React from "react";
import { AuthProvider } from "./auth-context/auth-context";
import { CategoriesProvider } from "./categories-context/categories-context";
import { TagsProvider } from "./tags-context/tags-context";
import { AccountsProvider } from "./accounts-context/accounts-context";
import { BudgetsProvider } from "./budgets-context/budgets-context";
import { RecurringProvider } from "./recurring-context/recurring-context";
import { AuditLogsProvider } from "./audit-logs-context/audit-logs-context";
import { ThemeContextProvider } from "./theme-context";
import { NewFeatureProvider } from "./new-feature-context/new-feature-context";

// ============================================
// CENTRALIZED PROVIDER COMPOSITION
// ============================================

interface AppProvidersProps {
	children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
	return (
		<AuthProvider>
			<CategoriesProvider>
				<TagsProvider>
					<AccountsProvider>
						<BudgetsProvider>
							<RecurringProvider>
								<NewFeatureProvider>
									<AuditLogsProvider>
										<ThemeContextProvider>
											{children}
										</ThemeContextProvider>
									</AuditLogsProvider>
								</NewFeatureProvider>
							</RecurringProvider>
						</BudgetsProvider>
					</AccountsProvider>
				</TagsProvider>
			</CategoriesProvider>
		</AuthProvider>
	);
}

// ============================================
// CENTRALIZED STORE HOOK
// ============================================

export function useAppStore() {
	const auth = require("./auth-context/auth-context").useAuth();
	const categories =
		require("./categories-context/categories-context").useCategories();
	const tags = require("./tags-context/tags-context").useTags();
	const accounts =
		require("./accounts-context/accounts-context").useAccounts();
	const budgets = require("./budgets-context/budgets-context").useBudgets();
	const recurring =
		require("./recurring-context/recurring-context").useRecurring();
	const auditLogs =
		require("./audit-logs-context/audit-logs-context").useAuditLogs();
	const newFeature =
		require("./new-feature-context/new-feature-context").useNewFeature();

	return {
		auth,
		categories,
		tags,
		accounts,
		budgets,
		recurring,
		newFeature,
		auditLogs,
	};
}

// ============================================
// RE-EXPORT ALL HOOKS
// ============================================

export { useAuth } from "./auth-context/auth-context";
export { useCategories } from "./categories-context/categories-context";
export { useTags } from "./tags-context/tags-context";
export { useAccounts } from "./accounts-context/accounts-context";
export { useBudgets } from "./budgets-context/budgets-context";
export { useRecurring } from "./recurring-context/recurring-context";
export { useNewFeature } from "./new-feature-context/new-feature-context";
export { useAuditLogs } from "./audit-logs-context/audit-logs-context";
```

### 5.2 Provider Dependency Order

The order of providers matters. Follow this dependency hierarchy:

```
AuthProvider (Required by all — MUST be first)
    ↓
CategoriesProvider (Independent)
    ↓
TagsProvider (Independent)
    ↓
AccountsProvider (Independent)
    ↓
BudgetsProvider (May depend on Categories)
    ↓
RecurringProvider (May depend on Categories, Accounts)
    ↓
<NewFeatureProvider> (Insert new providers here)
    ↓
AuditLogsProvider (Tracks all — place near end)
    ↓
ThemeContextProvider (UI only — MUST be last)
    ↓
{children}
```

### 5.3 Adding New Context Checklist (3 Steps)

| Step | Action                                     | File to Update                 |
| ---- | ------------------------------------------ | ------------------------------ |
| 1    | Import Provider and nest in `AppProviders` | `components/context/index.tsx` |
| 2    | Add hook to `useAppStore` return object    | `components/context/index.tsx` |
| 3    | Re-export hook at bottom of file           | `components/context/index.tsx` |

### 5.4 Usage in App Layout

```tsx
// app/layout.tsx
import { AppProviders } from "@/components/context";

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body>
				<AppProviders>{children}</AppProviders>
			</body>
		</html>
	);
}
```

### 5.5 Usage in Components (3 Options)

**Option A: Import individual hooks from index (Recommended)**

```tsx
import { useCategories, useTags } from "@/components/context";

export function CategoriesPage() {
	const { categories, isLoading } = useCategories();
	const { popularTags } = useTags();
}
```

**Option B: Use centralized store (Redux-like)**

```tsx
import { useAppStore } from "@/components/context";

export function DashboardPage() {
	const { auth, accounts, budgets } = useAppStore();
}
```

**Option C: Direct import from context file**

```tsx
import { useRecurring } from "@/components/context/recurring-context/recurring-context";

export function RecurringPage() {
	const { recurringTransactions } = useRecurring();
}
```

---

## 6. Page Creation Pattern (The Orchestrator)

### 6.1 File Structure

```
components/pages/<feature>/
├── index.tsx                          # Main page — the ONLY smart component
└── _components/
    ├── <feature>-header.tsx           # Title + create button
    ├── <feature>-table.tsx            # Table view (uses DataTable)
    ├── <feature>-cards.tsx            # Card/grid view (uses DataCard)
    └── <feature>-form-dialog.tsx      # Create/Edit form dialog
```

**Import order convention for `_components`:**

```tsx
// 1. Shared components and UI (from @/components/shared or @/components/ui)
import { DataCard } from "@/components/shared/data-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// 2. Types (from @/lib)
import type { Feature } from "@/lib/feature-service/types";

// 3. Page-specific components (relative imports LAST)
import { FeatureFormDialog } from "./feature-form-dialog";
```

### 6.2 Main Page (`index.tsx`) — The Orchestrator

This is the **ONLY smart component** in the page. All `_components` are presentational.

**Responsibilities:**

- Manages search, sort, and filter state (NOT in context)
- Debounces search input (300ms)
- Handles view mode toggle via `ToggleView` shared component
- Wires context data and callbacks to presentational components
- Shows error toasts
- Passes `isLoading` directly to DataTable/DataCard (they handle skeleton logic)

```tsx
// components/pages/<feature>/index.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { FeatureTable } from "./_components/<feature>-table";
import { FeatureCards } from "./_components/<feature>-cards";
import { FeatureHeader } from "./_components/<feature>-header";
import { useTheme, IViewMode } from "@/components/context/theme-context";
import { useFeature } from "@/components/context/<feature>-context/<feature>-context";
import type { SortConfig } from "@/components/shared/data-table";
import ToggleView from "@/components/shared/toggle-view";

export function FeaturePage() {
	const {
		items,
		pagination,
		isLoading,
		error,
		fetchItems,
		deleteItem,
		clearError,
	} = useFeature();

	const { viewMode, setViewMode } = useTheme();
	const [isFirstLoad, setIsFirstLoad] = useState(true);

	// Search & Sort state — managed HERE, not in context
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<SortConfig | null>(null);
	const debounceRef = useRef<NodeJS.Timeout | null>(null);

	// Initial fetch
	useEffect(() => {
		fetchItems({ page: 1, limit: 20 }).finally(() => setIsFirstLoad(false));
	}, []);

	// Toast errors
	useEffect(() => {
		if (error) {
			toast.error(error);
			clearError();
		}
	}, [error, clearError]);

	// Debounced search (300ms)
	const handleSearchChange = useCallback(
		(value: string) => {
			setSearch(value);
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => {
				fetchItems({
					page: 1,
					limit: pagination?.limit || 20,
					search: value || undefined,
				});
			}, 300);
		},
		[fetchItems, pagination?.limit],
	);

	// Sort change
	const handleSortChange = useCallback(
		(newSort: SortConfig) => {
			setSort(newSort);
			fetchItems({
				page: 1,
				limit: pagination?.limit || 20,
				search: search || undefined,
				sortBy: newSort.key as "name" | "createdAt" | "updatedAt", // Type assertion for your sortable fields
				sortOrder: newSort.direction,
			});
		},
		[fetchItems, pagination?.limit, search],
	);

	// Page change
	const handlePageChange = useCallback(
		(page: number) => {
			fetchItems({
				page,
				limit: pagination?.limit || 20,
				search: search || undefined,
				sortBy: sort?.key as "name" | "createdAt" | "updatedAt",
				sortOrder: sort?.direction,
			});
		},
		[fetchItems, pagination?.limit, search, sort],
	);

	// Limit change
	const handleLimitChange = useCallback(
		(limit: number) => {
			fetchItems({
				page: 1,
				limit,
				search: search || undefined,
				sortBy: sort?.key as "name" | "createdAt" | "updatedAt",
				sortOrder: sort?.direction,
			});
		},
		[fetchItems, search, sort],
	);

	// Cleanup debounce on unmount
	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

	// Common props passed to BOTH table and cards
	const commonProps = {
		items,
		pagination: pagination ?? null,
		isLoading, // Pass directly - DataTable/DataCard handle skeleton logic
		onDelete: deleteItem,
		searchValue: search,
		onSearchChange: handleSearchChange,
		sortConfig: sort,
		onSortChange: handleSortChange,
		onPageChange: handlePageChange,
		onLimitChange: handleLimitChange,
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<FeatureHeader />
				<ToggleView /> {/* Use shared ToggleView component */}
			</div>

			<div className="px-1">
				{viewMode === IViewMode.TABLE ? (
					<FeatureTable {...commonProps} />
				) : (
					<FeatureCards {...commonProps} />
				)}
			</div>
		</div>
	);
}
```

### 6.3 Header Component (`_components/<feature>-header.tsx`)

```tsx
// components/pages/<feature>/_components/<feature>-header.tsx

import { FeatureFormDialog } from "./<feature>-form-dialog";

export function FeatureHeader() {
	return (
		<div className="flex items-center justify-between flex-1">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Features</h1>
				<p className="text-muted-foreground">Manage your features</p>
			</div>
			<FeatureFormDialog />
		</div>
	);
}
```

### 6.4 Table Component (`_components/<feature>-table.tsx`)

**Key rules:**

- Import `DataTable`, `Column`, and `SortConfig` from `@/components/shared/data-table`
- Import `Pagination as PaginationType` from `@/lib/response-service`
- Define `columns` array with proper types
- Include sortable columns where applicable
- Import page-specific components LAST (relative imports)
- Pass all pagination/loading/search/sort props through to `DataTable`

```tsx
// components/pages/<feature>/_components/<feature>-table.tsx
"use client";

import {
	DataTable,
	type Column,
	type SortConfig,
} from "@/components/shared/data-table";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog";
import type { Feature } from "@/lib/<feature>-service/types";
import type { Pagination as PaginationType } from "@/lib/response-service";
import { FeatureFormDialog } from "./<feature>-form-dialog"; // Relative import LAST

interface FeatureTableProps {
	items: Feature[];
	pagination?: PaginationType | null;
	isLoading?: boolean;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onDelete: (id: string) => Promise<boolean>;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	sortConfig?: SortConfig | null;
	onSortChange?: (sort: SortConfig) => void;
}

export function FeatureTable({
	items,
	pagination,
	isLoading,
	onPageChange,
	onLimitChange,
	onDelete,
	searchValue = "",
	onSearchChange,
	sortConfig,
	onSortChange,
}: FeatureTableProps) {
	const columns: Column<Feature>[] = [
		{
			key: "index",
			header: "#",
			cell: (_, index) => (
				<span className="text-xs text-muted-foreground tabular-nums">
					{((pagination?.page || 1) - 1) * (pagination?.limit || 20) +
						index +
						1}
				</span>
			),
			className: "w-12",
		},
		{
			key: "name",
			header: "Name",
			sortable: true,
			cell: (item) => <span className="font-medium">{item.name}</span>,
		},
		{
			key: "createdAt",
			header: "Created",
			sortable: true,
			cell: (item) => (
				<div className="text-sm text-muted-foreground">
					{item.createdAt
						? new Date(item.createdAt).toLocaleDateString()
						: "—"}
				</div>
			),
			className: "w-32",
			hideOnMobile: true,
		},
		{
			key: "actions",
			header: "",
			cell: (item) => (
				<div className="flex items-center justify-end gap-1">
					<FeatureFormDialog
						mode="edit"
						item={item}
						trigger={
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
							>
								<Edit className="h-3.5 w-3.5" />
							</Button>
						}
						onSuccess={() => {
							onSearchChange?.(searchValue);
						}}
					/>
					<DeleteAlertDialog
						title="Delete Feature"
						itemName={item.name}
						itemType="feature"
						onDelete={() => onDelete(item.id)}
						trigger={
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
							>
								<Trash2 className="h-3.5 w-3.5 text-destructive" />
							</Button>
						}
					/>
				</div>
			),
			className: "w-24 text-right",
		},
	];

	return (
		<DataTable
			data={items}
			columns={columns}
			pagination={pagination}
			isLoading={isLoading}
			onPageChange={onPageChange}
			onLimitChange={onLimitChange}
			emptyMessage="No items found"
			emptyDescription="Create your first item to get started."
			searchPlaceholder="Search..."
			searchValue={searchValue}
			onSearchChange={onSearchChange}
			sortConfig={sortConfig}
			onSortChange={onSortChange}
		/>
	);
}
```

### 6.5 Cards Component (`_components/<feature>-cards.tsx`)

```tsx
// components/pages/<feature>/_components/<feature>-cards.tsx
"use client";

import { DataCard } from "@/components/shared/data-card";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Feature } from "@/lib/<feature>-service/types";
import type { Pagination as PaginationType } from "@/lib/response-service";
import { FeatureFormDialog } from "./<feature>-form-dialog"; // Relative import LAST

interface FeatureCardsProps {
	items: Feature[];
	pagination?: PaginationType | null;
	isLoading?: boolean;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onDelete: (id: string) => Promise<boolean>;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
}

export function FeatureCards({
	items,
	pagination,
	isLoading,
	onPageChange,
	onLimitChange,
	onDelete,
	searchValue = "",
	onSearchChange,
}: FeatureCardsProps) {
	return (
		<DataCard
			data={items}
			pagination={pagination}
			isLoading={isLoading}
			onPageChange={onPageChange}
			onLimitChange={onLimitChange}
			emptyMessage="No items found"
			emptyDescription="Create your first item to get started."
			gridClassName="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
			renderCard={(item) => (
				<Card className="group hover:shadow-md transition-shadow">
					<CardContent className="p-4">
						<div className="flex items-start justify-between">
							<h3 className="font-medium">{item.name}</h3>
							<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
								<FeatureFormDialog
									mode="edit"
									item={item}
									trigger={
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8"
										>
											<Edit className="h-3.5 w-3.5" />
										</Button>
									}
									onSuccess={() => {
										onSearchChange?.(searchValue);
									}}
								/>
								<DeleteAlertDialog
									title="Delete Feature"
									itemName={item.name}
									itemType="feature"
									onDelete={() => onDelete(item.id)}
									trigger={
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8"
										>
											<Trash2 className="h-3.5 w-3.5 text-destructive" />
										</Button>
									}
								/>
							</div>
						</div>
						{item.createdAt && (
							<p className="text-xs text-muted-foreground mt-2">
								Created{" "}
								{new Date(item.createdAt).toLocaleDateString()}
							</p>
						)}
					</CardContent>
				</Card>
			)}
		/>
	);
}
```

---

## 7. Shared Component Rules

### 7.1 `DataTable<T>` — For Table View

**Import:**

```tsx
import {
	DataTable,
	type Column,
	type SortConfig,
} from "@/components/shared/data-table";
import type { Pagination as PaginationType } from "@/lib/response-service";
```

| Prop                | Type                         | Required | Description                                       |
| ------------------- | ---------------------------- | -------- | ------------------------------------------------- |
| `data`              | `T[]`                        | Yes      | Array of items (must have `id: string`)           |
| `columns`           | `Column<T>[]`                | Yes      | Column definitions                                |
| `pagination`        | `PaginationType \| null`     | No       | Pagination metadata from API                      |
| `isLoading`         | `boolean`                    | No       | Show skeleton when `true` AND `data.length === 0` |
| `searchValue`       | `string`                     | No       | Controlled search input value                     |
| `onSearchChange`    | `(value: string) => void`    | No       | Called on search input change                     |
| `sortConfig`        | `SortConfig \| null`         | No       | Current sort state `{ key, direction }`           |
| `onSortChange`      | `(sort: SortConfig) => void` | No       | Called on column header click                     |
| `onPageChange`      | `(page: number) => void`     | No       | Page change handler                               |
| `onLimitChange`     | `(limit: number) => void`    | No       | Page size change handler                          |
| `emptyMessage`      | `string`                     | No       | Message when no data (default: "No data found")   |
| `emptyDescription`  | `string`                     | No       | Description when no data                          |
| `searchPlaceholder` | `string`                     | No       | Search input placeholder (default: "Search...")   |
| `filterSlot`        | `ReactNode`                  | No       | Extra filter UI placed next to search             |
| `showPagination`    | `boolean`                    | No       | Hide pagination (default: `true`)                 |
| `pageSizeOptions`   | `number[]`                   | No       | Limit options (default: `[5, 10, 20, 50, 100]`)   |

**Column Definition:**

```tsx
interface Column<T> {
	key: string;
	header: string;
	cell: (item: T, index: number) => React.ReactNode;
	className?: string;
	headerClassName?: string;
	hideOnMobile?: boolean;
	sortable?: boolean;
}
```

**SortConfig Type:**

```tsx
interface SortConfig {
	key: string;
	direction: "asc" | "desc";
}
```

### 7.2 `DataCard<T>` — For Grid/Card View

**Import:**

```tsx
import { DataCard } from "@/components/shared/data-card";
import type { Pagination as PaginationType } from "@/lib/response-service";
```

| Prop               | Type                                    | Required | Description                                                                                |
| ------------------ | --------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `data`             | `T[]`                                   | Yes      | Array of items                                                                             |
| `renderCard`       | `(item: T, index: number) => ReactNode` | Yes      | Render function for each card                                                              |
| `pagination`       | `PaginationType \| null`                | No       | Pagination metadata                                                                        |
| `isLoading`        | `boolean`                               | No       | Show skeleton cards when `true` AND `data.length === 0`                                    |
| `onPageChange`     | `(page: number) => void`                | No       | Page change handler                                                                        |
| `onLimitChange`    | `(limit: number) => void`               | No       | Page size change handler                                                                   |
| `gridClassName`    | `string`                                | No       | Tailwind grid classes (default: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`) |
| `skeletonCount`    | `number`                                | No       | Number of skeleton cards (default: `6`)                                                    |
| `emptyMessage`     | `string`                                | No       | Message when no data                                                                       |
| `emptyDescription` | `string`                                | No       | Description when no data                                                                   |
| `showPagination`   | `boolean`                               | No       | Hide pagination (default: `true`)                                                          |
| `pageSizeOptions`  | `number[]`                              | No       | Limit options (default: `[5, 10, 20, 50, 100]`)                                            |

### 7.3 `DeleteAlertDialog` — For Delete Confirmation

**Import:**

```tsx
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog";
```

| Prop          | Type                     | Required | Description                                                 |
| ------------- | ------------------------ | -------- | ----------------------------------------------------------- |
| `onDelete`    | `() => Promise<boolean>` | Yes      | Delete handler — return `true` on success                   |
| `title`       | `string`                 | No       | Dialog title (default: "Delete Item")                       |
| `itemName`    | `string`                 | No       | Name of item being deleted (shown in description)           |
| `itemType`    | `string`                 | No       | Type label (default: "item")                                |
| `description` | `string`                 | No       | Optional additional description (e.g., warning about usage) |
| `onSuccess`   | `() => void`             | No       | Called after successful delete                              |
| `trigger`     | `ReactNode`              | No       | Custom trigger element (default: ghost icon button)         |
| `isLoading`   | `boolean`                | No       | External loading state                                      |

### 7.4 `ToggleView` — For Table/Grid View Toggle

**Import:**

```tsx
import ToggleView from "@/components/shared/toggle-view";
```

This component is fully self-contained. It:

- Uses `useTheme()` hook to get/set `viewMode`
- Renders List and LayoutGrid icons as buttons
- No props required — just import and use

```tsx
// components/shared/toggle-view/index.tsx
import { IViewMode, useTheme } from "@/components/context/theme-context";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ToggleView() {
	const { viewMode, setViewMode } = useTheme();

	return (
		<div className="flex items-center gap-1 border rounded-md p-1">
			<Button
				variant={viewMode === IViewMode.TABLE ? "secondary" : "ghost"}
				size="icon"
				className="h-8 w-8"
				onClick={() => setViewMode(IViewMode.TABLE)}
			>
				<List className="h-4 w-4" />
			</Button>
			<Button
				variant={viewMode === IViewMode.GRID ? "secondary" : "ghost"}
				size="icon"
				className="h-8 w-8"
				onClick={() => setViewMode(IViewMode.GRID)}
			>
				<LayoutGrid className="h-4 w-4" />
			</Button>
		</div>
	);
}
```

---

## 8. Form Dialog Pattern

### 8.1 Core Rules

- Use shadcn/ui `Dialog` components
- Zod validation from `lib/<feature>-service/validation.ts`
- Dual mode: `"create" | "edit"` via `mode` prop
- Accept optional `trigger` prop for custom trigger buttons
- Call context methods (`createItem`, `updateItem`)
- Show `toast.success` on success
- Call `onSuccess?.()` callback after success
- Use `FieldGroup`, `Field`, `FieldLabel`, `FieldError` from shadcn/ui
- Default trigger: `New Item` button for create, no default trigger for edit (must provide custom trigger)

### 8.2 Template

```tsx
// components/pages/<feature>/_components/<feature>-form-dialog.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useFeature } from "@/components/context/<feature>-context/<feature>-context";
import { createSchema, updateSchema } from "@/lib/<feature>-service/validation";
import type {
	CreateInput,
	UpdateInput,
} from "@/lib/<feature>-service/validation";
import type { Feature } from "@/lib/<feature>-service/types";
import { ZodError } from "zod";

type FormData = CreateInput;

interface FormErrors {
	name?: string;
	// ...other fields
}

interface FeatureFormDialogProps {
	mode?: "create" | "edit";
	item?: Feature | null;
	trigger?: React.ReactNode;
	onSuccess?: () => void;
}

export function FeatureFormDialog({
	mode = "create",
	item = null,
	trigger,
	onSuccess,
}: FeatureFormDialogProps) {
	const [open, setOpen] = React.useState(false);
	const { createItem, updateItem, isLoading } = useFeature();
	const isEditMode = mode === "edit" && item;

	const [formData, setFormData] = React.useState<FormData>({ name: "" });
	const [errors, setErrors] = React.useState<FormErrors>({});

	// Populate form when editing
	React.useEffect(() => {
		if (isEditMode && item) {
			setFormData({ name: item.name /* map all fields */ });
		}
	}, [isEditMode, item]);

	// Reset form when dialog closes (create mode only)
	React.useEffect(() => {
		if (!open && !isEditMode) {
			setFormData({ name: "" /* defaults */ });
			setErrors({});
		}
	}, [open, isEditMode]);

	function handleChange(field: keyof FormData, value: string) {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field as keyof FormErrors]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	}

	function validateForm(): boolean {
		try {
			if (isEditMode) {
				// For edit, only validate fields that changed
				const updateData: Partial<FormData> = {};
				if (formData.name !== item?.name)
					updateData.name = formData.name;
				// Add other fields as needed

				if (Object.keys(updateData).length === 0) {
					return true; // No changes
				}
				updateSchema.parse(updateData);
			} else {
				createSchema.parse(formData);
			}
			setErrors({});
			return true;
		} catch (error) {
			if (error instanceof ZodError) {
				const fieldErrors: FormErrors = {};
				for (const issue of error.issues) {
					const field = issue.path[0] as keyof FormErrors;
					if (field && !fieldErrors[field]) {
						fieldErrors[field] = issue.message;
					}
				}
				setErrors(fieldErrors);
			}
			return false;
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!validateForm()) return;

		let result: Feature | null = null;

		if (isEditMode && item) {
			// Only send fields that changed
			const updateData: UpdateInput = {};
			if (formData.name !== item.name) updateData.name = formData.name;
			// Add other fields as needed

			if (Object.keys(updateData).length === 0) {
				toast.info("No changes to save");
				setOpen(false);
				return;
			}

			result = await updateItem(item.id, updateData);
		} else {
			result = await createItem(formData);
		}

		if (result) {
			toast.success(
				isEditMode ? "Updated successfully" : "Created successfully",
			);
			setOpen(false);
			onSuccess?.();
		}
	}

	const defaultTrigger = isEditMode ? null : (
		<Button>
			<Plus className="h-4 w-4 mr-2" />
			New Item
		</Button>
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{isEditMode ? "Edit" : "Create"}</DialogTitle>
					<DialogDescription>
						{isEditMode ? "Update the details." : "Add a new item."}
					</DialogDescription>
				</DialogHeader>
				<form id="feature-form" onSubmit={handleSubmit}>
					<FieldGroup>
						<Field data-invalid={!!errors.name}>
							<FieldLabel htmlFor="name">
								Name <span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									handleChange("name", e.target.value)
								}
								placeholder="Enter name"
								autoFocus
							/>
							<FieldDescription>
								Descriptive name.
							</FieldDescription>
							{errors.name && (
								<FieldError
									errors={[{ message: errors.name }]}
								/>
							)}
						</Field>
					</FieldGroup>
				</form>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => setOpen(false)}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						form="feature-form"
						disabled={isLoading}
					>
						{isLoading && (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						)}
						{isEditMode ? "Save Changes" : "Create"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
```

### 8.3 Complex Field Example: Color Picker

For features that need color selection (like Tags), here's the pattern:

```tsx
// Color picker field with predefined colors
const PREDEFINED_COLORS = [
	"#FF5733",
	"#33FF57",
	"#3357FF",
	"#F333FF",
	"#FFD733",
	"#FF33A8",
	"#33FFF5",
	"#FF8C33",
	"#8C33FF",
	"#33FF8C",
];

<Field data-invalid={!!errors.color}>
	<FieldLabel htmlFor="color">Color</FieldLabel>
	<div className="space-y-3">
		<div className="flex items-center gap-2">
			<Input
				id="color"
				type="color"
				value={formData.color}
				onChange={(e) => handleChange("color", e.target.value)}
				className="w-12 h-10 p-1"
			/>
			<Input
				value={formData.color || ""}
				onChange={(e) => handleChange("color", e.target.value)}
				placeholder="#FF5733"
				className="flex-1"
			/>
		</div>
		<div className="flex flex-wrap gap-2">
			{PREDEFINED_COLORS.map((color) => (
				<button
					key={color}
					type="button"
					className={`w-6 h-6 rounded-full border-2 transition-all ${
						formData.color === color
							? "border-primary scale-110"
							: "border-transparent hover:scale-105"
					}`}
					style={{ backgroundColor: color }}
					onClick={() => handleChange("color", color)}
				/>
			))}
		</div>
	</div>
	<FieldDescription>Choose a color for visual recognition.</FieldDescription>
	{errors.color && <FieldError errors={[{ message: errors.color }]} />}
</Field>;
```

---

## 9. Loading & Error Handling

### 9.1 Loading States

| Scenario               | Behavior                        | Implementation                                                               |
| ---------------------- | ------------------------------- | ---------------------------------------------------------------------------- |
| **First page load**    | Show skeletons                  | `isLoading` passed directly to DataTable/DataCard                            |
| **Subsequent fetches** | No skeleton, data stays visible | DataTable/DataCard only show skeletons when `isLoading && data.length === 0` |
| **Form submit**        | Spinner on submit button        | `disabled={isLoading}` + `Loader2` icon                                      |
| **Delete operation**   | Spinner in dialog               | `DeleteAlertDialog` handles this internally                                  |

### 9.2 Error Handling Flow

```
Context: Sets error state with specific messages per ErrorCode
    ↓
Page (index.tsx): useEffect watches error → toast.error(error) → clearError()
    ↓
Form Dialogs: Context methods return null on failure → dialog stays open
```

### 9.3 Toast Notifications

```tsx
import { toast } from "sonner";

// In Page — error toasts
useEffect(() => {
	if (error) {
		toast.error(error);
		clearError();
	}
}, [error, clearError]);

// In Form Dialog — success toasts
if (result) {
	toast.success(isEditMode ? "Updated successfully" : "Created successfully");
}

// DeleteAlertDialog handles its own success/error toasts internally
```

### 9.4 Skeleton Rules

- **Skeletons are built into `DataTable` and `DataCard`** — never create page-specific skeleton components
- `DataTable` skeletons: Renders `<Skeleton>` components inside table cells (default: 5 rows)
- `DataCard` skeletons: Renders `SkeletonCard` components in grid (default: 6 cards)
- Skeletons only show when `isLoading === true` AND `data.length === 0`

---

## 10. Quick Reference Cheatsheet

### 10.1 New Feature Development Checklist

**Step 1: Create Context**

- [ ] Read backend lib: `lib/<feature>-service/types.ts`, `validation.ts`, `index.ts`
- [ ] Create folder: `components/context/<feature>-context/`
- [ ] Create file: `<feature>-context.tsx` (copy Categories/Tags Context)
- [ ] Replace types, operations, and error handling
- [ ] Add Provider to `components/context/index.tsx` (AppProviders)
- [ ] Add hook to `useAppStore` in `components/context/index.tsx`
- [ ] Re-export hook from `components/context/index.tsx`

**Step 2: Create Page**

- [ ] Create folder: `components/pages/<feature>/`
- [ ] Create `index.tsx` (page orchestrator)
- [ ] Create `_components/<feature>-header.tsx`
- [ ] Create `_components/<feature>-table.tsx` (use `DataTable`)
- [ ] Create `_components/<feature>-cards.tsx` (use `DataCard`)
- [ ] Create `_components/<feature>-form-dialog.tsx` (create/edit)

**Step 3: Wire Everything**

- [ ] Page uses context hook for data and operations
- [ ] Page manages search/sort/filter state
- [ ] Page uses `ToggleView` for view mode switching
- [ ] Table and Cards receive data and callbacks as props
- [ ] Form Dialog calls context `createItem`/`updateItem`
- [ ] Delete uses `DeleteAlertDialog` shared component
- [ ] Import order follows convention (shared → types → relative)

### 10.2 Import Quick Reference

```tsx
// Context
import { useFeature } from "@/components/context/<feature>-context/<feature>-context";
// or
import { useFeature } from "@/components/context";

// API Client
import { apiClient, ApiError } from "@/lib/api-client";
import { ErrorCode, type ApiMeta } from "@/lib/response-service";

// Pagination Type
import type { Pagination as PaginationType } from "@/lib/response-service";

// Shared Components
import {
	DataTable,
	type Column,
	type SortConfig,
} from "@/components/shared/data-table";
import { DataCard } from "@/components/shared/data-card";
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog";
import ToggleView from "@/components/shared/toggle-view";

// Backend Types & Validation
import type { Feature } from "@/lib/<feature>-service/types";
import type {
	CreateInput,
	UpdateInput,
} from "@/lib/<feature>-service/validation";
import { createSchema, updateSchema } from "@/lib/<feature>-service/validation";

// Icons
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";

// Shadcn/ui
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
```

### 10.3 Architecture Summary

| Layer            | File                            | Responsibility                                                |
| ---------------- | ------------------------------- | ------------------------------------------------------------- |
| **Context**      | `context/<feature>-context.tsx` | State, API calls, optimistic updates, error state             |
| **Page**         | `pages/<feature>/index.tsx`     | Orchestration — search/sort/filter state, wiring              |
| **\_components** | `_components/*.tsx`             | Presentational — receive all data and callbacks as props      |
| **Shared**       | `shared/*`                      | Reusable — DataTable, DataCard, DeleteAlertDialog, ToggleView |

### 10.4 Always / Never Summary

| ✅ Always                                                 | ❌ Never                                   |
| --------------------------------------------------------- | ------------------------------------------ |
| Use Categories/Tags Context as template for every context | Invent new context patterns                |
| Add every context to `index.tsx` (3 places)               | Skip any of the 3 registration steps       |
| Use `apiClient` for ALL API calls                         | Use raw `fetch()` or `axios`               |
| Import `DataTable` and `DataCard` from shared             | Build custom tables or card grids          |
| Use `DeleteAlertDialog` from shared                       | Create custom delete dialogs               |
| Use `ToggleView` from shared                              | Create inline view toggle buttons          |
| Use shadcn/ui components for all UI                       | Create custom UI components                |
| Use Lucide React icons                                    | Use SVG or emoji icons                     |
| Manage search/sort state in Page, not Context             | Put UI state in Context                    |
| Pass `isLoading` directly to DataTable/DataCard           | Create `isFirstLoad` unless needed         |
| Use `debounceRef` (300ms) for search                      | Call API on every keystroke                |
| Show `toast.success` in form dialogs on success           | Forget user feedback                       |
| Call `onSuccess?.()` after successful mutations           | Leave callbacks uncalled                   |
| Import types from backend lib files                       | Guess or invent types                      |
| Move to `shared/` when reused by 2+ pages                 | Keep reusable components in `_components/` |
| Return `null` from context on failure                     | Throw unhandled errors from context        |
| Import page-specific components LAST (relative paths)     | Mix import orders arbitrarily              |

---

**Version 4.0** — Updated with Tags implementation patterns, ToggleView component, import order conventions, and simplified loading state handling.
