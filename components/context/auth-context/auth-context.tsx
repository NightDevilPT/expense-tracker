// components/context/auth-context.tsx
"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import type {
	RequestOtpInput,
	LoginOtpInput,
} from "@/lib/user-service/validation";
import { apiClient, ApiError } from "@/lib/api-client";
import type { OtpResponseData, SafeUserProfile } from "@/lib/user-service/types";
import { ErrorCode } from "@/lib/response-service";

// ============================================
// TYPES
// ============================================

export type User = SafeUserProfile;

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	error: string | null;
	login: (data: LoginOtpInput) => Promise<void>;
	logout: () => Promise<void>;
	requestOtp: (data: RequestOtpInput) => Promise<OtpResponseData>;
	refreshUser: () => Promise<void>;
	clearError: () => void;
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

interface AuthProviderProps {
	children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => setError(null), []);

	const fetchUser = useCallback(async () => {
		try {
			// ✅ apiClient.get returns ApiSuccessResponse<User>
			const response = await apiClient.get<User>("/auth/me");
			setUser(response.data);
			return response.data;
		} catch (error) {
			setUser(null);
			return null;
		}
	}, []);

	const refreshUser = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			await fetchUser();
		} catch (error) {
			const errorMessage =
				error instanceof ApiError
					? error.message
					: "Failed to refresh user";
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [fetchUser]);

	useEffect(() => {
		const initAuth = async () => {
			setIsLoading(true);
			await fetchUser();
			setIsLoading(false);
		};

		initAuth();
	}, [fetchUser]);

	const requestOtp = useCallback(
		async (data: RequestOtpInput): Promise<OtpResponseData> => {
			setIsLoading(true);
			setError(null);

			try {
				// apiClient.post returns ApiSuccessResponse<OtpResponseData>
				const response = await apiClient.post<OtpResponseData>("/auth/request-otp", data);

				// Return just the data portion since that's what the form needs
				return response.data;
			} catch (error) {
				let errorMessage = "Failed to send OTP";

				if (error instanceof ApiError) {
					if (error.code === ErrorCode.BAD_REQUEST) {
						errorMessage = error.message;
					} else if (error.code === ErrorCode.TOO_MANY_REQUESTS) {
						errorMessage = "Too many requests. Please try again later.";
					} else {
						errorMessage = error.message;
					}
				}

				setError(errorMessage);
				throw error;
			} finally {
				setIsLoading(false);
			}
		},
		[],
	);

	const login = useCallback(async (data: LoginOtpInput) => {
		setIsLoading(true);
		setError(null);

		try {
			// ✅ apiClient.post returns ApiSuccessResponse<{ user: User }>
			const response = await apiClient.post<{ user: User }>(
				"/auth/login",
				data,
			);
			setUser(response.data.user);
		} catch (error) {
			let errorMessage = "Failed to login";

			if (error instanceof ApiError) {
				if (error.code === ErrorCode.BAD_REQUEST) {
					errorMessage = "Invalid or expired OTP";
				} else if (error.code === ErrorCode.UNAUTHORIZED) {
					errorMessage = "Invalid OTP. Please try again.";
				} else {
					errorMessage = error.message;
				}
			}

			setError(errorMessage);
			throw error;
		} finally {
			setIsLoading(false);
		}
	}, []);

	const logout = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			// ✅ apiClient.post returns ApiSuccessResponse
			await apiClient.post("/auth/logout");
		} catch (error) {
			const errorMessage =
				error instanceof ApiError ? error.message : "Failed to logout";
			setError(errorMessage);
		} finally {
			setUser(null);
			setIsLoading(false);
		}
	}, []);

	const value: AuthContextType = {
		user,
		isLoading,
		isAuthenticated: !!user,
		error,
		login,
		logout,
		requestOtp,
		refreshUser,
		clearError,
	};

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}

// ============================================
// HOOK
// ============================================

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
