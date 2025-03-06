import getRuleDataForVersion from "./getRuleDataForVersion";
import { getRuleDraftByFilepath, getDocument, getRuleDataById } from "../utils/api";
import { getFileAsJsonIfAlreadyExists } from "../utils/githubApi";
import { RULE_VERSION } from "../constants/ruleVersion";
import { DEFAULT_RULE_CONTENT } from "../constants/defaultRuleContent";

jest.mock("../utils/api", () => ({
  getRuleDraftByFilepath: jest.fn(),
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
    (getRuleDraftByFilepath as jest.Mock).mockResolvedValue({ content: mockRuleContent });
    (getFileAsJsonIfAlreadyExists as jest.Mock).mockResolvedValue(mockRuleContent);
  });

  describe("Version Specific Fetching", () => {
    test("fetches draft version and falls back correctly", async () => {
      // Test successful draft fetch
      const result = await getRuleDataForVersion(mockRuleId, RULE_VERSION.draft);
      expect(getRuleDraftByFilepath).toHaveBeenCalledWith(mockRuleInfo.filepath);
      expect(result).toEqual({
        ruleInfo: mockRuleInfo,
        ruleContent: mockRuleContent,
      });

      // Test fallback to published content
      (getRuleDraftByFilepath as jest.Mock).mockResolvedValue({});
      const fallbackResult = await getRuleDataForVersion(mockRuleId, RULE_VERSION.draft);
      expect(getDocument).toHaveBeenCalledWith(`dev/${mockRuleInfo.filepath}`);
      expect(fallbackResult.ruleContent).toBe(mockRuleContent);
    });

    test("fetches review version correctly", async () => {
      const result = await getRuleDataForVersion(mockRuleId, RULE_VERSION.inReview);

      expect(getFileAsJsonIfAlreadyExists).toHaveBeenCalledWith(mockRuleInfo.filepath, mockRuleInfo.reviewBranch);
      expect(result).toEqual({
        ruleInfo: mockRuleInfo,
        ruleContent: mockRuleContent,
      });
    });

    test("fetches dev version correctly", async () => {
      const devResult = await getRuleDataForVersion(mockRuleId, RULE_VERSION.inDev);
      expect(getDocument).toHaveBeenCalledWith(`dev/${mockRuleInfo.filepath}`);
      expect(devResult.ruleContent).toBe(mockRuleContent);
    });

    test("fetches production version correctly", async () => {
      const devResult = await getRuleDataForVersion(mockRuleId, RULE_VERSION.inProduction);
      expect(getDocument).toHaveBeenCalledWith(`prod/${mockRuleInfo.filepath}`);
      expect(devResult.ruleContent).toBe(mockRuleContent);
    });
  });

  describe("Error Handling", () => {
    test("handles various error scenarios", async () => {
      // Test network error
      const networkError = new Error("Network error");
      (getRuleDraftByFilepath as jest.Mock).mockRejectedValue(networkError);
      const errorResult = await getRuleDataForVersion(mockRuleId, RULE_VERSION.draft);
      expect(errorResult.ruleContent).toBeNull();

      // Test missing review branch
      const noReviewBranch = { ...mockRuleInfo, reviewBranch: undefined };
      (getRuleDataById as jest.Mock).mockResolvedValue(noReviewBranch);
      const reviewResult = await getRuleDataForVersion(mockRuleId, RULE_VERSION.inReview);
      expect(reviewResult.ruleContent).toBeNull();
    });

    test("falls back to DEFAULT_RULE_CONTENT when filepath is missing", async () => {
      const ruleInfoWithoutPath = { ...mockRuleInfo, filepath: undefined };
      (getRuleDataById as jest.Mock).mockResolvedValue(ruleInfoWithoutPath);
      (getRuleDraftByFilepath as jest.Mock).mockResolvedValue({});

      const result = await getRuleDataForVersion(mockRuleId, RULE_VERSION.draft);

      expect(result).toEqual({
        ruleInfo: ruleInfoWithoutPath,
        ruleContent: DEFAULT_RULE_CONTENT,
      });

      const noFilepath = { ...mockRuleInfo, filepath: undefined };
      (getRuleDataById as jest.Mock).mockResolvedValue(noFilepath);
      const noPathResult = await getRuleDataForVersion(mockRuleId, RULE_VERSION.draft);
      expect(noPathResult.ruleContent).toBe(DEFAULT_RULE_CONTENT);
    });
  });
});
