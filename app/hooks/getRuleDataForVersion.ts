import { RuleInfo } from "../types/ruleInfo";
import { RULE_VERSION } from "../constants/ruleVersion";
import { getFileAsJsonIfAlreadyExists } from "../utils/githubApi";
import { getRuleDraft, getDocument, getRuleDataById } from "../utils/api";
import { DEFAULT_RULE_CONTENT } from "../constants/defaultRuleContent";
import { logError } from "@/app/utils/logger";

export default async function getRuleDataForVersion(ruleId: string, version?: string) {
  // Get rule data
  const ruleInfo: RuleInfo = await getRuleDataById(ruleId);
  // Get the rule content based on version and ruleInfo
  try {
    const ruleContent = await fetchRuleContentByVersion(ruleId, ruleInfo, version);
    return { ruleInfo, ruleContent };
  } catch (error: any) {
    logError("Error fetching rule content:", error);
    return { ruleInfo, ruleContent: null };
  }
}

async function fetchRuleContentByVersion(ruleId: string, ruleInfo: RuleInfo, version?: string): Promise<any> {
  switch (version) {
    case RULE_VERSION.draft:
      return await fetchDraftRuleContent(ruleId, ruleInfo);
    case RULE_VERSION.inReview:
      return await fetchReviewRuleContent(ruleInfo);
    case RULE_VERSION.inDev:
      return await fetchInDevRuleContent(ruleInfo);
    case RULE_VERSION.inProduction:
      return await fetchInProductionRuleContent(ruleInfo);
    case RULE_VERSION.embedded:
    default:
      return await fetchDefaultRuleContent(ruleInfo);
  }
}

async function fetchDraftRuleContent(ruleId: string, ruleInfo: RuleInfo): Promise<any> {
  const draft = await getRuleDraft(ruleId);
  if (draft?.content) return draft.content;
  return await getPublishedRuleContentOrDefault(ruleInfo);
}

async function fetchReviewRuleContent(ruleInfo: RuleInfo): Promise<any> {
  if (!ruleInfo.reviewBranch) {
    throw new Error("No branch in review");
  }
  return await getFileAsJsonIfAlreadyExists(ruleInfo.reviewBranch, ruleInfo.filepath);
}

async function fetchInDevRuleContent(ruleInfo: RuleInfo): Promise<any> {
  // If production version of app, get version from dev branch
  if (process.env.NEXT_PUBLIC_IN_PRODUCTION === "true") {
    return await getFileAsJsonIfAlreadyExists("dev", ruleInfo.filepath);
  }
  return await fetchDefaultRuleContent(ruleInfo);
}

async function fetchInProductionRuleContent(ruleInfo: RuleInfo): Promise<any> {
  // If dev version of app, get released version from main branch
  if (process.env.NEXT_PUBLIC_IN_PRODUCTION !== "true") {
    return await getFileAsJsonIfAlreadyExists("main", ruleInfo.filepath);
  }
  return await fetchDefaultRuleContent(ruleInfo);
}

async function fetchDefaultRuleContent(ruleInfo: RuleInfo): Promise<any> {
  return await getDocument(ruleInfo.filepath);
}

async function getPublishedRuleContentOrDefault(ruleInfo: RuleInfo) {
  if (ruleInfo.filepath) {
    return await getDocument(ruleInfo.filepath);
  }
  return DEFAULT_RULE_CONTENT;
}
