import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import FieldStyler from "./FieldStyler";
import userEvent from "@testing-library/user-event";

const originalEnv = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
  process.env.NEXT_PUBLIC_KLAMM_URL = "https://klamm.example.com";
});

afterEach(() => {
  process.env = originalEnv;
});

describe("FieldStyler", () => {
  describe("basic rendering", () => {
    test("renders label with name", () => {
      render(<FieldStyler name="Test Field" />);
      expect(screen.getByText("Test Field")).toBeInTheDocument();
      expect(screen.getByText("Test Field").tagName).toBe("LABEL");
    });

    test("renders label with htmlFor attribute", () => {
      render(<FieldStyler name="Test Field" field="test_field" />);
      expect(screen.getByText("Test Field")).toHaveAttribute("for", "test_field");
    });
  });

  describe("description handling", () => {
    test("renders info icon when description is provided", () => {
      render(<FieldStyler name="Test Field" description="Test Description" />);
      expect(screen.getByLabelText("info-circle")).toBeInTheDocument();
    });

    test("does not render info icon when no description", () => {
      render(<FieldStyler name="Test Field" />);
      expect(screen.queryByLabelText("info-circle")).not.toBeInTheDocument();
    });

    test("handles multiline descriptions", async () => {
      const multilineDesc = "Line 1\nLine 2";
      render(<FieldStyler name="Test Field" description={multilineDesc} />);
      const infoIcon = screen.getByLabelText("info-circle");
      userEvent.click(infoIcon);

      expect(await screen.findByText("Line 1")).toBeInTheDocument();
      expect(await screen.findByText("Line 2")).toBeInTheDocument();
    });
  });

  describe("KLAMM link functionality", () => {
    test("renders KLAMM link when URL and field are provided", async () => {
      render(<FieldStyler name="Test Field" description="Description" field="test_field" />);
      const infoIcon = screen.getByLabelText("info-circle");
      userEvent.click(infoIcon);

      const link = await screen.findByRole("link", { name: /Klamm/i });
      expect(link).toHaveAttribute("href", "https://klamm.example.com/fields/test_field");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    test("does not render KLAMM link when KLAMM URL is not set", () => {
      process.env.NEXT_PUBLIC_KLAMM_URL = undefined;
      render(<FieldStyler name="Test Field" description="Description" field="test_field" />);
      const infoIcon = screen.getByLabelText("info-circle");
      userEvent.click(infoIcon);

      expect(screen.queryByText("KLAMM")).not.toBeInTheDocument();
    });
  });

  describe("tooltip behavior", () => {
    test("shows 'View Description' tooltip on hover", async () => {
      render(<FieldStyler name="Test Field" description="Description" />);
      const infoIcon = screen.getByLabelText("info-circle");
      userEvent.hover(infoIcon);

      expect(await screen.findByText("View Description")).toBeInTheDocument();
    });
  });
});
