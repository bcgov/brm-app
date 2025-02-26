import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import NewScenarioCSV from "./NewScenarioCSV";
import { getCSVForRuleRun } from "@/app/utils/api";

jest.mock("@/app/utils/api", () => ({
  getCSVForRuleRun: jest.fn(),
}));

jest.mock("antd", () => {
  const antd = jest.requireActual("antd");
  return {
    ...antd,
    App: {
      useApp: () => ({
        message: {
          success: jest.fn(),
          error: jest.fn(),
        },
      }),
    },
    Upload: ({ customRequest, onRemove, children }: any) => (
      <div data-testid="upload">
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              customRequest({ file, onSuccess: () => {} });
            }
          }}
        />
        <button onClick={() => onRemove()}>Remove</button>
        {children}
      </div>
    ),
  };
});

describe("NewScenarioCSV", () => {
  const mockFile = new File(["test content"], "test.csv", { type: "text/csv" });
  const mockProps = {
    openNewCSVModal: true,
    jsonFile: "test.json",
    ruleContent: {
      nodes: [],
      edges: [],
      version: "1.0.0",
      name: "Test Rule",
      description: "Test Description",
    },
    confirmAddingNewCSVFile: jest.fn(),
    cancelAddingCSVFile: jest.fn(),
    runCSVScenarios: jest.fn(),
    existingFilenames: ["existing.csv"],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getCSVForRuleRun as jest.Mock).mockResolvedValue("template,content");
  });

  describe("Initial Rendering", () => {
    test("renders modal with correct title", () => {
      render(<NewScenarioCSV {...mockProps} />);
      expect(screen.getByText("Create new CSV test file")).toBeInTheDocument();
    });

    test("renders all instruction steps", () => {
      render(<NewScenarioCSV {...mockProps} />);
      expect(screen.getByText(/Download a template CSV file/)).toBeInTheDocument();
      expect(screen.getByText(/Add additional scenarios/)).toBeInTheDocument();
      expect(screen.getByText(/Upload your edited CSV file/)).toBeInTheDocument();
      expect(screen.getByText(/Run the uploaded scenarios/)).toBeInTheDocument();
    });
  });

  describe("File Operations", () => {
    test("allows uploading a new CSV file", async () => {
      render(<NewScenarioCSV {...mockProps} />);
      const input = screen.getByTestId("upload").querySelector('input[type="file"]');

      fireEvent.change(input!, { target: { files: [mockFile] } });

      const addButton = screen.getByText("Add to table list");
      expect(addButton).not.toBeDisabled();
    });

    test("allows downloading template CSV", async () => {
      render(<NewScenarioCSV {...mockProps} />);
      const downloadButton = screen.getByText("Generate Scenarios/Template");

      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(getCSVForRuleRun).toHaveBeenCalledWith(mockProps.jsonFile, mockProps.ruleContent);
      });
    });
  });

  describe("Modal Actions", () => {
    test("calls confirmAddingNewCSVFile when adding file", () => {
      render(<NewScenarioCSV {...mockProps} />);
      const input = screen.getByTestId("upload").querySelector('input[type="file"]');

      fireEvent.change(input!, { target: { files: [mockFile] } });
      fireEvent.click(screen.getByText("Add to table list"));

      expect(mockProps.confirmAddingNewCSVFile).toHaveBeenCalledWith(mockFile);
    });

    test("calls cancelAddingCSVFile when canceling", () => {
      render(<NewScenarioCSV {...mockProps} />);
      fireEvent.click(screen.getByText("Return"));
      expect(mockProps.cancelAddingCSVFile).toHaveBeenCalled();
    });

    test("allows running scenarios with uploaded file", async () => {
      render(<NewScenarioCSV {...mockProps} />);
      const input = screen.getByTestId("upload").querySelector('input[type="file"]');

      fireEvent.change(input!, { target: { files: [mockFile] } });
      fireEvent.click(screen.getByText("Run Upload Scenarios"));

      expect(mockProps.runCSVScenarios).toHaveBeenCalledWith(mockFile, "test.csv");
    });
  });
});
