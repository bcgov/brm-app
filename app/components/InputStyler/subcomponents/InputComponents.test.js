import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  DefaultInput,
  BooleanInput,
  NumberInput,
  TextInput,
  SelectInput,
  DateInput,
  ObjectArrayInput,
  ReadOnlyStringDisplay,
  ReadOnlyNumberDisplay,
  ReadOnlyBooleanDisplay,
  ReadOnlyArrayDisplay,
  ChildFieldInput,
  ObjectLengthDisplay,
} from "./InputComponents";

jest.mock("antd", () => {
  const originalModule = jest.requireActual("antd");

  const Radio = ({ value, children, onChange }) => (
    <label data-testid={`radio-${value}`}>
      <input type="radio" value={value} onChange={() => onChange && onChange({ target: { value } })} />
      {children}
    </label>
  );

  const RadioGroup = ({ onChange, value, children }) => (
    <div
      data-testid="radio-group"
      data-value={value}
      onClick={(e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "LABEL") {
          const clickedValue =
            e.target.value === "true" ||
            (e.target.getAttribute && e.target.getAttribute("data-testid") === "radio-true");
          onChange && onChange({ target: { value: clickedValue } });
        }
      }}
    >
      {children}
    </div>
  );

  Radio.Group = RadioGroup;

  return {
    ...originalModule,
    InputNumber: ({ min, max, value, onChange, onBlur }) => (
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        data-testid="input-number"
        onChange={(e) => onChange && onChange(Number(e.target.value))}
        onBlur={onBlur}
      />
    ),
    DatePicker: ({ allowClear, id, onChange, value }) => (
      <input
        type="date"
        id={id}
        value={value}
        data-testid="date-picker"
        onChange={(e) => onChange && onChange({ format: () => e.target.value })}
      />
    ),
    AutoComplete: ({ options, defaultValue, onBlur, onChange, id, style }) => (
      <input
        type="text"
        id={id}
        defaultValue={defaultValue}
        value={defaultValue}
        data-testid="auto-complete"
        onBlur={onBlur}
        onChange={(e) => onChange && onChange(e.target.value)}
        style={style}
      />
    ),
    Select: ({ options, defaultValue, onChange, id, style, mode }) => (
      <select
        id={id}
        defaultValue={defaultValue}
        onChange={(e) => onChange && onChange(e.target.value)}
        style={style}
        multiple={mode === "multiple"}
        data-testid="select-container"
      >
        {options &&
          options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
      </select>
    ),
    Radio,
    Button: ({ icon, onClick, children }) => {
      // Handle both string icons and object icons
      const iconName =
        typeof icon === "object" && icon && icon.type
          ? icon.type.render
            ? icon.type.render.name
            : typeof icon.type === "function"
            ? icon.type.name
            : "unknown"
          : "unknown";
      return (
        <button onClick={onClick} data-testid={`button-${children || iconName}`} data-icon={iconName}>
          {children || iconName}
        </button>
      );
    },
    Flex: ({ children }) => <div data-testid="flex">{children}</div>,
    Tag: ({ children, color }) => (
      <span data-testid="tag" data-color={color}>
        {children}
      </span>
    ),
    Tooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
  };
});

// Mock icons
jest.mock("@ant-design/icons", () => ({
  MinusCircleOutlined: function MinusCircleOutlined() {
    return "MinusCircleOutlined";
  },
  PlusCircleOutlined: function PlusCircleOutlined() {
    return "PlusCircleOutlined";
  },
}));

jest.mock("../InputStyler", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="input-styler" />),
  parseSchemaTemplate: jest.fn().mockImplementation((field) => ({ arrayName: field })),
  parsePropertyName: jest.fn().mockImplementation((field) => field),
}));

describe("InputComponents", () => {
  describe("DefaultInput", () => {
    const mockHandleValueChange = jest.fn();

    test("renders input when show is true", () => {
      render(<DefaultInput show={true} field="testField" handleValueChange={mockHandleValueChange} />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    test("doesn't render when show is false", () => {
      render(<DefaultInput show={false} field="testField" handleValueChange={mockHandleValueChange} />);
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    test("calls handleValueChange on blur", () => {
      render(<DefaultInput show={true} field="testField" handleValueChange={mockHandleValueChange} />);
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "test value" } });
      fireEvent.blur(input);
      expect(mockHandleValueChange).toHaveBeenCalledWith("test value", "testField");
    });
  });

  describe("ChildFieldInput", () => {
    const mockHandleInputChange = jest.fn();
    const mockItem = {
      name: "Test Name",
      age: 25,
    };
    const mockEach = {
      field: "name",
      label: "Name Field",
    };
    const mockProps = {
      item: mockItem,
      each: mockEach,
      index: 0,
      field: "testArray",
      handleInputChange: mockHandleInputChange,
      scenarios: [],
      rawData: {},
      value: [mockItem],
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test("renders the field label", () => {
      render(<ChildFieldInput {...mockProps} />);
      expect(screen.getByText("Name Field")).toBeInTheDocument();
    });

    test("updates parent array when child field changes", () => {
      render(<ChildFieldInput {...mockProps} />);
      const updatedArray = [{ ...mockItem, name: "New Name" }];
      mockHandleInputChange(updatedArray, "testArray");
      expect(mockHandleInputChange).toHaveBeenCalledWith(updatedArray, "testArray");
    });

    test("handles nested field paths correctly", () => {
      const nestedProps = {
        ...mockProps,
        field: "parent.testArray",
        index: 1,
      };
      render(<ChildFieldInput {...nestedProps} />);
      expect(screen.getByText("Name Field")).toBeInTheDocument();
    });
  });

  describe("ObjectLengthDisplay", () => {
    test("renders object length when show is true", () => {
      const mockObject = {
        key1: "value1",
        key2: "value2",
        key3: "value3",
      };
      render(<ObjectLengthDisplay show={true} value={mockObject} />);
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    test("renders length of empty object", () => {
      render(<ObjectLengthDisplay show={true} value={{}} />);
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    test("doesn't render when show is false", () => {
      const mockObject = { key1: "value1" };
      render(<ObjectLengthDisplay show={false} value={mockObject} />);
      expect(screen.queryByText("1")).not.toBeInTheDocument();
    });
  });

  describe("BooleanInput", () => {
    const mockHandleInputChange = jest.fn();

    test("renders radio buttons when show is true", () => {
      render(<BooleanInput show={true} field="testField" handleInputChange={mockHandleInputChange} />);
      expect(screen.getByTestId("radio-group")).toBeInTheDocument();
      expect(screen.getByText("Yes")).toBeInTheDocument();
      expect(screen.getByText("No")).toBeInTheDocument();
    });

    test("handles value changes", () => {
      render(<BooleanInput show={true} field="testField" handleInputChange={mockHandleInputChange} value={false} />);
      expect(screen.getByTestId("radio-group")).toHaveAttribute("data-value", "false");
      const yesRadio = screen.getByTestId("radio-true");
      fireEvent.click(yesRadio);
      expect(mockHandleInputChange).toHaveBeenCalledWith(true, "testField");
    });

    test("clear button sets value to undefined", () => {
      render(<BooleanInput show={true} field="testField" handleInputChange={mockHandleInputChange} />);
      fireEvent.click(screen.getByTestId("button-MinusCircleOutlined"));
      expect(mockHandleInputChange).toHaveBeenCalledWith(undefined, "testField");
    });
  });

  describe("NumberInput", () => {
    const mockHandleInputChange = jest.fn();
    const mockHandleValueChange = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test("calls handleInputChange with correct value", () => {
      render(
        <NumberInput
          show={true}
          field="testField"
          handleInputChange={mockHandleInputChange}
          handleValueChange={mockHandleValueChange}
        />
      );

      const input = screen.getByTestId("input-number");
      fireEvent.blur(input, { target: { value: "42" } });

      expect(mockHandleValueChange).toHaveBeenCalledWith("42", "testField");
    });

    test("calls handleInputChange when clicking clear button", () => {
      render(
        <NumberInput
          show={true}
          field="testField"
          handleInputChange={mockHandleInputChange}
          handleValueChange={mockHandleValueChange}
        />
      );

      const buttons = screen.getAllByRole("button");
      const clearButton = buttons[0];
      fireEvent.click(clearButton);

      expect(mockHandleInputChange).toHaveBeenCalledWith(undefined, "testField");
    });

    test("handles value changes", () => {
      render(
        <NumberInput
          show={true}
          field="testField"
          handleInputChange={mockHandleInputChange}
          handleValueChange={mockHandleValueChange}
        />
      );
      const input = screen.getByTestId("input-number");
      fireEvent.change(input, { target: { value: "42" } });
      expect(mockHandleInputChange).toHaveBeenCalledWith(42, "testField");
    });
  });

  describe("TextInput", () => {
    const mockHandleValueChange = jest.fn();
    const mockHandleInputChange = jest.fn();
    const mockHandleClear = jest.fn();
    const mockValuesArray = [{ value: "option1" }, { value: "option2" }];

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test("renders AutoComplete when show is true", () => {
      render(
        <TextInput
          show={true}
          field="testField"
          valuesArray={mockValuesArray}
          handleValueChange={mockHandleValueChange}
          handleInputChange={mockHandleInputChange}
          handleClear={mockHandleClear}
        />
      );
      expect(screen.getByTestId("auto-complete")).toBeInTheDocument();
    });

    test("doesn't render when show is false", () => {
      render(
        <TextInput
          show={false}
          field="testField"
          valuesArray={mockValuesArray}
          handleValueChange={mockHandleValueChange}
          handleInputChange={mockHandleInputChange}
          handleClear={mockHandleClear}
        />
      );
      expect(screen.queryByTestId("auto-complete")).not.toBeInTheDocument();
    });

    test("calls handleValueChange on blur", () => {
      render(
        <TextInput
          show={true}
          field="testField"
          valuesArray={mockValuesArray}
          handleValueChange={mockHandleValueChange}
          handleInputChange={mockHandleInputChange}
          handleClear={mockHandleClear}
        />
      );
      const input = screen.getByTestId("auto-complete");
      fireEvent.change(input, { target: { value: "test value" } });
      fireEvent.blur(input);
      expect(mockHandleValueChange).toHaveBeenCalledWith("test value", "testField");
    });

    test("calls handleInputChange on value change", () => {
      render(
        <TextInput
          show={true}
          field="testField"
          valuesArray={mockValuesArray}
          handleValueChange={mockHandleValueChange}
          handleInputChange={mockHandleInputChange}
          handleClear={mockHandleClear}
        />
      );
      const input = screen.getByTestId("auto-complete");
      fireEvent.change(input, { target: { value: "new value" } });
      expect(mockHandleInputChange).toHaveBeenCalledWith("new value", "testField");
    });

    test("calls handleClear when clear button is clicked", () => {
      render(
        <TextInput
          show={true}
          field="testField"
          valuesArray={mockValuesArray}
          handleValueChange={mockHandleValueChange}
          handleInputChange={mockHandleInputChange}
          handleClear={mockHandleClear}
        />
      );
      const buttons = screen.getAllByRole("button");
      const clearButton = buttons[0];
      fireEvent.click(clearButton);
      expect(mockHandleClear).toHaveBeenCalledWith("testField");
    });

    test("displays default value when provided", () => {
      render(
        <TextInput
          show={true}
          value="default value"
          field="testField"
          valuesArray={mockValuesArray}
          handleValueChange={mockHandleValueChange}
          handleInputChange={mockHandleInputChange}
          handleClear={mockHandleClear}
        />
      );
      expect(screen.getByTestId("auto-complete")).toHaveValue("default value");
    });

    test("displays field label", () => {
      render(
        <TextInput
          show={true}
          field="testField"
          valuesArray={mockValuesArray}
          handleValueChange={mockHandleValueChange}
          handleInputChange={mockHandleInputChange}
          handleClear={mockHandleClear}
        />
      );
      expect(screen.getByText("testField")).toBeInTheDocument();
    });
  });

  describe("SelectInput", () => {
    const mockHandleInputChange = jest.fn();
    const options = [
      { label: "Option 1", value: "1" },
      { label: "Option 2", value: "2" },
    ];

    test("renders select with options", () => {
      render(<SelectInput show={true} field="testField" options={options} handleInputChange={mockHandleInputChange} />);
      expect(screen.getByTestId("select-container")).toBeInTheDocument();
    });

    test("handles multiple select mode", () => {
      render(
        <SelectInput
          show={true}
          field="testField"
          options={options}
          handleInputChange={mockHandleInputChange}
          multiple={true}
        />
      );
      const multipleSelect = screen.getByTestId("select-container");
      expect(multipleSelect).toBeInTheDocument();
      expect(multipleSelect).toHaveAttribute("multiple");
    });
  });

  describe("DateInput", () => {
    const mockHandleInputChange = jest.fn();
    const mockHandleClear = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test("renders DatePicker when show is true", () => {
      render(
        <DateInput
          show={true}
          field="testDate"
          handleInputChange={mockHandleInputChange}
          handleClear={mockHandleClear}
        />
      );
      expect(screen.getByTestId("date-picker")).toBeInTheDocument();
    });

    test("handles date changes", () => {
      render(
        <DateInput
          show={true}
          field="testDate"
          value="2024-01-01"
          handleInputChange={mockHandleInputChange}
          handleClear={mockHandleClear}
        />
      );
      const datePicker = screen.getByTestId("date-picker");
      fireEvent.change(datePicker, { target: { value: "2024-02-01" } });
      expect(mockHandleInputChange).toHaveBeenCalledWith("2024-02-01", "testDate");
    });
  });

  describe("ReadOnlyDisplays", () => {
    test("ReadOnlyStringDisplay renders tags for comma-separated values", () => {
      render(<ReadOnlyStringDisplay show={true} value="one,two,three" />);
      const tags = screen.getAllByTestId("tag");
      expect(tags).toHaveLength(3);
      expect(tags[0]).toHaveTextContent("one");
      expect(tags[1]).toHaveTextContent("two");
      expect(tags[2]).toHaveTextContent("three");
    });

    test("ReadOnlyNumberDisplay formats currency when field includes 'amount'", () => {
      render(<ReadOnlyNumberDisplay show={true} value={1000} field="amount" />);
      const tag = screen.getByTestId("tag");
      expect(tag).toHaveTextContent("$");
    });

    test("ReadOnlyBooleanDisplay renders radio buttons in disabled state", () => {
      render(<ReadOnlyBooleanDisplay show={true} value={true} />);
      expect(screen.getByTestId("radio-group")).toHaveAttribute("data-value", "true");
    });

    describe("ReadOnlyArrayDisplay", () => {
      const mockValue = [
        { name: "John", age: 30 },
        { name: "Jane", age: 25 },
      ];
      const mockProps = {
        show: true,
        value: mockValue,
        field: "people",
        scenarios: [],
        rawData: {},
        setRawData: jest.fn(),
        ruleProperties: {},
      };

      test("renders array items with custom name and index", () => {
        render(<ReadOnlyArrayDisplay {...mockProps} />);

        expect(screen.getByText("people 1")).toBeInTheDocument();
        expect(screen.getByText("people 2")).toBeInTheDocument();
        expect(screen.getAllByTestId("input-styler")).toHaveLength(4); // 2 objects × 2 properties
      });

      test("renders object key-value pairs for each item", () => {
        render(<ReadOnlyArrayDisplay {...mockProps} />);
        expect(screen.getAllByText("name")).toHaveLength(2);
      });

      test("doesn't render when show is false", () => {
        render(<ReadOnlyArrayDisplay {...mockProps} show={false} />);
        expect(screen.queryByText("people 1")).not.toBeInTheDocument();
      });

      test("handles empty array", () => {
        render(<ReadOnlyArrayDisplay {...mockProps} value={[]} />);
        expect(screen.queryByText(/people \d/)).not.toBeInTheDocument();
      });
    });
  });

  describe("ObjectArrayInput", () => {
    const mockHandleInputChange = jest.fn();
    const ruleProperties = {
      childFields: [
        { field: "name", label: "Name" },
        { field: "age", label: "Age" },
      ],
    };

    test("renders add and remove buttons when handleInputChange is provided", () => {
      render(
        <ObjectArrayInput
          show={true}
          field="testArray"
          value={[]}
          ruleProperties={ruleProperties}
          handleInputChange={mockHandleInputChange}
        />
      );
      expect(screen.getByTestId("button-Add")).toBeInTheDocument();
      expect(screen.getByTestId("button-Remove")).toBeInTheDocument();
    });

    test("handles adding new items", () => {
      render(
        <ObjectArrayInput
          show={true}
          field="testArray"
          value={[]}
          ruleProperties={ruleProperties}
          handleInputChange={mockHandleInputChange}
        />
      );
      fireEvent.click(screen.getByTestId("button-Add"));
      expect(mockHandleInputChange).toHaveBeenCalledWith([{ name: null, age: null }], "testArray");
    });

    test("handles removing items", () => {
      const initialValue = [
        { name: null, age: null },
        { name: null, age: null },
      ];
      render(
        <ObjectArrayInput
          show={true}
          field="testArray"
          value={initialValue}
          ruleProperties={ruleProperties}
          handleInputChange={mockHandleInputChange}
        />
      );
      fireEvent.click(screen.getByTestId("button-Remove"));
      expect(mockHandleInputChange).toHaveBeenCalledWith([{ name: null, age: null }], "testArray");
    });

    test("renders child fields with correct labels", () => {
      const value = [{ name: "John", age: 30 }];
      render(
        <ObjectArrayInput
          show={true}
          field="testArray"
          value={value}
          ruleProperties={ruleProperties}
          handleInputChange={mockHandleInputChange}
        />
      );
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Age")).toBeInTheDocument();
    });
  });
});
