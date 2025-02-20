import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Rule from "./page";
import getRuleDataForVersion from "@/app/hooks/getRuleDataForVersion";
import { RULE_VERSION } from "@/app/constants/ruleVersion";

jest.mock("@/app/hooks/getRuleDataForVersion", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../components/RuleManager", () => ({
  __esModule: true,
  default: ({ ruleInfo, initialRuleContent, version, showAllScenarioTabs }: any) => (
    <div data-testid="rule-manager">
      <div data-testid="rule-info">{JSON.stringify(ruleInfo)}</div>
      <div data-testid="rule-content">{JSON.stringify(initialRuleContent)}</div>
      <div data-testid="version">{String(version)}</div>
      <div data-testid="show-all-tabs">{String(showAllScenarioTabs)}</div>
    </div>
  ),
}));

describe("Rule Page", () => {
  const mockRuleId = "test-rule-id";
  const mockRuleInfo = {
    _id: mockRuleId,
    name: "Test Rule",
    filepath: "test/path.json",
  };
  const mockRuleContent = {
    nodes: [],
    edges: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Data Fetching", () => {
    test("fetches rule data with correct version", async () => {
      (getRuleDataForVersion as jest.Mock).mockResolvedValue({
        ruleInfo: mockRuleInfo,
        ruleContent: mockRuleContent,
      });

      await Rule({ params: { ruleId: mockRuleId } });

      expect(getRuleDataForVersion).toHaveBeenCalledWith(mockRuleId, RULE_VERSION.embedded);
    });
  });

  describe("Component Rendering", () => {
    test("renders RuleManager with correct props when rule exists", async () => {
      (getRuleDataForVersion as jest.Mock).mockResolvedValue({
        ruleInfo: mockRuleInfo,
        ruleContent: mockRuleContent,
      });

      const { container } = render(await Rule({ params: { ruleId: mockRuleId } }));

      expect(screen.getByTestId("rule-manager")).toBeInTheDocument();
      expect(screen.getByTestId("rule-info")).toHaveTextContent(JSON.stringify(mockRuleInfo));
      expect(screen.getByTestId("rule-content")).toHaveTextContent(JSON.stringify(mockRuleContent));
      expect(screen.getByTestId("version")).toHaveTextContent("false");
      expect(screen.getByTestId("show-all-tabs")).toHaveTextContent("false");
    });

    test("renders error message when rule not found", async () => {
      (getRuleDataForVersion as jest.Mock).mockResolvedValue({
        ruleInfo: { _id: null },
        ruleContent: null,
      });

      const { container } = render(await Rule({ params: { ruleId: mockRuleId } }));

      expect(screen.getByText("Rule not found")).toBeInTheDocument();
      expect(screen.queryByTestId("rule-manager")).not.toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    test("handles getRuleDataForVersion rejection", async () => {
      (getRuleDataForVersion as jest.Mock).mockRejectedValue(new Error("Failed to fetch"));

      await expect(Rule({ params: { ruleId: mockRuleId } })).rejects.toThrow("Failed to fetch");
    });
  });
});
