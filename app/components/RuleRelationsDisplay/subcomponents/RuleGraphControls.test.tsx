import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { RuleGraphControls } from "./RuleGraphControls";

describe("RuleGraphControls", () => {
  const mockOnSearchChange = jest.fn();
  const mockOnCategoryChange = jest.fn();
  const mockOnShowDraftRulesChange = jest.fn();
  const mockOnLegendToggle = jest.fn();
  const mockOnClearFilters = jest.fn();

  const defaultProps = {
    searchTerm: "",
    categoryFilter: undefined,
    showDraftRules: false,
    isLegendMinimized: false,
    categories: [
      { value: "cat1", text: "Category 1" },
      { value: "cat2", text: "Category 2" },
    ],
    onSearchChange: mockOnSearchChange,
    onCategoryChange: mockOnCategoryChange,
    onShowDraftRulesChange: mockOnShowDraftRulesChange,
    onLegendToggle: mockOnLegendToggle,
    onClearFilters: mockOnClearFilters,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    });
  });

  describe("Basic Rendering", () => {
    test("renders all controls when not embedded", () => {
      render(<RuleGraphControls {...defaultProps} />);

      expect(screen.getByPlaceholderText("Search rules...")).toBeInTheDocument();
      expect(screen.getByText("Filter by category")).toBeInTheDocument();
      expect(screen.getByText("Show draft rules")).toBeInTheDocument();
      expect(screen.getByText("- Hide Legend")).toBeInTheDocument();
    });

    test("renders minimal controls when embedded", () => {
      render(<RuleGraphControls {...defaultProps} embeddedCategory="cat1" />);

      expect(screen.queryByPlaceholderText("Search rules...")).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText("Filter by category")).not.toBeInTheDocument();
      expect(screen.queryByText("Show draft rules")).not.toBeInTheDocument();
      expect(screen.getByText("- Hide Legend")).toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    test("calls onSearchChange when search input changes", () => {
      render(<RuleGraphControls {...defaultProps} />);
      const searchInput = screen.getByPlaceholderText("Search rules...");

      fireEvent.change(searchInput, { target: { value: "test search" } });
      expect(mockOnSearchChange).toHaveBeenCalledWith("test search");
    });
  });

  describe("Category Filter", () => {
    test("calls onCategoryChange when category is selected", () => {
      render(<RuleGraphControls {...defaultProps} />);

      const select = screen.getByRole("combobox", { name: "Filter by category" });
      fireEvent.mouseDown(select);

      const option = screen.getByText("Category 1");
      fireEvent.click(option);

      expect(mockOnCategoryChange).toHaveBeenCalledWith(["cat1"]);
    });
  });

  describe("Draft Rules Toggle", () => {
    test("calls onShowDraftRulesChange when checkbox is toggled", () => {
      const { rerender } = render(<RuleGraphControls {...defaultProps} />);
      const checkbox = screen.getByRole("checkbox", { name: "Show draft rules" });

      expect(checkbox).not.toBeChecked();
      fireEvent.click(checkbox);

      expect(mockOnShowDraftRulesChange).toHaveBeenCalledWith(true);
      rerender(<RuleGraphControls {...defaultProps} showDraftRules={true} />);
      
      fireEvent.click(checkbox);
      expect(mockOnShowDraftRulesChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Legend Toggle", () => {
    test("shows correct button text based on isLegendMinimized", () => {
      const { rerender } = render(<RuleGraphControls {...defaultProps} isLegendMinimized={false} />);
      expect(screen.getByText("- Hide Legend")).toBeInTheDocument();

      rerender(<RuleGraphControls {...defaultProps} isLegendMinimized={true} />);
      expect(screen.getByText("+ Show Legend")).toBeInTheDocument();
    });

    test("calls onLegendToggle when button is clicked", () => {
      render(<RuleGraphControls {...defaultProps} />);
      const toggleButton = screen.getByText("- Hide Legend");

      fireEvent.click(toggleButton);
      expect(mockOnLegendToggle).toHaveBeenCalled();
    });
  });

  describe("Clear Filters", () => {
    test("calls onClearFilters", () => {
      const initialProps = {
        ...defaultProps,
        searchTerm: "test",
        categoryFilter: "cat1",
        showDraftRules: true,
      };

      render(<RuleGraphControls {...initialProps} />);
      const clearButton = screen.getByText("Clear");

      fireEvent.click(clearButton);
      expect(mockOnClearFilters).toHaveBeenCalled();
    });
  });

  describe("Embed Link Generation", () => {
    test("shows embed button when filters are applied", () => {
      render(
        <RuleGraphControls
          {...defaultProps}
          searchTerm="test"
          location={
            {
              origin: "http://localhost",
              pathname: "/rules",
            } as Location
          }
        />
      );

      expect(screen.getByText("Create Embed")).toBeInTheDocument();
    });

    test("copies correct embed link to clipboard", () => {
      render(
        <RuleGraphControls
          {...defaultProps}
          searchTerm="test"
          categoryFilter="cat1"
          location={
            {
              origin: "http://localhost",
              pathname: "/rules",
            } as Location
          }
        />
      );

      const embedButton = screen.getByText("Create Embed");
      fireEvent.click(embedButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining("http://localhost/rules/embed&search=test&category=cat1")
      );
    });
  });

  describe("Legend Content", () => {
    test("displays legend items when not minimized", () => {
      render(<RuleGraphControls {...defaultProps} isLegendMinimized={false} />);

      expect(screen.getByText("Parent Rules")).toBeInTheDocument();
      expect(screen.getByText("Child Rules")).toBeInTheDocument();
      expect(screen.getByText("Selected Rule")).toBeInTheDocument();
    });

    test("hides legend items when minimized", () => {
      render(<RuleGraphControls {...defaultProps} isLegendMinimized={true} />);

      const legendSection = screen.getByText("Legend:").parentElement?.parentElement;
      expect(legendSection).toHaveStyle({ opacity: "0" });
    });
  });
});
