// prisma/seed/db-source/tags.ts

import { PrismaClient } from "@/generated/prisma/client";
import { SEED_CONFIG } from "../config";
import { randomItem, randomItems } from "../utils";

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#8b5cf6", "#ec4899", "#64748b", "#78716c",
];

const TAG_POOL = [
  "essential", "optional", "recurring", "one-time", "urgent",
  "planned", "impulse", "reimbursable", "tax-deductible", "work",
  "personal", "family", "travel", "online", "subscriptions",
  "cash", "card", "upi", "weekend", "weekday",
];

export async function seedTags(
  prisma: PrismaClient,
  userId: string
): Promise<Awaited<ReturnType<typeof prisma.tag.create>>[]> {
  const count = Math.min(SEED_CONFIG.tagsPerUser, TAG_POOL.length);
  const picked = randomItems(TAG_POOL, count);
  const tags: Awaited<ReturnType<typeof prisma.tag.create>>[] = [];

  for (const name of picked) {
    const tag = await prisma.tag.create({
      data: {
        name,
        color: randomItem(COLORS),
        userId,
      },
    });
    tags.push(tag);
  }

  return tags;
}