# Frontend Rulebook — Complete

**Version:** 1.0 | **Stack:** Next.js · TypeScript · Tailwind CSS · Shadcn/ui · Lucide Icons

---

## Part 1: Context API Creation

**Reference:** Auth Context (`components/context/auth-context/auth-context.tsx`)

### Core Rule
The Auth Context is the ONLY template. Copy its exact structure when creating any new context.

### Step 1: Read Backend Lib Files First
Before writing any code, read these 3 files from the backend:
- `lib/feature-service/types.ts` → Data types
- `lib/feature-service/validation.ts` → Input types
- `lib/feature-service/index.ts` → Available operations

### Step 2: Follow Auth Context Pattern
Copy the exact structure from `components/context/auth-context/auth-context.tsx` and replace feature-specific parts.

### Step 3: File Location
All contexts go in: `components/context/feature-context/feature-context.tsx`

Example:
```
components/context/
├── auth-context/
│   └── auth-context.tsx
├── categories-context/
│   └── categories-context.tsx
└── transactions-context/
    └── transactions-context.tsx
```

---

## Part 2: Page & Component Organization

### Core Rule
**Pages go in `components/pages/feature/` folder. Page-specific components go in `_components/` subfolder.**

### File Structure Rules

```
components/
├── pages/
│   ├── home/
│   │   ├── _components/           # Components ONLY for home page
│   │   │   ├── home-skeleton.tsx
│   │   │   ├── hero-section.tsx
│   │   │   └── featured-card.tsx
│   │   └── index.tsx              # Main home page component
│   │
│   ├── login/
│   │   ├── _components/           # Components ONLY for login page
│   │   │   ├── login-form.tsx
│   │   │   ├── login-skeleton.tsx
│   │   │   └── otp-input.tsx
│   │   └── index.tsx              # Main login page component
│   │
│   ├── dashboard/
│   │   ├── _components/           # Components ONLY for dashboard
│   │   │   ├── dashboard-skeleton.tsx
│   │   │   ├── stats-card.tsx
│   │   │   ├── revenue-chart.tsx
│   │   │   └── recent-transactions.tsx
│   │   └── index.tsx              # Main dashboard component
│   │
│   └── categories/
│       ├── _components/           # Components ONLY for categories page
│       │   ├── categories-skeleton.tsx
│       │   ├── category-list.tsx
│       │   ├── category-form.tsx
│       │   └── delete-dialog.tsx
│       └── index.tsx              # Main categories component
│
├── shared/                        # Reusable across MULTIPLE pages
│   ├── route-breadcrumb/
│   │   └── index.tsx
│   ├── theme-toggle/
│   │   └── index.tsx
│   └── confirm-dialog/
│       └── index.tsx
│
├── layout/                        # Layout components (global)
│   ├── header/
│   ├── footer/
│   └── sidebar/
│
├── context/                       # React Context providers
│
└── ui/                            # shadcn/ui components (DO NOT MODIFY)
```

### Rules for `_components` Folder

| Rule | Explanation |
|------|-------------|
| **Only for page-specific components** | Components that are NOT used by other pages |
| **Each page has its own `_components`** | Isolated and scoped to that page |
| **Skeletons go in `_components`** | Different pages have different skeleton layouts |
| **Move to `shared/` if used by 2+ pages** | Promote to shared folder when reused |

### Examples

**Page Component with `_components`:**
```tsx
// components/pages/categories/index.tsx
import { CategoriesSkeleton } from "./_components/categories-skeleton";
import { CategoryList } from "./_components/category-list";
import { CategoryForm } from "./_components/category-form";

export function CategoriesPage() {
  const { categories, isLoading } = useCategories();
  
  if (isLoading) {
    return <CategoriesSkeleton />;
  }
  
  return (
    <div>
      <CategoryForm />
      <CategoryList categories={categories} />
    </div>
  );
}
```

**Page-Specific Skeleton:**
```tsx
// components/pages/categories/_components/categories-skeleton.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CategoriesSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### When to Move to `shared/`

```tsx
// ✅ Move to shared/ - Used by multiple pages
// components/shared/confirm-dialog/index.tsx
export function ConfirmDialog() { ... }

// Used in: categories, transactions, budgets pages

// ❌ Keep in _components - Used by ONE page only
// components/pages/categories/_components/category-form.tsx
export function CategoryForm() { ... }

// Only used in categories page
```

---

## Part 3: Shadcn/ui Components (ALWAYS USE)

### Core Rule
**NEVER create custom UI components. ALWAYS use shadcn/ui components.**

### Available Shadcn Components

| Category | Components |
|----------|-----------|
| Layout | `card`, `sheet`, `sidebar`, `separator`, `scroll-area` |
| Form | `button`, `input`, `textarea`, `label`, `calendar`, `input-otp` |
| Navigation | `breadcrumb`, `pagination`, `dropdown-menu` |
| Feedback | `alert`, `badge`, `progress`, `skeleton`, `sonner` (toast) |
| Data Display | `avatar`, `chart`, `tooltip`, `popover` |
| Interactive | `dialog`, `collapsible`, `command`, `combobox` |

### Import Pattern
```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
```

### What NOT to Do
```tsx
// ❌ NEVER create custom button
const CustomButton = () => <button className="...">Click</button>;

// ❌ NEVER create custom skeleton
const CustomSkeleton = () => <div className="animate-pulse">...</div>;

// ✅ ALWAYS use shadcn components
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
```

---

## Part 4: Icons (ALWAYS USE LUCIDE)

### Core Rule
**NEVER use SVG icons. ALWAYS use Lucide React icons.**

### Import Pattern
```tsx
import { Home, User, Settings, ChevronRight, Plus, Trash2, Edit, Loader2 } from "lucide-react";
```

### Common Icons Reference

| Use Case | Icon Name |
|----------|-----------|
| Loading | `Loader2` (add `className="animate-spin"`) |
| Navigation | `Home`, `LayoutDashboard`, `Menu`, `ChevronRight` |
| Actions | `Plus`, `Edit`, `Trash2`, `Save`, `X`, `Check`, `Search` |
| User | `User`, `LogIn`, `LogOut`, `Settings`, `Bell` |
| Finance | `Wallet`, `CreditCard`, `DollarSign`, `TrendingUp`, `TrendingDown` |

### What NOT to Do
```tsx
// ❌ NEVER use raw SVG
const Icon = () => <svg>...</svg>;

// ❌ NEVER use emojis as icons
<span>👍</span>;

// ✅ ALWAYS use Lucide icons
import { ThumbsUp, Loader2 } from "lucide-react";
<ThumbsUp className="h-4 w-4" />
<Loader2 className="h-4 w-4 animate-spin" />
```

---

## Part 5: Quick Reference

### Creating New Page Checklist

- [ ] Create folder: `components/pages/feature/`
- [ ] Create main file: `index.tsx`
- [ ] Create `_components/` folder
- [ ] Create page-specific components in `_components/`
- [ ] Create skeleton in `_components/feature-skeleton.tsx`
- [ ] If component reused elsewhere → move to `shared/`

### Creating New Context Checklist

- [ ] Read backend lib files (`types.ts`, `validation.ts`, `index.ts`)
- [ ] Copy Auth Context structure
- [ ] Create folder: `components/context/feature-context/`
- [ ] Create file: `feature-context.tsx`
- [ ] Replace types with feature types
- [ ] Map backend operations to context actions

### Component Decision Tree

```
Need a component?
    ↓
Is it used by multiple pages?
    ↓                    ↓
   YES                  NO
    ↓                    ↓
Put in shared/      Put in pages/feature/_components/
    ↓                    ↓
Is it a UI component?   Is it a skeleton?
    ↓                    ↓
Use shadcn/ui         Create in _components/
```

---

## Summary Table

| ✅ DO | ❌ DON'T |
|-------|----------|
| Use Auth Context as template | Create new context patterns |
| Put page components in `pages/feature/` | Put page components in `shared/` |
| Put page-specific components in `_components/` | Mix page components across folders |
| Create skeleton per page in `_components/` | Use same skeleton for all pages |
| Move to `shared/` when reused 2+ times | Keep reusable components in `_components/` |
| Use shadcn/ui components | Create custom UI components |
| Use Lucide React icons | Use SVG or emoji icons |
| Read backend lib files first | Guess or invent types |