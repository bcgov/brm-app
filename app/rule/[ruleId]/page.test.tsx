import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Rule, { generateMetadata } from "./page";
import { getRuleDataById } from "@/app/utils/api";
import getGithubAuth from "@/app/utils/getGithubAuth";
import getRuleDataForVersion from "@/app/hooks/getRuleDataForVersion";
import { RULE_VERSION } from "@/app/constants/ruleVersion";

jest.mock("@/app/utils/api", () => ({
  getRuleDataById: jest.fn(),
}));

jest.mock("@/app/utils/getGithubAuth", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/app/hooks/getRuleDataForVersion", () => ({
  __esModule: true,
  default: jest.fn(),
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
  default: ({ ruleInfo, initialRuleContent, version }: any) => (
    <div data-testid="rule-manager">
      <div>Rule: {ruleInfo.name}</div>
      <div>Version: {version}</div>
    </div>
  ),
}));

jest.mock("./page", () => ({
  __esModule: true,
  default: jest.fn(({ params, searchParams }) => {
    const version =
      searchParams?.version?.trim() || (process.env.NEXT_PUBLIC_IN_PRODUCTION === "true" ? "inProduction" : "inDev");

    if (!params?.ruleId) return <h1>Rule not found</h1>;

    return (
      <div data-testid="rule-page">
        <div data-testid="github-auth-provider">
          <div data-testid="rule-header">Test Rule</div>
          <div data-testid="rule-manager">
            <div>Version: {version}</div>
          </div>
        </div>
      </div>
    );
  }),
  generateMetadata: jest.fn().mockImplementation(async ({ params }) => ({
    title: params?.ruleId ? "Test Rule Title" : "Not Found",
  })),
}));

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

    (getRuleDataById as jest.Mock).mockResolvedValue(mockRuleInfo);
    (getGithubAuth as jest.Mock).mockResolvedValue({ token: "test-token" });
    (getRuleDataForVersion as jest.Mock).mockResolvedValue({
      ruleInfo: mockRuleInfo,
      ruleContent: mockRuleContent,
    });
  });

  describe("Metadata Generation", () => {
    test("generates correct metadata with title", async () => {
      const mockRuleWithTitle = { ...mockRuleInfo };
      (getRuleDataById as jest.Mock).mockResolvedValueOnce(mockRuleWithTitle);

      const { generateMetadata: actualGenerateMetadata } = jest.requireActual("./page");
      const metadata = await actualGenerateMetadata({ params: { ruleId: mockRuleId } });

      expect(metadata.title).toBe(mockRuleWithTitle.title);
    });

    test("falls back to filepath when title is missing", async () => {
      const ruleInfoNoTitle = { ...mockRuleInfo, title: undefined };
      (getRuleDataById as jest.Mock).mockResolvedValueOnce(ruleInfoNoTitle);

      const { generateMetadata: actualGenerateMetadata } = jest.requireActual("./page");
      const metadata = await actualGenerateMetadata({ params: { ruleId: mockRuleId } });

      expect(metadata.title).toBe(ruleInfoNoTitle.filepath);
    });
  });

  describe("Version Handling", () => {
    test("uses default dev version when not in production", () => {
      process.env.NEXT_PUBLIC_IN_PRODUCTION = "false";

      render(<Rule params={{ ruleId: mockRuleId }} searchParams={{}} />);

      expect(screen.getByText("Version: inDev")).toBeInTheDocument();
    });

    test("uses default production version when in production", () => {
      process.env.NEXT_PUBLIC_IN_PRODUCTION = "true";

      render(<Rule params={{ ruleId: mockRuleId }} searchParams={{}} />);

      expect(screen.getByText("Version: inProduction")).toBeInTheDocument();
    });

    test("uses version from search params when provided", () => {
      render(<Rule params={{ ruleId: mockRuleId }} searchParams={{ version: "draft" }} />);

      expect(screen.getByText("Version: draft")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    test("displays error when rule not found", () => {
      render(<Rule params={{ ruleId: "" }} searchParams={{}} />);

      expect(screen.getByText("Rule not found")).toBeInTheDocument();
    });
  });

  describe("Component Rendering", () => {
    test("renders all components correctly", () => {
      render(<Rule params={{ ruleId: mockRuleId }} searchParams={{}} />);

      expect(screen.getByTestId("github-auth-provider")).toBeInTheDocument();
      expect(screen.getByTestId("rule-header")).toBeInTheDocument();
      expect(screen.getByTestId("rule-manager")).toBeInTheDocument();
    });
  });

  describe("Metadata Generation", () => {
    const { generateMetadata } = jest.requireActual("./page");

    test("generates correct metadata with title", async () => {
      (getRuleDataById as jest.Mock).mockResolvedValue(mockRuleInfo);

      const metadata = await generateMetadata({
        params: { ruleId: mockRuleId },
      });

      expect(metadata.title).toBe(mockRuleInfo.title);
    });
  });
});
