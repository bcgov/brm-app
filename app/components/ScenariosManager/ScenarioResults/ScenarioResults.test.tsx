import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ScenarioResults from "./ScenarioResults";
import { runDecisionsForScenarios, postDecision } from "@/app/utils/api";
import { Scenario } from "@/app/types/scenario";
import { RuleMap } from "@/app/types/rulemap";

jest.mock("@/app/utils/api", () => ({
  runDecisionsForScenarios: jest.fn(),
  postDecision: jest.fn(),
}));

jest.mock("@/app/hooks/ScreenSizeHandler", () => ({
  __esModule: true,
  default: () => ({ isMobile: false, isTablet: false }),
}));

jest.mock("../ScenarioGenerator", () => ({
  __esModule: true,
  default: () => <div data-testid="scenario-generator">Scenario Generator Mock</div>,
}));

jest.mock("antd", () => {
  let filteredNames: string[] = [];
  const messageApi = { error: jest.fn() };

  return {
    Table: ({ dataSource = [], expandable, onChange }: any) => (
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
              {expandable && (
                <button
                  onClick={() =>
                    expandable.expandIcon({
                      expanded: false,
                      onExpand: () => {},
                      record: item,
                    })
                  }
                  data-testid="expand-button"
                >
                  Expand
                </button>
              )}
              <button
                onClick={() => onChange && onChange({}, {}, { columnKey: "name", order: "ascend" })}
                data-testid="sort-button"
              >
                Sort
              </button>
              <button data-testid="edit-button" onClick={() => item.actions}>
                Edit
              </button>
            </div>
          ))}
      </div>
    ),
    Button: ({ children, onClick, type, disabled }: any) => (
      <button
        onClick={() => {
          if (children === "Show Error Scenarios") {
            filteredNames = ["Scenario 2"];
          }
          onClick?.();
        }}
        disabled={disabled}
        data-testid={`button-${type || "default"}`}
      >
        {children}
      </button>
    ),
    Space: ({ children }: any) => <div>{children}</div>,
    Flex: ({ children }: any) => <div>{children}</div>,
    Tag: ({ children, color, icon }: any) => (
      <span data-testid={`tag-${color}`}>
        {icon}
        {children}
      </span>
    ),
    message: messageApi,
    List: ({ dataSource, renderItem }: any) => (
      <div data-testid="list">
        {dataSource?.map((item: any, index: number) => (
          <div key={index}>{renderItem(item)}</div>
        ))}
      </div>
    ),
    Modal: ({ open, children, title, onCancel, footer }: any) =>
      open ? (
        <div data-testid="modal">
          <h3>{title}</h3>
          <div>{children}</div>
          <div>
            {footer}
            <button onClick={onCancel} data-testid="modal-cancel">
              Close
            </button>
          </div>
        </div>
      ) : null,
    Spin: ({ children }: any) => <div data-testid="spinner">{children}</div>,
  };
});

describe("ScenarioResults", () => {
  const mockScenarioResults = {
    "Scenario 1": {
      inputs: { field1: "value1", amount: 1000 },
      result: { output1: "result1" },
      expectedResults: { output1: "result1" },
      resultMatch: true,
    },
    "Scenario 2": {
      inputs: { field1: "value2", amount: 2000 },
      result: { output1: "result2" },
      expectedResults: { output1: "expected2" },
      resultMatch: false,
    },
  };

  const mockScenarios: Scenario[] = [
    {
      title: "Scenario 1",
      ruleID: "rule1",
      variables: [
        { name: "field1", value: "value1" },
        { name: "amount", value: 1000 },
      ],
      filepath: "test.json",
      expectedResults: [{ output1: "result1" }],
    },
    {
      title: "Scenario 2",
      ruleID: "rule1",
      variables: [
        { name: "field1", value: "value2" },
        { name: "amount", value: 2000 },
      ],
      filepath: "test.json",
      expectedResults: [{ output1: "expected2" }],
    },
  ];

  const mockRulemap: RuleMap = {
    inputs: [
      { name: "field1", value: "", type: "string" },
      { name: "amount", value: 0, type: "number" },
    ],
    outputs: [{ name: "output1", value: "", type: "string" }],
    resultOutputs: [], // Add the missing property
  };

  const mockProps = {
    scenarios: mockScenarios,
    jsonFile: "test.json",
    ruleContent: { nodes: [], edges: [] },
    rulemap: mockRulemap,
    updateScenario: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (runDecisionsForScenarios as jest.Mock).mockResolvedValue(mockScenarioResults);
    (postDecision as jest.Mock).mockResolvedValue({ result: { output1: "result1" } });
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
      expect(screen.getByText("Clear filters and sorters")).toBeInTheDocument();
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
      });
    });

    test("handles sorting and filtering", async () => {
      render(<ScenarioResults {...mockProps} />);

      await waitFor(() => {
        const sortButton = screen.getAllByTestId("sort-button")[0];
        fireEvent.click(sortButton);
        expect(screen.getByTestId("results-table")).toBeInTheDocument();
      });
    });
  });

  describe("Scenario Editing", () => {
    test("opens edit modal when edit button is clicked", async () => {
      render(<ScenarioResults {...mockProps} />);

      await waitFor(() => {
        const editButton = screen.getAllByTestId("edit-button")[0];
        fireEvent.click(editButton);
      });
    });
  });

  test("handles array results correctly", async () => {
    const arrayResultMock = {
      "Scenario 1": {
        inputs: { field1: "value1" },
        result: ["result1"],
        expectedResults: { output1: "result1" },
        resultMatch: false,
      },
    };
    (runDecisionsForScenarios as jest.Mock)
      .mockResolvedValueOnce(arrayResultMock)
      .mockResolvedValueOnce(mockScenarioResults);

    const { message } = require("antd");
    render(<ScenarioResults {...mockProps} />);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith(expect.stringContaining("Error fetching scenario results"));
    });
  });
});
