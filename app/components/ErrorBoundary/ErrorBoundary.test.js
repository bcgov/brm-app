import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ErrorBoundary from "./ErrorBoundary";

jest.mock("../../utils/logger", () => ({
  logError: jest.fn().mockResolvedValue(undefined),
}));

describe("ErrorBoundary", () => {
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;

  beforeEach(() => {
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
    jest.clearAllMocks();
  });

  describe("normal rendering", () => {
    test("renders children when no error occurs", () => {
      render(
        <ErrorBoundary>
          <div>Test Content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });
  });

  const ThrowError = ({ shouldThrow }) => {
    if (shouldThrow) {
      throw new Error("Test error");
    }
    return <div>No Error</div>;
  };

  describe("error handling", () => {
    test("displays error message when error occurs", async () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
        expect(screen.getByText("Test error")).toBeInTheDocument();
      });
    });
  });

  describe("component lifecycle", () => {
    test("recovers from error when remounted", async () => {
      const { unmount } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
      });

      unmount();
      render(
        <ErrorBoundary>
          <div>New Content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText("New Content")).toBeInTheDocument();
      expect(screen.queryByText("Something went wrong.")).not.toBeInTheDocument();
    });

    test("keeps error state when rerendered with same error component", async () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
      });

      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
        expect(screen.getByText("Test error")).toBeInTheDocument();
      });
    });

    test("resets when switching from error to non-error component", async () => {
      const { unmount } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
      });

      unmount();
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText("No Error")).toBeInTheDocument();
      expect(screen.queryByText("Something went wrong.")).not.toBeInTheDocument();
    });
  });

  describe("error UI", () => {
    test("displays Alert component with correct props", async () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent("Something went wrong.");
        expect(alert).toHaveTextContent("Test error");
      });
    });
  });
});
