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
import {
	userPaths,
	userSchemas,
	userTags,
} from "@/app/api/user/[userId]/open-api";

// Import transaction specs
import {
	transactionPaths,
	transactionSchemas,
	transactionTags,
} from "@/app/api/transactions/open-api";

import {
	transactionByIdPaths,
	transactionByIdSchemas,
	transactionByIdTags,
} from "@/app/api/transactions/[id]/open-api";

import {
	transactionSummaryPaths,
	transactionSummarySchemas,
	transactionSummaryTags,
} from "@/app/api/transactions/summary/open-api";

import {
	transactionBulkPaths,
	transactionBulkSchemas,
	transactionBulkTags,
} from "@/app/api/transactions/bulk/open-api";

import {
	transactionExportPaths,
	transactionExportSchemas,
	transactionExportTags,
} from "@/app/api/transactions/export/open-api";

import {
	budgetPaths,
	budgetSchemas,
	budgetTags,
} from "@/app/api/budgets/open-api";

import {
	budgetByIdPaths,
	budgetByIdSchemas,
	budgetByIdTags,
} from "@/app/api/budgets/[id]/open-api";

import {
	budgetCurrentPaths,
	budgetCurrentSchemas,
	budgetCurrentTags,
} from "@/app/api/budgets/current/open-api";

import {
	budgetAlertsPaths,
	budgetAlertsSchemas,
	budgetAlertsTags,
} from "@/app/api/budgets/alerts/open-api";

import {
	savingsGoalPaths,
	savingsGoalSchemas,
	savingsGoalTags,
} from "@/app/api/savings-goals/open-api";

import {
	savingsGoalByIdPaths,
	savingsGoalByIdSchemas,
	savingsGoalByIdTags,
} from "@/app/api/savings-goals/[id]/open-api";

import {
	savingsGoalProgressPaths,
	savingsGoalProgressSchemas,
	savingsGoalProgressTags,
} from "@/app/api/savings-goals/progress/open-api";
import {
	savingsGoalContributePaths,
	savingsGoalContributeSchemas,
	savingsGoalContributeTags,
} from "@/app/api/savings-goals/[id]/contribute/open-api";

import {
	recurringPaths,
	recurringSchemas,
	recurringTags,
} from "@/app/api/recurring/open-api";

import {
	recurringUpcomingPaths,
	recurringUpcomingSchemas,
	recurringUpcomingTags,
} from "@/app/api/recurring/upcoming/open-api";

import {
	recurringByIdPaths,
	recurringByIdSchemas,
	recurringByIdTags,
} from "@/app/api/recurring/[id]/open-api";

import {
	recurringPausePaths,
	recurringPauseSchemas,
	recurringPauseTags,
} from "@/app/api/recurring/[id]/pause/open-api";

import {
	recurringResumePaths,
	recurringResumeSchemas,
	recurringResumeTags,
} from "@/app/api/recurring/[id]/resume/open-api";

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
	...userPaths,
	...transactionPaths,
	...transactionByIdPaths,
	...transactionSummaryPaths,
	...transactionBulkPaths,
	...transactionExportPaths,
	...budgetPaths,
	...budgetByIdPaths,
	...budgetCurrentPaths,
	...budgetAlertsPaths,
	...savingsGoalPaths,
	...savingsGoalByIdPaths,
	...savingsGoalProgressPaths,
	...savingsGoalContributePaths,
	...recurringPaths,
	...recurringUpcomingPaths,
	...recurringByIdPaths,
	...recurringPausePaths,
	...recurringResumePaths,
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
	...userSchemas,
	...errorSchemas,
	...transactionSchemas,
	...transactionByIdSchemas,
	...transactionSummarySchemas,
	...transactionBulkSchemas,
	...transactionExportSchemas,
	...budgetSchemas,
	...budgetByIdSchemas,
	...budgetCurrentSchemas,
	...budgetAlertsSchemas,
	...savingsGoalSchemas,
	...savingsGoalByIdSchemas,
	...savingsGoalProgressSchemas,
	...savingsGoalContributeSchemas,
	...recurringSchemas,
	...recurringUpcomingSchemas,
	...recurringByIdSchemas,
	...recurringPauseSchemas,
	...recurringResumeSchemas,
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
	...userTags,
	...transactionTags,
	...transactionByIdTags,
	...transactionSummaryTags,
	...transactionBulkTags,
	...transactionExportTags,
	...budgetTags,
	...budgetByIdTags,
	...budgetCurrentTags,
	...budgetAlertsTags,
	...savingsGoalTags,
	...savingsGoalByIdTags,
	...savingsGoalProgressTags,
	...savingsGoalContributeTags,
	...recurringTags,
	...recurringUpcomingTags,
	...recurringByIdTags,
	...recurringPauseTags,
	...recurringResumeTags,
];
