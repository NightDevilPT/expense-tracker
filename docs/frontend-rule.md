# Frontend Rulebook — Next.js Client Components

**Version:** 5.0 | **Stack:** Next.js · TypeScript · Tailwind CSS · Shadcn/ui · Lucide Icons · API Client · Zod

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [File Responsibilities](#2-file-responsibilities)
3. [API Client & Response Service](#3-api-client--response-service)
4. [Context Store Creation Pattern](#4-context-store-creation-pattern)
5. [Centralized Context System](#5-centralized-context-system)
6. [Page Creation Patterns](#6-page-creation-patterns)
    - [6.1 Dual-View Page (Table + Cards)](#61-dual-view-page-table--cards)
    - [6.2 Table-Only Page](#62-table-only-page)
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
│   ├── audit-logs-context/
│   │   └── audit-logs-context.tsx        # Audit logs state (read-only + export)
│   ├── theme-context/
│   │   └── index.tsx                     # Theme & view mode preferences
│   └── index.tsx                         # ROOT PROVIDER + useAppStore + re-exports
│
├── pages/                                # Page components — orchestrators
│   ├── <feature-dual>/                   # Dual-view feature (e.g., accounts, categories)
│   │   ├── index.tsx                     # Main page (the ONLY stateful one)
│   │   └── _components/
│   │       ├── <feature>-header.tsx      # Title + create button
│   │       ├── <feature>-table.tsx       # Table view (uses DataTable)
│   │       ├── <feature>-cards.tsx       # Card/grid view (uses DataCard)
│   │       └── <feature>-form-dialog.tsx # Create/Edit form dialog
│   │
│   └── <feature-table-only>/             # Table-only feature (e.g., audit-logs)
│       ├── index.tsx                     # Main page orchestrator
│       └── _components/
│           ├── <feature>-header.tsx      # Title + export button (optional)
│           ├── <feature>-table.tsx       # Table view with filters (uses DataTable)
│           └── <feature>-detail-dialog.tsx # Detail modal (optional, read-only)
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
| **Page (Dual-View)**         | `components/pages/<feature>/index.tsx`     | Orchestrator — manages search/sort/filter state, wires context to table & cards             |
| **Page (Table-Only)**        | `components/pages/<feature>/index.tsx`     | Orchestrator — manages filter/sort state, wires context to table only                       |
| **Header (Dual-View)**       | `_components/<feature>-header.tsx`         | Page title, description, create button                                                      |
| **Header (Table-Only)**      | `_components/<feature>-header.tsx`         | Page title, description, export button + format selector (optional)                         |
| **Table**                    | `_components/<feature>-table.tsx`          | Defines columns, wires DataTable shared component                                           |
| **Cards**                    | `_components/<feature>-cards.tsx`          | Defines card renderer, wires DataCard shared component (dual-view only)                     |
| **Form Dialog**              | `_components/<feature>-form-dialog.tsx`    | Create/Edit form with Zod validation, calls context methods (dual-view only)                |
| **Detail Dialog**            | `_components/<feature>-detail-dialog.tsx`  | Read-only detail modal (table-only, optional)                                               |
| **DataTable (Shared)**       | `components/shared/data-table/`            | Generic table — handles search, sort, pagination, skeleton loading, empty state, filterSlot |
| **DataCard (Shared)**        | `components/shared/data-card/`             | Generic card grid — handles pagination, skeleton loading, empty state (dual-view only)      |
| **DeleteAlertDialog**        | `components/shared/delete-alert-dialog/`   | Reusable delete confirmation with loading state and toast notifications                     |
| **ToggleView (Shared)**      | `components/shared/toggle-view/`           | Reusable table/grid view mode toggle button (dual-view only)                                |
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
- **Choose the right page pattern** — Dual-view for CRUD features (Accounts, Categories), Table-only for read-only/historical data (Audit Logs).

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

// Shared card component (dual-view only)
import { DataCard } from "@/components/shared/data-card";

// Shared delete dialog (dual-view only)
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog";

// Shared toggle view (dual-view only)
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
				// Add feature-specific filters
				if (params.type) queryParams.set("type", params.type);

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

	// --- CREATE (dual-view only) ---
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

	// --- UPDATE (dual-view only) ---
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

	// --- DELETE (dual-view only) ---
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

	// --- EXPORT (table-only features like audit-logs) ---
	const exportItems = useCallback(
		async ({ format }: { format: "json" | "csv" }): Promise<boolean> => {
			if (!isAuthenticated) return false;
			setIsLoading(true);
			setError(null);

			try {
				const response = await apiClient.get<{ url: string }>(
					`/<feature>/export?format=${format}`,
				);
				// Trigger download
				window.open(response.data.url, "_blank");
				return true;
			} catch (error) {
				setError(
					error instanceof ApiError
						? error.message
						: "Failed to export",
				);
				return false;
			} finally {
				setIsLoading(false);
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
		createItem, // Omit for read-only features
		updateItem, // Omit for read-only features
		deleteItem, // Omit for read-only features
		clearError,
		exportItems, // Add for features that need export
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
| 4    | Map operations                        | `fetchItems`, `createItem`, `updateItem`, `deleteItem`, `getItemById` (optional), `exportItems` (opt) |
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

## 6. Page Creation Patterns

Choose the right pattern based on your feature requirements:

| Pattern        | Use Case                         | Example                      | Components                                        |
| -------------- | -------------------------------- | ---------------------------- | ------------------------------------------------- |
| **Dual-View**  | CRUD features with editable data | Accounts, Categories, Tags   | Header + Table + Cards + FormDialog               |
| **Table-Only** | Read-only/historical data        | Audit Logs, Activity History | Header (with export) + Table + DetailDialog (opt) |

### 6.1 Dual-View Page (Table + Cards)

**When to use:** Features where users need both table and grid views (accounts, categories, tags, budgets). These pages have:

- **CRUD operations** (Create, Read, Update, Delete)
- **View toggle** (Table ↔ Grid cards)
- **Search input** (debounced)
- **Filter dropdowns**

**File Structure:**

```
components/pages/<feature>/
├── index.tsx                          # Main page orchestrator
└── _components/
    ├── <feature>-header.tsx           # Title + create button
    ├── <feature>-table.tsx            # Table view (uses DataTable)
    ├── <feature>-cards.tsx            # Card grid view (uses DataCard)
    └── <feature>-form-dialog.tsx      # Create/Edit form dialog
```

#### 6.1.1 Main Page (`index.tsx`) — The Orchestrator

This is the **ONLY smart component** in the page. All `_components` are presentational.

**Responsibilities:**

- Manages search, sort, and filter state (NOT in context)
- Debounces search input (300ms)
- Handles view mode toggle via `ToggleView` shared component
- Wires context data and callbacks to presentational components
- Shows error toasts

```tsx
// components/pages/<feature>/index.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { FeatureTable } from "./_components/<feature>-table";
import { FeatureCards } from "./_components/<feature>-cards";
import { FeatureHeader } from "./_components/<feature>-header";
import { useTheme, IViewMode } from "@/components/context/theme-context";
import { useFeature } from "@/components/context/<feature>-context";
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

	const { viewMode } = useTheme();
	const [isFirstLoad, setIsFirstLoad] = useState(true);
	const [isMobileView, setIsMobileView] = useState(false);

	// Search & Sort state — managed HERE, not in context
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<SortConfig | null>(null);
	const [typeFilter, setTypeFilter] = useState<FeatureType | "ALL">("ALL");
	const debounceRef = useRef<NodeJS.Timeout | null>(null);

	// Check screen size for responsive behavior (optional)
	useEffect(() => {
		const checkScreenSize = () => {
			setIsMobileView(window.innerWidth <= 900);
		};
		checkScreenSize();
		window.addEventListener("resize", checkScreenSize);
		return () => window.removeEventListener("resize", checkScreenSize);
	}, []);

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
					type: typeFilter !== "ALL" ? typeFilter : undefined,
				});
			}, 300);
		},
		[fetchItems, pagination?.limit, typeFilter],
	);

	// Sort change
	const handleSortChange = useCallback(
		(newSort: SortConfig) => {
			setSort(newSort);
			fetchItems({
				page: 1,
				limit: pagination?.limit || 20,
				search: search || undefined,
				type: typeFilter !== "ALL" ? typeFilter : undefined,
				sortBy: newSort.key,
				sortOrder: newSort.direction,
			});
		},
		[fetchItems, pagination?.limit, search, typeFilter],
	);

	// Type filter change
	const handleTypeFilterChange = useCallback(
		(type: FeatureType | "ALL") => {
			setTypeFilter(type);
			fetchItems({
				page: 1,
				limit: pagination?.limit || 20,
				search: search || undefined,
				type: type !== "ALL" ? type : undefined,
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
				type: typeFilter !== "ALL" ? typeFilter : undefined,
			});
		},
		[fetchItems, pagination?.limit, search, typeFilter],
	);

	// Limit change
	const handleLimitChange = useCallback(
		(limit: number) => {
			fetchItems({
				page: 1,
				limit,
				search: search || undefined,
				type: typeFilter !== "ALL" ? typeFilter : undefined,
			});
		},
		[fetchItems, search, typeFilter],
	);

	// Cleanup debounce
	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

	// Common props passed to BOTH table and cards
	const commonProps = {
		items,
		pagination: pagination ?? null,
		isLoading,
		onDelete: deleteItem,
		searchValue: search,
		onSearchChange: handleSearchChange,
		sortConfig: sort,
		onSortChange: handleSortChange,
		onPageChange: handlePageChange,
		onLimitChange: handleLimitChange,
		typeFilter,
		onTypeFilterChange: handleTypeFilterChange,
	};

	// Determine which view to show
	const showCardView = isMobileView || viewMode === IViewMode.GRID;
	const showTableView = !isMobileView && viewMode === IViewMode.TABLE;

	return (
		<div className="h-full grid grid-rows-[auto_1fr]">
			<div className="flex items-center justify-between">
				<FeatureHeader />
				{!isMobileView && <ToggleView />}
			</div>
			<div>
				{showTableView ? (
					<FeatureTable {...commonProps} />
				) : (
					<FeatureCards {...commonProps} />
				)}
			</div>
		</div>
	);
}
```

#### 6.1.2 Header Component

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

#### 6.1.3 Table Component

```tsx
// components/pages/<feature>/_components/<feature>-table.tsx
"use client";

import {
	DataTable,
	type Column,
	type SortConfig,
} from "@/components/shared/data-table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Edit, Trash2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog";
import type { Feature, FeatureType } from "@/lib/<feature>-service/types";
import type { Pagination as PaginationType } from "@/lib/response-service";
import { FeatureFormDialog } from "./<feature>-form-dialog";

const TYPE_CONFIG: Record<
	FeatureType,
	{ label: string; variant: "default" | "secondary" | "outline" }
> = {
	TYPE_A: { label: "Type A", variant: "default" },
	TYPE_B: { label: "Type B", variant: "secondary" },
};

const TYPE_OPTIONS = [
	{ value: "ALL", label: "All Types" },
	{ value: "TYPE_A", label: "Type A" },
	{ value: "TYPE_B", label: "Type B" },
];

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
	typeFilter?: FeatureType | "ALL";
	onTypeFilterChange?: (type: FeatureType | "ALL") => void;
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
	typeFilter = "ALL",
	onTypeFilterChange,
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
			cell: (item) => (
				<div className="flex items-center gap-2">
					{item.color && (
						<div
							className="w-3 h-3 rounded-full"
							style={{ backgroundColor: item.color }}
						/>
					)}
					<span className="font-medium">{item.name}</span>
				</div>
			),
		},
		{
			key: "type",
			header: "Type",
			sortable: true,
			cell: (item) => {
				const config = TYPE_CONFIG[item.type];
				return <Badge variant={config.variant}>{config.label}</Badge>;
			},
			className: "w-36",
			hideOnMobile: true,
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
						description="This will permanently delete this item."
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

	const filterSlot = onTypeFilterChange ? (
		<Select
			value={typeFilter}
			onValueChange={(value) =>
				onTypeFilterChange(value as FeatureType | "ALL")
			}
		>
			<SelectTrigger className="w-[160px]">
				<SelectValue placeholder="Filter by type" />
			</SelectTrigger>
			<SelectContent>
				{TYPE_OPTIONS.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	) : undefined;

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
			filterSlot={filterSlot}
		/>
	);
}
```

#### 6.1.4 Cards Component

```tsx
// components/pages/<feature>/_components/<feature>-cards.tsx
"use client";

import { DataCard } from "@/components/shared/data-card";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Feature, FeatureType } from "@/lib/<feature>-service/types";
import type { Pagination as PaginationType } from "@/lib/response-service";
import { FeatureFormDialog } from "./<feature>-form-dialog";

const TYPE_CONFIG: Record<
	FeatureType,
	{ label: string; variant: "default" | "secondary" | "outline" }
> = {
	TYPE_A: { label: "Type A", variant: "default" },
	TYPE_B: { label: "Type B", variant: "secondary" },
};

interface FeatureCardsProps {
	items: Feature[];
	pagination?: PaginationType | null;
	isLoading?: boolean;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onDelete: (id: string) => Promise<boolean>;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	typeFilter?: FeatureType | "ALL";
	onTypeFilterChange?: (type: FeatureType | "ALL") => void;
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
	typeFilter = "ALL",
	onTypeFilterChange,
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
			renderCard={(item) => {
				const typeConfig = TYPE_CONFIG[item.type];
				return (
					<Card className="group hover:shadow-md transition-shadow">
						<CardContent className="p-4">
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-2">
									{item.color && (
										<div
											className="w-3 h-3 rounded-full"
											style={{
												backgroundColor: item.color,
											}}
										/>
									)}
									<h3 className="font-medium">{item.name}</h3>
									<Badge variant={typeConfig.variant}>
										{typeConfig.label}
									</Badge>
								</div>
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
									{new Date(
										item.createdAt,
									).toLocaleDateString()}
								</p>
							)}
						</CardContent>
					</Card>
				);
			}}
		/>
	);
}
```

---

### 6.2 Table-Only Page Pattern (Audit Logs Example)

**When to use:** Pages that display immutable/historical data that never needs CRUD operations (audit logs, activity history, system events). These pages have:

- **No Create/Edit/Delete** — Read-only view
- **No Card view** — Only table view (no toggle needed)
- **Filters** — Multiple filter selects (action type, entity type, etc.)
- **Export** — Optional export functionality

**What's different from dual-view pages:**

| Feature         | Dual-View (Accounts)  | Table-Only (Audit Logs)       |
| --------------- | --------------------- | ----------------------------- |
| Header          | Title + Create button | Title + Export button         |
| View toggle     | ✅ ToggleView         | ❌ Not needed                 |
| Cards component | ✅                    | ❌                            |
| Form dialog     | ✅                    | ❌                            |
| Delete action   | ✅                    | ❌                            |
| Search input    | ✅ (debounced)        | ❌ (uses filters only)        |
| Filters         | 1 dropdown (type)     | 2+ dropdowns (action, entity) |

**File Structure:**

```
components/pages/audit-logs/
├── index.tsx                          # Main page orchestrator
└── _components/
    ├── audit-logs-header.tsx          # Title + export button + format selector
    ├── audit-logs-table.tsx           # Table view with filters (uses DataTable)
    └── audit-log-detail-dialog.tsx    # Detail modal (read-only)
```

#### 6.2.1 Main Page (`index.tsx`)

```tsx
// components/pages/audit-logs/index.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { AuditLogsTable } from "./_components/audit-logs-table";
import { AuditLogsHeader } from "./_components/audit-logs-header";
import { useAuditLogs } from "@/components/context/audit-logs-context/audit-logs-context";
import type { SortConfig } from "@/components/shared/data-table";
import type { EntityType } from "@/lib/audit-service/types";
import { AuditAction } from "@/generated/prisma/enums";

export function AuditLogsPage() {
	const {
		auditLogs,
		pagination,
		isLoading,
		error,
		fetchAuditLogs,
		clearError,
	} = useAuditLogs();

	const [isFirstLoad, setIsFirstLoad] = useState(true);
	const [actionFilter, setActionFilter] = useState<AuditAction | "ALL">(
		"ALL",
	);
	const [entityTypeFilter, setEntityTypeFilter] = useState<
		EntityType | "ALL"
	>("ALL");
	const [sort, setSort] = useState<SortConfig | null>(null);

	// Initial fetch
	useEffect(() => {
		fetchAuditLogs({ page: 1, limit: 20 }).finally(() =>
			setIsFirstLoad(false),
		);
	}, []);

	// Toast errors
	useEffect(() => {
		if (error) {
			toast.error(error);
			clearError();
		}
	}, [error, clearError]);

	// Sort change — refetches with current filters
	const handleSortChange = useCallback(
		(newSort: SortConfig) => {
			setSort(newSort);
			fetchAuditLogs({
				page: 1,
				limit: pagination?.limit || 20,
				action: actionFilter !== "ALL" ? actionFilter : undefined,
				entityType:
					entityTypeFilter !== "ALL" ? entityTypeFilter : undefined,
			});
		},
		[fetchAuditLogs, pagination?.limit, actionFilter, entityTypeFilter],
	);

	// Action filter change
	const handleActionFilterChange = useCallback(
		(action: AuditAction | "ALL") => {
			setActionFilter(action);
			fetchAuditLogs({
				page: 1,
				limit: pagination?.limit || 20,
				action: action !== "ALL" ? action : undefined,
				entityType:
					entityTypeFilter !== "ALL" ? entityTypeFilter : undefined,
			});
		},
		[fetchAuditLogs, pagination?.limit, entityTypeFilter],
	);

	// Entity filter change
	const handleEntityTypeFilterChange = useCallback(
		(entityType: EntityType | "ALL") => {
			setEntityTypeFilter(entityType);
			fetchAuditLogs({
				page: 1,
				limit: pagination?.limit || 20,
				action: actionFilter !== "ALL" ? actionFilter : undefined,
				entityType: entityType !== "ALL" ? entityType : undefined,
			});
		},
		[fetchAuditLogs, pagination?.limit, actionFilter],
	);

	// Page change
	const handlePageChange = useCallback(
		(page: number) => {
			fetchAuditLogs({
				page,
				limit: pagination?.limit || 20,
				action: actionFilter !== "ALL" ? actionFilter : undefined,
				entityType:
					entityTypeFilter !== "ALL" ? entityTypeFilter : undefined,
			});
		},
		[fetchAuditLogs, pagination?.limit, actionFilter, entityTypeFilter],
	);

	// Limit change
	const handleLimitChange = useCallback(
		(limit: number) => {
			fetchAuditLogs({
				page: 1,
				limit,
				action: actionFilter !== "ALL" ? actionFilter : undefined,
				entityType:
					entityTypeFilter !== "ALL" ? entityTypeFilter : undefined,
			});
		},
		[fetchAuditLogs, actionFilter, entityTypeFilter],
	);

	return (
		<div className="h-full grid grid-rows-[auto_1fr]">
			<AuditLogsHeader />
			<div className="flex-1 overflow-auto min-h-0">
				<AuditLogsTable
					auditLogs={auditLogs}
					pagination={pagination ?? null}
					isLoading={isLoading}
					sortConfig={sort}
					onSortChange={handleSortChange}
					onPageChange={handlePageChange}
					onLimitChange={handleLimitChange}
					actionFilter={actionFilter}
					onActionFilterChange={handleActionFilterChange}
					entityTypeFilter={entityTypeFilter}
					onEntityTypeFilterChange={handleEntityTypeFilterChange}
				/>
			</div>
		</div>
	);
}
```

#### 6.2.2 Header Component with Export

```tsx
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
```

#### 6.2.3 Table Component with Multiple Filters

```tsx
// components/pages/audit-logs/_components/audit-logs-table.tsx
"use client";

import {
	DataTable,
	type Column,
	type SortConfig,
} from "@/components/shared/data-table";
import { Eye, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AuditLogEntry, EntityType } from "@/lib/audit-service/types";
import type { Pagination as PaginationType } from "@/lib/response-service";
import { AuditAction } from "@/generated/prisma/enums";
import { AuditLogDetailDialog } from "./audit-log-detail-dialog";

// Action configuration for badges
function getActionConfig(action: AuditAction): {
	label: string;
	variant: "default" | "secondary" | "outline";
} {
	const actionMap = {
		CREATE: { label: "Create", variant: "default" as const },
		UPDATE: { label: "Update", variant: "secondary" as const },
		DELETE: { label: "Delete", variant: "outline" as const },
		EXPORT: { label: "Export", variant: "secondary" as const },
		LOGIN: { label: "Login", variant: "default" as const },
		LOGOUT: { label: "Logout", variant: "outline" as const },
		SETTINGS_CHANGE: {
			label: "Settings Change",
			variant: "secondary" as const,
		},
		BUDGET_ALERT: { label: "Budget Alert", variant: "outline" as const },
		GOAL_MILESTONE: {
			label: "Goal Milestone",
			variant: "default" as const,
		},
	};
	return (
		actionMap[action] || {
			label: action.replace(/_/g, " "),
			variant: "outline" as const,
		}
	);
}

const ENTITY_TYPE_OPTIONS = [
	{ value: "ALL", label: "All Entities" },
	{ value: "Transaction", label: "Transaction" },
	{ value: "Category", label: "Category" },
	{ value: "Budget", label: "Budget" },
	{ value: "Account", label: "Account" },
	{ value: "User", label: "User" },
];

interface AuditLogsTableProps {
	auditLogs: AuditLogEntry[];
	pagination?: PaginationType | null;
	isLoading?: boolean;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	sortConfig?: SortConfig | null;
	onSortChange?: (sort: SortConfig) => void;
	actionFilter?: AuditAction | "ALL";
	onActionFilterChange?: (action: AuditAction | "ALL") => void;
	entityTypeFilter?: EntityType | "ALL";
	onEntityTypeFilterChange?: (entityType: EntityType | "ALL") => void;
}

export function AuditLogsTable({
	auditLogs,
	pagination,
	isLoading,
	onPageChange,
	onLimitChange,
	sortConfig,
	onSortChange,
	actionFilter = "ALL",
	onActionFilterChange,
	entityTypeFilter = "ALL",
	onEntityTypeFilterChange,
}: AuditLogsTableProps) {
	const columns: Column<AuditLogEntry>[] = [
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
			key: "action",
			header: "Action",
			sortable: true,
			cell: (item) => {
				const config = getActionConfig(item.action);
				return <Badge variant={config.variant}>{config.label}</Badge>;
			},
			className: "w-28",
		},
		{
			key: "entityType",
			header: "Entity",
			sortable: true,
			cell: (item) => (
				<div className="flex items-center gap-1.5">
					<FileText className="h-3.5 w-3.5 text-muted-foreground" />
					<span className="text-sm">{item.entityType}</span>
				</div>
			),
			className: "w-44",
			hideOnMobile: true,
		},
		{
			key: "description",
			header: "Description",
			cell: (item) => (
				<span className="text-sm line-clamp-1 max-w-[400px] block">
					{item.description || "—"}
				</span>
			),
		},
		{
			key: "userId",
			header: "User",
			cell: (item) => (
				<div className="flex items-center gap-1.5">
					<User className="h-3.5 w-3.5 text-muted-foreground" />
					<span className="text-xs text-muted-foreground font-mono">
						{item.userId.slice(0, 8)}...
					</span>
				</div>
			),
			className: "w-32",
			hideOnMobile: true,
		},
		{
			key: "createdAt",
			header: "Date & Time",
			sortable: true,
			cell: (item) => (
				<div className="text-sm text-muted-foreground whitespace-nowrap">
					{new Date(item.createdAt!).toLocaleString()}
				</div>
			),
			className: "w-44",
		},
		{
			key: "actions",
			header: "",
			cell: (item) => (
				<div className="flex items-center justify-end">
					<AuditLogDetailDialog
						auditLog={item}
						trigger={
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
							>
								<Eye className="h-3.5 w-3.5" />
							</Button>
						}
					/>
				</div>
			),
			className: "w-16 text-right",
		},
	];

	const filterSlot = (
		<div className="flex items-center gap-2">
			{onActionFilterChange && (
				<Select
					value={actionFilter}
					onValueChange={(value) =>
						onActionFilterChange(value as AuditAction | "ALL")
					}
				>
					<SelectTrigger className="w-[150px]">
						<SelectValue placeholder="Filter by action" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="ALL">All Actions</SelectItem>
						{Object.values(AuditAction).map((action) => (
							<SelectItem key={action} value={action}>
								{getActionConfig(action).label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
			{onEntityTypeFilterChange && (
				<Select
					value={entityTypeFilter}
					onValueChange={(value) =>
						onEntityTypeFilterChange(value as EntityType | "ALL")
					}
				>
					<SelectTrigger className="w-[170px]">
						<SelectValue placeholder="Filter by entity" />
					</SelectTrigger>
					<SelectContent>
						{ENTITY_TYPE_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
		</div>
	);

	return (
		<DataTable
			data={auditLogs}
			columns={columns}
			pagination={pagination}
			isLoading={isLoading}
			onPageChange={onPageChange}
			onLimitChange={onLimitChange}
			emptyMessage="No audit logs found"
			emptyDescription="Audit logs will appear here as activities are performed."
			sortConfig={sortConfig}
			onSortChange={onSortChange}
			filterSlot={filterSlot}
		/>
	);
}
```

#### 6.2.4 Detail Dialog (Read-Only Modal)

```tsx
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

interface AuditLogDetailDialogProps {
	auditLog: AuditLogEntry;
	trigger?: React.ReactNode;
}

export function AuditLogDetailDialog({
	auditLog,
	trigger,
}: AuditLogDetailDialogProps) {
	return (
		<Dialog>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						Audit Log Detail
						<Badge variant="outline">{auditLog.action}</Badge>
					</DialogTitle>
					<DialogDescription>
						Detailed information about this activity
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Basic Information Card */}
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
									{auditLog.id}
								</span>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<FileText className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground">
									Entity:
								</span>
								<span>{auditLog.entityType}</span>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<Clock className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground">
									Date:
								</span>
								<span>
									{new Date(
										auditLog.createdAt!,
									).toLocaleString()}
								</span>
							</div>
						</CardContent>
					</Card>

					{/* Description Card */}
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

					{/* User Information Card */}
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

					{/* Changes Card (for UPDATE actions) */}
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
												{JSON.stringify(
													auditLog.oldValue,
													null,
													2,
												)}
											</pre>
										</div>
									)}
									{auditLog.newValue && (
										<div>
											<p className="text-xs font-medium text-muted-foreground mb-1">
												New Values
											</p>
											<pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-40">
												{JSON.stringify(
													auditLog.newValue,
													null,
													2,
												)}
											</pre>
										</div>
									)}
								</CardContent>
							</Card>
						)}
				</div>
			</DialogContent>
		</Dialog>
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

### 7.2 `DataCard<T>` — For Grid/Card View (Dual-View Only)

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

### 7.3 `DeleteAlertDialog` — For Delete Confirmation (Dual-View Only)

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

### 7.4 `ToggleView` — For Table/Grid View Toggle (Dual-View Only)

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

## 8. Form Dialog Pattern (Dual-View Only)

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
import { useFeature } from "@/components/context/<feature>-context";
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
			setFormData({ name: item.name });
		}
	}, [isEditMode, item]);

	// Reset form when dialog closes (create mode only)
	React.useEffect(() => {
		if (!open && !isEditMode) {
			setFormData({ name: "" });
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
				const updateData: Partial<FormData> = {};
				if (formData.name !== item?.name)
					updateData.name = formData.name;

				if (Object.keys(updateData).length === 0) {
					return true;
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
			const updateData: UpdateInput = {};
			if (formData.name !== item.name) updateData.name = formData.name;

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

```tsx
const PREDEFINED_COLORS = [
	"#FF5733",
	"#33FF57",
	"#3357FF",
	"#F333FF",
	"#FFD733",
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

### 10.1 Page Pattern Decision Tree

```
Is the data editable (Create/Update/Delete)?
    │
    ├── YES → Use DUAL-VIEW pattern
    │         Features: Accounts, Categories, Tags, Budgets
    │         Components: Header (with create button) + Table + Cards + FormDialog
    │
    └── NO  → Use TABLE-ONLY pattern
              Features: Audit Logs, Activity History, System Events
              Components: Header (with export) + Table + DetailDialog (optional)
```

### 10.2 New Feature Development Checklist

**Step 1: Create Context**

- [ ] Read backend lib: `lib/<feature>-service/types.ts`, `validation.ts`
- [ ] Create folder: `components/context/<feature>-context/`
- [ ] Create file: `<feature>-context.tsx` (copy template)
- [ ] Replace types, operations, and error handling
- [ ] Add Provider to `components/context/index.tsx` (AppProviders)
- [ ] Add hook to `useAppStore` in `components/context/index.tsx`
- [ ] Re-export hook from `components/context/index.tsx`

**Step 2: Choose Page Pattern**

- [ ] **Dual-View** (if editable):
    - [ ] Create folder: `components/pages/<feature>/`
    - [ ] Create `index.tsx` (page orchestrator with ToggleView)
    - [ ] Create `_components/<feature>-header.tsx`
    - [ ] Create `_components/<feature>-table.tsx` (use `DataTable`)
    - [ ] Create `_components/<feature>-cards.tsx` (use `DataCard`)
    - [ ] Create `_components/<feature>-form-dialog.tsx`

- [ ] **Table-Only** (if read-only):
    - [ ] Create folder: `components/pages/<feature>/`
    - [ ] Create `index.tsx` (page orchestrator)
    - [ ] Create `_components/<feature>-header.tsx` (with export)
    - [ ] Create `_components/<feature>-table.tsx` (use `DataTable` with filterSlot)
    - [ ] Create `_components/<feature>-detail-dialog.tsx` (optional)

**Step 3: Wire Everything**

- [ ] Page uses context hook for data and operations
- [ ] Page manages search/sort/filter state (dual-view) or filter/sort state (table-only)
- [ ] Table and Cards receive data and callbacks as props
- [ ] Form Dialog calls context `createItem`/`updateItem` (dual-view only)
- [ ] Delete uses `DeleteAlertDialog` shared component (dual-view only)
- [ ] Import order follows convention (shared → types → relative)

### 10.3 Import Quick Reference

```tsx
// Context
import { useFeature } from "@/components/context/<feature>-context";
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
import { DataCard } from "@/components/shared/data-card"; // Dual-view only
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog"; // Dual-view only
import ToggleView from "@/components/shared/toggle-view"; // Dual-view only

// Backend Types & Validation
import type { Feature } from "@/lib/<feature>-service/types";
import type {
	CreateInput,
	UpdateInput,
} from "@/lib/<feature>-service/validation";
import { createSchema, updateSchema } from "@/lib/<feature>-service/validation";

// Icons
import { Plus, Edit, Trash2, Loader2, Download, Eye } from "lucide-react";

// Shadcn/ui
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
```

### 10.4 Architecture Summary

| Layer            | File                            | Responsibility                                                |
| ---------------- | ------------------------------- | ------------------------------------------------------------- |
| **Context**      | `context/<feature>-context.tsx` | State, API calls, optimistic updates, error state             |
| **Page**         | `pages/<feature>/index.tsx`     | Orchestration — search/sort/filter state, wiring              |
| **\_components** | `_components/*.tsx`             | Presentational — receive all data and callbacks as props      |
| **Shared**       | `shared/*`                      | Reusable — DataTable, DataCard, DeleteAlertDialog, ToggleView |

### 10.5 Always / Never Summary

| ✅ Always                                                   | ❌ Never                                   |
| ----------------------------------------------------------- | ------------------------------------------ |
| Use Categories/Tags Context as template for every context   | Invent new context patterns                |
| Add every context to `index.tsx` (3 places)                 | Skip any of the 3 registration steps       |
| Use `apiClient` for ALL API calls                           | Use raw `fetch()` or `axios`               |
| Import `DataTable` and `DataCard` from shared               | Build custom tables or card grids          |
| Use `DeleteAlertDialog` from shared                         | Create custom delete dialogs               |
| Use `ToggleView` from shared                                | Create inline view toggle buttons          |
| Use shadcn/ui components for all UI                         | Create custom UI components                |
| Use Lucide React icons                                      | Use SVG or emoji icons                     |
| Manage search/sort state in Page, not Context               | Put UI state in Context                    |
| Pass `isLoading` directly to DataTable/DataCard             | Create `isFirstLoad` unless needed         |
| Use `debounceRef` (300ms) for search (dual-view)            | Call API on every keystroke                |
| Show `toast.success` in form dialogs on success             | Forget user feedback                       |
| Call `onSuccess?.()` after successful mutations             | Leave callbacks uncalled                   |
| Import types from backend lib files                         | Guess or invent types                      |
| Move to `shared/` when reused by 2+ pages                   | Keep reusable components in `_components/` |
| Return `null` from context on failure                       | Throw unhandled errors from context        |
| Import page-specific components LAST (relative paths)       | Mix import orders arbitrarily              |
| **Choose the right page pattern** (dual-view vs table-only) | Use card view for read-only data           |
| **Hide ToggleView on mobile** in dual-view pages            | Show toggle view on screens ≤900px         |
| **Use filterSlot** in DataTable for multiple filters        | Create custom filter layouts               |
