import { RuleInfo } from "../types/ruleInfo";
import { RULE_VERSION } from "../constants/ruleVersion";
import { getFileAsJsonIfAlreadyExists } from "../utils/githubApi";
import { getRuleDraftByFilepath, getDocument, getRuleDataById } from "../utils/api";
import { DEFAULT_RULE_CONTENT } from "../constants/defaultRuleContent";
import { logError } from "@/app/utils/logger";

export default async function getRuleDataForVersion(ruleId: string, version?: string) {
  // Get rule data
  const ruleInfo: RuleInfo = await getRuleDataById(ruleId);
  // Get the rule content based on version and ruleInfo
  try {
    const { filepath, reviewBranch } = ruleInfo;
    const ruleContent = await fetchRuleContentByVersion(filepath, version, reviewBranch);
    return { ruleInfo, ruleContent };
  } catch (error: any) {
    logError("Error fetching rule content:", error);
    return { ruleInfo, ruleContent: null };
  }
}

export async function fetchRuleContentByVersion(
  filepath: string,
  version?: string,
  reviewBranch?: string
): Promise<any> {
  switch (version) {
    case RULE_VERSION.draft:
      return await fetchDraftRuleContent(filepath);
    case RULE_VERSION.inReview:
      return await fetchReviewRuleContent(filepath, reviewBranch);
    case RULE_VERSION.inDev:
      return await fetchInDevRuleContent(filepath);
    case RULE_VERSION.inProduction:
      return await fetchInProductionRuleContent(filepath);
    case RULE_VERSION.embedded:
    default:
      return await fetchInProductionRuleContent(filepath);
  }
}

async function fetchDraftRuleContent(filepath: string): Promise<any> {
  const draft = await getRuleDraftByFilepath(filepath);
  if (draft?.content) return draft.content;
  return await getPublishedRuleContentOrDefault(filepath);
}

async function fetchReviewRuleContent(filepath: string, reviewBranch?: string): Promise<any> {
  return await getFileAsJsonIfAlreadyExists(filepath, reviewBranch);
}

async function fetchInDevRuleContent(filepath: string): Promise<any> {
  return await getDocument(`dev/${filepath}`);
}

async function fetchInProductionRuleContent(filepath: string): Promise<any> {
  return await getDocument(`prod/${filepath}`);
}

async function getPublishedRuleContentOrDefault(filepath: string): Promise<any> {
  if (filepath) {
    return await fetchInDevRuleContent(filepath); // If no draft, get the dev version to work off of
  }
  return DEFAULT_RULE_CONTENT;
}
