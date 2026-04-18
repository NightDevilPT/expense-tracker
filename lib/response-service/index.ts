// ============================================
// ERROR CODES ENUM
// ============================================

export enum ErrorCode {
	// 400 - Bad Request
	BAD_REQUEST = "BAD_REQUEST",
	VALIDATION_ERROR = "VALIDATION_ERROR",
	INVALID_INPUT = "INVALID_INPUT",
	MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",

	// 401 - Unauthorized
	UNAUTHORIZED = "UNAUTHORIZED",
	INVALID_TOKEN = "INVALID_TOKEN",
	TOKEN_EXPIRED = "TOKEN_EXPIRED",
	INVALID_CREDENTIALS = "INVALID_CREDENTIALS",

	// 403 - Forbidden
	FORBIDDEN = "FORBIDDEN",
	INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",

	// 404 - Not Found
	NOT_FOUND = "NOT_FOUND",
	USER_NOT_FOUND = "USER_NOT_FOUND",
	RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",

	// 409 - Conflict
	CONFLICT = "CONFLICT",
	ALREADY_EXISTS = "ALREADY_EXISTS",
	DUPLICATE_ENTRY = "DUPLICATE_ENTRY",

	// 429 - Too Many Requests
	TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
	RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

	// 500 - Internal Server Error
	INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
	DATABASE_ERROR = "DATABASE_ERROR",
	UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

// ============================================
// HTTP STATUS CODES
// ============================================

export const HttpStatus = {
	OK: 200,
	CREATED: 201,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	TOO_MANY_REQUESTS: 429,
	INTERNAL_SERVER_ERROR: 500,
} as const;

// ============================================
// TYPES & INTERFACES
// ============================================

export interface ApiMeta {
	timestamp: string;
	executionTimeMs: number;
	pagination?: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

export interface ApiSuccessResponse<T = any> {
	success: true;
	message: string;
	data: T;
	meta: ApiMeta;
}

export interface ApiErrorResponse {
	success: false;
	error: {
		code: ErrorCode;
		message: string;
		details?: any;
	};
	meta: ApiMeta;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================
// HELPER FUNCTIONS
// ============================================

function getTimestamp(): string {
	return new Date().toISOString();
}

function getExecutionTime(startTime: number): number {
	return Date.now() - startTime;
}

function createMeta(
	startTime: number,
	pagination?: ApiMeta["pagination"],
): ApiMeta {
	return {
		timestamp: getTimestamp(),
		executionTimeMs: getExecutionTime(startTime),
		...(pagination && { pagination }),
	};
}

// ============================================
// RESPONSE FORMATTER FUNCTIONS (Return Plain Objects)
// ============================================

/**
 * Format success response - returns plain object
 */
export function formatSuccess<T>(
	data: T,
	startTime: number,
	options?: {
		message?: string;
		pagination?: ApiMeta["pagination"];
	},
): ApiSuccessResponse<T> {
	const { message = "Success", pagination } = options || {};

	return {
		success: true,
		message,
		data,
		meta: createMeta(startTime, pagination),
	};
}

/**
 * Format error response - returns plain object
 */
export function formatError(
	startTime: number,
	options: {
		code: ErrorCode;
		message: string;
		details?: any;
	},
): ApiErrorResponse {
	const { code, message, details } = options;

	return {
		success: false,
		error: { code, message, details },
		meta: createMeta(startTime),
	};
}

// ============================================
// SHORTHAND ERROR FORMATTERS
// ============================================

export function formatBadRequest(
	startTime: number,
	message: string,
	details?: any,
): ApiErrorResponse {
	return formatError(startTime, {
		code: ErrorCode.BAD_REQUEST,
		message,
		details,
	});
}

export function formatUnauthorized(
	startTime: number,
	message: string,
	details?: any,
): ApiErrorResponse {
	return formatError(startTime, {
		code: ErrorCode.UNAUTHORIZED,
		message,
		details,
	});
}

export function formatForbidden(
	startTime: number,
	message: string,
	details?: any,
): ApiErrorResponse {
	return formatError(startTime, {
		code: ErrorCode.FORBIDDEN,
		message,
		details,
	});
}

export function formatNotFound(
	startTime: number,
	message: string,
	details?: any,
): ApiErrorResponse {
	return formatError(startTime, {
		code: ErrorCode.NOT_FOUND,
		message,
		details,
	});
}

export function formatConflict(
	startTime: number,
	message: string,
	details?: any,
): ApiErrorResponse {
	return formatError(startTime, {
		code: ErrorCode.CONFLICT,
		message,
		details,
	});
}

export function formatTooManyRequests(
	startTime: number,
	message: string,
	details?: any,
): ApiErrorResponse {
	return formatError(startTime, {
		code: ErrorCode.TOO_MANY_REQUESTS,
		message,
		details,
	});
}

export function formatInternalError(
	startTime: number,
	message: string,
	details?: any,
): ApiErrorResponse {
	return formatError(startTime, {
		code: ErrorCode.INTERNAL_SERVER_ERROR,
		message,
		details,
	});
}

// ============================================
// PAGINATED RESPONSE FORMATTER
// ============================================

export function formatPaginated<T>(
	data: T,
	startTime: number,
	pagination: ApiMeta["pagination"],
	message: string = "Success",
): ApiSuccessResponse<T> {
	return formatSuccess(data, startTime, { message, pagination });
}
