import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { RuleGraphControls } from "./RuleGraphControls";
import { SelectProps, CheckboxProps } from "antd";

jest.mock("antd", () => {
  const antd = jest.requireActual("antd");
  return {
    ...antd,
    Select: ({ onChange, placeholder, value, options, ...props }: SelectProps) => (
      <div data-testid="mock-select" onClick={() => onChange && onChange(["cat1"], [])}>
        {placeholder}
        <select value={value as string} onChange={(e) => onChange && onChange(e.target.value, [])}>
          {options?.map((opt) => (
            <option key={opt.value?.toString()} value={opt.value?.toString()}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    ),
    Checkbox: ({ onChange, children, checked }: CheckboxProps) => (
      <label>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange && onChange({ target: { checked: e.target.checked } } as any)}
        />
        {children}
      </label>
    ),
  };
});

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

      const select = screen.getByTestId("mock-select");
      fireEvent.click(select);

      expect(mockOnCategoryChange).toHaveBeenCalledWith(["cat1"]);
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

      const collapsibleDiv = screen.getByText("Legend:").closest("div.collapsible");
      expect(collapsibleDiv).toHaveAttribute("style", expect.stringContaining("opacity: 0"));
    });
  });
});
