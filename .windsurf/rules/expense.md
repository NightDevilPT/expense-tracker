---
trigger: always_on
---

Here's the updated rule book as a clean document:

---

# Backend Rulebook — Next.js App Router API

**Version:** 3.2 | **Routing:** App Router (`app/api/`) with named method exports | **Stack:** Next.js · Prisma · Zod · JWT · Logger · ResponseService

---

## 1. Project Structure

```
app/
  api/
    auth/
      login/route.ts              ← Controller (HTTP layer only)
      request-otp/route.ts        ← Controller (HTTP layer only)
    <feature>/
      route.ts                    ← Non-dynamic controller
      [id]/route.ts               ← Dynamic route — always await params

lib/
  <feature>-service/              ← Feature folder naming: <feature>-service
    index.ts                      ← Business logic + Prisma calls
    types.ts                      ← Output types only (database/model interfaces)
    validation.ts                 ← Zod schemas + validation functions + input types

  cookie-service/index.ts         ← JWT generation & validation
  logger-service/index.ts         ← Structured console logger
  response-service/index.ts       ← Format helpers (return plain objects)
```

---

## 2. File Responsibilities

| Layer                | File                                  | Responsibility                                                       |
| -------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| **Controller**       | `app/api/<feature>/route.ts`          | Parse request, validate, call service, format + return response, log |
| **Business Logic**   | `lib/<feature>-service/index.ts`      | Prisma queries, data transformation, throw named errors              |
| **Types**            | `lib/<feature>-service/types.ts`      | **Output types ONLY** — database/model shapes, params interfaces     |
| **Validation**       | `lib/<feature>-service/validation.ts` | Zod schemas, validation functions, **input types**                   |
| **Cookie Service**   | `lib/cookie-service/index.ts`         | Token generation, validation, payload extraction                     |
| **Logger**           | `lib/logger-service/index.ts`         | Structured coloured console output                                   |
| **Response Service** | `lib/response-service/index.ts`       | Returns plain response objects — **does NOT create NextResponse**    |

### Hard Rules

- Route files must **never** contain Prisma calls.
- Service files (`lib/`) must **never** import `NextRequest`, `NextResponse`, or response helpers.
- Response helpers **return plain objects** — `NextResponse.json()` is always called in the **route file**.
- Validation must **always** use Zod in `validation.ts`.
- `types.ts` contains **only output types** (from database/models) and params interfaces like `GetCategoriesParams`, `PaginatedResult<T>`.
- `validation.ts` contains schemas, validation functions, **and input types**.

---

## 3. Response Service Pattern

> **Critical:** Response helpers return **plain objects**, not `NextResponse`. The route file always calls `NextResponse.json()`.

### 3.1 startTime Pattern

Every route handler records `startTime` at the top, passed to every format helper.

```ts
const startTime = Date.now();
```

### 3.2 Format Helper Signatures

```ts
// Success
formatSuccess(data, startTime, { message?, pagination? })
formatPaginated(data, startTime, pagination, message?)

// Errors
formatBadRequest(startTime, message, details?)
formatUnauthorized(startTime, message, details?)
formatForbidden(startTime, message, details?)
formatNotFound(startTime, message, details?)
formatConflict(startTime, message, details?)
formatTooManyRequests(startTime, message, details?)
formatInternalError(startTime, message, details?)
```

### 3.3 Usage Pattern in Route

```ts
// ✅ Correct
const response = formatSuccess(category, startTime, {
	message: "Category retrieved successfully",
});
return NextResponse.json(response, { status: HttpStatus.OK });

// ✅ Error path
const response = formatNotFound(startTime, "Category not found");
return NextResponse.json(response, { status: HttpStatus.NOT_FOUND });
```

### 3.4 formatPaginated Example

```ts
const response = formatPaginated(
	result.data,
	startTime,
	{
		page: result.page,
		limit: result.limit,
		total: result.total,
		totalPages: totalPages,
		hasNext: result.page < totalPages,
		hasPrev: result.page > 1,
	},
	"Categories retrieved successfully",
);
return NextResponse.json(response, { status: HttpStatus.OK });
```

### 3.5 HttpStatus Constants

```ts
import { HttpStatus } from "@/lib/response-service";

HttpStatus.OK; // 200
HttpStatus.CREATED; // 201
HttpStatus.BAD_REQUEST; // 400
HttpStatus.UNAUTHORIZED; // 401
HttpStatus.FORBIDDEN; // 403
HttpStatus.NOT_FOUND; // 404
HttpStatus.CONFLICT; // 409
HttpStatus.TOO_MANY_REQUESTS; // 429
HttpStatus.INTERNAL_SERVER_ERROR; // 500
```

### 3.6 When to Use Which Helper

| Situation                      | Helper                         | Status |
| ------------------------------ | ------------------------------ | ------ |
| Successful fetch or update     | `formatSuccess`                | 200    |
| Resource created               | `formatSuccess` with `CREATED` | 201    |
| List with pagination           | `formatPaginated`              | 200    |
| Zod / validation fails         | `formatBadRequest`             | 400    |
| Missing or invalid token       | `formatUnauthorized`           | 401    |
| Valid token, no permission     | `formatForbidden`              | 403    |
| Record not found               | `formatNotFound`               | 404    |
| Duplicate / already exists     | `formatConflict`               | 409    |
| Cannot delete due to relations | `formatConflict`               | 409    |
| Rate limit hit                 | `formatTooManyRequests`        | 429    |
| Unexpected server error        | `formatInternalError`          | 500    |

---

## 4. Route File Rules (Controller)

### 4.1 Structure — Non-Dynamic Route

```ts
// app/api/categories/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
	formatSuccess,
	formatPaginated,
	formatBadRequest,
	formatUnauthorized,
	formatConflict,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import { CookieService } from "@/lib/cookie-service";
import { getAllCategories, createCategory } from "@/lib/category-service";
import { validateCreateCategory } from "@/lib/category-service/validation";

const logger = new Logger("CATEGORIES-API");

export async function GET(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("GET /api/categories called");

		// Auth check
		const accessToken = req.cookies.get("accessToken")?.value;
		const refreshToken = req.cookies.get("refreshToken")?.value;
		const user = CookieService.validateTokens(accessToken, refreshToken);

		if (!user) {
			logger.warn("Unauthorized GET /api/categories");
			const response = formatUnauthorized(
				startTime,
				"Authentication required",
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		// Parse query params
		const url = new URL(req.url);
		const page = parseInt(url.searchParams.get("page") || "1");
		const limit = parseInt(url.searchParams.get("limit") || "20");
		const search = url.searchParams.get("search") || undefined;
		const type = url.searchParams.get("type") as
			| "INCOME"
			| "EXPENSE"
			| "TRANSFER"
			| undefined;

		// Validate pagination params
		if (isNaN(page) || page < 1) {
			const response = formatBadRequest(
				startTime,
				"Page must be a positive number",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		if (isNaN(limit) || limit < 1 || limit > 100) {
			const response = formatBadRequest(
				startTime,
				"Limit must be between 1 and 100",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		// Call service
		const result = await getAllCategories(user.id, {
			page,
			limit,
			search,
			type,
		});
		const totalPages = Math.ceil(result.total / result.limit);

		// Format and return
		const response = formatPaginated(
			result.data,
			startTime,
			{
				page: result.page,
				limit: result.limit,
				total: result.total,
				totalPages: totalPages,
				hasNext: result.page < totalPages,
				hasPrev: result.page > 1,
			},
			"Categories retrieved successfully",
		);
		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/categories failed", error);
		const response = formatInternalError(
			startTime,
			"Failed to retrieve categories",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}

export async function POST(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("POST /api/categories called");

		const accessToken = req.cookies.get("accessToken")?.value;
		const refreshToken = req.cookies.get("refreshToken")?.value;
		const user = CookieService.validateTokens(accessToken, refreshToken);

		if (!user) {
			logger.warn("Unauthorized POST /api/categories");
			const response = formatUnauthorized(
				startTime,
				"Authentication required",
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		const body = await req.json();
		const validatedData = validateCreateCategory(body);
		const category = await createCategory(user.id, validatedData);

		const response = formatSuccess(category, startTime, {
			message: "Category created successfully",
		});
		return NextResponse.json(response, { status: HttpStatus.CREATED });
	} catch (error: any) {
		logger.error("POST /api/categories failed", error);

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || "Invalid request data",
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		if (error.message === "ALREADY_EXISTS") {
			const response = formatConflict(
				startTime,
				"Category with this name already exists",
			);
			return NextResponse.json(response, { status: HttpStatus.CONFLICT });
		}

		const response = formatInternalError(
			startTime,
			"Failed to create category",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
```

### 4.2 Structure — Dynamic Route (`[id]`)

> **Critical:** In Next.js App Router, params arrive as a **Promise**. Always `await params` before accessing.

```ts
// app/api/categories/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
	formatSuccess,
	formatBadRequest,
	formatUnauthorized,
	formatNotFound,
	formatForbidden,
	formatConflict,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import { CookieService } from "@/lib/cookie-service";
import {
	getCategoryById,
	updateCategory,
	deleteCategory,
} from "@/lib/category-service";
import {
	validateUpdateCategory,
	validateCategoryId,
} from "@/lib/category-service/validation";

const logger = new Logger("CATEGORY-API");

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const startTime = Date.now();

	try {
		const { id } = await params; // ✅ Always await params
		logger.info("GET /api/categories/[id] called", { id });

		const accessToken = req.cookies.get("accessToken")?.value;
		const refreshToken = req.cookies.get("refreshToken")?.value;
		const user = CookieService.validateTokens(accessToken, refreshToken);

		if (!user) {
			logger.warn("Unauthorized GET /api/categories/[id]");
			const response = formatUnauthorized(
				startTime,
				"Authentication required",
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		validateCategoryId(id);
		const category = await getCategoryById(id, user.id);

		const response = formatSuccess(category, startTime, {
			message: "Category retrieved successfully",
		});
		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/categories/[id] failed", error);

		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(startTime, "Category not found");
			return NextResponse.json(response, {
				status: HttpStatus.NOT_FOUND,
			});
		}

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message,
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const response = formatInternalError(
			startTime,
			"Failed to retrieve category",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}

export async function PUT(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const startTime = Date.now();

	try {
		const { id } = await params;
		logger.info("PUT /api/categories/[id] called", { id });

		const accessToken = req.cookies.get("accessToken")?.value;
		const refreshToken = req.cookies.get("refreshToken")?.value;
		const user = CookieService.validateTokens(accessToken, refreshToken);

		if (!user) {
			logger.warn("Unauthorized PUT /api/categories/[id]");
			const response = formatUnauthorized(
				startTime,
				"Authentication required",
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		const body = await req.json();
		const validatedData = validateUpdateCategory(body);
		const category = await updateCategory(id, user.id, validatedData);

		const response = formatSuccess(category, startTime, {
			message: "Category updated successfully",
		});
		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("PUT /api/categories/[id] failed", error);

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message,
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(startTime, "Category not found");
			return NextResponse.json(response, {
				status: HttpStatus.NOT_FOUND,
			});
		}

		if (error.message === "ALREADY_EXISTS") {
			const response = formatConflict(
				startTime,
				"Category with this name already exists",
			);
			return NextResponse.json(response, { status: HttpStatus.CONFLICT });
		}

		const response = formatInternalError(
			startTime,
			"Failed to update category",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const startTime = Date.now();

	try {
		const { id } = await params;
		logger.info("DELETE /api/categories/[id] called", { id });

		const accessToken = req.cookies.get("accessToken")?.value;
		const refreshToken = req.cookies.get("refreshToken")?.value;
		const user = CookieService.validateTokens(accessToken, refreshToken);

		if (!user) {
			logger.warn("Unauthorized DELETE /api/categories/[id]");
			const response = formatUnauthorized(
				startTime,
				"Authentication required",
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		await deleteCategory(id, user.id);

		const response = formatSuccess(null, startTime, {
			message: "Category deleted successfully",
		});
		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("DELETE /api/categories/[id] failed", error);

		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(startTime, "Category not found");
			return NextResponse.json(response, {
				status: HttpStatus.NOT_FOUND,
			});
		}

		if (error.message === "FORBIDDEN") {
			const response = formatForbidden(
				startTime,
				"Cannot delete default categories",
			);
			return NextResponse.json(response, {
				status: HttpStatus.FORBIDDEN,
			});
		}

		if (error.message === "CONFLICT") {
			const response = formatConflict(
				startTime,
				"Cannot delete category with existing transactions",
			);
			return NextResponse.json(response, { status: HttpStatus.CONFLICT });
		}

		if (error.name === "ZodError") {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message,
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const response = formatInternalError(
			startTime,
			"Failed to delete category",
		);
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
```

### 4.3 Setting Cookies in Response (Login Flow)

```ts
const response = formatSuccess({ user: userData }, startTime, {
	message: "Login successful",
});

const nextResponse = NextResponse.json(response, { status: HttpStatus.OK });

nextResponse.cookies.set("accessToken", tokens.accessToken, {
	httpOnly: true,
	path: "/",
	maxAge: 10 * 60,
	sameSite: "lax",
	secure: process.env.NODE_ENV === "production",
});

nextResponse.cookies.set("refreshToken", tokens.refreshToken, {
	httpOnly: true,
	path: "/",
	maxAge: 12 * 60,
	sameSite: "lax",
	secure: process.env.NODE_ENV === "production",
});

return nextResponse;
```

---

## 5. Lib Feature File Rules (Business Logic)

Every service folder under `lib/` contains exactly three files:

```
lib/<feature>-service/
  types.ts        ← Output types + params interfaces
  validation.ts   ← Zod schemas + validation functions + input types
  index.ts        ← Prisma calls and business logic
```

### 5.1 `types.ts` — Output Types Only

```ts
// lib/category-service/types.ts

export interface Category {
	id: string;
	name: string;
	type: "INCOME" | "EXPENSE" | "TRANSFER";
	icon: string | null;
	color: string | null;
	isDefault: boolean;
	order: number;
	userId: string | null;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface CategoryWithStats extends Category {
	transactionCount?: number;
	totalAmount?: number;
}

export interface GetCategoriesParams {
	page?: number;
	limit?: number;
	search?: string;
	type?: "INCOME" | "EXPENSE" | "TRANSFER";
}

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
}
```

**Rules:**

- Output/database types only.
- Include params interfaces and pagination types.
- No imports from `./validation`.
- No logic, no Prisma imports, no Next.js imports.

### 5.2 `validation.ts` — Zod Schemas + Input Types

```ts
// lib/category-service/validation.ts

import { z } from "zod";

// ==================== SCHEMAS ====================

export const createCategorySchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(50, "Name must be 50 characters or less"),
	type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
	icon: z.string().max(50).nullable().optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
		.nullable()
		.optional(),
	order: z.number().int().min(0).default(0).optional(),
});

export const updateCategorySchema = z
	.object({
		name: z
			.string()
			.min(1, "Name is required")
			.max(50, "Name must be 50 characters or less")
			.optional(),
		icon: z.string().max(50).nullable().optional(),
		color: z
			.string()
			.regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
			.nullable()
			.optional(),
		order: z.number().int().min(0).optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided for update",
	});

export const categoryIdSchema = z.string().cuid("Invalid category ID format");

// ==================== VALIDATION FUNCTIONS ====================

export function validateCreateCategory(data: unknown): CreateCategoryInput {
	return createCategorySchema.parse(data);
}

export function validateUpdateCategory(data: unknown): UpdateCategoryInput {
	return updateCategorySchema.parse(data);
}

export function validateCategoryId(id: string): void {
	categoryIdSchema.parse(id);
}

// ==================== INPUT TYPES ====================

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
```

**Rules:**

- Zod exclusively — no manual validation logic.
- `.parse()` throws `ZodError` automatically.
- Export input types using `z.infer`.
- Only import from `"zod"`.

### 5.3 `index.ts` — Business Logic

```ts
// lib/category-service/index.ts

import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/logger-service";
import {
	validateCreateCategory,
	validateUpdateCategory,
	validateCategoryId,
	type CreateCategoryInput,
	type UpdateCategoryInput,
} from "./validation";
import type { Category, GetCategoriesParams, PaginatedResult } from "./types";

const logger = new Logger("CATEGORY-SERVICE");

export async function getAllCategories(
	userId: string,
	params: GetCategoriesParams = {},
): Promise<PaginatedResult<Category>> {
	const page = Math.max(1, params.page || 1);
	const limit = Math.min(100, Math.max(1, params.limit || 20));
	const skip = (page - 1) * limit;

	logger.info("Fetching all categories", {
		userId,
		page,
		limit,
		search: params.search,
		type: params.type,
	});

	const where: any = {
		OR: [{ userId: userId }, { isDefault: true }],
	};

	if (params.search) {
		where.name = { contains: params.search, mode: "insensitive" };
	}

	if (params.type) {
		where.type = params.type;
	}

	const total = await prisma.category.count({ where });
	const categories = await prisma.category.findMany({
		where,
		skip,
		take: limit,
		orderBy: [{ order: "asc" }, { name: "asc" }],
	});

	logger.info("Categories fetched successfully", {
		count: categories.length,
		total,
		page,
		limit,
	});

	return { data: categories, total, page, limit };
}

export async function getCategoryById(
	id: string,
	userId: string,
): Promise<Category> {
	logger.info("Fetching category by ID", { id, userId });

	validateCategoryId(id);

	const category = await prisma.category.findFirst({
		where: { id, OR: [{ userId: userId }, { isDefault: true }] },
	});

	if (!category) {
		logger.warn("Category not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	logger.info("Category fetched successfully", { id });
	return category;
}

export async function createCategory(
	userId: string,
	data: CreateCategoryInput,
): Promise<Category> {
	logger.info("Creating new category", { userId, name: data.name });

	const validatedData = validateCreateCategory(data);

	const existingCategory = await prisma.category.findFirst({
		where: { userId: userId, name: validatedData.name },
	});

	if (existingCategory) {
		logger.warn("Category already exists", {
			userId,
			name: validatedData.name,
		});
		throw new Error("ALREADY_EXISTS");
	}

	const category = await prisma.category.create({
		data: {
			name: validatedData.name,
			type: validatedData.type,
			icon: validatedData.icon || null,
			color: validatedData.color || null,
			order: validatedData.order || 0,
			userId: userId,
			isDefault: false,
		},
	});

	logger.info("Category created successfully", {
		id: category.id,
		name: category.name,
	});
	return category;
}

export async function updateCategory(
	id: string,
	userId: string,
	data: UpdateCategoryInput,
): Promise<Category> {
	logger.info("Updating category", { id, userId });

	validateCategoryId(id);
	const validatedData = validateUpdateCategory(data);

	const existingCategory = await prisma.category.findFirst({
		where: { id, userId: userId },
	});

	if (!existingCategory) {
		logger.warn("Category not found or access denied", { id, userId });
		throw new Error("NOT_FOUND");
	}

	if (validatedData.name && validatedData.name !== existingCategory.name) {
		const duplicateCategory = await prisma.category.findFirst({
			where: {
				userId: userId,
				name: validatedData.name,
				id: { not: id },
			},
		});

		if (duplicateCategory) {
			logger.warn("Category name already exists", {
				userId,
				name: validatedData.name,
			});
			throw new Error("ALREADY_EXISTS");
		}
	}

	const category = await prisma.category.update({
		where: { id },
		data: validatedData,
	});

	logger.info("Category updated successfully", { id, name: category.name });
	return category;
}

export async function deleteCategory(
	id: string,
	userId: string,
): Promise<void> {
	logger.info("Deleting category", { id, userId });

	validateCategoryId(id);

	const category = await prisma.category.findFirst({
		where: { id, userId: userId },
	});

	if (!category) {
		logger.warn("Category not found or access denied", { id, userId });
		throw new Error("NOT_FOUND");
	}

	if (category.isDefault) {
		logger.warn("Cannot delete default category", { id, userId });
		throw new Error("FORBIDDEN");
	}

	const transactionCount = await prisma.transaction.count({
		where: { categoryId: id },
	});

	if (transactionCount > 0) {
		logger.warn("Category has transactions, cannot delete", {
			id,
			transactionCount,
		});
		throw new Error("CONFLICT");
	}

	await prisma.category.delete({ where: { id } });
	logger.info("Category deleted successfully", { id });
}
```

**Rules:**

- All Prisma calls live **only** here — never in route files.
- Always call validation at the start of each function.
- Throw named string errors for known failure states.
- Import input types from `./validation`, output types from `./types`.
- Never import `NextRequest`, `NextResponse`, or response helpers.

### 5.4 Transactions

```ts
const result = await prisma.$transaction(async (tx) => {
	await tx.oTPSession.updateMany({
		where: { email, deletedAt: null },
		data: { deletedAt: new Date() },
	});

	const session = await tx.oTPSession.create({
		data: { email, otpCode, expiresAt },
	});

	return session;
});
```

### 5.5 Import Flow

```
app/api/<feature>/route.ts
  ├── imports validateX()         from lib/<feature>-service/validation.ts
  ├── imports service functions   from lib/<feature>-service/index.ts
  ├── imports format helpers      from lib/response-service
  ├── imports Logger              from lib/logger-service
  └── imports CookieService       from lib/cookie-service

lib/<feature>-service/index.ts
  ├── imports validateX() + input types   from ./validation
  ├── imports output types                from ./types
  ├── imports Logger                      from lib/logger-service
  └── imports prisma                      from lib/prisma

lib/<feature>-service/validation.ts
  └── imports z from "zod" ONLY

lib/<feature>-service/types.ts
  └── no imports (or Prisma types only)
```

---

## 6. Logging Rules

### 6.1 Logger Instance

```ts
const logger = new Logger("CATEGORIES-API"); // route file (uppercase feature-API)
const logger = new Logger("CATEGORY-SERVICE"); // lib service file (uppercase feature-SERVICE)
```

### 6.2 Log Levels and When to Use Them

| Level   | When                                      | Example                                              |
| ------- | ----------------------------------------- | ---------------------------------------------------- |
| `info`  | Request received, key steps, success      | `logger.info("GET /api/categories called")`          |
| `warn`  | Auth failure, suspicious input, not found | `logger.warn("Category not found", { id, userId })`  |
| `error` | Caught exceptions                         | `logger.error("POST /api/categories failed", error)` |
| `debug` | Dev tracing, intermediate values          | `logger.debug("Generated OTP", { expiresAt })`       |

### 6.3 Rules

- Log at the **start** of every handler (`info`).
- Log in every `catch` block before sending an error response (`error`).
- Log every auth failure (`warn`).
- Log when records are not found (`warn`).
- Pass context as the **second argument** — never string-interpolate it into the message.
- **Never log** passwords, tokens, OTP codes (in production), or sensitive fields.

```ts
// ✅ Correct
logger.info("OTP session created", { email, otpId: session.id, expiresAt });

// ❌ Wrong
logger.info(`OTP session created: ${JSON.stringify(session)}`);
```

### 6.4 Masking Sensitive Values

```ts
logger.debug("Generated OTP", {
	email,
	otpCode: process.env.NODE_ENV === "development" ? otpCode : "***HIDDEN***",
	expiresAt,
});
```

---

## 7. Authentication Rules

### 7.1 Token Extraction

```ts
const accessToken = req.cookies.get("accessToken")?.value;
const refreshToken = req.cookies.get("refreshToken")?.value;
const user = CookieService.validateTokens(accessToken, refreshToken);

if (!user) {
	logger.warn("Unauthorized POST /api/categories");
	const response = formatUnauthorized(startTime, "Authentication required");
	return NextResponse.json(response, { status: HttpStatus.UNAUTHORIZED });
}
```

### 7.2 Public Routes

Routes that do not require authentication must **omit** the auth check block entirely.

### 7.3 Row-Level Security Pattern

Always include user ID in `where` clauses for protected resources:

```ts
// ✅ Correct — user can only access their own data
const category = await prisma.category.findFirst({
	where: { id, OR: [{ userId: userId }, { isDefault: true }] },
});

// ✅ Correct — create with user ID
await prisma.category.create({
	data: { ...validatedData, userId: userId },
});
```

---

## 8. Error Handling Contract

### 8.1 Named Errors from Lib

| Lib throws                   | Route maps to        | Status |
| ---------------------------- | -------------------- | ------ |
| `"NOT_FOUND"`                | `formatNotFound`     | 404    |
| `"ALREADY_EXISTS"`           | `formatConflict`     | 409    |
| `"UNAUTHORIZED"`             | `formatUnauthorized` | 401    |
| `"FORBIDDEN"`                | `formatForbidden`    | 403    |
| `"CONFLICT"`                 | `formatConflict`     | 409    |
| `ZodError` (from `.parse()`) | `formatBadRequest`   | 400    |

### 8.2 Catch Block Pattern

```ts
} catch (error: any) {
    logger.error("POST /api/categories failed", error);

    // 1. Zod validation errors
    if (error.name === "ZodError") {
        const response = formatBadRequest(startTime, error.errors?.[0]?.message);
        return NextResponse.json(response, { status: HttpStatus.BAD_REQUEST });
    }

    // 2. Named business logic errors
    if (error.message === "NOT_FOUND") {
        const response = formatNotFound(startTime, "Category not found");
        return NextResponse.json(response, { status: HttpStatus.NOT_FOUND });
    }

    if (error.message === "ALREADY_EXISTS") {
        const response = formatConflict(startTime, "Category with this name already exists");
        return NextResponse.json(response, { status: HttpStatus.CONFLICT });
    }

    if (error.message === "FORBIDDEN") {
        const response = formatForbidden(startTime, "Cannot delete default categories");
        return NextResponse.json(response, { status: HttpStatus.FORBIDDEN });
    }

    if (error.message === "CONFLICT") {
        const response = formatConflict(startTime, "Cannot delete category with existing transactions");
        return NextResponse.json(response, { status: HttpStatus.CONFLICT });
    }

    // 3. Fallback
    const response = formatInternalError(startTime, "Operation failed");
    return NextResponse.json(response, { status: HttpStatus.INTERNAL_SERVER_ERROR });
}
```

### 8.3 Never Expose Raw Errors

Never return `error.message` directly from unknown errors. Only map known named errors.

---

## 9. Quick Reference Cheatsheet

### Full Request Lifecycle

```
REQUEST COMES IN
      │
      ▼
export async function GET/POST/PUT/DELETE(req: NextRequest)
  │
  ├── const startTime = Date.now()
  ├── logger.info("METHOD /api/<feature> called")
  ├── CookieService.validateTokens() → if null AND protected → formatUnauthorized + return
  ├── const { id } = await params  ← dynamic routes ONLY
  ├── validateCategoryId(id)       ← dynamic routes ONLY
  ├── const body = await req.json()
  ├── validateCreateCategory(body) ← throws ZodError if invalid
  ├── call lib/<feature>-service/index.ts function
  │         ├── validates internally
  │         ├── calls Prisma
  │         └── throws named errors on failure
  ├── logger.info("Operation successful", { id })
  ├── const response = formatSuccess(data, startTime, { message })
  └── return NextResponse.json(response, { status: HttpStatus.OK })
        │
        └── catch (error: any)
              ├── logger.error("... failed", error)
              ├── ZodError           → formatBadRequest   → 400
              ├── "NOT_FOUND"        → formatNotFound     → 404
              ├── "ALREADY_EXISTS"   → formatConflict     → 409
              ├── "FORBIDDEN"        → formatForbidden    → 403
              ├── "CONFLICT"         → formatConflict     → 409
              └── fallback           → formatInternalError → 500
```

### File Quick Reference

```
lib/<feature>-service/
├── types.ts        → OUTPUT types + params interfaces
├── validation.ts   → Zod schemas + validation functions + INPUT types
└── index.ts        → Business logic (Prisma calls, named errors)
```

### Type Separation Rule

| File            | Contains                                          | Imports From                                                 |
| --------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| `types.ts`      | Output types, params interfaces, pagination types | Nothing (or Prisma types only)                               |
| `validation.ts` | Zod schemas, validation functions, input types    | `"zod"` only                                                 |
| `index.ts`      | Business logic                                    | Input types from `./validation`, output types from `./types` |

### Always / Never Summary

| ✅ Always                                                   | ❌ Never                                                  |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| Use named exports: `export async function GET/POST/...`     | Use `export default function handler`                     |
| Record `const startTime = Date.now()` at handler top        | Forget `startTime` — all format helpers need it           |
| `await params` in every dynamic route handler               | Access `params.id` without awaiting                       |
| Wrap every handler in `try-catch`                           | Leave a handler without a `try-catch`                     |
| Call `NextResponse.json(formatX(...), { status })` in route | Call format helpers expecting them to return NextResponse |
| Use `HttpStatus` constants for status codes                 | Hard-code status numbers like `200`, `400`                |
| Use Zod for all validation                                  | Write manual validation logic                             |
| Export input types from `validation.ts`                     | Export input types from `types.ts`                        |
| Export output types from `types.ts`                         | Import input types in `types.ts`                          |
| Throw named string errors from `index.ts`                   | Import `NextRequest` or `NextResponse` in lib files       |
| Log at the start of every handler                           | Log passwords, tokens, OTP codes, or secrets              |
| Pass context as second arg to logger                        | String-interpolate context into log messages              |
| Check `error.name === "ZodError"` in catch                  | Return `error.message` directly from unknown errors       |
| Use `prisma.$transaction` for multi-step writes             | Perform multi-step writes outside a transaction           |
| Include user ID in all Prisma `where` clauses for security  | Forget row-level security checks                          |

