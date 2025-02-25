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
      expect(screen.getByLabelText("Yes")).toBeInTheDocument();
      expect(screen.getByLabelText("No")).toBeInTheDocument();
    });

    test("handles value changes", () => {
      render(<BooleanInput show={true} field="testField" handleInputChange={mockHandleInputChange} />);
      fireEvent.click(screen.getByLabelText("Yes"));
      expect(mockHandleInputChange).toHaveBeenCalledWith(true, "testField");
    });

    test("clear button sets value to undefined", () => {
      render(<BooleanInput show={true} field="testField" handleInputChange={mockHandleInputChange} />);
      fireEvent.click(screen.getByRole("button"));
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

      const input = screen.getByRole("spinbutton");
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

      const clearButton = screen.getByRole("button", { name: /minus-circle/i });
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
      const input = screen.getByRole("spinbutton");
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
      expect(screen.getByRole("combobox")).toBeInTheDocument();
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
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
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
      const input = screen.getByRole("combobox");
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
      const input = screen.getByRole("combobox");
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
      const clearButton = screen.getByRole("button");
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
      expect(screen.getByRole("combobox")).toHaveValue("default value");
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
      expect(screen.getByRole("combobox")).toBeInTheDocument();
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
      expect(multipleSelect).toHaveClass("ant-select-multiple");
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
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    test("handles clearing the date", () => {
      render(
        <DateInput
          show={true}
          field="testDate"
          value="2024-01-01"
          handleInputChange={mockHandleInputChange}
          handleClear={mockHandleClear}
        />
      );
      const clearButton = screen.getByRole("button");
      fireEvent.click(clearButton);
      expect(mockHandleInputChange).toHaveBeenCalledWith(null, "testDate");
    });
  });

  describe("ReadOnlyDisplays", () => {
    test("ReadOnlyStringDisplay renders tags for comma-separated values", () => {
      render(<ReadOnlyStringDisplay show={true} value="one,two,three" />);
      expect(screen.getAllByText(/one|two|three/)).toHaveLength(3);
    });

    test("ReadOnlyNumberDisplay formats currency when field includes 'amount'", () => {
      render(<ReadOnlyNumberDisplay show={true} value={1000} field="amount" />);
      expect(screen.getByText(/\$.*1,000\.00/)).toBeInTheDocument();
    });

    test("ReadOnlyBooleanDisplay renders radio buttons in disabled state", () => {
      render(<ReadOnlyBooleanDisplay show={true} value={true} />);
      const yesRadio = screen.getByLabelText("Yes");
      expect(yesRadio).toBeChecked();
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
        expect(screen.getByText("John")).toBeInTheDocument();
        expect(screen.getByText("Jane")).toBeInTheDocument();
        expect(screen.getByText("30")).toBeInTheDocument();
        expect(screen.getByText("25")).toBeInTheDocument();

        const nameLabels = screen.getAllByText("name");
        const ageLabels = screen.getAllByText("age");
        expect(nameLabels).toHaveLength(2);
        expect(ageLabels).toHaveLength(2);
      });

      test("renders object key-value pairs for each item", () => {
        render(<ReadOnlyArrayDisplay {...mockProps} />);
        expect(screen.getAllByText("name")).toHaveLength(2);
      });

      test("doesn't render when show is false", () => {
        render(<ReadOnlyArrayDisplay {...mockProps} show={false} />);
        expect(screen.queryByText("People 1")).not.toBeInTheDocument();
      });

      test("handles empty array", () => {
        render(<ReadOnlyArrayDisplay {...mockProps} value={[]} />);
        expect(screen.queryByText(/People \d/)).not.toBeInTheDocument();
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
      expect(screen.getByText("Add")).toBeInTheDocument();
      expect(screen.getByText("Remove")).toBeInTheDocument();
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
      fireEvent.click(screen.getByText("Add"));
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
      fireEvent.click(screen.getByText("Remove"));
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
