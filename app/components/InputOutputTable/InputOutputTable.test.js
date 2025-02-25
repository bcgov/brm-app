import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import InputOutputTable from "./InputOutputTable";

describe("InputOutputTable", () => {
  const mockSetRawData = jest.fn();
  const defaultProps = {
    title: "Test Table",
    rawData: {
      field1: "value1",
      field2: 42,
    },
    setRawData: mockSetRawData,
    editable: true,
  };

  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })),
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Table Rendering", () => {
    test("renders table with data", () => {
      render(<InputOutputTable {...defaultProps} />);
      expect(screen.getByText("Test Table")).toBeInTheDocument();
      const inputs = screen.getAllByRole("textbox");
      expect(inputs[0]).toHaveValue("value1");
      expect(inputs[1]).toHaveValue("42");
    });

    test("handles null or undefined rawData", () => {
      render(<InputOutputTable {...defaultProps} rawData={null} />);
      expect(screen.getByText("Test Table")).toBeInTheDocument();
    });

    test("filters out ignored properties", () => {
      const dataWithIgnored = {
        field1: "value1",
        submit: true,
        lateEntry: false,
        rulemap: {},
      };
      render(<InputOutputTable {...defaultProps} rawData={dataWithIgnored} />);
      const inputs = screen.getAllByRole("textbox");
      expect(inputs[0]).toHaveValue("value1");
      expect(screen.queryByText("submit")).not.toBeInTheDocument();
    });
  });

  describe("Value Processing and Display", () => {
    test("displays boolean values with appropriate tags", () => {
      const booleanData = {
        trueProp: true,
        falseProp: false,
      };
      render(<InputOutputTable {...defaultProps} rawData={booleanData} editable={false} />);

      expect(screen.getByText("TRUE")).toHaveClass("ant-tag-green");
      expect(screen.getByText("FALSE")).toHaveClass("ant-tag-red");
    });

    test("formats amount fields with dollar signs", () => {
      const amountData = {
        total_amount: 1234.56,
        regular_number: 1234.56,
      };
      render(<InputOutputTable {...defaultProps} rawData={amountData} editable={false} />);

      expect(screen.getByText("$1,234.56")).toHaveClass("ant-tag-green");
      expect(screen.getByText("1234.56")).toBeInTheDocument();
    });

    test("handles array and object values", () => {
      const arrayData = {
        arrayField: [
          {
            name: "item1",
            value: "test1",
          },
          {
            name: "item2",
            value: "test2",
          },
        ],
      };
      render(<InputOutputTable {...defaultProps} rawData={arrayData} editable={false} />);
      expect(screen.getByText("arrayField 1")).toBeInTheDocument();
      expect(screen.getByText("arrayField 2")).toBeInTheDocument();
      expect(screen.getAllByText("name")).toHaveLength(2);
    });
  });

  describe("Editable Mode", () => {
    test("allows input value changes", () => {
      render(<InputOutputTable {...defaultProps} />);

      const input = screen.getAllByRole("textbox")[0];
      fireEvent.change(input, { target: { value: "new value" } });
      fireEvent.blur(input);

      expect(mockSetRawData).toHaveBeenCalled();
    });

    test("handles clear button click", () => {
      render(<InputOutputTable {...defaultProps} />);

      const clearButtons = screen.getAllByRole("button");
      fireEvent.click(clearButtons[0]);

      expect(mockSetRawData).toHaveBeenCalledWith(
        expect.objectContaining({
          field1: null,
        })
      );
    });

    test("handles Enter key press with submit button ref", () => {
      const mockSubmitRef = {
        current: { click: jest.fn() },
      };

      render(<InputOutputTable {...defaultProps} submitButtonRef={mockSubmitRef} />);

      const input = screen.getAllByRole("textbox")[0];
      fireEvent.keyDown(input, { key: "Enter" });

      expect(mockSubmitRef.current.click).toHaveBeenCalled();
    });
  });

  describe("Output Table Visibility", () => {
    test("toggles table visibility for Outputs title", () => {
      render(<InputOutputTable {...defaultProps} title="Outputs" />);

      const toggleButton = screen.getByText("Hide");
      fireEvent.click(toggleButton);

      expect(screen.getByText("Show")).toBeInTheDocument();
    });

    test("does not show toggle button for non-Outputs title", () => {
      render(<InputOutputTable {...defaultProps} title="Inputs" />);

      expect(screen.queryByText("Hide")).not.toBeInTheDocument();
      expect(screen.queryByText("Show")).not.toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    test("handles missing setRawData function", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      render(<InputOutputTable {...defaultProps} setRawData={undefined} />);

      const input = screen.getAllByRole("textbox")[0];
      fireEvent.change(input, { target: { value: "new value" } });
      fireEvent.blur(input);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test("handles value parsing edge cases", () => {
      render(<InputOutputTable {...defaultProps} />);
      const input = screen.getAllByRole("textbox")[0];

      // Test string inputs maintaining type
      fireEvent.change(input, { target: { value: "true" } });
      fireEvent.blur(input);
      expect(mockSetRawData).toHaveBeenCalledWith({
        field1: "true",
        field2: 42,
      });

      // Test numeric string maintaining type
      fireEvent.change(input, { target: { value: "123" } });
      fireEvent.blur(input);
      expect(mockSetRawData).toHaveBeenCalledWith({
        field1: "123",
        field2: 42,
      });
    });
  });
});
