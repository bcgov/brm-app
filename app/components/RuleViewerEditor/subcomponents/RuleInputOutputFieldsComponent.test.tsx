import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import RuleInputOutputFieldsComponent from "./RuleInputOutputFieldsComponent";
import { getBREFields, getBREFieldFromName } from "@/app/utils/api";

jest.mock("@/app/utils/api", () => ({
  getBREFields: jest.fn(),
  getBREFieldFromName: jest.fn(),
}));

jest.mock("@gorules/jdm-editor", () => {
  let currentFields = [
    {
      id: "field1",
      field: "testField",
      name: "Test Field",
      description: "Test Description",
    },
  ];

  const mockUpdateNode = jest.fn((id, callback) => {
    const draft = {
      content: {
        fields: [...currentFields],
      },
    };
    const result = callback(draft);
    currentFields = result.content.fields;
    return result;
  });

  return {
    GraphNode: ({ children, actions, ...props }: any) => (
      <div data-testid="graph-node" className="ruleNode" {...props}>
        {actions}
        <div data-testid="graph-node-content">
          {currentFields.map((field, index) => (
            <div key={field.id || index} className="ant-list-item">
              {props.isEditable ? (
                field.field === "" ? (
                  <select role="combobox" data-testid="field-select">
                    <option value="">Select a field...</option>
                  </select>
                ) : (
                  <span>{field.name}</span>
                )
              ) : (
                <span>{field.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    ),
    useDecisionGraphActions: () => ({
      updateNode: mockUpdateNode,
    }),
    useDecisionGraphState: () => (selector: any) =>
      selector({
        decisionGraph: {
          nodes: [
            {
              id: "test-id",
              content: {
                fields: currentFields,
              },
            },
          ],
        },
      }),
  };
});

describe("RuleInputOutputFieldsComponent", () => {
  const mockProps = {
    specification: {
      displayName: "Test Specification",
      type: "test",
      category: "test",
      groups: [],
      properties: {},
    },
    id: "test-id",
    isSelected: false,
    name: "Test Fields",
    fieldsTypeLabel: "Input",
    setInputOutputSchema: jest.fn(),
    isEditable: true,
  };

  const mockKlammField = {
    id: "field1",
    name: "testField",
    label: "Test Field",
    description: "Test Description",
    data_type: { name: "string" },
    data_validation: {
      validation_criteria: "test criteria",
      bre_validation_type: { value: "string" },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getBREFields as jest.Mock).mockResolvedValue([mockKlammField]);
    (getBREFieldFromName as jest.Mock).mockResolvedValue(mockKlammField);
  });

  describe("Initial Rendering", () => {
    test("renders with initial fields", async () => {
      render(<RuleInputOutputFieldsComponent {...mockProps} isEditable={false} />);
      expect(await screen.findByText("Test Field")).toBeInTheDocument();
    });

    test("renders add field button when editable", () => {
      render(<RuleInputOutputFieldsComponent {...mockProps} />);
      expect(screen.getByText(/Add Input/)).toBeInTheDocument();
    });

    test("renders refresh button when editable", () => {
      render(<RuleInputOutputFieldsComponent {...mockProps} />);
      expect(screen.getByLabelText("Refresh fields from Klamm")).toBeInTheDocument();
    });

    test("hides action buttons when not editable", () => {
      render(<RuleInputOutputFieldsComponent {...mockProps} isEditable={false} />);
      expect(screen.queryByText(/Add Input/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Refresh Klamm/)).not.toBeInTheDocument();
    });
  });

  describe("Field Management", () => {
    test("disables field management when not editable", () => {
      render(<RuleInputOutputFieldsComponent {...mockProps} isEditable={false} />);
      expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    });
  });

  describe("Klamm Integration", () => {
    test("shows loading state during refresh", async () => {
      render(<RuleInputOutputFieldsComponent {...mockProps} />);
      const refreshButton = screen.getByLabelText("Refresh fields from Klamm");

      fireEvent.click(refreshButton);
      expect(screen.getByLabelText("Loading...")).toBeInTheDocument();
    });
  });
});
