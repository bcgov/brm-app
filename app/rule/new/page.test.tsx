import React from "react";
import { render } from "@testing-library/react";
import NewRuleWrapper from "./page";
import * as getGithubAuth from "@/app/utils/getGithubAuth";
import { GithubAuthProvider } from "@/app/components/GithubAuthProvider";

jest.mock("@/app/utils/getGithubAuth");
jest.mock("@/app/components/GithubAuthProvider", () => ({
  GithubAuthProvider: jest.fn(({ children }) => <div>{children}</div>),
}));
jest.mock("./NewRule", () => ({
  __esModule: true,
  default: () => <div>NewRule Component</div>,
}));

describe("NewRuleWrapper", () => {
  const mockGetGithubAuth = getGithubAuth.default as jest.Mock;

  beforeEach(() => {
    mockGetGithubAuth.mockReset();
  });

  test("renders with github auth info", async () => {
    const mockAuthInfo = { token: "test-token" };
    mockGetGithubAuth.mockResolvedValueOnce(mockAuthInfo);

    const { container } = render(await NewRuleWrapper());

    expect(mockGetGithubAuth).toHaveBeenCalledWith("rule/new");
    expect(GithubAuthProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        authInfo: mockAuthInfo,
      }),
      expect.anything()
    );
    expect(container).toHaveTextContent("NewRule Component");
  });

  test("handles missing auth info", async () => {
    mockGetGithubAuth.mockResolvedValueOnce(null);

    const { container } = render(await NewRuleWrapper());

    expect(mockGetGithubAuth).toHaveBeenCalledWith("rule/new");
    expect(GithubAuthProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        authInfo: null,
      }),
      expect.anything()
    );
    expect(container).toHaveTextContent("NewRule Component");
  });
});
