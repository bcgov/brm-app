import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ScenarioSelectionContent from "./ScenarioSelectionContent";
import { Scenario } from "@/app/types/scenario";

describe("ScenarioSelectionContent", () => {
  const mockScenarios: Scenario[] = [
    {
      title: "Scenario 1",
      ruleID: "rule1",
      filepath: "/test/path1",
      variables: [],
      expectedResults: [],
    },
    {
      title: "Scenario 2",
      ruleID: "rule1",
      filepath: "/test/path2",
      variables: [],
      expectedResults: [],
    },
    {
      title: "Scenario 3",
      ruleID: "rule1",
      filepath: "/test/path3",
      variables: [],
      expectedResults: [],
    },
  ];

  const mockProps = {
    scenarios: mockScenarios,
    onComplete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Rendering", () => {
    test("renders all scenarios", () => {
      render(<ScenarioSelectionContent {...mockProps} />);
      mockScenarios.forEach((scenario) => {
        expect(screen.getByText(scenario.title)).toBeInTheDocument();
      });
    });

    test("renders select all checkbox", () => {
      render(<ScenarioSelectionContent {...mockProps} />);
      expect(screen.getByText("Select All")).toBeInTheDocument();
    });

    test("initializes with all scenarios selected", () => {
      render(<ScenarioSelectionContent {...mockProps} />);
      const checkboxes = screen.getAllByRole("checkbox");
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });
    });
  });

  describe("Selection Behavior", () => {
    test("select all checkbox toggles all scenarios", () => {
      render(<ScenarioSelectionContent {...mockProps} />);
      const selectAllCheckbox = screen.getByText("Select All").parentElement?.querySelector('input[type="checkbox"]');

      fireEvent.click(selectAllCheckbox!);
      const checkboxesAfterUnselect = screen.getAllByRole("checkbox");
      checkboxesAfterUnselect.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });

      fireEvent.click(selectAllCheckbox!);
      const checkboxesAfterSelect = screen.getAllByRole("checkbox");
      checkboxesAfterSelect.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });
    });

    test("individual checkboxes can be toggled", () => {
      render(<ScenarioSelectionContent {...mockProps} />);
      const firstScenarioCheckbox = screen
        .getByText(mockScenarios[0].title)
        .parentElement?.querySelector('input[type="checkbox"]');

      fireEvent.click(firstScenarioCheckbox!);
      expect(firstScenarioCheckbox).not.toBeChecked();
    });
  });

  describe("Callback Behavior", () => {
    test("calls onComplete with initial selection", () => {
      render(<ScenarioSelectionContent {...mockProps} />);
      expect(mockProps.onComplete).toHaveBeenCalledWith(mockScenarios);
    });

    test("calls onComplete when selection changes", () => {
      render(<ScenarioSelectionContent {...mockProps} />);
      const firstScenarioCheckbox = screen
        .getByText(mockScenarios[0].title)
        .parentElement?.querySelector('input[type="checkbox"]');

      fireEvent.click(firstScenarioCheckbox!);
      expect(mockProps.onComplete).toHaveBeenCalledWith(expect.arrayContaining([mockScenarios[1], mockScenarios[2]]));
    });

    test("calls onComplete with empty array when all are unselected", () => {
      render(<ScenarioSelectionContent {...mockProps} />);
      const selectAllCheckbox = screen.getByText("Select All").parentElement?.querySelector('input[type="checkbox"]');

      fireEvent.click(selectAllCheckbox!);
      expect(mockProps.onComplete).toHaveBeenCalledWith([]);
    });
  });
});
