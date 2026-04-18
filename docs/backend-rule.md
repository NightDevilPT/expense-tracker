---
trigger: always_on
---

# Backend Rulebook — Next.js App Router API

> **Version:** 3.1
> **Routing:** App Router (`app/api/`) with named method exports
> **Stack:** Next.js · Prisma · Zod · JWT (CookieService) · Logger · ResponseService (format-based)

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [File Responsibilities](#2-file-responsibilities)
3. [Response Service Pattern](#3-response-service-pattern)
4. [Route File Rules (Controller)](#4-route-file-rules-controller)
5. [Lib Feature File Rules (Business Logic)](#5-lib-feature-file-rules-business-logic)
6. [Logging Rules](#6-logging-rules)
7. [Authentication Rules](#7-authentication-rules)
8. [Error Handling Contract](#8-error-handling-contract)
9. [Quick Reference Cheatsheet](#9-quick-reference-cheatsheet)

---

## 1. Project Structure

```
app/
  api/
    auth/
      login/
        route.ts              ← Controller (HTTP layer only)
      request-otp/
        route.ts              ← Controller (HTTP layer only)
    <feature>/
      route.ts                ← Non-dynamic controller
      [id]/
        route.ts              ← Dynamic route — always await params

lib/
  <feature>-service/          ← Feature folder naming: <n>-service
    index.ts                  ← Business logic + Prisma calls
    types.ts                  ← Output types only (database/model interfaces)
    validation.ts             ← Zod schemas + validation functions + input types

  cookie-service/
    index.ts                  ← JWT generation & validation

  logger-service/
    index.ts                  ← Structured console logger

  response-service/
    index.ts                  ← Format helpers (return plain objects, not NextResponse)

interface/
  api.interface.ts            ← Shared API response types
```

---

## 2. File Responsibilities

| Layer                | File                                  | Responsibility                                                         |
| -------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| **Controller**       | `app/api/<feature>/route.ts`          | Parse request, validate, call service, format + return response, log   |
| **Business Logic**   | `lib/<feature>-service/index.ts`      | Prisma queries, data transformation, throw named errors                |
| **Types**            | `lib/<feature>-service/types.ts`      | **Output types ONLY** — interfaces for database/model shapes           |
| **Validation**       | `lib/<feature>-service/validation.ts` | Zod schemas, validation functions, **input types** (inferred from Zod) |
| **Cookie Service**   | `lib/cookie-service/index.ts`         | Token generation, validation, payload extraction                       |
| **Logger**           | `lib/logger-service/index.ts`         | Structured coloured console output                                     |
| **Response Service** | `lib/response-service/index.ts`       | Returns plain response objects — **does NOT create NextResponse**      |

### Hard Rules

- Route files must **never** contain Prisma calls.
- Service files (`lib/`) must **never** import `NextRequest`, `NextResponse`, or response helpers.
- Response helpers **return plain objects** — `NextResponse.json()` is always called in the **route file**.
- Validation must **always** use Zod in `validation.ts`.
- `types.ts` contains **only output types** (from database/models).
- `validation.ts` contains schemas, validation functions, **and input types**.

---

## 3. Response Service Pattern

> **Critical:** This project uses a **format-then-respond** pattern. Response helpers return **plain objects**, not `NextResponse`. The route file is always responsible for calling `NextResponse.json(response, { status })`.

### 3.1 startTime Pattern

Every route handler must record `startTime` at the top. This is passed to every format helper for execution time tracking.

```ts
const startTime = Date.now();
```

### 3.2 Format Helper Signatures

```ts
// Success
formatSuccess(data, startTime, { message?, pagination? })   → ApiSuccessResponse
formatPaginated(data, startTime, pagination, message?)      → ApiSuccessResponse

// Errors
formatBadRequest(startTime, message, details?)              → ApiErrorResponse
formatUnauthorized(startTime, message, details?)            → ApiErrorResponse
formatForbidden(startTime, message, details?)               → ApiErrorResponse
formatNotFound(startTime, message, details?)                → ApiErrorResponse
formatConflict(startTime, message, details?)                → ApiErrorResponse
formatTooManyRequests(startTime, message, details?)         → ApiErrorResponse
formatInternalError(startTime, message, details?)           → ApiErrorResponse
```

### 3.3 Usage Pattern in Route

```ts
// ✅ Correct — format then respond
const response = formatSuccess({ user: userData }, startTime, {
	message: "Login successful",
});
return NextResponse.json(response, { status: HttpStatus.OK });

// ✅ Correct — error path
const response = formatBadRequest(startTime, "Invalid OTP format");
return NextResponse.json(response, { status: HttpStatus.BAD_REQUEST });

// ❌ Wrong — never call res.status().json() directly
// ❌ Wrong — never pass res to format helpers
```

### 3.4 HttpStatus Constants

Always use `HttpStatus` constants — never hard-code status numbers.

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

### 3.5 When to Use Which Helper

| Situation                  | Helper                                | Status |
| -------------------------- | ------------------------------------- | ------ |
| Successful fetch or update | `formatSuccess`                       | 200    |
| Resource created           | `formatSuccess` with `CREATED` status | 201    |
| List with pagination       | `formatPaginated`                     | 200    |
| Zod / validation fails     | `formatBadRequest`                    | 400    |
| Invalid body or params     | `formatBadRequest`                    | 400    |
| Missing or invalid token   | `formatUnauthorized`                  | 401    |
| Valid token, no permission | `formatForbidden`                     | 403    |
| Record not found           | `formatNotFound`                      | 404    |
| Duplicate / already exists | `formatConflict`                      | 409    |
| Rate limit hit             | `formatTooManyRequests`               | 429    |
| Unexpected server error    | `formatInternalError`                 | 500    |

---

## 4. Route File Rules (Controller)

### 4.1 Structure — Non-Dynamic Route

Use `export async function` named exports directly for each HTTP method.

```ts
// app/api/<feature>/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import { CookieService } from "@/lib/cookie-service";
import {
	formatSuccess,
	formatBadRequest,
	formatUnauthorized,
	formatConflict,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import { getAllFeatures, createFeature } from "@/lib/<feature>-service";
import { validateCreateFeature } from "@/lib/<feature>-service/validation";

const logger = new Logger("FEATURE");

export async function GET(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("GET /api/<feature> called");

		const accessToken = req.cookies.get("accessToken")?.value;
		const refreshToken = req.cookies.get("refreshToken")?.value;
		const user = CookieService.validateTokens(accessToken, refreshToken);

		if (!user) {
			logger.warn("Unauthorized GET /api/<feature>");
			const response = formatUnauthorized(
				startTime,
				"Authentication required",
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		const data = await getAllFeatures(user.id);
		logger.info("Fetched successfully", { count: data.length });

		const response = formatSuccess(data, startTime, {
			message: "Fetched successfully",
		});
		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/<feature> failed", error);
		const response = formatInternalError(startTime, "Failed to fetch");
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}

export async function POST(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("POST /api/<feature> called");

		const accessToken = req.cookies.get("accessToken")?.value;
		const refreshToken = req.cookies.get("refreshToken")?.value;
		const user = CookieService.validateTokens(accessToken, refreshToken);

		if (!user) {
			logger.warn("Unauthorized POST /api/<feature>");
			const response = formatUnauthorized(
				startTime,
				"Authentication required",
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		const body = await req.json();
		const validatedData = validateCreateFeature(body); // Throws ZodError if invalid

		const created = await createFeature({
			...validatedData,
			userId: user.id,
		});
		logger.info("Created successfully", { id: created.id });

		const response = formatSuccess(created, startTime, {
			message: "Created successfully",
		});
		return NextResponse.json(response, { status: HttpStatus.CREATED });
	} catch (error: any) {
		logger.error("POST /api/<feature> failed", error);

		if (
			error.name === "ZodError" ||
			error.message?.includes("Validation")
		) {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || error.message,
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		if (error.message === "ALREADY_EXISTS") {
			const response = formatConflict(
				startTime,
				"Resource already exists",
			);
			return NextResponse.json(response, { status: HttpStatus.CONFLICT });
		}

		const response = formatInternalError(startTime, "Failed to create");
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
```

### 4.2 Structure — Dynamic Route (`[id]`)

> In the App Router, route segment params arrive as a **Promise**. Always `await params` before accessing any value.

```ts
// app/api/<feature>/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import { CookieService } from "@/lib/cookie-service";
import {
	formatSuccess,
	formatBadRequest,
	formatUnauthorized,
	formatNotFound,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import { getFeatureById, deleteFeature } from "@/lib/<feature>-service";
import { validateId } from "@/lib/<feature>-service/validation";

const logger = new Logger("FEATURE");

// ✅ params is a Promise in App Router — must always be awaited
export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const startTime = Date.now();

	try {
		const { id } = await params;
		logger.info("GET /api/<feature>/[id] called", { id });

		const accessToken = req.cookies.get("accessToken")?.value;
		const refreshToken = req.cookies.get("refreshToken")?.value;
		const user = CookieService.validateTokens(accessToken, refreshToken);

		if (!user) {
			logger.warn("Unauthorized GET /api/<feature>/[id]");
			const response = formatUnauthorized(
				startTime,
				"Authentication required",
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		validateId(id); // Throws ZodError if invalid UUID

		const item = await getFeatureById(id, user.id);
		logger.info("Fetched successfully", { id });

		const response = formatSuccess(item, startTime, {
			message: "Fetched successfully",
		});
		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("GET /api/<feature>/[id] failed", error);

		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(startTime, "Resource not found");
			return NextResponse.json(response, {
				status: HttpStatus.NOT_FOUND,
			});
		}
		if (
			error.name === "ZodError" ||
			error.message?.includes("Invalid ID")
		) {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || error.message,
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const response = formatInternalError(startTime, "Failed to fetch");
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
		logger.info("DELETE /api/<feature>/[id] called", { id });

		const accessToken = req.cookies.get("accessToken")?.value;
		const refreshToken = req.cookies.get("refreshToken")?.value;
		const user = CookieService.validateTokens(accessToken, refreshToken);

		if (!user) {
			logger.warn("Unauthorized DELETE /api/<feature>/[id]");
			const response = formatUnauthorized(
				startTime,
				"Authentication required",
			);
			return NextResponse.json(response, {
				status: HttpStatus.UNAUTHORIZED,
			});
		}

		validateId(id);
		await deleteFeature(id, user.id);
		logger.info("Deleted successfully", { id });

		const response = formatSuccess(null, startTime, {
			message: "Deleted successfully",
		});
		return NextResponse.json(response, { status: HttpStatus.OK });
	} catch (error: any) {
		logger.error("DELETE /api/<feature>/[id] failed", error);

		if (error.message === "NOT_FOUND") {
			const response = formatNotFound(startTime, "Resource not found");
			return NextResponse.json(response, {
				status: HttpStatus.NOT_FOUND,
			});
		}
		if (
			error.name === "ZodError" ||
			error.message?.includes("Invalid ID")
		) {
			const response = formatBadRequest(
				startTime,
				error.errors?.[0]?.message || error.message,
			);
			return NextResponse.json(response, {
				status: HttpStatus.BAD_REQUEST,
			});
		}

		const response = formatInternalError(startTime, "Failed to delete");
		return NextResponse.json(response, {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
	}
}
```

> ❌ **Never** access params without awaiting:
>
> ```ts
> // Wrong — breaks in Next.js 15+
> export async function GET(
> 	req: NextRequest,
> 	{ params }: { params: { id: string } },
> ) {
> 	const { id } = params; // ❌
> }
> ```

### 4.3 Setting Cookies in Response (Login Flow)

When a route needs to set cookies (e.g., after login), create a `NextResponse` from the formatted response object first, then attach cookies:

```ts
const response = formatSuccess({ user: userData }, startTime, {
	message: "Login successful",
});

const nextResponse = NextResponse.json(response, { status: HttpStatus.OK });

nextResponse.cookies.set("accessToken", tokens.accessToken, {
	httpOnly: true,
	path: "/",
	maxAge: 10 * 60, // 10 minutes
	sameSite: "lax",
	secure: process.env.NODE_ENV === "production",
});

nextResponse.cookies.set("refreshToken", tokens.refreshToken, {
	httpOnly: true,
	path: "/",
	maxAge: 12 * 60, // 12 minutes
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
  types.ts        ← Output types only (database/model interfaces)
  validation.ts   ← Zod schemas + validation functions + input types
  index.ts        ← Prisma calls and business logic
```

---

### 5.1 `types.ts` — Output Types Only

Define **only** types that represent what comes **out of the database**.

```ts
// lib/<feature>-service/types.ts

export interface Feature {
	id: string;
	name: string;
	amount: number;
	userId: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface FeatureWithRelations extends Feature {
	user?: {
		id: string;
		name: string;
		email: string;
	};
}

// ❌ NEVER re-export input types from validation here
// export type { CreateFeatureInput } from "./validation"; // WRONG
```

**Rules:**

- Output/database types only.
- No imports from `./validation`.
- No logic, no Prisma imports, no Next.js imports.

---

### 5.2 `validation.ts` — Zod Schemas + Input Types

All Zod schemas, validation functions, and input types live here. Validation functions **throw** on failure.

```ts
// lib/<feature>-service/validation.ts

import { z } from "zod";

// ==================== SCHEMAS ====================

export const createFeatureSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(100, "Name must be 100 characters or fewer"),
	amount: z
		.number()
		.positive("Amount must be positive")
		.min(0.01, "Amount must be at least 0.01"),
	category: z.string().max(50).optional(),
});

export const updateFeatureSchema = z
	.object({
		name: z.string().min(1).max(100).optional(),
		amount: z.number().positive().min(0.01).optional(),
		category: z.string().max(50).optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided for update",
	});

export const idSchema = z.string().uuid("Invalid ID format");

// ==================== VALIDATION FUNCTIONS ====================

export function validateCreateFeature(data: unknown): CreateFeatureInput {
	return createFeatureSchema.parse(data); // Throws ZodError if invalid
}

export function validateUpdateFeature(data: unknown): UpdateFeatureInput {
	return updateFeatureSchema.parse(data);
}

export function validateId(id: string): void {
	idSchema.parse(id);
}

// ==================== INPUT TYPES ====================

export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;
export type UpdateFeatureInput = z.infer<typeof updateFeatureSchema>;
```

**Rules:**

- Zod exclusively — no manual validation logic.
- `.parse()` throws `ZodError` automatically — never return error strings.
- Export input types directly from this file using `z.infer`.
- Only import from `"zod"` — no Prisma, no Next.js, no response helpers.

---

### 5.3 `index.ts` — Business Logic

```ts
// lib/<feature>-service/index.ts

import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/logger-service";
import {
	validateCreateFeature,
	validateUpdateFeature,
	validateId,
	type CreateFeatureInput,
	type UpdateFeatureInput,
} from "./validation";
import type { Feature } from "./types";

const logger = new Logger("FEATURE-SERVICE");

export async function getAllFeatures(userId: string): Promise<Feature[]> {
	logger.info("Fetching all features", { userId });
	return await prisma.feature.findMany({ where: { userId } });
}

export async function getFeatureById(
	id: string,
	userId: string,
): Promise<Feature> {
	validateId(id);

	const item = await prisma.feature.findFirst({ where: { id, userId } });
	if (!item) throw new Error("NOT_FOUND");

	return item;
}

export async function createFeature(
	data: CreateFeatureInput & { userId: string },
): Promise<Feature> {
	const validatedData = validateCreateFeature(data);
	return await prisma.feature.create({ data: validatedData });
}

export async function updateFeature(
	id: string,
	userId: string,
	data: UpdateFeatureInput,
): Promise<Feature> {
	validateId(id);
	const validatedData = validateUpdateFeature(data);

	const item = await prisma.feature.findFirst({ where: { id, userId } });
	if (!item) throw new Error("NOT_FOUND");

	return await prisma.feature.update({ where: { id }, data: validatedData });
}

export async function deleteFeature(id: string, userId: string): Promise<void> {
	validateId(id);

	const item = await prisma.feature.findFirst({ where: { id, userId } });
	if (!item) throw new Error("NOT_FOUND");

	await prisma.feature.delete({ where: { id } });
}
```

**Rules:**

- All Prisma calls live **only** here — never in route files.
- Always call validation at the start of each function.
- Throw named string errors for known failure states (see section 8).
- Import input types from `./validation`, output types from `./types`.
- Never import `NextRequest`, `NextResponse`, or response helpers.

---

### 5.4 Transactions

Use `prisma.$transaction` for multi-step operations that must succeed or fail atomically.

```ts
const result = await prisma.$transaction(async (tx) => {
	// Step 1 — invalidate old records
	await tx.oTPSession.updateMany({
		where: { email, deletedAt: null },
		data: { deletedAt: new Date() },
	});

	// Step 2 — create new record
	const session = await tx.oTPSession.create({
		data: { email, otpCode, expiresAt },
	});

	return session;
});
```

---

### 5.5 Import Flow

```
app/api/<feature>/route.ts
  ├── imports validateX()         from  lib/<feature>-service/validation.ts
  ├── imports service functions   from  lib/<feature>-service/index.ts
  ├── imports format helpers      from  lib/response-service
  ├── imports Logger              from  lib/logger-service
  └── imports CookieService       from  lib/cookie-service

lib/<feature>-service/index.ts
  ├── imports validateX() + input types   from  ./validation
  ├── imports output types                from  ./types
  ├── imports Logger                      from  lib/logger-service
  └── imports prisma                      from  lib/prisma

lib/<feature>-service/validation.ts
  └── imports z from "zod" ONLY

lib/<feature>-service/types.ts
  └── no imports (or Prisma types only)
```

---

## 6. Logging Rules

### 6.1 Logger Instance

Create one logger per file using the **uppercase** service name:

```ts
const logger = new Logger("REQUEST-OTP"); // route file
const logger = new Logger("USER-SERVICE"); // lib service file
```

### 6.2 Log Levels and When to Use Them

| Level   | When                                 | Example                                              |
| ------- | ------------------------------------ | ---------------------------------------------------- |
| `info`  | Request received, key steps, success | `logger.info("POST /api/auth/login called")`         |
| `warn`  | Auth failure, suspicious input       | `logger.warn("Unauthorized GET /api/expense")`       |
| `error` | Caught exceptions                    | `logger.error("POST /api/auth/login failed", error)` |
| `debug` | Dev tracing, intermediate values     | `logger.debug("Generated OTP", { expiresAt })`       |

### 6.3 Rules

- Log at the **start** of every handler (`info`).
- Log in every `catch` block before sending an error response (`error`).
- Log every auth failure (`warn`).
- Pass context as the **second argument** — never string-interpolate it into the message.
- **Never log** passwords, tokens, OTP codes (in production), or any sensitive fields.

```ts
// ✅ Correct
logger.info("OTP session created", { email, otpId: session.id, expiresAt });

// ❌ Wrong
logger.info(`OTP session created: ${JSON.stringify(session)}`);
```

### 6.4 Masking Sensitive Values

When you need to log something that may be sensitive, mask it explicitly:

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

Read tokens from `httpOnly` cookies on every protected route:

```ts
const accessToken = req.cookies.get("accessToken")?.value;
const refreshToken = req.cookies.get("refreshToken")?.value;
const user = CookieService.validateTokens(accessToken, refreshToken);

if (!user) {
	logger.warn("Unauthorized POST /api/<feature>");
	const response = formatUnauthorized(startTime, "Authentication required");
	return NextResponse.json(response, { status: HttpStatus.UNAUTHORIZED });
}
```

### 7.2 Token Generation (Login Flow)

After successful authentication, generate tokens via `CookieService` and set them as `httpOnly` cookies:

```ts
const tokens = CookieService.generateTokens({
	id: user.id,
	email: user.email,
	name: user.name,
});

nextResponse.cookies.set("accessToken", tokens.accessToken, {
	httpOnly: true,
	path: "/",
	maxAge: 10 * 60, // 10 minutes
	sameSite: "lax",
	secure: process.env.NODE_ENV === "production",
});

nextResponse.cookies.set("refreshToken", tokens.refreshToken, {
	httpOnly: true,
	path: "/",
	maxAge: 12 * 60, // 12 minutes
	sameSite: "lax",
	secure: process.env.NODE_ENV === "production",
});
```

### 7.3 Public Routes

Routes that do not require authentication (e.g., `/api/auth/request-otp`, `/api/auth/login`) must **omit** the auth check block entirely — do not add it and return `formatUnauthorized`.

---

## 8. Error Handling Contract

### 8.1 Named Errors from Lib

Service functions in `lib/` throw plain string errors for known failure states. The route layer catches them and maps to the correct response helper.

| Lib throws                   | Route maps to                                             | Status |
| ---------------------------- | --------------------------------------------------------- | ------ |
| `"NOT_FOUND"`                | `formatNotFound`                                          | 404    |
| `"ALREADY_EXISTS"`           | `formatConflict`                                          | 409    |
| `"UNAUTHORIZED"`             | `formatUnauthorized`                                      | 401    |
| `"FORBIDDEN"`                | `formatForbidden`                                         | 403    |
| `"INVALID_OTP"`              | `formatBadRequest(startTime, "Invalid OTP code")`         | 400    |
| `"OTP_EXPIRED_OR_NOT_FOUND"` | `formatBadRequest(startTime, "OTP expired or not found")` | 400    |
| `"INVALID_OTP_FORMAT"`       | `formatBadRequest(startTime, "Invalid OTP format")`       | 400    |
| `ZodError` (from `.parse()`) | `formatBadRequest(startTime, error.errors?.[0]?.message)` | 400    |
| Anything else                | `formatInternalError`                                     | 500    |

### 8.2 Catch Block Pattern

Every route handler must follow this catch pattern:

```ts
} catch (error: any) {
	logger.error("POST /api/<feature> failed", error);

	// 1. Zod validation errors
	if (error.name === "ZodError" || error.message?.includes("Validation")) {
		const response = formatBadRequest(startTime, error.errors?.[0]?.message || error.message);
		return NextResponse.json(response, { status: HttpStatus.BAD_REQUEST });
	}

	// 2. Named business logic errors
	if (error.message === "NOT_FOUND") {
		const response = formatNotFound(startTime, "Resource not found");
		return NextResponse.json(response, { status: HttpStatus.NOT_FOUND });
	}

	if (error.message === "ALREADY_EXISTS") {
		const response = formatConflict(startTime, "Resource already exists");
		return NextResponse.json(response, { status: HttpStatus.CONFLICT });
	}

	// 3. Custom error strings (e.g., auth service)
	if (error.message?.includes("Invalid or expired OTP")) {
		const response = formatUnauthorized(startTime, "Invalid or expired OTP");
		return NextResponse.json(response, { status: HttpStatus.UNAUTHORIZED });
	}

	// 4. Fallback
	const response = formatInternalError(startTime, "Operation failed");
	return NextResponse.json(response, { status: HttpStatus.INTERNAL_SERVER_ERROR });
}
```

### 8.3 Never Expose Raw Errors

Never return `error.message` directly from unknown errors. Only map known named errors — everything else falls through to `formatInternalError`.

---

## 9. Quick Reference Cheatsheet

### Full Request Lifecycle

```
REQUEST COMES IN
      │
      ▼
export async function GET/POST/PUT/PATCH/DELETE(req: NextRequest)
  │
  ├── const startTime = Date.now()
  ├── logger.info("METHOD /api/<feature> called")
  ├── CookieService.validateTokens() → if null AND protected → formatUnauthorized + return
  ├── const { id } = await params  ← dynamic routes ONLY — always await
  ├── validateId(id)               ← dynamic routes ONLY
  ├── const body = await req.json()
  ├── validateCreateX(body)        ← throws ZodError if invalid
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
              ├── "UNAUTHORIZED"     → formatUnauthorized → 401
              └── fallback           → formatInternalError → 500
```

### File Quick Reference

```
lib/<feature>-service/
├── types.ts        → OUTPUT types only  (database/model interfaces)
├── validation.ts   → Zod schemas + validation functions + INPUT types
└── index.ts        → Business logic (Prisma calls, named errors)
```

### Type Separation Rule

| File            | Contains                                           | Imports From                                                 |
| --------------- | -------------------------------------------------- | ------------------------------------------------------------ |
| `types.ts`      | Output types (database shapes)                     | Nothing (or Prisma types only)                               |
| `validation.ts` | Zod schemas, validation functions, **input types** | `"zod"` only                                                 |
| `index.ts`      | Business logic                                     | Input types from `./validation`, output types from `./types` |

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
| Mask sensitive values in logs in production                 | Log raw OTP codes, passwords, or tokens in production     |
