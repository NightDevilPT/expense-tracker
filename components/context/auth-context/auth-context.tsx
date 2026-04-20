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
import { apiClient } from "@/lib/api-client";
import type { SafeUserProfile } from "@/lib/user-service/types";

// ============================================
// TYPES
// ============================================

export type User = SafeUserProfile;

interface RequestOtpResponse {
	email: string;
	otpId: string;
	expiresAt: string;
	otpCode?: string;
}

interface LoginResponse {
	user: User;
}

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	login: (data: LoginOtpInput) => Promise<void>;
	logout: () => Promise<void>;
	requestOtp: (data: RequestOtpInput) => Promise<RequestOtpResponse>;
	refreshUser: () => Promise<void>;
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

	const fetchUser = useCallback(async () => {
		try {
			const userData = await apiClient.get<User>("/auth/me");
			setUser(userData);
			return userData;
		} catch (error) {
			setUser(null);
			return null;
		}
	}, []);

	const refreshUser = useCallback(async () => {
		await fetchUser();
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
		async (data: RequestOtpInput): Promise<RequestOtpResponse> => {
			return apiClient.post<RequestOtpResponse>(
				"/auth/request-otp",
				data,
			);
		},
		[],
	);

	const login = useCallback(async (data: LoginOtpInput) => {
		const response = await apiClient.post<LoginResponse>(
			"/auth/login",
			data,
		);
		setUser(response.user);
	}, []);

	const logout = useCallback(async () => {
		try {
			await apiClient.post("/auth/logout");
		} catch (error) {
			console.error("Logout API error:", error);
		} finally {
			setUser(null);
		}
	}, []);

	const value: AuthContextType = {
		user,
		isLoading,
		isAuthenticated: !!user,
		login,
		logout,
		requestOtp,
		refreshUser,
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
