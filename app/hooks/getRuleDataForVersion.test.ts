import getRuleDataForVersion from "./getRuleDataForVersion";
import { getRuleDraft, getDocument, getRuleDataById } from "../utils/api";
import { getFileAsJsonIfAlreadyExists } from "../utils/githubApi";
import { RULE_VERSION } from "../constants/ruleVersion";
import { DEFAULT_RULE_CONTENT } from "../constants/defaultRuleContent";

jest.mock("../utils/api", () => ({
  getRuleDraft: jest.fn(),
  getDocument: jest.fn(),
  getRuleDataById: jest.fn(),
}));

jest.mock("../utils/githubApi", () => ({
  getFileAsJsonIfAlreadyExists: jest.fn(),
}));

jest.mock("@/app/utils/logger", () => ({
  logError: jest.fn(),
}));

describe("getRuleDataForVersion", () => {
  const mockRuleId = "test-rule-id";
  const mockRuleInfo = {
    _id: mockRuleId,
    filepath: "test/path.json",
    reviewBranch: "feature/test-branch",
    isPublished: true,
  };
  const mockRuleContent = { nodes: [], edges: [] };

  beforeEach(() => {
    jest.clearAllMocks();
    (getRuleDataById as jest.Mock).mockResolvedValue(mockRuleInfo);
    (getDocument as jest.Mock).mockResolvedValue(mockRuleContent);
    (getRuleDraft as jest.Mock).mockResolvedValue({ content: mockRuleContent });
    (getFileAsJsonIfAlreadyExists as jest.Mock).mockResolvedValue(mockRuleContent);
  });

  describe("Version Specific Fetching", () => {
    test("fetches draft version correctly", async () => {
      const result = await getRuleDataForVersion(mockRuleId, RULE_VERSION.draft);

      expect(getRuleDraft).toHaveBeenCalledWith(mockRuleId);
      expect(result).toEqual({
        ruleInfo: mockRuleInfo,
        ruleContent: mockRuleContent,
      });
    });

    test("fetches review version correctly", async () => {
      const result = await getRuleDataForVersion(mockRuleId, RULE_VERSION.inReview);

      expect(getFileAsJsonIfAlreadyExists).toHaveBeenCalledWith(mockRuleInfo.reviewBranch, mockRuleInfo.filepath);
      expect(result).toEqual({
        ruleInfo: mockRuleInfo,
        ruleContent: mockRuleContent,
      });
    });

    test("fetches dev version correctly when in production", async () => {
      process.env.NEXT_PUBLIC_IN_PRODUCTION = "true";

      const result = await getRuleDataForVersion(mockRuleId, RULE_VERSION.inDev);

      expect(getFileAsJsonIfAlreadyExists).toHaveBeenCalledWith("dev", mockRuleInfo.filepath);
      expect(result).toEqual({
        ruleInfo: mockRuleInfo,
        ruleContent: mockRuleContent,
      });
    });

    test("fetches production version correctly when in dev", async () => {
      process.env.NEXT_PUBLIC_IN_PRODUCTION = "false";

      const result = await getRuleDataForVersion(mockRuleId, RULE_VERSION.inProduction);

      expect(getFileAsJsonIfAlreadyExists).toHaveBeenCalledWith("main", mockRuleInfo.filepath);
      expect(result).toEqual({
        ruleInfo: mockRuleInfo,
        ruleContent: mockRuleContent,
      });
    });
  });

  describe("Error Handling", () => {
    test("returns null ruleContent on error", async () => {
      (getRuleDraft as jest.Mock).mockRejectedValue(new Error("Failed to fetch"));

      const result = await getRuleDataForVersion(mockRuleId, RULE_VERSION.draft);

      expect(result).toEqual({
        ruleInfo: mockRuleInfo,
        ruleContent: null,
      });
    });

    test("throws error when review branch is missing for review version", async () => {
      const ruleInfoWithoutBranch = { ...mockRuleInfo, reviewBranch: undefined };
      (getRuleDataById as jest.Mock).mockResolvedValue(ruleInfoWithoutBranch);

      const result = await getRuleDataForVersion(mockRuleId, RULE_VERSION.inReview);

      expect(result).toEqual({
        ruleInfo: ruleInfoWithoutBranch,
        ruleContent: null,
      });
    });
  });

  describe("Fallback Behavior", () => {
    test("falls back to published content when draft is not available", async () => {
      (getRuleDraft as jest.Mock).mockResolvedValue({});

      const result = await getRuleDataForVersion(mockRuleId, RULE_VERSION.draft);

      expect(getDocument).toHaveBeenCalledWith(mockRuleInfo.filepath);
      expect(result).toEqual({
        ruleInfo: mockRuleInfo,
        ruleContent: mockRuleContent,
      });
    });

    test("falls back to DEFAULT_RULE_CONTENT when filepath is missing", async () => {
      const ruleInfoWithoutPath = { ...mockRuleInfo, filepath: undefined };
      (getRuleDataById as jest.Mock).mockResolvedValue(ruleInfoWithoutPath);
      (getRuleDraft as jest.Mock).mockResolvedValue({});

      const result = await getRuleDataForVersion(mockRuleId, RULE_VERSION.draft);

      expect(result).toEqual({
        ruleInfo: ruleInfoWithoutPath,
        ruleContent: DEFAULT_RULE_CONTENT,
      });
    });
  });
});
