import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ScenarioGenerator from "./ScenarioGenerator";
import { createScenario, updateScenario, getScenariosByFilename } from "@/app/utils/api";
import { RuleMap } from "@/app/types/rulemap";
import { Switch } from "antd";

jest.mock("@/app/utils/api", () => ({
  createScenario: jest.fn(),
  updateScenario: jest.fn(),
  getScenariosByFilename: jest.fn(),
}));

jest.mock("../../InputOutputTable", () => ({
  __esModule: true,
  default: ({ title, rawData, setRawData }: any) => {
    const titleOutput = typeof title === "string" ? title : <div data-testid="complex-title">Expected Results</div>;

    return (
      <div data-testid="input-output-table">
        <h3>{titleOutput}</h3>
        <pre>{JSON.stringify(rawData)}</pre>
        {setRawData && <button onClick={() => setRawData({ ...rawData, modified: true })}>Modify Data</button>}
      </div>
    );
  },
}));

jest.mock("../ScenarioFormatter", () => ({
  __esModule: true,
  default: ({ title, rawData, setRawData }: any) => (
    <div data-testid="scenario-formatter">
      <h3>{title}</h3>
      <pre>{JSON.stringify(rawData)}</pre>
      <button onClick={() => setRawData({ ...rawData, updated: true })}>Update Data</button>
    </div>
  ),
}));

jest.mock("antd", () => ({
  Flex: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Button: ({ children, disabled, onClick }: any) => (
    <button disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
  Input: ({ value, onChange, disabled }: any) => (
    <input value={value} onChange={onChange} disabled={disabled} data-testid="scenario-name-input" />
  ),
  Popconfirm: ({ onConfirm, children }: any) => <div onClick={onConfirm}>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  Switch: ({ checked, onChange }: any) => (
    <button data-testid="auto-copy-switch" onClick={() => onChange(!checked)} data-checked={checked ? "true" : "false"}>
      Toggle Auto-Copy
    </button>
  ),
}));

describe("ScenarioGenerator", () => {
  const mockRulemap: RuleMap = {
    inputs: [
      { name: "Input 1", field: "input1", value: "test" },
      { name: "Input 2", field: "input2", value: "test" },
    ],
    outputs: [
      { name: "Output 1", field: "output1", value: "test" },
      { name: "Output 2", field: "output2", value: "test" },
    ],
    resultOutputs: [
      { name: "Result 1", field: "result1", value: "test" },
      { name: "Result 2", field: "result2", value: "test" },
    ],
  };

  const mockProps = {
    scenarios: [],
    resultsOfSimulation: { result: "test" },
    simulationContext: { input: "test" },
    setSimulationContext: jest.fn(),
    runSimulation: jest.fn(),
    resetTrigger: false,
    ruleId: "test-rule",
    jsonFile: "test.json",
    rulemap: mockRulemap,
    scenarioName: "Test Scenario",
    setScenarioName: jest.fn(),
    setActiveTabKey: jest.fn(),
    setActiveScenarios: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Rendering", () => {
    test("renders simulation inputs", () => {
      render(<ScenarioGenerator {...mockProps} />);
      expect(screen.getByTestId("scenario-formatter")).toBeInTheDocument();
    });

    test("renders simulation results when available", () => {
      render(<ScenarioGenerator {...mockProps} />);
      const results = screen.getAllByTestId("input-output-table");
      expect(results[0]).toHaveTextContent("Results");
    });

    test("renders expected results section when editing", () => {
      render(<ScenarioGenerator {...mockProps} editing={true} />);
      const results = screen.getAllByTestId("input-output-table");
      expect(results[1]).toHaveTextContent("Expected Results");
    });
  });

  describe("Simulation Actions", () => {
    test("allows running simulation", () => {
      render(<ScenarioGenerator {...mockProps} />);
      const simulateButton = screen.getByText("Simulate ▶");

      fireEvent.click(simulateButton);
      expect(mockProps.runSimulation).toHaveBeenCalled();
    });

    test("updates simulation context with proper data structure", () => {
      render(<ScenarioGenerator {...mockProps} />);
      const updateButton = screen.getByText("Update Data");

      fireEvent.click(updateButton);
      expect(mockProps.setSimulationContext).toHaveBeenCalledWith(
        expect.objectContaining({
          input: "test",
          updated: true,
        })
      );
    });
  });

  describe("Scenario Management", () => {
    test("handles new scenario creation with error handling", async () => {
      const mockError = new Error("Creation failed");
      (createScenario as jest.Mock).mockRejectedValueOnce(mockError);

      render(<ScenarioGenerator {...mockProps} />);

      fireEvent.click(screen.getByText("Simulate ▶"));
      fireEvent.click(screen.getByText("Save Scenario ⬇️"));

      await waitFor(() => {
        expect(createScenario).toHaveBeenCalled();
        expect(mockProps.setActiveScenarios).not.toHaveBeenCalled();
      });
    });

    test("handles existing scenario update with success flow", async () => {
      const existingScenarios = [
        {
          _id: "123",
          title: "Test Scenario",
          ruleID: "test-rule",
          filepath: "test.json",
          variables: [],
          expectedResults: [],
        },
      ];

      const updatedScenarios = [...existingScenarios];
      (getScenariosByFilename as jest.Mock).mockResolvedValueOnce(updatedScenarios);

      render(<ScenarioGenerator {...mockProps} scenarios={existingScenarios} />);

      fireEvent.click(screen.getByText("Simulate ▶"));
      fireEvent.click(screen.getByText("Save Scenario ⬇️"));

      await waitFor(() => {
        expect(updateScenario).toHaveBeenCalled();
        expect(getScenariosByFilename).toHaveBeenCalledWith("test.json");
        expect(mockProps.setActiveScenarios).toHaveBeenCalledWith(updatedScenarios);
      });
    });

    test("disables save button without scenario name", () => {
      render(<ScenarioGenerator {...mockProps} scenarioName="" simulationContext={{ input: "test" }} />);
      fireEvent.click(screen.getByText("Simulate ▶"));

      const saveButton = screen.getByText("Save Scenario ⬇️").closest("button");
      expect(saveButton).toBeDisabled();
    });
  });

  describe("Reset Behavior", () => {
    test("performs complete reset when resetTrigger changes", () => {
      const { rerender } = render(<ScenarioGenerator {...mockProps} />);

      rerender(<ScenarioGenerator {...mockProps} resetTrigger={true} />);

      expect(mockProps.setSimulationContext).toHaveBeenCalledWith(expect.objectContaining({ rulemap: true }));

      const simulateButton = screen.getByText("Simulate ▶");
      fireEvent.click(simulateButton);

      expect(mockProps.runSimulation).toHaveBeenCalled();
    });
  });
});
