import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import getGithubAuth from "./getGithubAuth";
import { isGithubAuthTokenValid, AuthFailureReasons } from "./githubApi";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
  })),
  headers: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

jest.mock("./githubApi", () => ({
  isGithubAuthTokenValid: jest.fn(),
  AuthFailureReasons: {
    NO_OAUTH: "No OAuth token",
    NOT_VALID: "OAuth token not valid",
    NO_ORG_ACCESS: "OAuth token gives no org access",
  },
}));

describe("getGithubAuth", () => {
  const mockRedirectPath = "test-path";
  const mockToken = "test-token";
  const mockUsername = "test-user";
  const mockHost = "localhost:3000";
  const mockProto = "http";

  beforeEach(() => {
    jest.clearAllMocks();

    (cookies as jest.Mock).mockImplementation(() => ({
      get: jest.fn((name) => ({
        value: name === "github-authentication-token" ? mockToken : mockUsername,
      })),
    }));

    (headers as jest.Mock).mockImplementation(() => ({
      get: jest.fn((name) => (name === "host" ? mockHost : mockProto)),
    }));

    (isGithubAuthTokenValid as jest.Mock).mockResolvedValue({ valid: true });
  });

  test("returns null when auth is not required", async () => {
    const result = await getGithubAuth(mockRedirectPath, false);
    expect(result).toBeNull();
    expect(isGithubAuthTokenValid).not.toHaveBeenCalled();
  });

  test("returns auth info when validation succeeds", async () => {
    const result = await getGithubAuth(mockRedirectPath);

    expect(result).toEqual({
      githubAuthToken: mockToken,
      githubAuthUsername: mockUsername,
    });
    expect(isGithubAuthTokenValid).toHaveBeenCalledWith(mockToken);
    expect(redirect).not.toHaveBeenCalled();
  });

  test("redirects to github auth when no token exists", async () => {
    (cookies as jest.Mock).mockImplementation(() => ({
      get: jest.fn(() => null),
    }));

    (isGithubAuthTokenValid as jest.Mock).mockResolvedValue({
      valid: false,
      reason: AuthFailureReasons.NO_OAUTH,
    });

    await getGithubAuth(mockRedirectPath);

    expect(redirect).toHaveBeenCalledWith(`/auth/github?returnUrl=${mockProto}://${mockHost}/${mockRedirectPath}`);
  });

  test("redirects to no org access error when token lacks permissions", async () => {
    (isGithubAuthTokenValid as jest.Mock).mockResolvedValue({
      valid: false,
      reason: AuthFailureReasons.NO_ORG_ACCESS,
    });

    await getGithubAuth(mockRedirectPath);

    expect(redirect).toHaveBeenCalledWith(
      `/errors/noorgaccess?returnUrl=${mockProto}://${mockHost}/${mockRedirectPath}`
    );
  });

  test("redirects to github auth when token is invalid", async () => {
    (isGithubAuthTokenValid as jest.Mock).mockResolvedValue({
      valid: false,
      reason: AuthFailureReasons.NOT_VALID,
    });

    await getGithubAuth(mockRedirectPath);

    expect(redirect).toHaveBeenCalledWith(`/auth/github?returnUrl=${mockProto}://${mockHost}/${mockRedirectPath}`);
  });
});
