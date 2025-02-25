import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ScenarioViewer from "./ScenarioViewer";
import { deleteScenario, updateScenario } from "@/app/utils/api";
import { Scenario } from "@/app/types/scenario";

jest.mock("@/app/utils/api", () => ({
  deleteScenario: jest.fn(),
  updateScenario: jest.fn(),
}));

jest.mock("../../InputOutputTable", () => ({
  __esModule: true,
  default: ({ title, rawData }: any) => (
    <div data-testid="input-output-table">
      <h3>{title}</h3>
      <pre>{JSON.stringify(rawData)}</pre>
    </div>
  ),
}));

jest.mock("../ScenarioFormatter", () => ({
  __esModule: true,
  default: ({ title, rawData }: any) => (
    <div data-testid="scenario-formatter">
      <h3>{title}</h3>
      <pre>{JSON.stringify(rawData)}</pre>
    </div>
  ),
}));

jest.mock("antd", () => {
  const messageApi = { success: jest.fn(), error: jest.fn() };
  return {
    Flex: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Button: ({ children, onClick, disabled }: any) => (
      <button onClick={onClick} disabled={disabled}>
        {children}
      </button>
    ),
    Input: ({ value, onChange, onPressEnter, onBlur }: any) => (
      <input
        value={value}
        onChange={(e) => onChange(e)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onPressEnter?.();
            onBlur?.();
          }
        }}
        onBlur={onBlur}
        data-testid="scenario-title-input"
      />
    ),
    Popconfirm: ({ onConfirm, children }: any) => (
      <div onClick={onConfirm} data-testid="popconfirm">
        {children}
      </div>
    ),
    message: messageApi,
    Pagination: () => <div data-testid="pagination" />,
    Tooltip: ({ children }: any) => <div>{children}</div>,
  };
});

describe("ScenarioViewer", () => {
  const mockScenarios: Scenario[] = [
    {
      _id: "1",
      title: "Scenario 1",
      ruleID: "rule1",
      filepath: "/test/path",
      variables: [{ name: "input1", value: "value1" }],
      expectedResults: [],
    },
    {
      _id: "2",
      title: "Scenario 2",
      ruleID: "rule1",
      filepath: "/test/path",
      variables: [{ name: "input2", value: "value2" }],
      expectedResults: [],
    },
  ];

  const mockProps = {
    scenarios: mockScenarios,
    jsonFile: "test.json",
    resultsOfSimulation: { result: "test" },
    setSimulationContext: jest.fn(),
    runSimulation: jest.fn(),
    rulemap: {
      inputs: [],
      outputs: [],
      resultOutputs: [],
    },
    editing: true,
    setActiveTabKey: jest.fn(),
    setResetTrigger: jest.fn(),
    setScenarioName: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Rendering", () => {
    test("renders scenario list", () => {
      render(<ScenarioViewer {...mockProps} />);
      mockScenarios.forEach((scenario) => {
        expect(screen.getByText(scenario.title)).toBeInTheDocument();
      });
    });

    test("renders manage scenarios button when editing", () => {
      render(<ScenarioViewer {...mockProps} />);
      expect(screen.getByText("Manage Scenarios")).toBeInTheDocument();
    });

    test("hides manage scenarios button when not editing", () => {
      render(<ScenarioViewer {...mockProps} editing={false} />);
      expect(screen.queryByText("Manage Scenarios")).not.toBeInTheDocument();
    });
  });

  describe("Scenario Selection", () => {
    test("selects scenario and updates simulation context", () => {
      render(<ScenarioViewer {...mockProps} />);
      fireEvent.click(screen.getByText("Scenario 1"));

      expect(mockProps.setSimulationContext).toHaveBeenCalledWith({
        input1: "value1",
      });
    });

    test("runs simulation when simulate button clicked", () => {
      render(<ScenarioViewer {...mockProps} />);
      fireEvent.click(screen.getByText("Scenario 1"));
      fireEvent.click(screen.getByText("Simulate ▶"));

      expect(mockProps.runSimulation).toHaveBeenCalled();
    });
  });

  describe("Scenario Management", () => {
    test("allows deleting scenarios", async () => {
      render(<ScenarioViewer {...mockProps} />);
      fireEvent.click(screen.getByText("Manage Scenarios"));

      const deleteButton = screen.getAllByTestId("popconfirm")[0];
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(deleteScenario).toHaveBeenCalledWith("1");
      });
    });

    test("allows editing scenario names", async () => {
      render(<ScenarioViewer {...mockProps} />);

      fireEvent.click(screen.getByText("Manage Scenarios"));

      const scenarioSpan = screen.getByText("Scenario 1");
      fireEvent.click(scenarioSpan);

      const input = screen.getByTestId("scenario-title-input");
      fireEvent.change(input, { target: { value: "Updated Scenario" } });

      fireEvent.blur(input);

      await waitFor(() => {
        expect(updateScenario).toHaveBeenCalledWith(
          expect.objectContaining({
            _id: "1",
            title: "Updated Scenario",
            ruleID: "rule1",
            filepath: "/test/path",
          }),
          "1"
        );
      });
    });

    test("prevents duplicate scenario names", async () => {
      render(<ScenarioViewer {...mockProps} />);
      const { message } = require("antd");

      fireEvent.click(screen.getByText("Manage Scenarios"));

      fireEvent.click(screen.getByText("Scenario 1"));

      const input = screen.getByTestId("scenario-title-input");
      fireEvent.change(input, { target: { value: "Scenario 2" } });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith(expect.stringMatching(/already exists/i));
      });
    });
  });
});
