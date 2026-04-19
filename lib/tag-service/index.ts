import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/logger-service";
import {
	validateCreateTag,
	validateUpdateTag,
	validateTagId,
	validateGetTagsParams,
	validateGetPopularTagsParams,
	type CreateTagInput,
	type UpdateTagInput,
	type GetTagsParams,
	type GetPopularTagsParams,
} from "./validation";
import type { Tag, PaginatedResult, PopularTag, TagWithCount } from "./types";
import { logCreate, logUpdate, logDelete } from "@/lib/audit-service";

const logger = new Logger("TAG-SERVICE");

export async function getAllTags(
	userId: string,
	params: GetTagsParams,
): Promise<PaginatedResult<TagWithCount>> {
	// Set default values first
	const page = Math.max(1, params.page || 1);
	const limit = Math.min(100, Math.max(1, params.limit || 20));
	const skip = (page - 1) * limit;

	logger.info("Fetching all tags", {
		userId,
		page,
		limit,
		search: params.search,
	});

	// Create validated params with defaults
	const validatedParams = {
		page,
		limit,
		sortBy: params.sortBy || "name",
		sortOrder: params.sortOrder || "asc",
		search: params.search,
	};

	const where: any = { userId };

	if (validatedParams.search) {
		where.name = { contains: validatedParams.search, mode: "insensitive" };
	}

	// Build orderBy
	let orderBy: any = {};
	if (validatedParams.sortBy === "transactionCount") {
		// For transactionCount, we need to sort after getting counts
		orderBy = { name: validatedParams.sortOrder };
	} else {
		orderBy = { [validatedParams.sortBy]: validatedParams.sortOrder };
	}

	const [total, tags] = await Promise.all([
		prisma.tag.count({ where }),
		prisma.tag.findMany({
			where,
			skip,
			take: limit,
			orderBy,
		}),
	]);

	// Get transaction count for each tag
	const tagsWithCount = await Promise.all(
		tags.map(async (tag) => {
			const transactionCount = await prisma.transactionTag.count({
				where: { tagId: tag.id },
			});
			return { ...tag, transactionCount };
		}),
	);

	// Sort by transactionCount if requested
	let sortedTags = tagsWithCount;
	if (validatedParams.sortBy === "transactionCount") {
		sortedTags = tagsWithCount.sort((a, b) => {
			const countA = a.transactionCount || 0;
			const countB = b.transactionCount || 0;
			return validatedParams.sortOrder === "asc"
				? countA - countB
				: countB - countA;
		});
	}

	logger.info("Tags fetched successfully", {
		count: sortedTags.length,
		total,
		page,
		limit,
	});

	return {
		data: sortedTags as TagWithCount[],
		total,
		page,
		limit,
	};
}

export async function getTagById(id: string, userId: string): Promise<Tag> {
	logger.info("Fetching tag by ID", { id, userId });

	validateTagId(id);

	const tag = await prisma.tag.findFirst({
		where: { id, userId },
	});

	if (!tag) {
		logger.warn("Tag not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	return tag as Tag;
}

export async function createTag(
	userId: string,
	data: CreateTagInput,
): Promise<Tag> {
	logger.info("Creating new tag", { userId, name: data.name });

	const validatedData = validateCreateTag(data);

	const existingTag = await prisma.tag.findFirst({
		where: { userId, name: validatedData.name },
	});

	if (existingTag) {
		logger.warn("Tag with this name already exists", {
			userId,
			name: validatedData.name,
		});
		throw new Error("ALREADY_EXISTS");
	}

	const tag = await prisma.tag.create({
		data: {
			name: validatedData.name,
			color: validatedData.color || null,
			userId,
		},
	});

	logger.info("Tag created successfully", { id: tag.id, name: tag.name });

	// Audit log for tag creation
	await logCreate(
		userId,
		"Tag",
		tag.id,
		{
			name: tag.name,
			color: tag.color,
		},
		{
			description: `Tag "${tag.name}" created`,
		},
	);

	return tag as Tag;
}

export async function updateTag(
	id: string,
	userId: string,
	data: UpdateTagInput,
): Promise<Tag> {
	logger.info("Updating tag", { id, userId });

	validateTagId(id);
	const validatedData = validateUpdateTag(data);

	const existingTag = await prisma.tag.findFirst({
		where: { id, userId },
	});

	if (!existingTag) {
		logger.warn("Tag not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	// If name is being changed, check for duplicates
	if (validatedData.name && validatedData.name !== existingTag.name) {
		const duplicateTag = await prisma.tag.findFirst({
			where: {
				userId,
				name: validatedData.name,
				id: { not: id },
			},
		});

		if (duplicateTag) {
			logger.warn("Tag name already exists", {
				userId,
				name: validatedData.name,
			});
			throw new Error("ALREADY_EXISTS");
		}
	}

	const updatedTag = await prisma.tag.update({
		where: { id },
		data: validatedData,
	});

	logger.info("Tag updated successfully", { id, name: updatedTag.name });

	// Prepare old and new data for audit (only changed fields)
	const oldDataForAudit: Record<string, any> = {};
	const newDataForAudit: Record<string, any> = {};

	for (const key of Object.keys(validatedData)) {
		if (key in existingTag) {
			const oldValue = (existingTag as any)[key];
			const newValue = (updatedTag as any)[key];

			if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
				oldDataForAudit[key] = oldValue;
				newDataForAudit[key] = newValue;
			}
		}
	}

	// Audit log for tag update
	if (Object.keys(oldDataForAudit).length > 0) {
		await logUpdate(userId, "Tag", id, oldDataForAudit, newDataForAudit, {
			description: `Tag "${updatedTag.name}" updated`,
			excludeFields: ["id", "createdAt", "updatedAt", "userId"],
		});
	}

	return updatedTag as Tag;
}

export async function deleteTag(id: string, userId: string): Promise<void> {
	logger.info("Deleting tag", { id, userId });

	validateTagId(id);

	const tag = await prisma.tag.findFirst({
		where: { id, userId },
		include: {
			transactions: {
				take: 1,
			},
		},
	});

	if (!tag) {
		logger.warn("Tag not found", { id, userId });
		throw new Error("NOT_FOUND");
	}

	// Check if tag is used in any transactions
	if (tag.transactions.length > 0) {
		logger.warn("Tag is used in transactions, cannot delete", { id });
		throw new Error("CONFLICT");
	}

	// Prepare tag data for audit
	const tagDataForAudit = {
		name: tag.name,
		color: tag.color,
	};

	await prisma.tag.delete({ where: { id } });

	logger.info("Tag deleted successfully", { id });

	// Audit log for tag deletion
	await logDelete(userId, "Tag", id, tagDataForAudit, {
		description: `Tag "${tag.name}" deleted`,
	});
}

export async function getPopularTags(
	userId: string,
	params: GetPopularTagsParams = { limit: 10 },
): Promise<PopularTag[]> {
	logger.info("Fetching popular tags", { userId, limit: params.limit });

	const validatedParams = validateGetPopularTagsParams(params);

	const popularTags = await prisma.$queryRaw`
    SELECT 
      t.id, 
      t.name, 
      t.color,
      COUNT(tt.transactionId) as transactionCount
    FROM tags t
    JOIN transaction_tags tt ON t.id = tt.tagId
    WHERE t.userId = ${userId}
    GROUP BY t.id, t.name, t.color
    ORDER BY transactionCount DESC
    LIMIT ${validatedParams.limit}
  `;

	logger.info("Popular tags fetched successfully", {
		count: (popularTags as any[]).length,
	});

	return popularTags as PopularTag[];
}
