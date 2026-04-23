Here's the updated Frontend Rulebook with the centralized context system properly integrated:

---

# Frontend Rulebook — Complete

**Version:** 3.0 | **Stack:** Next.js · TypeScript · Tailwind CSS · Shadcn/ui · Lucide Icons · API Client

---

## Table of Contents

1. [API Client & Response Service](#part-1-api-client--response-service)
2. [Context API Creation](#part-2-context-api-creation)
3. [Centralized Context System](#part-3-centralized-context-system)
4. [Page & Component Organization](#part-4-page--component-organization)
5. [Shadcn/ui Components](#part-5-shadcnui-components-always-use)
6. [Icons](#part-6-icons-always-use-lucide)
7. [Quick Reference](#part-7-quick-reference)

---

## Part 1: API Client & Response Service

### Core Rule

**NEVER use raw `fetch()` calls directly in contexts or components. ALWAYS use the `apiClient`.**

### 1.1 File Location

```
lib/
├── api-client/
│   └── index.ts              # Centralized API client
├── response-service/
│   └── index.ts              # Response types and error codes
└── logger-service/
    └── index.ts              # Optional: frontend logger
```

### 1.2 Import Patterns

```tsx
// Import API client
import { apiClient, ApiError } from "@/lib/api-client";

// Import response types and error codes
import { ErrorCode, HttpStatus, type ApiMeta } from "@/lib/response-service";
```

### 1.3 API Client Usage

```tsx
import { apiClient, ApiError } from "@/lib/api-client";
import { ErrorCode } from "@/lib/response-service";

// ✅ GET request
const data = await apiClient.get<Category[]>("/categories");

// ✅ GET with query params (using URLSearchParams)
const queryParams = new URLSearchParams({
	page: "1",
	limit: "20",
	search: "food",
});
const data = await apiClient.get<PaginatedResponse<Category>>(
	`/categories?${queryParams}`,
);

// ✅ POST request
const newCategory = await apiClient.post<Category>("/categories", {
	name: "Groceries",
	type: "EXPENSE",
});

// ✅ PUT request
const updated = await apiClient.put<Category>(`/categories/${id}`, {
	name: "Updated Name",
});

// ✅ DELETE request
await apiClient.delete<void>(`/categories/${id}`);

// ✅ PATCH request
const patched = await apiClient.patch<Category>(`/categories/${id}`, {
	order: 1,
});
```

### 1.4 Error Handling Pattern

```tsx
import { apiClient, ApiError } from "@/lib/api-client";
import { ErrorCode } from "@/lib/response-service";
import { toast } from "sonner";

try {
	const data = await apiClient.get<Category[]>("/categories");
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

			default:
				toast.error(error.message);
		}
	}
}
```

### 1.5 What NOT to Do

```tsx
// ❌ NEVER use raw fetch
const response = await fetch("/api/categories");
const data = await response.json();

// ✅ ALWAYS use apiClient
import { apiClient } from "@/lib/api-client";
const data = await apiClient.get<Category[]>("/categories");
```

---

## Part 2: Context API Creation

### Core Rule

The Auth Context is the ONLY template. Copy its exact structure when creating any new context.

### 2.1 Context File Structure

```
components/context/
├── auth-context/
│   └── auth-context.tsx
├── categories-context/
│   └── categories-context.tsx
├── tags-context/
│   └── tags-context.tsx
├── accounts-context/
│   └── accounts-context.tsx
├── budgets-context/
│   └── budgets-context.tsx
├── recurring-context/
│   └── recurring-context.tsx
├── audit-logs-context/
│   └── audit-logs-context.tsx
├── theme-context/
│   └── index.tsx
└── index.tsx                    # ROOT PROVIDER - WRAPS ALL CONTEXTS
```

### 2.2 Context Template Structure

```tsx
// components/context/feature-context/feature-context.tsx
"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import type {
	CreateInput,
	UpdateInput,
} from "@/lib/feature-service/validation";
import { apiClient, ApiError } from "@/lib/api-client";
import type { Feature } from "@/lib/feature-service/types";
import { useAuth } from "@/components/context/auth-context/auth-context";
import {
	ErrorCode,
	type ApiSuccessResponse,
	type ApiMeta,
} from "@/lib/response-service";

// ============================================
// TYPES
// ============================================

interface FeatureContextType {
	// State
	data: Feature[];
	pagination: ApiMeta["pagination"] | null;
	isLoading: boolean;
	error: string | null;

	// Actions
	fetchData: (params?: any) => Promise<void>;
	createItem: (data: CreateInput) => Promise<Feature | null>;
	updateItem: (id: string, data: UpdateInput) => Promise<Feature | null>;
	deleteItem: (id: string) => Promise<boolean>;
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
	const [data, setData] = useState<Feature[]>([]);
	const [pagination, setPagination] = useState<ApiMeta["pagination"] | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => setError(null), []);

	// Fetch implementation
	const fetchData = useCallback(
		async (params: any = {}) => {
			if (!isAuthenticated) return;
			setIsLoading(true);
			setError(null);

			try {
				const queryParams = new URLSearchParams();
				// Add params...

				const response = await apiClient.get<
					ApiSuccessResponse<Feature[]>
				>(`/feature?${queryParams.toString()}`);
				setData(response.data);
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

	// Create, Update, Delete implementations...

	useEffect(() => {
		if (isAuthenticated) {
			fetchData();
		}
	}, [isAuthenticated, fetchData]);

	const value: FeatureContextType = {
		data,
		pagination,
		isLoading,
		error,
		fetchData,
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

### 2.3 Creating New Context Checklist

- [ ] Read backend lib files (`types.ts`, `validation.ts`, `index.ts`)
- [ ] Copy Auth Context structure
- [ ] Create folder: `components/context/feature-context/`
- [ ] Create file: `feature-context.tsx`
- [ ] Replace types with feature types (import from backend lib)
- [ ] Map backend operations to context actions using `apiClient`
- [ ] **ADD PROVIDER TO `index.tsx`** (See Part 3)
- [ ] **ADD HOOK TO `useAppStore`** (See Part 3)
- [ ] **RE-EXPORT HOOK FROM `index.tsx`** (See Part 3)

---

## Part 3: Centralized Context System

### Core Rule

**EVERY new context MUST be added to the Root Provider AND `useAppStore` in `components/context/index.tsx`.**

### 3.1 Root Provider File (REFERENCE TEMPLATE)

```tsx
// components/context/index.tsx
"use client";

import React from "react";
import { TagsProvider } from "./tags-context/tags-context";
import { AuthProvider } from "./auth-context/auth-context";
import { BudgetsProvider } from "./budgets-context/budgets-context";
import { AccountsProvider } from "./accounts-context/accounts-context";
import { RecurringProvider } from "./recurring-context/recurring-context";
import { AuditLogsProvider } from "./audit-logs-context/audit-logs-context";
import { CategoriesProvider } from "./categories-context/categories-context";
import { ThemeContextProvider } from "./theme-context";

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
								<AuditLogsProvider>
									<ThemeContextProvider>
										{children}
									</ThemeContextProvider>
								</AuditLogsProvider>
							</RecurringProvider>
						</BudgetsProvider>
					</AccountsProvider>
				</TagsProvider>
			</CategoriesProvider>
		</AuthProvider>
	);
}

// ============================================
// CENTRALIZED STORE HOOK (Redux-like)
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

	return {
		auth,
		categories,
		tags,
		accounts,
		budgets,
		recurring,
		auditLogs,
	};
}

// ============================================
// RE-EXPORT ALL HOOKS (Convenience)
// ============================================

export { useAuth } from "./auth-context/auth-context";
export { useCategories } from "./categories-context/categories-context";
export { useTags } from "./tags-context/tags-context";
export { useAccounts } from "./accounts-context/accounts-context";
export { useBudgets } from "./budgets-context/budgets-context";
export { useRecurring } from "./recurring-context/recurring-context";
export { useAuditLogs } from "./audit-logs-context/audit-logs-context";
```

### 3.2 Adding New Context to Root Provider

When creating a new context, you MUST complete ALL 3 steps:

**Step 1: Import Provider and Add to Composition Chain**

```tsx
// 1. Add import
import { NewFeatureProvider } from "./new-feature-context/new-feature-context";

// 2. Add to composition chain (maintain logical order)
export function AppProviders({ children }: AppProvidersProps) {
	return (
		<AuthProvider>
			<CategoriesProvider>
				<TagsProvider>
					<AccountsProvider>
						<BudgetsProvider>
							<RecurringProvider>
								<NewFeatureProvider>
									{" "}
									{/* ADD HERE */}
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
```

**Step 2: Add to useAppStore**

```tsx
export function useAppStore() {
	// ... existing hooks
	const newFeature =
		require("./new-feature-context/new-feature-context").useNewFeature();

	return {
		auth,
		categories,
		tags,
		accounts,
		budgets,
		recurring,
		newFeature, // ADD HERE
		auditLogs,
	};
}
```

**Step 3: Re-export Hook**

```tsx
// Add to exports
export { useNewFeature } from "./new-feature-context/new-feature-context";
```

### 3.3 Provider Dependency Order

The order of providers matters! Follow this dependency hierarchy:

```
AuthProvider (Required by all - MUST be first)
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
AuditLogsProvider (Tracks all - place near end)
    ↓
ThemeContextProvider (UI only - MUST be last)
    ↓
{children}
```

### 3.4 Usage in App Layout

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

### 3.5 Usage in Components (3 Ways)

**Option A: Import individual hooks from index (Recommended)**

```tsx
// components/pages/categories/index.tsx
"use client";

import { useCategories, useTags } from "@/components/context";

export function CategoriesPage() {
	const { categories, isLoading } = useCategories();
	const { popularTags } = useTags();
	// ...
}
```

**Option B: Use centralized store (Redux-like)**

```tsx
// components/pages/dashboard/index.tsx
"use client";

import { useAppStore } from "@/components/context";

export function DashboardPage() {
	const { auth, accounts, budgets, recurring } = useAppStore();

	const user = auth.user;
	const { accounts: accountList } = accounts;
	const { currentBudgets } = budgets;
	const { upcomingRecurring } = recurring;
	// ...
}
```

**Option C: Direct import from context file**

```tsx
// components/pages/recurring/index.tsx
"use client";

import { useRecurring } from "@/components/context/recurring-context/recurring-context";

export function RecurringPage() {
	const { recurringTransactions, pauseRecurring } = useRecurring();
	// ...
}
```

---

## Part 4: Page & Component Organization

### Core Rule

**Pages go in `components/pages/feature/` folder. Page-specific components go in `_components/` subfolder.**

### File Structure Rules

```
components/
├── pages/
│   ├── home/
│   │   ├── _components/
│   │   │   ├── home-skeleton.tsx
│   │   │   ├── hero-section.tsx
│   │   │   └── featured-card.tsx
│   │   └── index.tsx
│   │
│   ├── login/
│   │   ├── _components/
│   │   │   ├── login-form.tsx
│   │   │   ├── login-skeleton.tsx
│   │   │   └── otp-input.tsx
│   │   └── index.tsx
│   │
│   └── categories/
│       ├── _components/
│       │   ├── categories-skeleton.tsx
│       │   ├── category-list.tsx
│       │   ├── category-form.tsx
│       │   └── delete-dialog.tsx
│       └── index.tsx
│
├── shared/                        # Reusable across MULTIPLE pages
│   ├── route-breadcrumb/
│   ├── theme-toggle/
│   └── confirm-dialog/
│
├── layout/                        # Layout components (global)
│   ├── header/
│   ├── footer/
│   └── sidebar/
│
├── context/                       # React Context providers
│   ├── auth-context/
│   ├── categories-context/
│   ├── tags-context/
│   ├── accounts-context/
│   ├── budgets-context/
│   ├── recurring-context/
│   ├── audit-logs-context/
│   ├── <feature>-context/
│   └── index.tsx                  # ROOT PROVIDER
│
└── ui/                            # shadcn/ui components (DO NOT MODIFY)
```

### Rules for `_components` Folder

| Rule                                      | Explanation                                     |
| ----------------------------------------- | ----------------------------------------------- |
| **Only for page-specific components**     | Components that are NOT used by other pages     |
| **Each page has its own `_components`**   | Isolated and scoped to that page                |
| **Skeletons go in `_components`**         | Different pages have different skeleton layouts |
| **Move to `shared/` if used by 2+ pages** | Promote to shared folder when reused            |

---

## Part 5: Shadcn/ui Components (ALWAYS USE)

### Core Rule

**NEVER create custom UI components. ALWAYS use shadcn/ui components.**

### Import Pattern

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
```

---

## Part 6: Icons (ALWAYS USE LUCIDE)

### Core Rule

**NEVER use SVG icons. ALWAYS use Lucide React icons.**

### Import Pattern

```tsx
import {
	Home,
	User,
	Settings,
	Plus,
	Trash2,
	Edit,
	Loader2,
	Pause,
	Play,
	RotateCcw,
} from "lucide-react";
```

---

## Part 7: Quick Reference

### Creating New Feature Checklist

**Step 1: Create Context**

- [ ] Read backend lib files (`types.ts`, `validation.ts`, `index.ts`)
- [ ] Copy Auth Context structure
- [ ] Create folder: `components/context/feature-context/`
- [ ] Create file: `feature-context.tsx`
- [ ] Replace types and operations
- [ ] **ADD PROVIDER TO `index.tsx` AppProviders**
- [ ] **ADD HOOK TO `index.tsx` useAppStore**
- [ ] **RE-EXPORT HOOK FROM `index.tsx`**

**Step 2: Create Page**

- [ ] Create folder: `components/pages/feature/`
- [ ] Create main file: `index.tsx`
- [ ] Create `_components/` folder
- [ ] Create page-specific components in `_components/`
- [ ] Create skeleton in `_components/feature-skeleton.tsx`

### Summary Table

| ✅ DO                                          | ❌ DON'T                                   |
| ---------------------------------------------- | ------------------------------------------ |
| Use Auth Context as template                   | Create new context patterns                |
| Add EVERY context to `index.tsx` (3 places)    | Skip adding context to Root Provider       |
| Use `apiClient` for all API calls              | Use raw `fetch()`                          |
| Import types from backend lib files            | Guess or invent types                      |
| Import hooks from centralized `index.tsx`      | Deep import paths unnecessarily            |
| Put page components in `pages/feature/`        | Put page components in `shared/`           |
| Put page-specific components in `_components/` | Mix page components across folders         |
| Create skeleton per page in `_components/`     | Use same skeleton for all pages            |
| Move to `shared/` when reused 2+ times         | Keep reusable components in `_components/` |
| Use shadcn/ui components                       | Create custom UI components                |
| Use Lucide React icons                         | Use SVG or emoji icons                     |

### New Context Addition Checklist

| Step | Action                       | File to Update |
| ---- | ---------------------------- | -------------- |
| 1    | Import Provider              | `index.tsx`    |
| 2    | Add Provider to AppProviders | `index.tsx`    |
| 3    | Add hook to useAppStore      | `index.tsx`    |
| 4    | Re-export hook               | `index.tsx`    |

---
