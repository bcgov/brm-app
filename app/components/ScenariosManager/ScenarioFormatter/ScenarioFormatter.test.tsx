import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ScenarioFormatter from "./ScenarioFormatter";
import { RuleMap } from "@/app/types/rulemap";

jest.mock("../../InputStyler/InputStyler", () => ({
  __esModule: true,
  default: ({ value }: any) => <div data-testid="input-styler">{value}</div>,
}));

jest.mock("../../InputStyler/subcomponents/FieldStyler", () => ({
  __esModule: true,
  default: ({ name }: any) => <div data-testid="field-styler">{name}</div>,
}));

jest.mock("antd", () => ({
  Table: ({ dataSource, columns }: any) => (
    <div data-testid="mock-table">
      {dataSource?.map((item: any, index: number) => (
        <div key={index} data-testid="table-row">
          {columns.map((column: any) => (
            <div key={column.key} data-testid={`${column.dataIndex}-cell`}>
              {item[column.dataIndex]}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

describe("ScenarioFormatter", () => {
  const mockRulemap: RuleMap = {
    inputs: [
      {
        name: "Input 1",
        field: "input1",
        value: "test",
      },
      {
        name: "Input 2",
        field: "input2",
        value: "test",
      },
    ],
    outputs: [
      {
        name: "Output 1",
        field: "output1",
        value: "test",
      },
      {
        name: "Output 2",
        field: "output2",
        value: "test",
      },
    ],
    resultOutputs: [
      {
        name: "Result 1",
        field: "result1",
        value: "test",
      },
      {
        name: "Result 2",
        field: "result2",
        value: "test",
      },
    ],
  };

  const mockProps = {
    title: "Inputs",
    rawData: {
      input1: "value1",
      input2: "value2",
      rulemap: true,
    },
    setRawData: jest.fn(),
    rulemap: mockRulemap,
    scenarios: [],
    range: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Rendering", () => {
    test("renders with correct title and table structure", () => {
      render(<ScenarioFormatter {...mockProps} />);
      expect(screen.getByText("Inputs")).toBeInTheDocument();
      const table = screen.getByTestId("mock-table");
      expect(table).toBeInTheDocument();

      const rows = screen.getAllByTestId("table-row");
      expect(rows).toHaveLength(2);
    });
  });

  describe("Table Visibility", () => {
    test("toggle button only appears for outputs", () => {
      const { rerender } = render(<ScenarioFormatter {...mockProps} />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();

      rerender(<ScenarioFormatter {...mockProps} title="Outputs" />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    test("toggles table visibility for outputs", () => {
      render(<ScenarioFormatter {...mockProps} title="Outputs" />);
      const toggleButton = screen.getByText("Hide");
      const table = screen.getByTestId("mock-table");

      expect(table).toBeInTheDocument();
      fireEvent.click(toggleButton);
      expect(screen.queryByTestId("mock-table")).not.toBeInTheDocument();

      fireEvent.click(screen.getByText("Show"));
      expect(screen.getByTestId("mock-table")).toBeInTheDocument();
    });
  });

  describe("Data Processing", () => {
    test("filters out ignored properties", () => {
      const dataWithIgnored = {
        input1: "value1",
        input2: "value2",
        submit: true,
        lateEntry: false,
        rulemap: true,
      };

      render(<ScenarioFormatter {...mockProps} rawData={dataWithIgnored} />);

      const rows = screen.getAllByTestId("table-row");
      expect(rows).toHaveLength(2);

      expect(screen.getByText("value1")).toBeInTheDocument();
      expect(screen.getByText("value2")).toBeInTheDocument();
    });

    test("handles null raw data correctly", () => {
      render(<ScenarioFormatter {...mockProps} rawData={null} />);
      expect(screen.getByTestId("mock-table")).toBeInTheDocument();
      expect(screen.queryByTestId("table-row")).not.toBeInTheDocument();
    });

    test("throws error when rawData is an array", () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

      const arrayData = [] as any;

      expect(() => {
        render(<ScenarioFormatter {...mockProps} rawData={arrayData} />);
      }).toThrow("Please update your rule and ensure that outputs are on one line.");

      consoleError.mockRestore();
    });
  });

  describe("Editable Behavior", () => {
    test("correctly merges rulemap inputs with raw data", () => {
      const partialData = {
        input1: "value1",
        rulemap: true,
      };

      render(<ScenarioFormatter {...mockProps} rawData={partialData} />);
      expect(screen.getByTestId("mock-table")).toBeInTheDocument();
      const cells = screen.getAllByTestId("value-cell");
      expect(cells).toHaveLength(2);
    });
  });
});
