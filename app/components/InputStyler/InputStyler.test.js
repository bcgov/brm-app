import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import InputStyler, { parsePropertyName, parseSchemaTemplate, getAutoCompleteOptions } from "./InputStyler";

describe("InputStyler", () => {
  const mockSetRawData = jest.fn();
  const defaultProps = {
    value: "",
    field: "testField",
    editable: true,
    scenarios: [],
    rawData: {},
    setRawData: mockSetRawData,
    ruleProperties: {
      type: "text",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Value Processing", () => {
    test("processes string 'true' to boolean true", () => {
      render(
        <InputStyler
          {...defaultProps}
          value="true"
          ruleProperties={{
            validationType: "true-false",
            type: "true-false",
            dataType: "true-false",
          }}
        />
      );
      const radio = screen.getByRole("radio", { name: /yes/i });
      expect(radio).toBeInTheDocument();
    });

    test("processes string 'false' to boolean false", async () => {
      await act(async () => {
        render(
          <InputStyler
            {...defaultProps}
            editable={true}
            value={false}
            ruleProperties={{
              validationType: "true-false",
              type: "true-false",
              dataType: "true-false",
            }}
          />
        );
      });
      const noRadio = screen.getByLabelText("No");
      expect(noRadio).toBeChecked();
    });

    test("converts numeric strings to numbers when type is not text", () => {
      const mockSetRawData = jest.fn();
      render(
        <InputStyler
          {...defaultProps}
          value="42"
          setRawData={mockSetRawData}
          ruleProperties={{
            dataType: "number-input",
          }}
        />
      );

      const input = screen.getByRole("spinbutton");
      fireEvent.blur(input, { target: { value: "123" } });

      expect(mockSetRawData).toHaveBeenCalledWith(
        expect.objectContaining({
          testField: 123,
        })
      );
    });

    test("preserves numeric strings when type is text", () => {
      const mockSetRawData = jest.fn();
      render(
        <InputStyler
          {...defaultProps}
          value="42"
          setRawData={mockSetRawData}
          ruleProperties={{
            dataType: "text",
          }}
        />
      );

      const input = screen.getByRole("combobox");
      fireEvent.blur(input, { target: { value: "123" } });

      expect(mockSetRawData).toHaveBeenCalledWith(
        expect.objectContaining({
          testField: "123",
        })
      );
    });

    test("preserves original value for non-convertible strings", () => {
      const mockSetRawData = jest.fn();
      render(
        <InputStyler
          {...defaultProps}
          value="not a number"
          setRawData={mockSetRawData}
          ruleProperties={{
            dataType: "number-input",
          }}
        />
      );

      const input = screen.getByRole("spinbutton");
      fireEvent.blur(input, { target: { value: "not a number" } });

      expect(mockSetRawData).toHaveBeenCalledWith(
        expect.objectContaining({
          testField: "not a number",
        })
      );
    });

    test("handles empty number values", () => {
      const mockSetRawData = jest.fn();
      render(
        <InputStyler
          {...defaultProps}
          value=""
          setRawData={mockSetRawData}
          ruleProperties={{
            dataType: "number-input",
          }}
        />
      );

      const input = screen.getByRole("spinbutton");
      fireEvent.blur(input, { target: { value: "" } });

      expect(mockSetRawData).toHaveBeenCalledWith(
        expect.objectContaining({
          testField: 0,
        })
      );
    });

    test("converts undefined and null values to 0 for number inputs", () => {
      const mockSetRawData = jest.fn();
      render(
        <InputStyler
          {...defaultProps}
          value={null}
          setRawData={mockSetRawData}
          ruleProperties={{
            dataType: "number-input",
          }}
        />
      );

      const input = screen.getByRole("spinbutton");
      fireEvent.blur(input, { target: { value: undefined } });

      expect(mockSetRawData).toHaveBeenCalledWith(
        expect.objectContaining({
          testField: 0,
        })
      );
    });

    test("processes mixed case boolean strings to render Boolean Input", async () => {
      const mockSetRawData = jest.fn();
      await act(async () => {
        render(
          <InputStyler
            {...defaultProps}
            value="TrUe"
            setRawData={mockSetRawData}
            ruleProperties={{
              dataType: "true-false",
            }}
          />
        );
      });

      const radio = screen.getByRole("radio", { name: /yes/i });
      expect(radio).toBeInTheDocument();
    });

    test("handles floating point number strings", () => {
      const mockSetRawData = jest.fn();
      render(
        <InputStyler
          {...defaultProps}
          value="123.45"
          setRawData={mockSetRawData}
          ruleProperties={{
            dataType: "number-input",
          }}
        />
      );

      const input = screen.getByRole("spinbutton");
      fireEvent.blur(input, { target: { value: "123.45" } });

      expect(mockSetRawData).toHaveBeenCalledWith(
        expect.objectContaining({
          testField: 123.45,
        })
      );
    });
  });

  describe("Input Type Rendering", () => {
    test("renders BooleanInput for true-false type", async () => {
      await act(async () => {
        render(
          <InputStyler
            {...defaultProps}
            editable={true}
            value={true}
            ruleProperties={{
              validationType: "true-false",
              type: "true-false",
              dataType: "true-false",
            }}
          />
        );
      });
      const yesRadio = screen.getByLabelText("Yes");
      expect(yesRadio).toBeChecked();
    });

    test("renders SelectInput for select type", () => {
      const options = [
        { label: "Option 1", value: "1" },
        { label: "Option 2", value: "2" },
      ];
      render(
        <InputStyler
          {...defaultProps}
          ruleProperties={{
            type: "select",
            options,
          }}
        />
      );
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    test("renders NumberInput for number type", () => {
      render(<InputStyler {...defaultProps} ruleProperties={{ dataType: "number-input", min: 0, max: 100 }} />);
      expect(screen.getByRole("spinbutton")).toBeInTheDocument();
    });

    test("renders DateInput for date type", () => {
      render(<InputStyler {...defaultProps} ruleProperties={{ dataType: "date" }} />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });
  });

  describe("Range Handling", () => {
    test("renders min and max inputs for number range", () => {
      render(<InputStyler {...defaultProps} range={true} ruleProperties={{ dataType: "number-input" }} />);
      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs).toHaveLength(2);
    });

    test("renders min and max inputs for date range", () => {
      render(<InputStyler {...defaultProps} range={true} ruleProperties={{ dataType: "date" }} />);
      const inputs = screen.getAllByRole("textbox");
      expect(inputs).toHaveLength(2);
    });
  });

  describe("Read-only Display", () => {
    test("renders read-only display for non-editable boolean", async () => {
      await act(async () => {
        render(<InputStyler {...defaultProps} editable={false} value={true} />);
      });
      const yesRadio = screen.getByLabelText("Yes");
      expect(yesRadio).toBeChecked();
    });

    test("renders read-only array display with proper formatting", () => {
      const arrayValue = [
        { name: "Test Name", age: 42 },
        { name: "Another Test", age: 25 },
      ];
      render(<InputStyler {...defaultProps} editable={false} value={arrayValue} field="people" />);

      expect(screen.getByText("people 1")).toBeInTheDocument();
      expect(screen.getByText("people 2")).toBeInTheDocument();

      const nameLabels = screen.getAllByText("name");
      const ageLabels = screen.getAllByText("age");
      expect(nameLabels).toHaveLength(2);
      expect(ageLabels).toHaveLength(2);

      expect(screen.getByText("Test Name")).toBeInTheDocument();
      expect(screen.getByText("Another Test")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText("25")).toBeInTheDocument();
    });

    test("renders comma-separated values for non-object arrays as tags", () => {
      render(<InputStyler {...defaultProps} editable={false} value={["one", "two", "three"]} />);
      const tags = screen.getAllByText(/one|two|three/);
      expect(tags).toHaveLength(3);
      tags.forEach((tag) => {
        expect(tag).toHaveClass("ant-tag-blue");
      });
    });

    test("renders read-only number with currency format when field contains 'amount'", () => {
      render(<InputStyler {...defaultProps} editable={false} value={1000} field="total_amount" />);
      const tag = screen.getByText("$1,000.00");
      expect(tag).toHaveClass("ant-tag-green");
    });

    test("renders read-only number without currency format for regular numbers", () => {
      render(<InputStyler {...defaultProps} editable={false} value={1000} field="quantity" />);
      const tag = screen.getByText("1000");
      expect(tag).toHaveClass("ant-tag-blue");
    });

    test("renders read-only string as blue tag", () => {
      render(<InputStyler {...defaultProps} editable={false} value="test string" />);
      const tag = screen.getByText("test string");
      expect(tag).toHaveClass("ant-tag-blue");
    });
  });

  describe("Utility Functions", () => {
    describe("parsePropertyName", () => {
      test("extracts property name from array notation", () => {
        expect(parsePropertyName("items[0].name")).toBe("name");
      });

      test("returns original field if no array notation", () => {
        expect(parsePropertyName("simpleName")).toBe("simpleName");
      });
    });

    describe("parseSchemaTemplate", () => {
      test("parses array schema template", () => {
        const result = parseSchemaTemplate("items[{name:string,age:number}]");
        expect(result).toEqual({
          arrayName: "items",
          objectTemplate: {
            name: "",
            age: 0,
          },
        });
      });

      test("returns null for invalid template", () => {
        expect(parseSchemaTemplate("invalid")).toBeNull();
      });

      test("returns null for parseSchemaTemplate with empty input", () => {
        expect(parseSchemaTemplate("")).toBeNull();
        expect(parseSchemaTemplate(undefined)).toBeNull();
      });
    });

    describe("getAutoCompleteOptions", () => {
      test("extracts unique values from scenarios", () => {
        const scenarios = [
          { variables: [{ name: "test", value: "value1" }] },
          { variables: [{ name: "test", value: "value2" }] },
          { variables: [{ name: "test", value: "value1" }] },
        ];
        const options = getAutoCompleteOptions("test", scenarios);
        expect(options).toHaveLength(2);
        expect(options).toContainEqual({ value: "value1", type: "string" });
        expect(options).toContainEqual({ value: "value2", type: "string" });
      });

      test("returns empty array when no scenarios provided", () => {
        expect(getAutoCompleteOptions("test")).toHaveLength(0);
      });
    });
  });

  describe("Error Handling", () => {
    test("processes values with strict type checking", () => {
      render(
        <InputStyler
          {...defaultProps}
          value={42}
          ruleProperties={{
            dataType: "number-input",
          }}
        />
      );

      const input = screen.getByDisplayValue("42");
      expect(input).toBeInTheDocument();

      fireEvent.blur(input, { target: { value: "" } });

      expect(mockSetRawData).toHaveBeenCalledWith(
        expect.objectContaining({
          testField: 0,
        })
      );
    });

    test("handles missing setRawData function", () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      render(
        <InputStyler
          {...defaultProps}
          setRawData={undefined}
          value="test"
          ruleProperties={{
            dataType: "text",
          }}
        />
      );

      const input = screen.getByDisplayValue("test");
      expect(input).toBeInTheDocument();

      fireEvent.blur(input, { target: { value: "new value" } });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    test("handles undefined rawData", () => {
      render(
        <InputStyler
          {...defaultProps}
          rawData={undefined}
          value="test"
          ruleProperties={{
            dataType: "text",
          }}
        />
      );

      const input = screen.getByDisplayValue("test");
      expect(input).toBeInTheDocument();

      fireEvent.blur(input, { target: { value: "new value" } });

      expect(mockSetRawData).toHaveBeenCalled();
    });

    test("handles rawData type checking", () => {
      const mockSetRawData = jest.fn();
      render(<InputStyler {...defaultProps} rawData={{ rulemap: true }} setRawData={mockSetRawData} value="test" />);

      const input = screen.getByDisplayValue("test");
      fireEvent.blur(input, { target: { value: "new value" } });

      expect(mockSetRawData).toHaveBeenCalledWith(
        expect.objectContaining({
          rulemap: true,
          testField: "new value",
        })
      );
    });

    test("handles null scenarios array", () => {
      render(<InputStyler {...defaultProps} scenarios={null} value="test" />);

      const input = screen.getByDisplayValue("test");
      expect(input).toBeInTheDocument();
    });

    test("processes non-string values correctly", () => {
      render(
        <InputStyler
          {...defaultProps}
          value={123}
          ruleProperties={{
            dataType: "number-input",
          }}
        />
      );

      const input = screen.getByDisplayValue("123");
      fireEvent.blur(input, { target: { value: 456 } });

      expect(mockSetRawData).toHaveBeenCalledWith(
        expect.objectContaining({
          testField: 456,
        })
      );
    });
  });

  describe("Range Value Handling", () => {
    test("handles range value updates", () => {
      const mockSetRawData = jest.fn();
      render(
        <InputStyler
          {...defaultProps}
          range={true}
          setRawData={mockSetRawData}
          value={{ minValue: null, maxValue: null }}
          ruleProperties={{
            dataType: "number-input",
          }}
        />
      );

      const inputs = screen.getAllByDisplayValue("");
      expect(inputs.length).toBeGreaterThanOrEqual(2);

      const [minInput, maxInput] = inputs;

      fireEvent.change(minInput, { target: { value: "10" } });
      fireEvent.blur(minInput);
      expect(mockSetRawData).toHaveBeenCalledWith(
        expect.objectContaining({
          testField: { minValue: 10, maxValue: null },
        })
      );

      fireEvent.change(maxInput, { target: { value: "20" } });
      fireEvent.blur(maxInput);

      expect(mockSetRawData).toHaveBeenCalledWith(
        expect.objectContaining({
          testField: { minValue: null, maxValue: 20 },
        })
      );
    });

    test("handles clearing range values", () => {
      render(
        <InputStyler
          {...defaultProps}
          range={true}
          value={{ minValue: 10, maxValue: 20 }}
          ruleProperties={{
            dataType: "number-input",
          }}
        />
      );

      const clearButtons = screen.getAllByRole("button", { name: /minus-circle/i });
      fireEvent.click(clearButtons[0]);

      expect(mockSetRawData).toHaveBeenCalledWith(
        expect.objectContaining({
          testField: undefined,
        })
      );
    });
  });

  describe("Object Array Input", () => {
    test("handles object array type with child fields", () => {
      render(
        <InputStyler
          {...defaultProps}
          value={[{ name: "Test", age: 25 }]}
          ruleProperties={{
            type: "object-array",
            childFields: [
              { field: "name", type: "text" },
              { field: "age", type: "number" },
            ],
          }}
        />
      );

      const addButton = screen.getByText("Add");
      const removeButton = screen.getByText("Remove");

      fireEvent.click(addButton);
      expect(mockSetRawData).toHaveBeenCalled();

      fireEvent.click(removeButton);
      expect(mockSetRawData).toHaveBeenCalled();
    });
  });

  describe("Type Detection", () => {
    test("detects type from scenarios when value is empty", () => {
      render(
        <InputStyler {...defaultProps} value="" scenarios={[{ variables: [{ name: "testField", value: "42" }] }]} />
      );

      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  describe("Default Input Handling", () => {
    test("renders default input for null values", () => {
      render(<InputStyler {...defaultProps} value={null} ruleProperties={{}} />);

      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  describe("Type Detection and Processing", () => {
    test("processes values with type inference", () => {
      const scenarios = [{ variables: [{ name: "testField", value: 42 }] }];

      render(
        <InputStyler
          {...defaultProps}
          scenarios={scenarios}
          value=""
          ruleProperties={{
            dataType: "number-input",
          }}
        />
      );

      const input = screen.getByRole("spinbutton");
      fireEvent.blur(input, { target: { value: "123" } });

      expect(mockSetRawData).toHaveBeenCalledWith(
        expect.objectContaining({
          testField: 123,
        })
      );
    });

    test("handles default case in parseSchemaTemplate", () => {
      const result = parseSchemaTemplate("items[{field:unknown}]");
      expect(result).toEqual({
        arrayName: "items",
        objectTemplate: {
          field: undefined,
        },
      });
    });
  });

  describe("Validation Handling", () => {
    test("handles missing validation type gracefully", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      render(<InputStyler {...defaultProps} ruleProperties={{}} />);

      expect(screen.getByRole("combobox")).toBeInTheDocument();
      consoleSpy.mockRestore();
    });

    test("handles invalid validation type gracefully", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      render(
        <InputStyler
          {...defaultProps}
          ruleProperties={{
            validationType: "invalid-type",
            type: "invalid-type",
          }}
        />
      );

      expect(screen.getByRole("combobox")).toBeInTheDocument(); // Should fall back to default input
      consoleSpy.mockRestore();
    });
  });

  describe("Value Type Processing", () => {
    test("processes non-numeric string input correctly", () => {
      render(
        <InputStyler
          {...defaultProps}
          value="test"
          setRawData={mockSetRawData}
          ruleProperties={{
            dataType: "text",
          }}
        />
      );

      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "abc" } });
      fireEvent.blur(input);

      expect(mockSetRawData).toHaveBeenCalledWith(
        expect.objectContaining({
          testField: "abc",
        })
      );
    });

    test("handles explicit process value calls", () => {
      render(
        <InputStyler
          {...defaultProps}
          value=""
          ruleProperties={{
            dataType: "number-input",
          }}
        />
      );

      const input = screen.getByRole("spinbutton");
      fireEvent.change(input, { target: { value: "123" } });
      fireEvent.blur(input);

      expect(mockSetRawData).toHaveBeenCalledWith(
        expect.objectContaining({
          testField: 123,
        })
      );
    });
  });

  describe("Read-only Display Edge Cases", () => {
    test("handles object arrays in read-only mode", () => {
      const complexArray = [{ id: 1, name: "test" }];
      render(<InputStyler {...defaultProps} editable={false} value={complexArray} field="items" />);

      expect(screen.getByText("items 1")).toBeInTheDocument();
      expect(screen.getByText("id")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("name")).toBeInTheDocument();
      expect(screen.getByText("test")).toBeInTheDocument();
    });

    test("handles non-object arrays in read-only mode", () => {
      render(<InputStyler {...defaultProps} editable={false} value={["a", "b", "c"]} />);

      const tags = screen.getAllByText(/[abc]/);
      expect(tags).toHaveLength(3);
      tags.forEach((tag) => expect(tag).toHaveClass("ant-tag-blue"));
    });
  });

  describe("Schema Template Processing", () => {
    test("handles complex schema templates", () => {
      const result = parseSchemaTemplate("items[{id:number,name:string,active:boolean,custom:unknown}]");
      expect(result).toEqual({
        arrayName: "items",
        objectTemplate: {
          id: 0,
          name: "",
          active: false,
          custom: undefined,
        },
      });
    });
  });
});
