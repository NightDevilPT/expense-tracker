---
trigger: always_on
---

This is the rulke book i have defined : # Backend Rulebook — Next.js App Router API

> **Version:** 2.1  
> **Routing:** App Router (`app/api/`) with named method exports  
> **Stack:** Next.js · Prisma · Zod · JWT (CookieService) · Logger · ResponseService

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [File Responsibilities](#2-file-responsibilities)
3. [Route File Rules (Controller)](#3-route-file-rules-controller)
4. [Lib Feature File Rules (Business Logic)](#4-lib-feature-file-rules-business-logic)
5. [Response Format Rules](#5-response-format-rules)
6. [Logging Rules](#6-logging-rules)
7. [Authentication Rules](#7-authentication-rules)
8. [Error Handling Rules](#8-error-handling-rules)
9. [Quick Reference Cheatsheet](#9-quick-reference-cheatsheet)

---

## 1. Project Structure

```
app/
  api/
    <feature>/
      route.ts              ← Controller only (HTTP layer)
      [id]/
        route.ts            ← Dynamic route with awaited params

lib/
  <feature>/
    index.ts                ← Business logic + Prisma calls
    types.ts                ← TypeScript interfaces & types (OUTPUT types only)
    validation.ts           ← Zod schemas + validation functions + INPUT types

  cookie-service/
    index.ts                ← JWT token generation & validation

  logger-service/
    index.ts                ← Structured console logger

  response-service/
    index.ts                ← Standardised API response helpers

interface/
  api.interface.ts          ← Shared API response types
```

---

## 2. File Responsibilities

| Layer                | File                            | Responsibility                                                         |
| -------------------- | ------------------------------- | ---------------------------------------------------------------------- |
| **Controller**       | `app/api/<feature>/route.ts`    | Parse request, call validation, call service, send response, log       |
| **Business Logic**   | `lib/<feature>/index.ts`        | Prisma queries, data transformation, throw named errors                |
| **Types**            | `lib/<feature>/types.ts`        | **OUTPUT types only** — TypeScript interfaces for database/models      |
| **Validation**       | `lib/<feature>/validation.ts`   | Zod schemas, validation functions, **INPUT types** (inferred from Zod) |
| **Cookie Service**   | `lib/cookie-service/index.ts`   | Token generation, validation, setting/clearing cookies                 |
| **Logger**           | `lib/logger-service/index.ts`   | Structured console log output                                          |
| **Response Service** | `lib/response-service/index.ts` | Shape and send HTTP response                                           |

**Hard rules:**

- Route files must **never** contain Prisma calls.
- Service files must **never** import `NextRequest` or response helpers.
- Response helpers must **always** be called from the route file.
- Validation must **always** be done with Zod in `validation.ts`.
- **`types.ts` contains ONLY output types (what comes from database).**
- **`validation.ts` contains schemas, validation functions, AND input types.**

---

## 3. Route File Rules (Controller)

### 3.1 Structure — Non-Dynamic Route

Use named `export async function` for each HTTP method. Each handler receives `req: NextRequest` and `res: NextApiResponse`.

```ts
// app/api/<feature>/route.ts

import { NextRequest } from "next/server";
import { NextApiResponse } from "next";
import { Logger } from "@/lib/logger-service";
import { CookieService } from "@/lib/cookie-service";
import {
	sendSuccess,
	sendCreated,
	sendBadRequest,
	sendUnauthorized,
	sendInternalError,
} from "@/lib/response-service";
import { getAllFeatures, createFeature } from "@/lib/<feature>";
import { validateCreateFeature } from "@/lib/<feature>/validation";

const logger = new Logger("<FEATURE>");

function getAuthUser(req: NextRequest) {
	const accessToken = req.cookies.get("accessToken")?.value;
	const refreshToken = req.cookies.get("refreshToken")?.value;
	return CookieService.validateTokens(accessToken, refreshToken);
}

export async function GET(req: NextRequest, res: NextApiResponse) {
	try {
		logger.info("GET /api/<feature> called");

		const user = getAuthUser(req);
		if (!user) {
			logger.warn("Unauthorized GET /api/<feature>");
			return sendUnauthorized(res, "Authentication required");
		}

		const data = await getAllFeatures(user.id);
		logger.info("Fetched successfully", { count: data.length });
		sendSuccess(res, data, "Fetched successfully");
	} catch (error) {
		logger.error("GET /api/<feature> failed", error);
		sendInternalError(res, "Failed to fetch");
	}
}

export async function POST(req: NextRequest, res: NextApiResponse) {
	try {
		logger.info("POST /api/<feature> called");

		const user = getAuthUser(req);
		if (!user) {
			logger.warn("Unauthorized POST /api/<feature>");
			return sendUnauthorized(res, "Authentication required");
		}

		const body = await req.json();

		// Validate with Zod — throws if invalid
		const validatedData = validateCreateFeature(body);

		const created = await createFeature({
			...validatedData,
			userId: user.id,
		});

		logger.info("Created successfully", { id: created.id });
		sendCreated(res, created, "Created successfully");
	} catch (error: any) {
		logger.error("POST /api/<feature> failed", error);

		if (error.message?.includes("Validation")) {
			return sendBadRequest(res, error.message);
		}

		sendInternalError(res, "Failed to create");
	}
}
```

### 3.2 Structure — Dynamic Route (`[id]`)

In the App Router, route segment params arrive as a **Promise** — always `await params` before accessing any value.

```ts
// app/api/<feature>/[id]/route.ts

import { NextRequest } from "next/server";
import { NextApiResponse } from "next";
import { Logger } from "@/lib/logger-service";
import { CookieService } from "@/lib/cookie-service";
import {
	sendSuccess,
	sendUnauthorized,
	sendNotFound,
	sendBadRequest,
	sendInternalError,
} from "@/lib/response-service";
import { getFeatureById, deleteFeature } from "@/lib/<feature>";
import { validateId } from "@/lib/<feature>/validation";

const logger = new Logger("<FEATURE>");

function getAuthUser(req: NextRequest) {
	const accessToken = req.cookies.get("accessToken")?.value;
	const refreshToken = req.cookies.get("refreshToken")?.value;
	return CookieService.validateTokens(accessToken, refreshToken);
}

// ✅ params is a Promise in App Router — must be awaited
export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
	res: NextApiResponse,
) {
	try {
		const { id } = await params;
		logger.info("GET /api/<feature>/[id] called", { id });

		const user = getAuthUser(req);
		if (!user) {
			logger.warn("Unauthorized GET /api/<feature>/[id]");
			return sendUnauthorized(res, "Authentication required");
		}

		// Validate ID with Zod — throws if invalid
		validateId(id);

		const item = await getFeatureById(id, user.id);
		sendSuccess(res, item, "Fetched successfully");
	} catch (error: any) {
		logger.error("GET /api/<feature>/[id] failed", error);
		if (error.message === "NOT_FOUND")
			return sendNotFound(res, "Resource not found");
		if (
			error.message?.includes("Validation") ||
			error.message?.includes("Invalid ID")
		) {
			return sendBadRequest(res, error.message);
		}
		sendInternalError(res, "Failed to fetch");
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
	res: NextApiResponse,
) {
	try {
		const { id } = await params;
		logger.info("DELETE /api/<feature>/[id] called", { id });

		const user = getAuthUser(req);
		if (!user) {
			logger.warn("Unauthorized DELETE /api/<feature>/[id]");
			return sendUnauthorized(res, "Authentication required");
		}

		validateId(id);

		await deleteFeature(id, user.id);
		sendSuccess(res, null, "Deleted successfully");
	} catch (error: any) {
		logger.error("DELETE /api/<feature>/[id] failed", error);
		if (error.message === "NOT_FOUND")
			return sendNotFound(res, "Resource not found");
		if (
			error.name === "ZodError" ||
			error.message?.includes("Invalid ID")
		) {
			return sendBadRequest(
				res,
				error.errors?.[0]?.message || error.message,
			);
		}
		sendInternalError(res, "Failed to delete");
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
> 	const { id } = params;
> }
> ```

### 3.3 Response Helper Signatures

All helpers take `res: NextApiResponse` as the **first argument** and return `void`. They call `res.status().json()` internally.

```ts
sendSuccess(res, data, message?, statusCode?, meta?)
sendError(res, code, message, statusCode?, details?, meta?)
sendPaginatedSuccess(res, data, pagination, message?, statusCode?)
sendCreated(res, data, message?, meta?)
sendNoContent(res)
sendBadRequest(res, message?, details?)
sendUnauthorized(res, message?, details?)
sendForbidden(res, message?, details?)
sendNotFound(res, message?, details?)
sendConflict(res, message?, details?)
sendTooManyRequests(res, message?, details?)
sendInternalError(res, message?, details?)
```

---

## 4. Lib Feature File Rules (Business Logic)

Every feature folder under `lib/` contains exactly three files:

```
lib/<feature>/
  types.ts          ← OUTPUT types only (database/model interfaces)
  validation.ts     ← Zod schemas + validation functions + INPUT types
  index.ts          ← Prisma calls and business logic
```

---

### 4.1 `types.ts` — Output TypeScript Interfaces (ONLY)

Define **ONLY output types** here — what comes from the database/models. **DO NOT import or re-export input types from validation.**

```ts
// lib/<feature>/types.ts

// Only database/model output types
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
	// ... other relations
}

// ❌ NEVER do this:
// export type { CreateFeatureInput, UpdateFeatureInput } from "./validation";
```

**Rules:**

- **ONLY output types** — what comes from database/models.
- No imports from `./validation`.
- No re-exporting input types.
- No logic, no imports from Prisma or Next.js.

---

### 4.2 `validation.ts` — Zod Validation + Input Types

Define all Zod schemas, validation functions, **AND input types** here. Validation functions **throw** errors when validation fails.

```ts
// lib/<feature>/validation.ts

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
	return createFeatureSchema.parse(data); // Throws if invalid
}

export function validateUpdateFeature(data: unknown): UpdateFeatureInput {
	return updateFeatureSchema.parse(data); // Throws if invalid
}

export function validateId(id: string): void {
	idSchema.parse(id); // Throws if invalid
}

// ==================== INPUT TYPE EXPORTS ====================

export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;
export type UpdateFeatureInput = z.infer<typeof updateFeatureSchema>;
```

**Rules:**

- Use Zod exclusively for validation — no manual validation logic.
- Validation functions call `.parse()` which throws ZodError on failure.
- **Export input types directly from this file** using `z.infer<typeof schema>`.
- Never import from Prisma, Next.js, or response helpers here.

---

### 4.3 `index.ts` — Business Logic

Import **output types** from `./types` and **input types + validation** from `./validation`.

```ts
// lib/<feature>/index.ts

import { prisma } from "@/lib/prisma";
// Import validation functions AND input types from validation.ts
import {
	validateCreateFeature,
	validateUpdateFeature,
	validateId,
	type CreateFeatureInput,
	type UpdateFeatureInput,
} from "./validation";
// Import output types from types.ts
import type { Feature } from "./types";

export async function getAllFeatures(userId: string): Promise<Feature[]> {
	return await prisma.feature.findMany({ where: { userId } });
}

export async function getFeatureById(
	id: string,
	userId: string,
): Promise<Feature> {
	validateId(id); // Throws if invalid

	const item = await prisma.feature.findFirst({ where: { id, userId } });
	if (!item) throw new Error("NOT_FOUND");
	return item;
}

export async function createFeature(
	data: CreateFeatureInput & { userId: string },
): Promise<Feature> {
	const validatedData = validateCreateFeature(data); // Throws if invalid

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

	return await prisma.feature.update({
		where: { id },
		data: validatedData,
	});
}

export async function deleteFeature(
	id: string,
	userId: string,
): Promise<Feature> {
	validateId(id);

	const item = await prisma.feature.findFirst({ where: { id, userId } });
	if (!item) throw new Error("NOT_FOUND");

	return await prisma.feature.delete({ where: { id } });
}
```

**Rules:**

- All Prisma calls live **only** here.
- Always call validation functions at the start of each function.
- Validation functions throw — catch them in the route layer.
- Throw named errors (`"NOT_FOUND"`, `"ALREADY_EXISTS"`) for known states.
- **Import input types from `./validation`.**
- **Import output types from `./types`.**
- Never import `NextRequest`, `NextApiResponse`, or response helpers.

---

### 4.4 Import Flow

```
route.ts
  ├── imports validateX()    from  lib/<feature>/validation.ts
  ├── imports service fns    from  lib/<feature>/index.ts
  └── (does NOT need types unless using output types)

lib/<feature>/index.ts
  ├── imports validateX() AND input types   from  ./validation
  └── imports output types                  from  ./types

lib/<feature>/validation.ts
  └── imports z              from "zod" only
  └── exports schemas, validation functions, AND input types

lib/<feature>/types.ts
  └── exports output types only (database/model interfaces)
  └── NO imports from ./validation
```

---

### 4.5 Error Codes Contract

| Lib throws                       | Route maps to                                     |
| -------------------------------- | ------------------------------------------------- |
| `"NOT_FOUND"`                    | `sendNotFound(res)`                               |
| `"ALREADY_EXISTS"`               | `sendConflict(res)`                               |
| `"UNAUTHORIZED"`                 | `sendUnauthorized(res)`                           |
| `"FORBIDDEN"`                    | `sendForbidden(res)`                              |
| `"INVALID_OTP"`                  | `sendBadRequest(res, "Invalid OTP code")`         |
| `"OTP_EXPIRED_OR_NOT_FOUND"`     | `sendBadRequest(res, "OTP expired or not found")` |
| `"INVALID_OTP_FORMAT"`           | `sendBadRequest(res, "Invalid OTP format")`       |
| Zod `ZodError` (from validation) | `sendBadRequest(res, error.message)`              |
| anything else                    | `sendInternalError(res)`                          |

---

### 5.4 When to Use Which Helper

| Situation                  | Helper                                        |
| -------------------------- | --------------------------------------------- |
| Successful fetch           | `sendSuccess(res, data, "message")`           |
| Resource created           | `sendCreated(res, data, "message")`           |
| List with pagination       | `sendPaginatedSuccess(res, data, pagination)` |
| Zod validation fails       | `sendBadRequest(res, error.message)`          |
| Invalid body / params      | `sendBadRequest(res, "message")`              |
| Missing / invalid token    | `sendUnauthorized(res, "message")`            |
| Valid token, no permission | `sendForbidden(res, "message")`               |
| Record not found           | `sendNotFound(res, "message")`                |
| Duplicate / already exists | `sendConflict(res, "message")`                |
| Rate limit hit             | `sendTooManyRequests(res, "message")`         |
| Unexpected server error    | `sendInternalError(res, "message")`           |

---

## 6. Logging Rules

### 6.1 Logger Instance

Create one logger per route file using the uppercase feature name:

```ts
const logger = new Logger("EXPENSE");
```

### 6.2 When to Log

| Event                | Level   | Example                                          |
| -------------------- | ------- | ------------------------------------------------ |
| Request received     | `info`  | `logger.info("GET /api/expense called")`         |
| Auth failure         | `warn`  | `logger.warn("Unauthorized GET /api/expense")`   |
| Successful operation | `info`  | `logger.info("Expense created", { id })`         |
| Caught error         | `error` | `logger.error("GET /api/expense failed", error)` |
| Dev tracing          | `debug` | `logger.debug("Parsed body", body)`              |

### 6.3 Rules

- Log at the **start** of every handler.
- Log in every `catch` block before sending an error response.
- Pass context as the **second argument** — never string-interpolate it into the message.
- Never log passwords, tokens, OTP codes (except in development), or any sensitive fields.

```ts
// ✅ Correct
logger.info("Expense created", { id: expense.id });

// ❌ Wrong
logger.info(`Expense created: ${JSON.stringify(expense)}`);
```

---

## 7. Authentication Rules

### 7.1 Reading the Token

Read cookies directly from `req`:

```ts
function getAuthUser(req: NextRequest) {
	const accessToken = req.cookies.get("accessToken")?.value;
	const refreshToken = req.cookies.get("refreshToken")?.value;
	return CookieService.validateTokens(accessToken, refreshToken);
}
```

Define this helper once per route file, above the exported handlers.

### 7.2 Protecting a Route

```ts
export async function GET(req: NextRequest, res: NextApiResponse) {
	const user = getAuthUser(req);
	if (!user) {
		logger.warn("Unauthorized GET /api/<feature>");
		return sendUnauthorized(res, "Authentication required");
	}
	// proceed — user.id, user.email are available
}
```

### 7.3 Public Routes (No Auth Required)

For routes like `request-otp` that don't require authentication, simply omit the `getAuthUser` check.

```ts
export async function POST(req: NextRequest, res: NextApiResponse) {
	try {
		logger.info("POST /api/auth/request-otp called");

		const body = await req.json();
		const validatedData = validateRequestOTP(body);

		// No auth check needed for public route
		const result = await requestOTP(validatedData);

		sendSuccess(res, result, "OTP sent successfully");
	} catch (error) {
		// ... error handling
	}
}
```

### 7.4 Token Expiry

- Access token: **10 minutes**
- Refresh token: **12 minutes**
- `CookieService.validateTokens` automatically issues new tokens when the access token is expired but the refresh token is still valid.

---

## 8. Error Handling Rules

### 8.1 Every Handler Must Have a Try-Catch

```ts
export async function POST(req: NextRequest, res: NextApiResponse) {
	try {
		// ... handler logic
	} catch (error: any) {
		logger.error("POST /api/<feature> failed", error);

		// Handle Zod validation errors
		if (error.name === "ZodError") {
			return sendBadRequest(
				res,
				error.errors[0]?.message || "Validation failed",
			);
		}

		// Handle named errors from service layer
		if (error.message === "NOT_FOUND")
			return sendNotFound(res, "Resource not found");
		if (error.message === "ALREADY_EXISTS")
			return sendConflict(res, "Already exists");
		if (error.message === "INVALID_OTP")
			return sendBadRequest(res, "Invalid OTP code");
		if (error.message === "OTP_EXPIRED_OR_NOT_FOUND") {
			return sendBadRequest(res, "OTP expired or not found");
		}

		// Fallback — never leak internal error messages
		sendInternalError(res, "An unexpected error occurred");
	}
}
```

### 8.2 Validation Flow

```ts
// 1. In route.ts — call validation function from validation.ts
const validatedData = validateCreateFeature(body); // Throws ZodError if invalid

// 2. Catch ZodError in catch block
catch (error: any) {
  if (error.name === "ZodError") {
    return sendBadRequest(res, error.errors[0]?.message);
  }
}
```

### 8.3 Never Leak Internal Error Messages

```ts
// ❌ Never — exposes Prisma / DB internals to the client
sendInternalError(res, error.message);

// ✅ Always — log internally, return a safe generic message
logger.error("DB error", error);
sendInternalError(res, "An unexpected error occurred");
```

---

## 9. Quick Reference Cheatsheet

```
REQUEST COMES IN
      │
      ▼
app/api/<feature>/route.ts
  │
  ├── export async function GET(req, res)
  ├── export async function POST(req, res)
  ├── export async function PUT(req, res)
  ├── export async function PATCH(req, res)
  └── export async function DELETE(req, res)
        │
        ├── 1. logger.info("METHOD /api/<feature> called")
        ├── 2. getAuthUser(req) → if null AND protected route → sendUnauthorized()
        ├── 3. const { id } = await params (dynamic routes only)
        ├── 4. validateId(id) from validation.ts (dynamic routes only)
        ├── 5. validateCreateX(body) from validation.ts → throws ZodError if invalid
        ├── 6. call lib/<feature>/index.ts function
        │         ├── imports input types  from ./validation
        │         ├── imports output types from ./types
        │         ├── imports validators   from ./validation
        │         └── all Prisma calls live here
        ├── 7. sendSuccess(res, data) / sendCreated(res, data)
        │
        └── catch (error)
              ├── logger.error("... failed", error)
              ├── if error.name === "ZodError" → sendBadRequest(res, error.message)
              ├── if error.message === "NOT_FOUND" → sendNotFound(res)
              ├── if error.message === "ALREADY_EXISTS" → sendConflict(res)
              └── fallback → sendInternalError(res, "...")
```

### File Structure Quick View

```
lib/<feature>/
├── types.ts           → OUTPUT types only (database/model interfaces)
├── validation.ts      → Zod schemas + validation functions + INPUT types
└── index.ts           → Business logic (imports from ./types & ./validation)
```

### Type Separation Rule

| File            | Contains                                           | Imports From                                                 |
| --------------- | -------------------------------------------------- | ------------------------------------------------------------ |
| `types.ts`      | Output types only (database/models)                | Nothing (except maybe Prisma types)                          |
| `validation.ts` | Zod schemas, validation functions, **Input types** | `zod` only                                                   |
| `index.ts`      | Business logic                                     | Input types from `./validation`, Output types from `./types` |

### Always / Never Summary

| ✅ Always                                      | ❌ Never                                       |
| ---------------------------------------------- | ---------------------------------------------- |
| Use named exports: `export async function GET` | Use `export default function handler`          |
| Pass `res` as first arg to every helper        | Call `res.status().json()` directly            |
| `await params` in every dynamic route handler  | Access `params.id` without awaiting            |
| Wrap every handler in try-catch                | Put Prisma calls in route files                |
| Use Zod for all validation                     | Write manual validation logic                  |
| Export input types from `validation.ts`        | Export input types from `types.ts`             |
| Export output types from `types.ts`            | Import input types in `types.ts`               |
| Validation functions call `.parse()`           | Return error strings from validation functions |
| Throw named error strings from `index.ts`      | Import `NextRequest` in lib files              |
| Log at the start of every handler              | Log passwords, tokens, OTP codes, or secrets   |
| Pass context as second arg to logger           | Return `error.message` directly to client      |
| Check `error.name === "ZodError"` in catch     | Assume all errors are strings                  |
