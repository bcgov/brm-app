import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import VersionBar from "./VersionBar";
import { RULE_VERSION } from "@/app/constants/ruleVersion";
import { RuleInfo } from "@/app/types/ruleInfo";

const originalEnv = process.env;

jest.mock("antd", () => ({
  Flex: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Radio: {
    Group: ({ children, onChange }: any) => (
      <div data-testid="radio-group" onChange={onChange}>
        {children}
      </div>
    ),
    Button: ({ children, value, style }: any) => (
      <button data-testid={`version-button-${value}`} value={value} style={style}>
        {children}
      </button>
    ),
  },
  Grid: {
    useBreakpoint: () => ({ md: true }),
  },
}));

describe("VersionBar", () => {
  const mockRuleInfo: RuleInfo = {
    _id: "rule1",
    name: "Test Rule",
    filepath: "/test/path",
    isPublished: true,
    reviewBranch: "review-branch",
  };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete (window as any).location;
    window.location = new URL("http://localhost") as any;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Initial Rendering", () => {
    test("renders all version buttons when rule is published and in production", () => {
      process.env.NEXT_PUBLIC_IN_PRODUCTION = "true";
      render(<VersionBar ruleInfo={mockRuleInfo} />);

      expect(screen.getByTestId("version-button-draft")).toBeInTheDocument();
      expect(screen.getByTestId("version-button-inReview")).toBeInTheDocument();
      expect(screen.getByTestId("version-button-inDev")).toBeInTheDocument();
      expect(screen.getByTestId("version-button-inProduction")).toBeInTheDocument();
    });

    test("does not render production button when not in production environment", () => {
      process.env.NEXT_PUBLIC_IN_PRODUCTION = "false";
      render(<VersionBar ruleInfo={mockRuleInfo} />);

      expect(screen.getByTestId("version-button-draft")).toBeInTheDocument();
      expect(screen.getByTestId("version-button-inReview")).toBeInTheDocument();
      expect(screen.getByTestId("version-button-inDev")).toBeInTheDocument();
      expect(screen.queryByTestId("version-button-inProduction")).not.toBeInTheDocument();
    });

    test("does not render review button when no review branch exists", () => {
      const ruleInfoNoReview = { ...mockRuleInfo, reviewBranch: undefined };
      render(<VersionBar ruleInfo={ruleInfoNoReview} />);

      expect(screen.getByTestId("version-button-draft")).toBeInTheDocument();
      expect(screen.queryByTestId("version-button-inReview")).not.toBeInTheDocument();
    });

    test("does not render dev and production buttons when rule is not published", () => {
      const unpublishedRule = { ...mockRuleInfo, isPublished: false };
      render(<VersionBar ruleInfo={unpublishedRule} />);

      expect(screen.getByTestId("version-button-draft")).toBeInTheDocument();
      expect(screen.getByTestId("version-button-inReview")).toBeInTheDocument();
      expect(screen.queryByTestId("version-button-inDev")).not.toBeInTheDocument();
      expect(screen.queryByTestId("version-button-inProduction")).not.toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    test("applies correct styling to active version button", () => {
      render(<VersionBar ruleInfo={mockRuleInfo} version={RULE_VERSION.inDev} />);

      const inDevButton = screen.getByTestId("version-button-inDev");
      expect(inDevButton).toHaveStyle({
        backgroundColor: "var(--color-in-dev)",
        color: "white",
        height: "44px",
      });
    });

    test("does not apply active styling to inactive version buttons", () => {
      render(<VersionBar ruleInfo={mockRuleInfo} version={RULE_VERSION.inDev} />);

      const draftButton = screen.getByTestId("version-button-draft");
      expect(draftButton).not.toHaveStyle({
        backgroundColor: "var(--color-in-dev)",
        color: "white",
      });
    });
  });
});
