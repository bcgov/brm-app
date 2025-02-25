import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import IsolationTester from "./IsolationTester";
import { getCSVTests } from "@/app/utils/api";

jest.mock("@/app/utils/api", () => ({
  getCSVTests: jest.fn(),
}));

describe("IsolationTester", () => {
  const mockProps = {
    scenarios: [],
    simulationContext: { testInput: null, rulemap: true },
    setSimulationContext: jest.fn(),
    resetTrigger: false,
    jsonFile: "test-file.json",
    rulemap: {
      inputs: [
        {
          field: "testInput",
          type: "string",
          name: "Test Input",
          value: "",
        },
      ],
      outputs: [
        {
          field: "testOutput",
          type: "string",
          name: "Test Output",
          value: "",
        },
      ],
      resultOutputs: [
        {
          field: "testOutput",
          type: "string",
          name: "Test Output",
          value: "",
        },
      ],
    },
    ruleContent: { nodes: [], edges: [] },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Rendering", () => {
    test("renders all instruction list items", () => {
      render(<IsolationTester {...mockProps} />);
      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(5);
    });

    test("renders input number with default value", () => {
      render(<IsolationTester {...mockProps} />);
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveValue("10");
    });

    test("renders generate tests button", () => {
      render(<IsolationTester {...mockProps} />);
      expect(screen.getByText("Generate Tests")).toBeInTheDocument();
    });
  });

  describe("Input Number Behavior", () => {
    test("allows changing scenario count within bounds", () => {
      render(<IsolationTester {...mockProps} />);
      const input = screen.getByRole("spinbutton");

      fireEvent.change(input, { target: { value: "50" } });
      fireEvent.blur(input);
      expect(input).toHaveValue("50");
    });

    test("prevents values above maximum", () => {
      render(<IsolationTester {...mockProps} />);
      const input = screen.getByRole("spinbutton");

      fireEvent.change(input, { target: { value: "1001" } });
      fireEvent.blur(input);
      expect(input).toHaveValue("1000");
    });

    test("prevents values below minimum", () => {
      render(<IsolationTester {...mockProps} />);
      const input = screen.getByRole("spinbutton");

      fireEvent.change(input, { target: { value: "0" } });
      fireEvent.blur(input);
      expect(input).toHaveValue("1");
    });
  });

  describe("CSV Generation", () => {
    test("shows loading state when generating tests", async () => {
      (getCSVTests as jest.Mock).mockImplementation(() => new Promise(() => {}));
      render(<IsolationTester {...mockProps} />);
      const generateButton = screen.getByText("Generate Tests");
      fireEvent.click(generateButton);
      expect(screen.getByText("Generating test scenarios...")).toBeInTheDocument();
    });

    test("handles successful CSV generation", async () => {
      (getCSVTests as jest.Mock).mockResolvedValue("success");

      render(<IsolationTester {...mockProps} />);
      const generateButton = screen.getByText("Generate Tests");

      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText("Scenario Tests: success")).toBeInTheDocument();
      });
    });

    test("handles CSV generation error", async () => {
      (getCSVTests as jest.Mock).mockRejectedValue(new Error("Failed to generate"));

      render(<IsolationTester {...mockProps} />);
      const generateButton = screen.getByText("Generate Tests");

      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText("Error downloading scenarios.")).toBeInTheDocument();
      });
    });
  });

  describe("Simulation Context Updates", () => {
    test("updates simulation context on reset trigger change", () => {
      const setSimulationContext = jest.fn();
      const initialContext = { someValue: "test", rulemap: false };

      render(
        <IsolationTester
          {...mockProps}
          simulationContext={initialContext}
          setSimulationContext={setSimulationContext}
        />
      );

      expect(setSimulationContext).toHaveBeenCalledWith({
        ...initialContext,
        rulemap: true,
      });
    });
  });

  describe("Collapse Behavior", () => {
    test("renders input variables collapse panel", () => {
      render(<IsolationTester {...mockProps} />);
      const panel = screen.getByText("Input Variables").closest(".ant-collapse-item");
      expect(panel).not.toHaveClass("ant-collapse-item-active");
    });

    test("shows scenario formatter when expanded", async () => {
      render(<IsolationTester {...mockProps} />);
      const collapseHeader = screen.getByText("Input Variables");

      fireEvent.click(collapseHeader);
      await waitFor(() => {
        const panel = screen.getByText("Input Variables").closest(".ant-collapse-item");
        expect(panel).toHaveClass("ant-collapse-item-active");
        expect(screen.getByText("Inputs")).toBeInTheDocument();
      });
    });
  });
});
