Here's the complete updated rule book with all sections properly included:

---

# Backend Rulebook — Next.js App Router API

**Version:** 3.5 | **Routing:** App Router (`app/api/`) with named method exports | **Stack:** Next.js · Prisma · Zod · JWT · Logger · ResponseService · OpenAPI · Proxy Auth

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [File Responsibilities](#2-file-responsibilities)
3. [Proxy Authentication & Rate Limiting](#3-proxy-authentication--rate-limiting)
4. [OpenAPI Documentation Rules](#4-openapi-documentation-rules)
5. [Route File Rules (Controller)](#5-route-file-rules-controller)
6. [Response Service Pattern](#6-response-service-pattern)
7. [Lib Feature File Rules (Business Logic)](#7-lib-feature-file-rules-business-logic)
8. [Logging Rules](#8-logging-rules)
9. [Error Handling Contract](#9-error-handling-contract)
10. [Quick Reference Cheatsheet](#10-quick-reference-cheatsheet)

---

## 1. Project Structure

```
app/
  api/
    auth/
      login/
        route.ts                    ← Controller (HTTP layer only)
        open-api.ts                 ← OpenAPI spec for this route
      request-otp/
        route.ts                    ← Controller (HTTP layer only)
        open-api.ts                 ← OpenAPI spec for this route
      logout/
        route.ts
        open-api.ts
      me/
        route.ts
        open-api.ts
    <feature>/
      route.ts                      ← Non-dynamic controller
      open-api.ts                   ← OpenAPI spec for collection routes
      popular/
        route.ts                    ← Sub-resource controller
        open-api.ts                 ← OpenAPI spec for sub-resource
      [id]/
        route.ts                    ← Dynamic route — always await params
        open-api.ts                 ← OpenAPI spec for single resource routes

lib/
  <feature>-service/                ← Feature folder naming: <feature>-service
    index.ts                        ← Business logic + Prisma calls
    types.ts                        ← Output types only (database/model interfaces)
    validation.ts                   ← Zod schemas + validation functions + input types

  cookie-service/
    index.ts                        ← JWT generation & validation

  logger-service/
    index.ts                        ← Structured console logger

  response-service/
    index.ts                        ← Format helpers (return plain objects)

  rate-limit/
    index.ts                        ← Rate limiting storage and logic

  swagger/                          ← OpenAPI/Swagger configuration
    index.ts                        ← Main OpenAPI spec generator
    schemas.ts                      ← Common response schemas and helpers
    types.ts                        ← OpenAPI type definitions
    security.ts                     ← Security scheme definitions
    specs/
      index.ts                      ← Aggregates all API specs

prisma/
  schema.prisma                     ← Database schema

proxy.ts                            ← Central authentication & rate limiting (root)
```

---

## 2. File Responsibilities

| Layer                | File                                  | Responsibility                                                     |
| -------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| **Proxy**            | `proxy.ts` (root)                     | Authentication, rate limiting, user context injection for ALL APIs |
| **Controller**       | `app/api/<feature>/route.ts`          | Parse request, validate input, call service, format response, log  |
| **OpenAPI Spec**     | `app/api/<feature>/open-api.ts`       | Define OpenAPI paths, schemas, parameters, and responses           |
| **Business Logic**   | `lib/<feature>-service/index.ts`      | Prisma queries, data transformation, throw named errors            |
| **Types**            | `lib/<feature>-service/types.ts`      | **Output types ONLY** — database/model shapes, params interfaces   |
| **Validation**       | `lib/<feature>-service/validation.ts` | Zod schemas, validation functions, **input types**                 |
| **Cookie Service**   | `lib/cookie-service/index.ts`         | Token generation, validation, payload extraction                   |
| **Logger**           | `lib/logger-service/index.ts`         | Structured coloured console output                                 |
| **Response Service** | `lib/response-service/index.ts`       | Returns plain response objects — **does NOT create NextResponse**  |
| **Rate Limit**       | `lib/rate-limit/index.ts`             | In-memory rate limiting storage                                    |
| **Swagger Service**  | `lib/swagger/index.ts`                | Generates complete OpenAPI specification                           |

### Hard Rules

- **Authentication is handled centrally in `proxy.ts`** — Route files should NOT contain auth checks.
- **Every new API endpoint MUST include an `open-api.ts` file** co-located with the route file.
- **Every new API route MUST be configured in `proxy.ts`** (public routes or rate limits).
- Route files must **never** contain Prisma calls.
- Service files (`lib/`) must **never** import `NextRequest`, `NextResponse`, or response helpers.
- Response helpers **return plain objects** — `NextResponse.json()` is always called in the **route file**.
- Validation must **always** use Zod in `validation.ts`.
- `types.ts` contains **only output types** (from database/models) and params interfaces.
- `validation.ts` contains schemas, validation functions, **and input types**.
- OpenAPI files must export `{feature}Paths`, `{feature}Schemas`, and `{feature}Tags`.

---

## 3. Proxy Authentication & Rate Limiting

### 3.1 Proxy Overview

The `proxy.ts` file handles **ALL** `/api/*` requests centrally for:

- Authentication validation
- Rate limiting
- User context injection

**Route files should NOT contain authentication checks** — this is handled by the proxy.

### 3.2 Proxy Configuration

```ts
// proxy.ts

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
	"/api/auth/login",
	"/api/auth/request-otp",
	"/api/auth/verify-otp",
	"/api/auth/logout",
	"/api/open-api",
	"/api/docs",
	// Add new public routes here
];

// Rate limit configuration per route pattern
const RATE_LIMITS: Record<string, { windowMs: number; maxRequests: number }> = {
	"/api/auth/login": { windowMs: 60_000, maxRequests: 5 },
	"/api/auth/request-otp": { windowMs: 60_000, maxRequests: 3 },
	"/api/auth/logout": { windowMs: 60_000, maxRequests: 60 },
	"/api/user": { windowMs: 60_000, maxRequests: 10 },
	"/api/open-api": { windowMs: 60_000, maxRequests: 100 },
	"/api/categories": { windowMs: 60_000, maxRequests: 30 },
	"/api/tags": { windowMs: 60_000, maxRequests: 30 },
	// Add new rate limits here
	default: { windowMs: 60_000, maxRequests: 30 },
};
```

### 3.3 Adding a New API to Proxy

When creating a new API, you MUST update `proxy.ts`:

**Step 1: Determine if the route is public or protected**

- Public routes (no auth required): Add to `PUBLIC_ROUTES`
- Protected routes (require auth): Do NOT add to `PUBLIC_ROUTES`

**Step 2: Add rate limit configuration**

```ts
const RATE_LIMITS = {
	// ... existing
	"/api/your-feature": { windowMs: 60_000, maxRequests: 30 },
};
```

**Step 3: Rate limit guidelines**
| Route Type | Recommended Limit |
|------------|-------------------|
| Login/OTP | 3-5 requests/min |
| Create/Update/Delete | 30 requests/min |
| List/Get | 60 requests/min |
| Public docs | 100 requests/min |

### 3.4 User Context in Route Files

The proxy injects user information into request headers:

```ts
// In proxy.ts - User context injection
requestHeaders.set("x-user-id", userPayload.id);
requestHeaders.set("x-user-email", userPayload.email);
requestHeaders.set("x-user-name", userPayload.name);
```

**Route files access user info via headers:**

```ts
// app/api/categories/route.ts
export async function GET(req: NextRequest) {
	const userId = req.headers.get("x-user-id");
	// NO auth check needed — proxy already validated
}
```

### 3.5 Proxy Checklist for New APIs

- [ ] Route added to `PUBLIC_ROUTES` (if public) OR intentionally omitted (if protected)
- [ ] Rate limit configured in `RATE_LIMITS`
- [ ] Rate limit values follow guidelines
- [ ] Route file does NOT contain duplicate auth checks
- [ ] Route file uses `x-user-id` header for user context

---

## 4. OpenAPI Documentation Rules

### 4.1 Required Files Per API

Every API route directory MUST include an `open-api.ts` file:

```
app/api/<feature>/
  route.ts          ← API implementation
  open-api.ts       ← REQUIRED: OpenAPI specification
  [id]/
    route.ts        ← Dynamic route implementation
    open-api.ts     ← REQUIRED: OpenAPI specification
```

### 4.2 OpenAPI File Structure

```ts
// app/api/<feature>/open-api.ts
import { OpenAPIV3 } from "openapi-types";
import { successResponse, paginatedResponse } from "@/lib/swagger/schemas";

// Define schemas
const featureSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		id: { type: "string", format: "cuid", example: "clh1234567890abcdef" },
		name: { type: "string", example: "Example Name" },
		createdAt: { type: "string", format: "date-time" },
		updatedAt: { type: "string", format: "date-time" },
	},
	required: ["id", "name", "createdAt", "updatedAt"],
};

const createFeatureSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		name: {
			type: "string",
			minLength: 1,
			maxLength: 50,
			example: "My Feature",
		},
	},
	required: ["name"],
};

const updateFeatureSchema: OpenAPIV3.SchemaObject = {
	type: "object",
	properties: {
		name: {
			type: "string",
			minLength: 1,
			maxLength: 50,
			example: "Updated Name",
		},
	},
	minProperties: 1,
};

// Query parameters
const getFeatureParameters: OpenAPIV3.ParameterObject[] = [
	{
		name: "page",
		in: "query",
		description: "Page number (starts from 1)",
		required: false,
		schema: { type: "integer", minimum: 1, default: 1 },
	},
	{
		name: "limit",
		in: "query",
		description: "Items per page (max 100)",
		required: false,
		schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
	},
	{
		name: "search",
		in: "query",
		description: "Search term",
		required: false,
		schema: { type: "string" },
	},
];

// Export paths
export const featurePaths: OpenAPIV3.PathsObject = {
	"/api/<feature>": {
		get: {
			summary: "List resources",
			description: "Get paginated list of resources",
			tags: ["FeatureName"],
			parameters: getFeatureParameters,
			responses: {
				"200": {
					description: "Resources retrieved successfully",
					content: {
						"application/json": {
							schema: paginatedResponse(featureSchema),
						},
					},
				},
				"400": { $ref: "#/components/responses/BadRequest" },
				"401": { $ref: "#/components/responses/Unauthorized" },
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
		post: {
			summary: "Create resource",
			description: "Create a new resource",
			tags: ["FeatureName"],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: createFeatureSchema,
					},
				},
			},
			responses: {
				"201": {
					description: "Resource created successfully",
					content: {
						"application/json": {
							schema: successResponse(featureSchema),
						},
					},
				},
				"400": { $ref: "#/components/responses/BadRequest" },
				"401": { $ref: "#/components/responses/Unauthorized" },
				"409": { $ref: "#/components/responses/Conflict" },
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
	},
};

// Export schemas
export const featureSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	Feature: featureSchema,
	CreateFeatureRequest: createFeatureSchema,
	UpdateFeatureRequest: updateFeatureSchema,
};

// Export tags
export const featureTags: OpenAPIV3.TagObject[] = [
	{
		name: "FeatureName",
		description: "Description of this feature's endpoints",
	},
];
```

### 4.3 Dynamic Route OpenAPI Structure

```ts
// app/api/<feature>/[id]/open-api.ts
import { OpenAPIV3 } from "openapi-types";
import { successResponse, emptySuccessResponse } from "@/lib/swagger/schemas";

const idParameter: OpenAPIV3.ParameterObject = {
	name: "id",
	in: "path",
	description: "Resource ID (CUID format)",
	required: true,
	schema: { type: "string", format: "cuid" },
	example: "clh1234567890abcdef",
};

export const featureByIdPaths: OpenAPIV3.PathsObject = {
	"/api/<feature>/{id}": {
		get: {
			summary: "Get resource by ID",
			tags: ["FeatureName"],
			parameters: [idParameter],
			responses: {
				"200": {
					description: "Resource retrieved",
					content: {
						"application/json": {
							schema: successResponse({
								$ref: "#/components/schemas/Feature",
							} as OpenAPIV3.SchemaObject),
						},
					},
				},
				"401": { $ref: "#/components/responses/Unauthorized" },
				"404": { $ref: "#/components/responses/NotFound" },
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
		put: {
			summary: "Update resource",
			tags: ["FeatureName"],
			parameters: [idParameter],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: {
							$ref: "#/components/schemas/UpdateFeatureRequest",
						} as OpenAPIV3.SchemaObject,
					},
				},
			},
			responses: {
				"200": {
					description: "Resource updated",
					content: {
						"application/json": {
							schema: successResponse({
								$ref: "#/components/schemas/Feature",
							} as OpenAPIV3.SchemaObject),
						},
					},
				},
				"400": { $ref: "#/components/responses/BadRequest" },
				"401": { $ref: "#/components/responses/Unauthorized" },
				"404": { $ref: "#/components/responses/NotFound" },
				"409": { $ref: "#/components/responses/Conflict" },
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
		delete: {
			summary: "Delete resource",
			tags: ["FeatureName"],
			parameters: [idParameter],
			responses: {
				"200": {
					description: "Resource deleted",
					content: {
						"application/json": {
							schema: emptySuccessResponse(),
						},
					},
				},
				"401": { $ref: "#/components/responses/Unauthorized" },
				"403": { $ref: "#/components/responses/Forbidden" },
				"404": { $ref: "#/components/responses/NotFound" },
				"409": { $ref: "#/components/responses/Conflict" },
				"500": { $ref: "#/components/responses/InternalServerError" },
			},
			security: [{ accessToken: [], refreshToken: [] }],
		},
	},
};

export const featureByIdSchemas: Record<string, OpenAPIV3.SchemaObject> = {};
export const featureByIdTags: OpenAPIV3.TagObject[] = [];
```

### 4.4 Registering APIs in Swagger Specs

After creating `open-api.ts` files, you MUST register them in `lib/swagger/specs/index.ts`:

```ts
// lib/swagger/specs/index.ts
import { OpenAPIV3 } from "openapi-types";
import { errorSchemas } from "../schemas";

// Import all feature specs
import {
	featurePaths,
	featureSchemas,
	featureTags,
} from "@/app/api/<feature>/open-api";
import {
	featureByIdPaths,
	featureByIdSchemas,
	featureByIdTags,
} from "@/app/api/<feature>/[id]/open-api";

export const allPaths: OpenAPIV3.PathsObject = {
	...featurePaths,
	...featureByIdPaths,
	// ... other paths
};

export const allSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	...errorSchemas,
	...featureSchemas,
	...featureByIdSchemas,
	// ... other schemas
};

export const allTags: OpenAPIV3.TagObject[] = [
	{
		name: "FeatureName",
		description: "Description of this feature",
	},
	...featureTags,
	...featureByIdTags,
	// ... other tags
];
```

### 4.5 OpenAPI Checklist for New APIs

- [ ] `open-api.ts` file created in the route directory
- [ ] `open-api.ts` file created in the `[id]` directory (if dynamic route exists)
- [ ] All request/response schemas defined with examples
- [ ] Query parameters documented (for GET collection routes)
- [ ] Path parameters documented (for dynamic routes)
- [ ] Request body schema defined (for POST/PUT/PATCH)
- [ ] All possible response status codes documented (200, 201, 400, 401, 403, 404, 409, 500)
- [ ] Security requirements specified:
    - `security: [{ accessToken: [], refreshToken: [] }]` for protected routes
    - `security: []` for public routes
- [ ] Tags assigned to group related endpoints
- [ ] Exports added to `lib/swagger/specs/index.ts`
- [ ] Schemas use proper types from `lib/<feature>-service/types.ts`
- [ ] Examples use realistic data (e.g., `mike.williams@gmail.com` for email)

### 4.6 Common Response Helpers

```ts
import {
	successResponse, // For single item responses
	paginatedResponse, // For list responses
	emptySuccessResponse, // For DELETE responses
} from "@/lib/swagger/schemas";
```

### 4.7 Security Scheme Reference

All protected endpoints must use:

```ts
security: [{ accessToken: [], refreshToken: [] }];
```

Public endpoints must use:

```ts
security: [];
```

---

## 5. Route File Rules (Controller)

### 5.1 Structure — Non-Dynamic Route (WITHOUT Auth Checks)

```ts
// app/api/categories/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
	formatSuccess,
	formatPaginated,
	formatBadRequest,
	formatConflict,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
import { getAllCategories, createCategory } from "@/lib/category-service";
import { validateCreateCategory } from "@/lib/category-service/validation";

const logger = new Logger("CATEGORIES-API");

export async function GET(req: NextRequest) {
	const startTime = Date.now();

	try {
		logger.info("GET /api/categories called");

		// ✅ User ID from proxy-injected header
		const userId = req.headers.get("x-user-id");

		// ❌ NO auth check needed — proxy already validated

		const url = new URL(req.url);
		const page = parseInt(url.searchParams.get("page") || "1");
		const limit = parseInt(url.searchParams.get("limit") || "20");
		const search = url.searchParams.get("search") || undefined;
		const type = url.searchParams.get("type") as
			| "INCOME"
			| "EXPENSE"
			| "TRANSFER"
			| undefined;

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

		const result = await getAllCategories(userId!, {
			page,
			limit,
			search,
			type,
		});
		const totalPages = Math.ceil(result.total / result.limit);

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

		const userId = req.headers.get("x-user-id");
		const body = await req.json();
		const validatedData = validateCreateCategory(body);

		const category = await createCategory(userId!, validatedData);

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

### 5.2 Structure — Dynamic Route (`[id]`)

> **Critical:** In Next.js App Router, params arrive as a **Promise**. Always `await params` before accessing.

```ts
// app/api/categories/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logger-service";
import {
	formatSuccess,
	formatBadRequest,
	formatNotFound,
	formatForbidden,
	formatConflict,
	formatInternalError,
	HttpStatus,
} from "@/lib/response-service";
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

		const userId = req.headers.get("x-user-id");

		validateCategoryId(id);
		const category = await getCategoryById(id, userId!);

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

		const userId = req.headers.get("x-user-id");
		const body = await req.json();
		const validatedData = validateUpdateCategory(body);

		validateCategoryId(id);
		const category = await updateCategory(id, userId!, validatedData);

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

		const userId = req.headers.get("x-user-id");

		validateCategoryId(id);
		await deleteCategory(id, userId!);

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

### 5.3 Setting Cookies in Response (Login Flow)

```ts
// app/api/auth/login/route.ts

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

## 6. Response Service Pattern

> **Critical:** Response helpers return **plain objects**, not `NextResponse`. The route file always calls `NextResponse.json()`.

### 6.1 startTime Pattern

Every route handler records `startTime` at the top, passed to every format helper.

```ts
const startTime = Date.now();
```

### 6.2 Format Helper Signatures

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

### 6.3 HttpStatus Constants

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

### 6.4 When to Use Which Helper

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

## 7. Lib Feature File Rules (Business Logic)

### 7.1 File Structure

Every service folder under `lib/` contains exactly three files:

```
lib/<feature>-service/
  types.ts        ← Output types + params interfaces
  validation.ts   ← Zod schemas + validation functions + input types
  index.ts        ← Prisma calls and business logic
```

### 7.2 `types.ts` — Output Types Only

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

- Output/database types only
- Include params interfaces and pagination types
- No imports from `./validation`
- No logic, no Prisma imports, no Next.js imports

### 7.3 `validation.ts` — Zod Schemas + Input Types

```ts
// lib/category-service/validation.ts

import { z } from "zod";

export const createCategorySchema = z.object({
	name: z.string().min(1).max(50),
	type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
	icon: z.string().max(50).nullable().optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.nullable()
		.optional(),
	order: z.number().int().min(0).default(0).optional(),
});

export const updateCategorySchema = z
	.object({
		name: z.string().min(1).max(50).optional(),
		icon: z.string().max(50).nullable().optional(),
		color: z
			.string()
			.regex(/^#[0-9A-Fa-f]{6}$/)
			.nullable()
			.optional(),
		order: z.number().int().min(0).optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided for update",
	});

export const categoryIdSchema = z.string().cuid("Invalid category ID format");

export function validateCreateCategory(data: unknown): CreateCategoryInput {
	return createCategorySchema.parse(data);
}

export function validateUpdateCategory(data: unknown): UpdateCategoryInput {
	return updateCategorySchema.parse(data);
}

export function validateCategoryId(id: string): void {
	categoryIdSchema.parse(id);
}

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
```

**Rules:**

- Zod exclusively — no manual validation
- `.parse()` throws `ZodError` automatically
- Export input types using `z.infer`
- Only import from `"zod"`

### 7.4 `index.ts` — Business Logic

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

	logger.info("Fetching all categories", { userId, page, limit });

	const where: any = {
		OR: [{ userId: userId }, { isDefault: true }],
	};

	if (params.search) {
		where.name = { contains: params.search, mode: "insensitive" };
	}

	if (params.type) {
		where.type = params.type;
	}

	const [total, categories] = await Promise.all([
		prisma.category.count({ where }),
		prisma.category.findMany({
			where,
			skip,
			take: limit,
			orderBy: [{ order: "asc" }, { name: "asc" }],
		}),
	]);

	return { data: categories, total, page, limit };
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

	logger.info("Category created", { id: category.id });
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
		throw new Error("NOT_FOUND");
	}

	if (category.isDefault) {
		throw new Error("FORBIDDEN");
	}

	const transactionCount = await prisma.transaction.count({
		where: { categoryId: id },
	});

	if (transactionCount > 0) {
		throw new Error("CONFLICT");
	}

	await prisma.category.delete({ where: { id } });
	logger.info("Category deleted", { id });
}
```

**Rules:**

- All Prisma calls live **only** here — never in route files
- Never use `any` as types
- Always call validation at the start of each function
- Throw named string errors for known failure states
- Import input types from `./validation`, output types from `./types`
- Never import `NextRequest`, `NextResponse`, or response helpers

---

## 8. Logging Rules

### 8.1 Logger Instance

```ts
const logger = new Logger("CATEGORIES-API"); // route file
const logger = new Logger("CATEGORY-SERVICE"); // service file
```

### 8.2 Log Levels

| Level   | When                                      |
| ------- | ----------------------------------------- |
| `info`  | Request received, key steps, success      |
| `warn`  | Auth failure, suspicious input, not found |
| `error` | Caught exceptions                         |
| `debug` | Dev tracing, intermediate values          |

### 8.3 Rules

- Log at the **start** of every handler (`info`)
- Log in every `catch` block before sending error response (`error`)
- Pass context as **second argument** — never string-interpolate
- **Never log** passwords, tokens, OTP codes (in production)

```ts
// ✅ Correct
logger.info("OTP session created", { email, otpId: session.id });

// ❌ Wrong
logger.info(`OTP session created: ${JSON.stringify(session)}`);
```

---

## 9. Error Handling Contract

### 9.1 Named Errors from Lib

| Lib throws                   | Route maps to        | Status |
| ---------------------------- | -------------------- | ------ |
| `"NOT_FOUND"`                | `formatNotFound`     | 404    |
| `"ALREADY_EXISTS"`           | `formatConflict`     | 409    |
| `"UNAUTHORIZED"`             | `formatUnauthorized` | 401    |
| `"FORBIDDEN"`                | `formatForbidden`    | 403    |
| `"CONFLICT"`                 | `formatConflict`     | 409    |
| `ZodError` (from `.parse()`) | `formatBadRequest`   | 400    |

### 9.2 Catch Block Pattern

```ts
} catch (error: any) {
    logger.error("POST /api/categories failed", error);

    if (error.name === "ZodError") {
        const response = formatBadRequest(startTime, error.errors?.[0]?.message);
        return NextResponse.json(response, { status: HttpStatus.BAD_REQUEST });
    }

    if (error.message === "NOT_FOUND") {
        const response = formatNotFound(startTime, "Category not found");
        return NextResponse.json(response, { status: HttpStatus.NOT_FOUND });
    }

    if (error.message === "ALREADY_EXISTS") {
        const response = formatConflict(startTime, "Category already exists");
        return NextResponse.json(response, { status: HttpStatus.CONFLICT });
    }

    const response = formatInternalError(startTime, "Operation failed");
    return NextResponse.json(response, { status: HttpStatus.INTERNAL_SERVER_ERROR });
}
```

### 9.3 Never Expose Raw Errors

Never return `error.message` directly from unknown errors. Only map known named errors.

---

## 10. Quick Reference Cheatsheet

### 10.1 New API Development Checklist

**Step 1: Create Service Layer**

- [ ] `lib/<feature>-service/types.ts` - Output types
- [ ] `lib/<feature>-service/validation.ts` - Zod schemas + input types
- [ ] `lib/<feature>-service/index.ts` - Business logic

**Step 2: Create Route Files**

- [ ] `app/api/<feature>/route.ts` - Collection routes
- [ ] `app/api/<feature>/[id]/route.ts` - Single resource routes (if needed)

**Step 3: Create OpenAPI Documentation**

- [ ] `app/api/<feature>/open-api.ts` - Collection routes spec
- [ ] `app/api/<feature>/[id]/open-api.ts` - Single resource spec (if needed)
- [ ] Register in `lib/swagger/specs/index.ts`

**Step 4: Configure Proxy**

- [ ] Add to `PUBLIC_ROUTES` (if public)
- [ ] Add rate limit to `RATE_LIMITS`

### 10.2 File Quick Reference

```
lib/<feature>-service/
├── types.ts        → OUTPUT types + params interfaces
├── validation.ts   → Zod schemas + validation functions + INPUT types
└── index.ts        → Business logic (Prisma calls, named errors)

app/api/<feature>/
├── route.ts        → Controller (no auth checks)
├── open-api.ts     → OpenAPI spec
└── [id]/
    ├── route.ts    → Dynamic controller
    └── open-api.ts → OpenAPI spec
```

### 10.3 Type Separation Rule

| File            | Contains                                          | Imports From                   |
| --------------- | ------------------------------------------------- | ------------------------------ |
| `types.ts`      | Output types, params interfaces, pagination types | Nothing (or Prisma types only) |
| `validation.ts` | Zod schemas, validation functions, input types    | `"zod"` only                   |
| `index.ts`      | Business logic                                    | `./validation`, `./types`      |

### 10.4 Always / Never Summary

| ✅ Always                                               | ❌ Never                                                  |
| ------------------------------------------------------- | --------------------------------------------------------- |
| Use named exports: `export async function GET/POST/...` | Use `export default function handler`                     |
| Record `const startTime = Date.now()` at handler top    | Forget `startTime` — all format helpers need it           |
| `await params` in every dynamic route handler           | Access `params.id` without awaiting                       |
| Wrap every handler in `try-catch`                       | Leave a handler without `try-catch`                       |
| Create `open-api.ts` for every route                    | Skip OpenAPI documentation                                |
| Configure proxy for every new API                       | Forget to add rate limits                                 |
| Get userId from `x-user-id` header                      | Add auth checks in route files                            |
| Call `NextResponse.json(formatX(...), { status })`      | Call format helpers expecting them to return NextResponse |
| Use `HttpStatus` constants for status codes             | Hard-code status numbers like `200`, `400`                |
| Use Zod for all validation                              | Write manual validation logic                             |
| Export input types from `validation.ts`                 | Export input types from `types.ts`                        |
| Throw named string errors from `index.ts`               | Import `NextRequest` or `NextResponse` in lib files       |
| Log at the start of every handler                       | Log passwords, tokens, or secrets                         |
| Check `error.name === "ZodError"` in catch              | Return `error.message` directly from unknown errors       |
| Include user ID in all Prisma `where` clauses           | Forget row-level security checks                          |

---
