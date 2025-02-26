import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import SimulatorPanel from "./SimulatorPanel";
import JSON5 from "json5";

jest.mock("@gorules/jdm-editor", () => ({
  GraphSimulator: ({ defaultRequest, onRun, onClear }: any) => (
    <div data-testid="graph-simulator">
      <textarea data-testid="simulator-input" defaultValue={defaultRequest || JSON5.stringify({})} />
      <button
        onClick={() =>
          onRun({
            context: defaultRequest ? JSON5.parse(defaultRequest) : {},
          })
        }
        data-testid="run-button"
      >
        Run Simulation
      </button>
      <button onClick={onClear} data-testid="clear-button">
        Clear
      </button>
    </div>
  ),
}));

describe("SimulatorPanel", () => {
  const mockContext = {
    input: "test input",
    value: 123,
  };

  const mockProps = {
    contextToSimulate: mockContext,
    setContextToSimulate: jest.fn(),
    runSimulation: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Rendering", () => {
    test("renders with initial context", () => {
      render(<SimulatorPanel {...mockProps} />);
      const input = screen.getByTestId("simulator-input");
      expect(input).toHaveValue(JSON5.stringify(mockContext));
    });
  });

  describe("Simulation Actions", () => {
    test("calls runSimulation when run button clicked", async () => {
      render(<SimulatorPanel {...mockProps} />);
      const runButton = screen.getByTestId("run-button");

      fireEvent.click(runButton);
      expect(mockProps.runSimulation).toHaveBeenCalledWith(mockContext);
    });

    test("calls setContextToSimulate with empty object when cleared", () => {
      render(<SimulatorPanel {...mockProps} />);
      const clearButton = screen.getByTestId("clear-button");

      fireEvent.click(clearButton);
      expect(mockProps.setContextToSimulate).toHaveBeenCalledWith({});
    });
  });
});
