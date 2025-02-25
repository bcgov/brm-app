import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { RULE_VERSION } from "@/app/constants/ruleVersion";

jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

const mockGetRuleDataById = jest.fn();
const mockGetGithubAuth = jest.fn();
const mockGetRuleDataForVersion = jest.fn();

jest.mock("@/app/utils/api", () => ({
  getRuleDataById: (...args: any[]) => mockGetRuleDataById(...args),
}));

jest.mock("@/app/utils/getGithubAuth", () => ({
  __esModule: true,
  default: (...args: any[]) => mockGetGithubAuth(...args),
}));

jest.mock("@/app/hooks/getRuleDataForVersion", () => ({
  __esModule: true,
  default: (...args: any[]) => mockGetRuleDataForVersion(...args),
}));

jest.mock("@/app/components/GithubAuthProvider", () => ({
  GithubAuthProvider: ({ children }: any) => <div data-testid="github-auth-provider">{children}</div>,
}));

jest.mock("@/app/components/RuleHeader", () => ({
  __esModule: true,
  default: ({ ruleInfo }: any) => <div data-testid="rule-header">{ruleInfo.name}</div>,
}));

jest.mock("@/app/components/RuleManager", () => ({
  __esModule: true,
  default: ({ ruleInfo, version }: any) => (
    <div data-testid="rule-manager">
      <div>Rule: {ruleInfo.name}</div>
      <div>Version: {version}</div>
    </div>
  ),
}));

const { default: Rule, generateMetadata } = require("./page");

describe("Rule Page", () => {
  const mockRuleId = "test-rule-id";
  const mockRuleInfo = {
    _id: mockRuleId,
    name: "Test Rule",
    filepath: "test/path.json",
    title: "Test Rule Title",
  };
  const mockRuleContent = { nodes: [], edges: [] };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_IN_PRODUCTION = "false";

    mockGetRuleDataById.mockResolvedValue(mockRuleInfo);
    mockGetGithubAuth.mockResolvedValue({ token: "test-token" });
    mockGetRuleDataForVersion.mockResolvedValue({
      ruleInfo: mockRuleInfo,
      ruleContent: mockRuleContent,
    });
  });

  describe("Version Handling", () => {
    test("uses default dev version when not in production", async () => {
      const component = await Rule({ params: { ruleId: mockRuleId }, searchParams: {} });
      render(component);

      expect(mockGetRuleDataForVersion).toHaveBeenCalledWith(mockRuleId, RULE_VERSION.inDev);
    });

    test("uses default production version when in production", async () => {
      process.env.NEXT_PUBLIC_IN_PRODUCTION = "true";

      const component = await Rule({ params: { ruleId: mockRuleId }, searchParams: {} });
      render(component);

      expect(mockGetRuleDataForVersion).toHaveBeenCalledWith(mockRuleId, RULE_VERSION.inProduction);
    });

    test("uses version from search params when provided", async () => {
      const component = await Rule({ params: { ruleId: mockRuleId }, searchParams: { version: "draft" } });
      render(component);

      expect(mockGetRuleDataForVersion).toHaveBeenCalledWith(mockRuleId, "draft");
    });
  });

  describe("GitHub Authentication", () => {
    test("requires oauth for draft version", async () => {
      const component = await Rule({
        params: { ruleId: mockRuleId },
        searchParams: { version: "draft" },
      });
      render(component);

      expect(mockGetGithubAuth).toHaveBeenCalledWith(`rule/${mockRuleId}?version=draft`, true);
    });

    test("requires oauth for review version", async () => {
      const component = await Rule({ params: { ruleId: mockRuleId }, searchParams: { version: "inReview" } });
      render(component);

      expect(mockGetGithubAuth).toHaveBeenCalledWith(`rule/${mockRuleId}?version=inReview`, true);
    });

    test("does not require oauth for production version", async () => {
      const component = await Rule({ params: { ruleId: mockRuleId }, searchParams: { version: "inProduction" } });
      render(component);

      expect(mockGetGithubAuth).toHaveBeenCalledWith(`rule/${mockRuleId}?version=inProduction`, false);
    });
  });

  describe("Error Handling", () => {
    test("displays error when rule not found", async () => {
      mockGetRuleDataForVersion.mockResolvedValue({
        ruleInfo: { _id: null },
        ruleContent: null,
      });

      const component = await Rule({ params: { ruleId: mockRuleId }, searchParams: {} });
      render(component);

      expect(screen.getByText("Rule not found")).toBeInTheDocument();
    });
  });

  describe("Metadata Generation", () => {
    test("generates correct metadata with title", async () => {
      const metadata = await generateMetadata({
        params: { ruleId: mockRuleId },
        searchParams: {},
      });

      expect(metadata.title).toBe(mockRuleInfo.title);
      expect(mockGetRuleDataById).toHaveBeenCalledWith(mockRuleId);
    });

    test("falls back to filepath when title is missing", async () => {
      const ruleInfoNoTitle = { ...mockRuleInfo, title: undefined };
      mockGetRuleDataById.mockResolvedValueOnce(ruleInfoNoTitle);

      const metadata = await generateMetadata({
        params: { ruleId: mockRuleId },
        searchParams: {},
      });

      expect(metadata.title).toBe(ruleInfoNoTitle.filepath);
    });
  });
});
