// lib/savings-goal-service/validation.ts

import { z } from "zod";

// Create Savings Goal
export const createSavingsGoalSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  targetAmount: z.number().positive("Target amount must be positive"),
  deadline: z.string().datetime().or(z.date()),
  notes: z.string().max(500).nullable().optional(),
  linkedCategoryId: z.string().cuid("Invalid category ID").nullable().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "FAILED", "CANCELLED"]).default("ACTIVE"),
});

// Update Savings Goal
export const updateSavingsGoalSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    targetAmount: z.number().positive().optional(),
    deadline: z.string().datetime().or(z.date()).optional(),
    notes: z.string().max(500).nullable().optional(),
    linkedCategoryId: z.string().cuid().nullable().optional(),
    status: z.enum(["ACTIVE", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// Contribute to Goal
export const contributeToGoalSchema = z.object({
  amount: z.number().positive("Contribution amount must be positive"),
  notes: z.string().max(200).optional(),
});

// Get Savings Goals Query
export const getSavingsGoalsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["ACTIVE", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
  sortBy: z.enum(["deadline", "targetAmount", "currentAmount", "progress", "createdAt"]).default("deadline"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// ID Validation
export const savingsGoalIdSchema = z.string().cuid("Invalid savings goal ID format");

// Validation Functions
export function validateCreateSavingsGoal(data: unknown): CreateSavingsGoalInput {
  return createSavingsGoalSchema.parse(data);
}

export function validateUpdateSavingsGoal(data: unknown): UpdateSavingsGoalInput {
  return updateSavingsGoalSchema.parse(data);
}

export function validateContributeToGoal(data: unknown): ContributeToGoalInput {
  return contributeToGoalSchema.parse(data);
}

export function validateGetSavingsGoalsQuery(data: unknown): GetSavingsGoalsQueryInput {
  return getSavingsGoalsQuerySchema.parse(data);
}

export function validateSavingsGoalId(id: string): void {
  savingsGoalIdSchema.parse(id);
}

// Input Types
export type CreateSavingsGoalInput = z.infer<typeof createSavingsGoalSchema>;
export type UpdateSavingsGoalInput = z.infer<typeof updateSavingsGoalSchema>;
export type ContributeToGoalInput = z.infer<typeof contributeToGoalSchema>;
export type GetSavingsGoalsQueryInput = z.infer<typeof getSavingsGoalsQuerySchema>;