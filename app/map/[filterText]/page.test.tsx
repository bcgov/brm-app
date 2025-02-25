import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import Map from "./page";
import { fetchAndProcessRuleData } from "@/app/utils/graphUtils";
import { logError } from "@/app/utils/logger";

jest.mock("@/app/utils/graphUtils", () => ({
  fetchAndProcessRuleData: jest.fn(),
}));

jest.mock("@/app/utils/logger", () => ({
  logError: jest.fn(),
}));

jest.mock("@/app/components/RuleRelationsDisplay/RuleRelationsDisplay", () => ({
  __esModule: true,
  default: ({ rules, categories, basicLegend }: any) => (
    <div data-testid="rule-relations-graph">
      <span>Rules: {rules.length}</span>
      <span>Categories: {categories.length}</span>
      {basicLegend && <span>Basic Legend</span>}
    </div>
  ),
}));

jest.mock("antd", () => ({
  Spin: ({ children, tip }: any) => (
    <div data-testid="loading-spinner">
      {tip}
      {children}
    </div>
  ),
}));

describe("Map Page", () => {
  const mockRules = [
    { id: 1, name: "Rule 1" },
    { id: 2, name: "Rule 2" },
  ];
  const mockCategories = [{ text: "Category 1", value: "cat1" }];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Loading", () => {
    test("shows loading spinner initially", () => {
      (fetchAndProcessRuleData as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<Map params={{ filterText: "test" }} />);

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
      expect(screen.getByText("Loading rules...")).toBeInTheDocument();
    });
  });

  describe("Data Fetching", () => {
    test("fetches and displays rule data correctly", async () => {
      (fetchAndProcessRuleData as jest.Mock).mockResolvedValue({
        rules: mockRules,
        categories: mockCategories,
        isEmbedded: false,
      });

      await act(async () => {
        render(<Map params={{ filterText: "test" }} />);
      });

      expect(fetchAndProcessRuleData).toHaveBeenCalledWith("test");
      expect(screen.getByText("Rules: 2")).toBeInTheDocument();
      expect(screen.getByText("Categories: 1")).toBeInTheDocument();
    });

    test("handles embedded view correctly", async () => {
      (fetchAndProcessRuleData as jest.Mock).mockResolvedValue({
        rules: mockRules,
        categories: mockCategories,
        isEmbedded: true,
      });

      await act(async () => {
        render(<Map params={{ filterText: "embed&category=test" }} />);
      });

      expect(screen.getByText("Basic Legend")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    test("handles fetch errors gracefully", async () => {
      const error = new Error("Failed to fetch");
      (fetchAndProcessRuleData as jest.Mock).mockRejectedValue(error);

      await act(async () => {
        render(<Map params={{ filterText: "test" }} />);
      });

      expect(logError).toHaveBeenCalledWith(error.message);
      expect(screen.getByTestId("rule-relations-graph")).toBeInTheDocument();
    });
  });

  describe("Filter Text Processing", () => {
    test("decodes filter text for display", async () => {
      (fetchAndProcessRuleData as jest.Mock).mockResolvedValue({
        rules: mockRules,
        categories: mockCategories,
        isEmbedded: false,
      });

      await act(async () => {
        render(<Map params={{ filterText: "test%20category" }} />);
      });

      expect(fetchAndProcessRuleData).toHaveBeenCalledWith("test%20category");
    });
  });
});
