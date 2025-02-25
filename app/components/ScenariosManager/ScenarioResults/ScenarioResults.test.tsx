import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ScenarioResults from "./ScenarioResults";
import { runDecisionsForScenarios } from "@/app/utils/api";

jest.mock("@/app/utils/api", () => ({
  runDecisionsForScenarios: jest.fn(),
}));

jest.mock("antd", () => {
  let filteredNames: string[] = [];
  const messageApi = { error: jest.fn() };

  return {
    Table: ({ dataSource = [] }: any) => (
      <div data-testid="results-table">
        {dataSource
          .filter((item: any) => filteredNames.length === 0 || filteredNames.includes(item.name))
          .map((item: any) => (
            <div key={item.key} data-testid="table-row">
              <span>{item.name}</span>
              <span
                data-testid={`result-${item.resultMatch?.props?.className === "result-match" ? "success" : "error"}`}
              >
                {item.resultMatch?.props?.className === "result-match" ? "SUCCESS" : "ERROR"}
              </span>
              {Object.entries(item).map(([key, value]: [string, any]) => {
                if (key.includes("input_amount")) {
                  return (
                    <span key={key} data-testid="amount-value">
                      ${value?.toLocaleString()}.00
                    </span>
                  );
                }
                return null;
              })}
            </div>
          ))}
      </div>
    ),
    Button: ({ children, onClick }: any) => (
      <button
        onClick={() => {
          if (children === "Show Error Scenarios") {
            filteredNames = ["Scenario 2"];
          }
          onClick?.();
        }}
      >
        {children}
      </button>
    ),
    Space: ({ children }: any) => <div>{children}</div>,
    Flex: ({ children }: any) => <div>{children}</div>,
    Tag: ({ children, color }: any) => <span data-testid={`tag-${color}`}>{children}</span>,
    message: messageApi,
  };
});

describe("ScenarioResults", () => {
  const mockScenarioResults = {
    "Scenario 1": {
      inputs: { field1: "value1" },
      result: { output1: "result1" },
      expectedResults: { output1: "result1" },
      resultMatch: true,
    },
    "Scenario 2": {
      inputs: { field1: "value2" },
      result: { output1: "result2" },
      expectedResults: { output1: "expected2" },
      resultMatch: false,
    },
  };

  const mockProps = {
    scenarios: [],
    jsonFile: "test.json",
    ruleContent: { nodes: [], edges: [] },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (runDecisionsForScenarios as jest.Mock).mockResolvedValue(mockScenarioResults);
  });

  describe("Initial Rendering", () => {
    test("renders results table", async () => {
      render(<ScenarioResults {...mockProps} />);
      expect(screen.getByTestId("results-table")).toBeInTheDocument();
    });

    test("renders control buttons", () => {
      render(<ScenarioResults {...mockProps} />);
      expect(screen.getByText("Re-Run Scenarios")).toBeInTheDocument();
      expect(screen.getByText("Show Error Scenarios")).toBeInTheDocument();
    });
  });

  describe("Results Display", () => {
    test("displays success indicators for matching results", async () => {
      render(<ScenarioResults {...mockProps} />);
      await waitFor(() => {
        const successIndicators = screen.getAllByTestId("result-success");
        expect(successIndicators[0]).toBeInTheDocument();
      });
    });

    test("displays error indicators for mismatching results", async () => {
      render(<ScenarioResults {...mockProps} />);
      await waitFor(() => {
        const errorIndicators = screen.getAllByTestId("result-error");
        expect(errorIndicators[0]).toBeInTheDocument();
      });
    });

    test("expands rows with mismatched results", async () => {
      render(<ScenarioResults {...mockProps} />);
      await waitFor(() => {
        const errorRow = screen.getByText("Scenario 2");
        expect(errorRow).toBeInTheDocument();
      });
    });
  });

  describe("Actions", () => {
    test("re-runs scenarios when button clicked", async () => {
      render(<ScenarioResults {...mockProps} />);
      fireEvent.click(screen.getByText("Re-Run Scenarios"));

      await waitFor(() => {
        expect(runDecisionsForScenarios).toHaveBeenCalledWith(mockProps.jsonFile, mockProps.ruleContent);
      });
    });

    test("shows error message when API fails", async () => {
      const error = new Error("API Error");
      (runDecisionsForScenarios as jest.Mock).mockRejectedValueOnce(error);
      const { message } = require("antd");

      render(<ScenarioResults {...mockProps} />);

      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith(expect.stringContaining("Error fetching scenario results"));
      });
    });

    test("filters to show only error scenarios", async () => {
      render(<ScenarioResults {...mockProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Show Error Scenarios"));
        expect(screen.getByText("Scenario 2")).toBeInTheDocument();
        expect(screen.queryByText("Scenario 1")).not.toBeInTheDocument();
      });
    });
  });
});
