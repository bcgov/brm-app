import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { RuleDescription } from "./RuleDescription";

jest.mock("antd", () => ({
  ...jest.requireActual("antd"),
  message: {
    error: jest.fn(),
  },
}));

declare global {
  interface Window {
    message: { error: (message: string) => void };
  }
}

describe("RuleDescription", () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    data: {
      name: "test-rule",
      label: "Test Rule",
      filepath: "/path/to/rule",
      description: "Test description",
      url: "test-rule",
      isPublished: true,
    },
    onClose: mockOnClose,
    visible: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    window.open = jest.fn();
    process.env.NEXT_PUBLIC_KLAMM_URL = "https://klamm.example.com";
  });

  describe("Visibility", () => {
    test("renders when visible is true", () => {
      render(<RuleDescription {...defaultProps} />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    test("doesn't render when visible is false", () => {
      render(<RuleDescription {...defaultProps} visible={false} />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("Content Display", () => {
    test("displays rule information correctly", () => {
      render(<RuleDescription {...defaultProps} />);

      expect(screen.getByText("Test Rule")).toBeInTheDocument();
      expect(screen.getByText("Name: test-rule")).toBeInTheDocument();
      expect(screen.getByText("Path: /path/to/rule")).toBeInTheDocument();
      expect(screen.getByText("Test description")).toBeInTheDocument();
    });

    test("shows 'N/A' when filepath is missing", () => {
      const props = {
        ...defaultProps,
        data: { ...defaultProps.data, filepath: undefined },
      };
      render(<RuleDescription {...props} />);
      expect(screen.getByText("Path: N/A")).toBeInTheDocument();
    });

    test("shows default message when description is missing", () => {
      const props = {
        ...defaultProps,
        data: { ...defaultProps.data, description: undefined },
      };
      render(<RuleDescription {...props} />);
      expect(screen.getByText("No description available")).toBeInTheDocument();
    });

    test("uses name when label is missing", () => {
      const props = {
        ...defaultProps,
        data: { ...defaultProps.data, label: undefined },
      };
      render(<RuleDescription {...props} />);
      expect(screen.getByText("test-rule")).toBeInTheDocument();
    });
  });

  describe("App Link Behavior", () => {
    test("enables app link when url exists", () => {
      render(<RuleDescription {...defaultProps} />);
      const appLink = screen.getByText("View in App").parentElement;
      expect(appLink).not.toBeDisabled();
    });

    test("disables app link when url is missing", () => {
      const props = {
        ...defaultProps,
        data: { ...defaultProps.data, url: undefined },
      };
      render(<RuleDescription {...props} />);
      const appLink = screen.getByText("View in App").parentElement;
      expect(appLink).toBeDisabled();
    });

    test("opens correct app URL when clicked", () => {
      render(<RuleDescription {...defaultProps} />);
      const appLink = screen.getByText("View in App");
      fireEvent.click(appLink);
      expect(window.open).toHaveBeenCalledWith("http://localhost/rule/test-rule");
    });
  });

  describe("Klamm Link Behavior", () => {
    test("enables Klamm link when rule is published", () => {
      render(<RuleDescription {...defaultProps} />);
      const klammLink = screen.getByText("View in Klamm").parentElement;
      expect(klammLink).not.toBeDisabled();
    });

    test("disables Klamm link when rule is not published", () => {
      const props = {
        ...defaultProps,
        data: { ...defaultProps.data, isPublished: false },
      };
      render(<RuleDescription {...props} />);
      const klammLink = screen.getByText("View in Klamm").parentElement;
      expect(klammLink).toBeDisabled();
    });

    test("opens correct Klamm URL when clicked", () => {
      render(<RuleDescription {...defaultProps} />);
      const klammLink = screen.getByText("View in Klamm");
      fireEvent.click(klammLink);
      expect(window.open).toHaveBeenCalledWith("https://klamm.example.com/rules/test-rule", "_blank");
    });
  });

  describe("Keyboard Navigation", () => {
    test("closes on Escape key press", () => {
      render(<RuleDescription {...defaultProps} />);
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
      expect(mockOnClose).toHaveBeenCalled();
    });

    test("handles Enter key on app link", () => {
      render(<RuleDescription {...defaultProps} />);
      const appLink = screen.getByText("View in App");
      fireEvent.keyDown(appLink, { key: "Enter" });
      expect(window.open).toHaveBeenCalled();
    });

    test("handles Enter key on Klamm link", () => {
      render(<RuleDescription {...defaultProps} />);
      const klammLink = screen.getByText("View in Klamm");
      fireEvent.keyDown(klammLink, { key: "Enter" });
      expect(window.open).toHaveBeenCalled();
    });
  });

  describe("Handling unpublished Klamm links", () => {
    test("New window does not open when clicking unpublished Klamm link", () => {
      const props = {
        ...defaultProps,
        data: {
          ...defaultProps.data,
          isPublished: false,
          url: "test-rule",
        },
      };

      render(<RuleDescription {...props} />);

      const klammLink = screen.getByText("View in Klamm");
      fireEvent.click(klammLink);

      expect(window.open).not.toHaveBeenCalled();
    });
  });
});
