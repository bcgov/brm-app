import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import NoOrgAccess from "./page";
import axios from "axios";
import React from "react";

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
    test("renders complete error message and description", () => {
      render(<NoOrgAccess />);

      expect(screen.getByTestId("alert-message")).toHaveTextContent("No Org Access");
      expect(screen.getByTestId("alert-description")).toHaveTextContent(
        /your account has no organization authorization/i
      );
      expect(screen.getByTestId("alert-description")).toHaveTextContent(
        /hit the "Re-Login" button below and then make sure to hit the "Authorize" button/i
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
    test("calls logout endpoint and clears localStorage on mount", () => {
      jest.spyOn(React, "useEffect");

      render(<NoOrgAccess />);

      expect(React.useEffect).toHaveBeenCalled();

      expect(axios.post).toHaveBeenCalledWith("/auth/github/logout");
      expect(window.localStorage.removeItem).toHaveBeenCalledWith("token");

      const axiosCallOrder = (axios.post as jest.Mock).mock.invocationCallOrder[0];
      const localStorageCallOrder = (window.localStorage.removeItem as jest.Mock).mock.invocationCallOrder[0];
      expect(axiosCallOrder).toBeLessThan(localStorageCallOrder);
    });
  });

  describe("Loading State", () => {
    test("renders content within Suspense boundary", () => {
      const originalSuspense = React.Suspense;
      const mockSuspense = jest.fn(({ children, fallback }) => (
        <div data-testid="suspense-boundary">
          {children}
          <div data-testid="fallback-content">{fallback}</div>
        </div>
      ));

      (React.Suspense as any) = mockSuspense;

      render(<NoOrgAccess />);

      expect(screen.getByTestId("suspense-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("fallback-content")).toHaveTextContent("Loading...");

      (React.Suspense as any) = originalSuspense;
    });
  });
});
