import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import RootLayout from "./layout";

jest.mock("next/font/google", () => ({
  Inter: () => ({ className: "mock-inter-font" }),
}));

jest.mock("@ant-design/nextjs-registry", () => ({
  AntdRegistry: ({ children }: { children: React.ReactNode }) => <div data-testid="antd-registry">{children}</div>,
}));

jest.mock("./CustomConfigProvider", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="custom-config-provider">{children}</div>,
}));

jest.mock("./components/ErrorBoundary", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>,
}));

jest.mock("antd", () => ({
  App: ({ children }: { children: React.ReactNode }) => <div data-testid="antd-app">{children}</div>,
  Flex: ({ children, ...props }: any) => (
    <div data-testid="flex-container" {...props}>
      {children}
    </div>
  ),
}));

const originalEnv = process.env;

describe("RootLayout", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Initial Rendering", () => {
    test("renders the layout with all required components", () => {
      const { container } = render(
        <RootLayout>
          <div>Test Content</div>
        </RootLayout>
      );

      const html = container.parentElement;

      expect(html?.querySelector("html")).toHaveAttribute("lang", "en");
      expect(html?.querySelector("body")).toHaveClass("mock-inter-font");
      expect(screen.getByTestId("antd-registry")).toBeInTheDocument();
      expect(screen.getByTestId("custom-config-provider")).toBeInTheDocument();
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("antd-app")).toBeInTheDocument();
      expect(screen.getByTestId("flex-container")).toBeInTheDocument();
      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    test("shows development banner when not in production", () => {
      process.env.NEXT_PUBLIC_IN_PRODUCTION = "false";
      render(
        <RootLayout>
          <div>Test Content</div>
        </RootLayout>
      );

      expect(screen.getByText("YOU ARE USING A DEVELOPMENT VERSION OF THE APP")).toBeInTheDocument();
    });

    test("does not show development banner in production", () => {
      process.env.NEXT_PUBLIC_IN_PRODUCTION = "true";
      render(
        <RootLayout>
          <div>Test Content</div>
        </RootLayout>
      );

      expect(screen.queryByText("YOU ARE USING A DEVELOPMENT VERSION OF THE APP")).not.toBeInTheDocument();
    });
  });

  describe("Metadata", () => {
    test("exports metadata with correct values", () => {
      const { metadata } = require("./layout");

      expect(metadata).toEqual({
        title: {
          template: "%s | Business Rules Management App",
          default: "Business Rules Management App",
        },
        description: "System for creating and simulating results for Business Rules",
      });
    });
  });

  describe("Component Structure", () => {
    test("maintains correct component nesting order", () => {
      const { container } = render(
        <RootLayout>
          <div>Test Content</div>
        </RootLayout>
      );

      const html = container.parentElement;
      expect(html?.children[0].tagName).toBe("DIV");
      expect(html?.querySelector('[data-testid="antd-registry"]')).toBeInTheDocument();
      expect(html?.querySelector('[data-testid="custom-config-provider"]')).toBeInTheDocument();
      expect(html?.querySelector('[data-testid="error-boundary"]')).toBeInTheDocument();
      expect(html?.querySelector('[data-testid="antd-app"]')).toBeInTheDocument();
      expect(html?.querySelector('[data-testid="flex-container"]')).toBeInTheDocument();
    });
  });
});
