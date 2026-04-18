// lib/cookie-service.ts
import { NextApiResponse } from "next";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const EXPIRY = {
	ACCESS: 60 * 10, // 10 minutes
	REFRESH: 60 * 12, // 12 minutes
};

export interface TokenResponse {
	accessToken: string;
	refreshToken: string;
}

export interface DecodedToken {
	id: string;
	email: string;
	name?: string;
	type: "access" | "refresh";
	iat: number;
	exp: number;
}

export class CookieService {
	// Generate tokens
	static generateTokens(payload: Record<string, any>): TokenResponse {
		const accessToken = jwt.sign(
			{ ...payload, type: "access" },
			JWT_SECRET,
			{ expiresIn: EXPIRY.ACCESS },
		);

		const refreshToken = jwt.sign(
			{ ...payload, type: "refresh" },
			JWT_SECRET,
			{ expiresIn: EXPIRY.REFRESH },
		);

		return { accessToken, refreshToken };
	}

	// Set tokens in cookies (for NextApiResponse)
	static setTokens(res: NextApiResponse, tokens: TokenResponse): void {
		res.setHeader("Set-Cookie", [
			`accessToken=${tokens.accessToken}; HttpOnly; Path=/; Max-Age=${EXPIRY.ACCESS}; ${
				process.env.NODE_ENV === "production" ? "Secure; " : ""
			}SameSite=Lax`,
			`refreshToken=${tokens.refreshToken}; HttpOnly; Path=/; Max-Age=${EXPIRY.REFRESH}; ${
				process.env.NODE_ENV === "production" ? "Secure; " : ""
			}SameSite=Lax`,
		]);
	}

	// Clear tokens from cookies
	static clearTokens(res: NextApiResponse): void {
		res.setHeader("Set-Cookie", [
			"accessToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax",
			"refreshToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax",
		]);
	}

	// Verify a single token
	static verifyToken(
		token: string,
		expectedType: "access" | "refresh",
	): DecodedToken | null {
		try {
			const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
			if (decoded.type !== expectedType) {
				return null;
			}
			return decoded;
		} catch (error) {
			return null;
		}
	}

	// Main validation function for Pages Router
	static validateTokens(
		accessToken?: string,
		refreshToken?: string,
		res?: NextApiResponse,
	): DecodedToken | null {
		// Try to verify access token
		if (accessToken) {
			const decoded = this.verifyToken(accessToken, "access");
			if (decoded) {
				return decoded; // Access token valid
			}
		}

		// Access token invalid, try refresh token
		if (refreshToken && res) {
			const decoded = this.verifyToken(refreshToken, "refresh");
			if (decoded) {
				// Refresh token valid, generate new tokens
				const payload = {
					id: decoded.id,
					email: decoded.email,
					name: decoded.name,
				};
				const newTokens = this.generateTokens(payload);
				this.setTokens(res, newTokens); // Update cookies

				// Return decoded user info
				return {
					id: decoded.id,
					email: decoded.email,
					name: decoded.name,
					type: "access",
					iat: Date.now(),
					exp: Date.now() + EXPIRY.ACCESS * 1000,
				};
			}
		}

		// Both tokens invalid
		return null;
	}
}
