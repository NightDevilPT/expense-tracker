// lib/api-client.ts

import {
	ApiResponse,
	ApiErrorResponse,
	HttpStatus,
} from "@/lib/response-service";

export class ApiError extends Error {
	code: string;
	details?: any;
	status: number;

	constructor(message: string, code: string, status: number, details?: any) {
		super(message);
		this.name = "ApiError";
		this.code = code;
		this.status = status;
		this.details = details;
	}
}

interface RequestOptions {
	method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
	body?: any;
	headers?: Record<string, string>;
	cache?: RequestCache;
	next?: NextFetchRequestConfig;
}

interface ApiClientConfig {
	baseURL?: string;
	defaultHeaders?: Record<string, string>;
}

class ApiClient {
	private baseURL: string;
	private defaultHeaders: Record<string, string>;

	constructor(config: ApiClientConfig = {}) {
		this.baseURL = config.baseURL || "";
		this.defaultHeaders = {
			"Content-Type": "application/json",
			...config.defaultHeaders,
		};
	}

	private async request<T>(
		endpoint: string,
		options: RequestOptions = {},
	): Promise<T> {
		const { method = "GET", body, headers = {}, cache, next } = options;

		const url = `${this.baseURL}${endpoint}`;

		const fetchOptions: RequestInit = {
			method,
			headers: {
				...this.defaultHeaders,
				...headers,
			},
			credentials: "include",
			cache,
			next,
		};

		if (body) {
			fetchOptions.body = JSON.stringify(body);
		}

		try {
			const response = await fetch(url, fetchOptions);
			const data: ApiResponse<T> = await response.json();

			if (!data.success) {
				const errorData = data as ApiErrorResponse;
				throw new ApiError(
					errorData.error.message,
					errorData.error.code,
					response.status,
					errorData.error.details,
				);
			}

			return data.data;
		} catch (error) {
			if (error instanceof ApiError) {
				throw error;
			}

			if (error instanceof Error) {
				throw new ApiError(
					error.message || "Network error",
					"NETWORK_ERROR",
					0,
				);
			}

			throw new ApiError("An unknown error occurred", "UNKNOWN_ERROR", 0);
		}
	}

	async get<T>(
		endpoint: string,
		options?: Omit<RequestOptions, "method" | "body">,
	): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: "GET" });
	}

	async post<T>(
		endpoint: string,
		body?: any,
		options?: Omit<RequestOptions, "method" | "body">,
	): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: "POST", body });
	}

	async put<T>(
		endpoint: string,
		body?: any,
		options?: Omit<RequestOptions, "method" | "body">,
	): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: "PUT", body });
	}

	async delete<T>(
		endpoint: string,
		options?: Omit<RequestOptions, "method" | "body">,
	): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: "DELETE" });
	}

	async patch<T>(
		endpoint: string,
		body?: any,
		options?: Omit<RequestOptions, "method" | "body">,
	): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: "PATCH", body });
	}
}

export const apiClient = new ApiClient({
	baseURL: "/api",
});

export default apiClient;
