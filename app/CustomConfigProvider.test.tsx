import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import CustomConfigProvider from "./CustomConfigProvider";
import { useTheme } from "./hooks/useTheme";

jest.mock("antd", () => ({
  ConfigProvider: ({ children, theme }: { children: React.ReactNode; theme: any }) => (
    <div data-testid="config-provider" data-theme={JSON.stringify(theme)}>
      {children}
    </div>
  ),
  Spin: () => <div data-testid="loading-spinner">Loading...</div>,
}));

jest.mock("./hooks/useTheme", () => ({
  useTheme: jest.fn(),
}));

jest.mock("./styles/themeConfig", () => ({
  defaultTheme: {
    token: { colorPrimary: "#light" },
  },
  darkTheme: {
    token: { colorPrimary: "#dark" },
  },
}));

describe("CustomConfigProvider", () => {
  const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Rendering", () => {
    test("renders loading spinner when theme is null", () => {
      mockUseTheme.mockReturnValue(null);

      render(
        <CustomConfigProvider>
          <div>Test Content</div>
        </CustomConfigProvider>
      );

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
      expect(screen.queryByText("Test Content")).not.toBeInTheDocument();
    });

    test("renders children when theme is available", () => {
      mockUseTheme.mockReturnValue("light");

      render(
        <CustomConfigProvider>
          <div>Test Content</div>
        </CustomConfigProvider>
      );

      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });
  });

  describe("Theme Configuration", () => {
    test("applies light theme when theme is light", () => {
      mockUseTheme.mockReturnValue("light");

      render(
        <CustomConfigProvider>
          <div>Test Content</div>
        </CustomConfigProvider>
      );

      const configProvider = screen.getByTestId("config-provider");
      const appliedTheme = JSON.parse(configProvider.getAttribute("data-theme") || "{}");
      expect(appliedTheme.token.colorPrimary).toBe("#light");
    });

    test("applies dark theme when theme is dark", () => {
      mockUseTheme.mockReturnValue("dark");

      render(
        <CustomConfigProvider>
          <div>Test Content</div>
        </CustomConfigProvider>
      );

      const configProvider = screen.getByTestId("config-provider");
      const appliedTheme = JSON.parse(configProvider.getAttribute("data-theme") || "{}");
      expect(appliedTheme.token.colorPrimary).toBe("#dark");
    });
  });

  describe("Theme Changes", () => {
    test("updates theme when useTheme hook value changes", () => {
      mockUseTheme.mockReturnValue("light");

      const { rerender } = render(
        <CustomConfigProvider>
          <div>Test Content</div>
        </CustomConfigProvider>
      );

      let configProvider = screen.getByTestId("config-provider");
      let appliedTheme = JSON.parse(configProvider.getAttribute("data-theme") || "{}");
      expect(appliedTheme.token.colorPrimary).toBe("#light");

      mockUseTheme.mockReturnValue("dark");
      rerender(
        <CustomConfigProvider>
          <div>Test Content</div>
        </CustomConfigProvider>
      );

      configProvider = screen.getByTestId("config-provider");
      appliedTheme = JSON.parse(configProvider.getAttribute("data-theme") || "{}");
      expect(appliedTheme.token.colorPrimary).toBe("#dark");
    });
  });
});
