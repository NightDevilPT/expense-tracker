// Update lib/swagger/specs/index.ts to include categories
import { OpenAPIV3 } from "openapi-types";
import { errorSchemas } from "../schemas";

// Auth imports
import {
	requestOtpPaths,
	requestOtpSchemas,
	requestOtpTags,
} from "@/app/api/auth/request-otp/open-api";
import {
	logoutPaths,
	logoutSchemas,
	logoutTags,
} from "@/app/api/auth/logout/open-api";
import { mePaths, meSchemas, meTags } from "@/app/api/auth/me/open-api";
import {
	loginOtpPaths,
	loginOtpSchemas,
	loginOtpTags,
} from "@/app/api/auth/login/open-api";

// Tags imports
import { tagsPaths, tagsSchemas, tagsTags } from "@/app/api/tags/open-api";
import {
	popularTagsPaths,
	popularTagsSchemas,
	popularTagsTags,
} from "@/app/api/tags/popular/open-api";
import {
	tagByIdPaths,
	tagByIdSchemas,
	tagByIdTags,
} from "@/app/api/tags/[id]/open-api";

// Categories imports
import {
	categoriesPaths,
	categoriesSchemas,
	categoriesTags,
} from "@/app/api/categories/open-api";
import {
	categoryByIdPaths,
	categoryByIdSchemas,
	categoryByIdTags,
} from "@/app/api/categories/[id]/open-api";

import {
	accountsPaths,
	accountsSchemas,
	accountsTags,
} from "@/app/api/accounts/open-api";
import {
	accountByIdPaths,
	accountByIdSchemas,
	accountByIdTags,
} from "@/app/api/accounts/[id]/open-api";
import {
	accountHistoryPaths,
	accountHistorySchemas,
	accountHistoryTags,
} from "@/app/api/accounts/[id]/history/open-api";
import {
	accountAddBalancePaths,
	accountAddBalanceSchemas,
	accountAddBalanceTags,
} from "@/app/api/accounts/[id]/add-balance/open-api";
import { userPaths, userSchemas, userTags } from "@/app/api/user/[userId]/open-api";


export const allPaths: OpenAPIV3.PathsObject = {
	...requestOtpPaths,
	...loginOtpPaths,
	...logoutPaths,
	...mePaths,
	...tagsPaths,
	...popularTagsPaths,
	...tagByIdPaths,
	...categoriesPaths,
	...categoryByIdPaths,
	...accountsPaths,
	...accountByIdPaths,
	...accountHistoryPaths,
	...accountAddBalancePaths,
	...userPaths
};

export const allSchemas: Record<string, OpenAPIV3.SchemaObject> = {
	...errorSchemas,
	...requestOtpSchemas,
	...loginOtpSchemas,
	...logoutSchemas,
	...meSchemas,
	...tagsSchemas,
	...popularTagsSchemas,
	...tagByIdSchemas,
	...categoriesSchemas,
	...categoryByIdSchemas,
	...accountsSchemas,
	...accountByIdSchemas,
	...accountHistorySchemas,
	...accountAddBalanceSchemas,
	...userSchemas
};

export const allTags: OpenAPIV3.TagObject[] = [
	...requestOtpTags,
	...loginOtpTags,
	...logoutTags,
	...meTags,
	...tagsTags,
	...popularTagsTags,
	...tagByIdTags,
	...categoriesTags,
	...categoryByIdTags,
	...accountsTags,
	...accountByIdTags,
	...accountHistoryTags,
	...accountAddBalanceTags,
	...userTags
];
