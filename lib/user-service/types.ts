// lib/user-service/types.ts

// Only database/model output types

export interface OTPSession {
  id: string;
  email: string;
  otpCode: string;
  expiresAt: Date;
  verifiedAt?: Date;
  attempts: number;
  createdAt: Date;
  deletedAt?: Date;
}

// User profile output type (without sensitive data)
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  currency: string;
  theme: string;
  firstDayOfWeek: number;
  dateFormat: string;
  numberFormat: string;
  emailNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Safe user profile (excludes any sensitive fields)
export type SafeUserProfile = UserProfile;