import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { GithubAuthProvider } from "./GithubAuthProvider";
import { initializeGithubAxiosInstance } from "../utils/githubApi";

jest.mock("../utils/githubApi", () => ({
  initializeGithubAxiosInstance: jest.fn(),
}));

describe("GithubAuthProvider", () => {
  const mockAuthInfo = {
    githubAuthToken: "test-token",
    githubAuthUsername: "test-user",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Rendering", () => {
    test("renders children when auth info is provided", () => {
      const { getByText } = render(
        <GithubAuthProvider authInfo={mockAuthInfo}>
          <div>Test Child</div>
        </GithubAuthProvider>
      );

      expect(getByText("Test Child")).toBeInTheDocument();
    });

    test("renders children when auth info is null", () => {
      const { getByText } = render(
        <GithubAuthProvider authInfo={null}>
          <div>Test Child</div>
        </GithubAuthProvider>
      );

      expect(getByText("Test Child")).toBeInTheDocument();
    });
  });

  describe("Authentication Initialization", () => {
    test("initializes github axios instance when auth info is provided", () => {
      render(
        <GithubAuthProvider authInfo={mockAuthInfo}>
          <div>Test Child</div>
        </GithubAuthProvider>
      );

      expect(initializeGithubAxiosInstance).toHaveBeenCalledWith(
        mockAuthInfo.githubAuthToken,
        mockAuthInfo.githubAuthUsername
      );
    });

    test("does not initialize github axios instance when auth info is null", () => {
      render(
        <GithubAuthProvider authInfo={null}>
          <div>Test Child</div>
        </GithubAuthProvider>
      );

      expect(initializeGithubAxiosInstance).not.toHaveBeenCalled();
    });

    test("initializes with partial auth info", () => {
      const partialAuthInfo = {
        githubAuthToken: "test-token",
      };

      render(
        <GithubAuthProvider authInfo={partialAuthInfo}>
          <div>Test Child</div>
        </GithubAuthProvider>
      );

      expect(initializeGithubAxiosInstance).toHaveBeenCalledWith("test-token", undefined);
    });
  });

  describe("Context Value", () => {
    test("provides auth info through context", () => {
      const TestComponent = () => {
        return <div>Test Component</div>;
      };

      render(
        <GithubAuthProvider authInfo={mockAuthInfo}>
          <TestComponent />
        </GithubAuthProvider>
      );

      expect(initializeGithubAxiosInstance).toHaveBeenCalledWith(
        mockAuthInfo.githubAuthToken,
        mockAuthInfo.githubAuthUsername
      );
    });
  });
});
