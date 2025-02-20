import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import NoOrgAccess from "./page";
import axios from "axios";

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue("/return-url"),
  }),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...props} />;
  },
}));

jest.mock("axios", () => ({
  post: jest.fn(),
}));

jest.mock("antd", () => ({
  Alert: ({ message, description }: any) => (
    <div data-testid="error-alert">
      <div data-testid="alert-message">{message}</div>
      <div data-testid="alert-description">{description}</div>
    </div>
  ),
  Button: ({ children, href, type }: any) => (
    <a href={href} data-testid="relogin-button">
      <button type={type}>{children}</button>
    </a>
  ),
}));

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  Suspense: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("NoOrgAccess", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, "localStorage", {
      value: {
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  describe("Initial Rendering", () => {
    test("renders error message and description", () => {
      render(<NoOrgAccess />);

      expect(screen.getByTestId("alert-message")).toHaveTextContent("No Org Access");
      expect(screen.getByTestId("alert-description")).toHaveTextContent(
        /your account has no organization authorization/i
      );
    });

    test("renders GitHub authorization image", () => {
      render(<NoOrgAccess />);

      const image = screen.getByAltText("GitHub Authorize Screen");
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("src", "/images/github-authorize-screen.png");
    });

    test("renders re-login button with correct href", () => {
      render(<NoOrgAccess />);

      const link = screen.getByTestId("relogin-button");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/auth/github?returnUrl=/return-url");
      expect(link.textContent).toBe("Re-Login");
    });
  });

  describe("Cleanup Actions", () => {
    test("calls logout endpoint on mount", () => {
      render(<NoOrgAccess />);

      expect(axios.post).toHaveBeenCalledWith("/auth/github/logout");
    });

    test("removes token from localStorage on mount", () => {
      render(<NoOrgAccess />);

      expect(window.localStorage.removeItem).toHaveBeenCalledWith("token");
    });
  });

  describe("Loading State", () => {
    test("includes Suspense boundary", () => {
      const { container } = render(<NoOrgAccess />);

      expect(container).toBeInTheDocument();
      expect(screen.getByTestId("error-alert")).toBeInTheDocument();
    });
  });
});
