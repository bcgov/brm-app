import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import {
  initializeGithubAxiosInstance,
  isGithubAuthTokenValid,
  generateBranchName,
  generateCommitMessage,
  generateReviewMessage,
  getPRUrl,
  sendRuleForReview,
  getFileAsJsonIfAlreadyExists,
  getCSVTestFilesFromBranch,
  addCSVTestFileToReview,
  removeCSVTestFileFromReview,
  AuthFailureReasons,
} from "./githubApi";
import { logError } from "./logger";

jest.mock("./logger", () => ({
  logError: jest.fn(),
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ login: "testuser" }),
    headers: new Headers(),
    redirected: false,
    status: 200,
    statusText: "OK",
    type: "default",
    url: "",
    clone: () => new Response(),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(""),
  } as Response)
);

describe("githubApi", () => {
  let mock: MockAdapter;
  let originalLocation: Location;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    jest.clearAllMocks();

    originalLocation = window.location;

    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...originalLocation,
        assign: jest.fn(),
        replace: jest.fn(),
        href: "http://localhost:3000",
      },
    });

    (global.fetch as jest.Mock).mockReset().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ login: "testuser" }),
        headers: new Headers(),
        redirected: false,
        status: 200,
        statusText: "OK",
        type: "default",
        url: "",
        clone: () => new Response(),
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
        text: () => Promise.resolve(""),
      } as Response)
    );
  });

  afterEach(() => {
    mock.restore();

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  describe("initializeGithubAxiosInstance", () => {
    test("initializes with valid token", async () => {
      const token = "valid-token";
      const username = "testuser";
      await expect(initializeGithubAxiosInstance(token, username)).resolves.not.toThrow();
    });

    test("throws error with no token", async () => {
      await expect(initializeGithubAxiosInstance(undefined, "testuser")).rejects.toThrow(
        "No oauth token to initialize"
      );
    });
  });

  describe("isGithubAuthTokenValid", () => {
    test("returns invalid when no token provided", async () => {
      const result = await isGithubAuthTokenValid(undefined);
      expect(result).toEqual({ valid: false, reason: AuthFailureReasons.NO_OAUTH });
    });

    test("returns invalid when token is not valid", async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          statusText: "Unauthorized",
          headers: new Headers(),
          redirected: false,
          type: "default",
          url: "",
          clone: () => new Response(),
          body: null,
          bodyUsed: false,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          blob: () => Promise.resolve(new Blob()),
          formData: () => Promise.resolve(new FormData()),
          text: () => Promise.resolve(""),
          json: () => Promise.reject(new Error("Unauthorized")),
        } as Response)
      );

      const result = await isGithubAuthTokenValid("invalid-token");
      expect(result).toEqual({ valid: false, reason: AuthFailureReasons.NOT_VALID });
    });

    test("returns invalid when no org access", async () => {
      mock.onGet("https://api.github.com/user").reply(200);
      mock.onGet("https://api.github.com/repos/bcgov/brms-rules/git/ref/heads/dev").reply(403);

      const result = await isGithubAuthTokenValid("valid-token");
      expect(result).toEqual({ valid: false, reason: AuthFailureReasons.NO_ORG_ACCESS });
    });

    test("initializes axios instance when token is valid", async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ login: "testuser" }),
        } as Response)
      );
      mock.onGet("https://api.github.com/repos/bcgov/brms-rules/git/ref/heads/dev").reply(200);

      const result = await isGithubAuthTokenValid("valid-token");
      expect(result).toEqual({ valid: true });
    });
  });

  describe("generateBranchName", () => {
    test("generates correct branch name", () => {
      const result = generateBranchName("test/path/file.json");
      expect(result).toBe("testuser/file.json");
    });

    test("truncates long filenames", () => {
      const result = generateBranchName("test/path/very-long-filename-that-needs-truncating.json");
      expect(result.length).toBeLessThanOrEqual(21);
    });

    test("handles spaces in filename", () => {
      const result = generateBranchName("test/path/file spaces.json");
      expect(result).toBe("testuser/file-spaces.");
    });

    test("handles special characters", () => {
      const result = generateBranchName("test/path/file@#$%.json");
      expect(result).toBe("testuser/file@#$%.json");
    });

    test("uses authenticated username", () => {
      const customUsername = "customuser";
      initializeGithubAxiosInstance("token", customUsername);
      const result = generateBranchName("test/file.json");
      expect(result).toBe("customuser/file.json");
    });
  });

  describe("generateCommitMessage", () => {
    test("generates message for new file", () => {
      const result = generateCommitMessage(true, "test/file.json");
      expect(result).toBe("Updated file.json");
    });

    test("generates message for existing file", () => {
      const result = generateCommitMessage(false, "test/file.json");
      expect(result).toBe("Added file.json");
    });

    test("handles nested file paths", () => {
      const result = generateCommitMessage(true, "deeply/nested/path/file.json");
      expect(result).toBe("Updated file.json");
    });

    test("handles file paths with spaces", () => {
      const result = generateCommitMessage(false, "test/my file.json");
      expect(result).toBe("Added my file.json");
    });
  });

  describe("generateReviewMessage", () => {
    test("generates review message with link", () => {
      const result = generateReviewMessage(true, "test/file.json");
      expect(result).toContain("Updating file.json");
      expect(result).toContain(`Review: http://localhost:3000/?version=inReview`);
    });

    test("includes file path in message", () => {
      const result = generateReviewMessage(true, "test/file.json");
      expect(result).toContain("file.json");
    });

    test("handles file paths with special characters", () => {
      const result = generateReviewMessage(true, "test/special@#$%.json");
      expect(result).toContain("special@#$%.json");
      expect(result).toContain("Review: http://localhost:3000/?version=inReview");
    });

    test("generates different messages for new vs existing files", () => {
      const newFileResult = generateReviewMessage(true, "test/file.json");
      const existingFileResult = generateReviewMessage(false, "test/file.json");

      expect(newFileResult).toContain("Updating");
      expect(existingFileResult).toContain("Adding");
      expect(newFileResult).toContain("Review: ");
      expect(existingFileResult).toContain("Review: ");
    });
  });

  describe("getPRUrl", () => {
    test("returns null when no branch name provided", async () => {
      const result = await getPRUrl("");
      expect(result).toBeNull();
    });

    test("returns null when no PR exists", async () => {
      mock.onGet().reply((config) => {
        if (
          config.url?.includes("/pulls") &&
          config.url.includes("state=open") &&
          config.url.includes("head=bcgov:test-branch")
        ) {
          return [200, []];
        }
        return [404];
      });

      const result = await getPRUrl("test-branch");
      expect(result).toBeNull();
    });

    test("handles API errors gracefully", async () => {
      mock.onGet("https://api.github.com/repos/bcgov/brms-rules/pulls").networkError();

      const result = await getPRUrl("test-branch");
      expect(result).toBeNull();
      expect(logError).not.toHaveBeenCalled();
    });

    test("handles malformed response data", async () => {
      mock.onGet("https://api.github.com/repos/bcgov/brms-rules/pulls").reply(200, [{}]);

      const result = await getPRUrl("test-branch");
      expect(result).toBeNull();
    });

    test("handles non-200 response", async () => {
      mock.onGet("https://api.github.com/repos/bcgov/brms-rules/pulls").reply(403);

      const result = await getPRUrl("test-branch");
      expect(result).toBeNull();
    });
  });

  describe("getFileAsJsonIfAlreadyExists", () => {
    test("throws error when file doesn't exist", async () => {
      mock.onGet("https://api.github.com/repos/bcgov/brms-rules/git/ref/heads/test-branch").reply(200);
      mock.onGet("https://api.github.com/repos/bcgov/brms-rules/contents/rules/test.json").reply(200, {
        content: null,
      });

      await expect(getFileAsJsonIfAlreadyExists("test.json", "test-branch")).rejects.toThrow(
        "Request failed with status code 404"
      );
    });

    test("throws error when branch not found", async () => {
      mock.onGet("https://api.github.com/repos/bcgov/brms-rules/git/ref/heads/test-branch").reply(404);

      await expect(getFileAsJsonIfAlreadyExists("test.json", "test-branch")).rejects.toThrow(
        "Request failed with status code 404"
      );
    });
  });

  describe("sendRuleForReview", () => {
    const mockRuleContent = { nodes: [], edges: [] };
    const branchName = "testuser/test-rule";
    const filePath = "test-rule.json";
    const reviewDescription = "Test review description";

    beforeEach(() => {
      mock.reset();
      initializeGithubAxiosInstance("token", "testuser");
    });

    test("successfully creates new branch and PR", async () => {
      mock
        .onGet("https://api.github.com/repos/bcgov/brms-rules/git/ref/heads/dev")
        .replyOnce(200, { object: { sha: "base-sha-123" } });

      mock.onGet("https://api.github.com/repos/bcgov/brms-rules/git/ref/heads/testuser/test-rule").replyOnce(404);

      mock
        .onPost("https://api.github.com/repos/bcgov/brms-rules/git/refs", {
          ref: `refs/heads/${branchName}`,
          sha: "base-sha-123",
        })
        .replyOnce(201);

      mock
        .onGet("https://api.github.com/repos/bcgov/brms-rules/contents/rules/test-rule.json", {
          params: { ref: branchName },
        })
        .replyOnce(404);

      mock.onPut("https://api.github.com/repos/bcgov/brms-rules/contents/rules/test-rule.json").replyOnce(201);

      mock
        .onGet("https://api.github.com/repos/bcgov/brms-rules/pulls?state=open&head=bcgov:testuser/test-rule")
        .replyOnce(200, []);

      mock
        .onPost("https://api.github.com/repos/bcgov/brms-rules/pulls")
        .replyOnce(201, { html_url: "https://github.com/bcgov/brms-rules/pull/123" });

      await expect(sendRuleForReview(mockRuleContent, branchName, filePath, reviewDescription)).resolves.not.toThrow();

      expect(logError).not.toHaveBeenCalled();
    });
  });

  describe("getCSVTestFilesFromBranch", () => {
    beforeEach(() => {
      mock.reset();
      initializeGithubAxiosInstance("token", "testuser");
    });

    test("successfully retrieves list of CSV files with details", async () => {
      const mockFiles = [
        { name: "test1.csv", path: "tests/test1.csv", download_url: "http://example.com/test1.csv" },
        { name: "test2.csv", path: "tests/test2.csv", download_url: "http://example.com/test2.csv" },
      ];

      const mockCommit = [
        {
          commit: { author: { date: "2024-01-01T00:00:00Z" } },
          author: { login: "testuser" },
        },
      ];

      mock
        .onGet("https://api.github.com/repos/bcgov/brms-rules/contents/tests", {
          params: { ref: "test-branch" },
        })
        .reply(200, mockFiles);

      mockFiles.forEach((file) => {
        const commitsUrl = `https://api.github.com/repos/bcgov/brms-rules/commits?path=${file.path}&per_page=1&sha=test-branch`;
        mock.onGet(commitsUrl).reply(200, mockCommit);
      });

      const result = await getCSVTestFilesFromBranch("test-branch", "tests");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        filename: "test1.csv",
        downloadFile: "http://example.com/test1.csv",
        lastUpdated: "2024-01-01T00:00:00Z",
        updatedBy: "testuser",
      });
      expect(result[1]).toEqual({
        filename: "test2.csv",
        downloadFile: "http://example.com/test2.csv",
        lastUpdated: "2024-01-01T00:00:00Z",
        updatedBy: "testuser",
      });
    });

    test("returns empty array when no files exist", async () => {
      mock
        .onGet("https://api.github.com/repos/bcgov/brms-rules/contents/tests", {
          params: { ref: "test-branch" },
        })
        .replyOnce(404);

      const result = await getCSVTestFilesFromBranch("test-branch", "tests");
      expect(result).toEqual([]);
    });

    test("returns empty array when no files exist", async () => {
      mock.onGet("https://api.github.com/repos/bcgov/brms-rules/contents/tests").reply(404);

      const result = await getCSVTestFilesFromBranch("test-branch", "tests");
      expect(result).toEqual([]);
    });
  });

  describe("addCSVTestFileToReview", () => {
    const csvContent = "header1,header2\nvalue1,value2";
    const branchName = "testuser/test-branch";
    const filePath = "test.csv";

    beforeEach(() => {
      mock.reset();
      initializeGithubAxiosInstance("token", "testuser");
    });

    test("successfully adds CSV file to review", async () => {
      mock
        .onGet("https://api.github.com/repos/bcgov/brms-rules/git/ref/heads/dev")
        .replyOnce(200, { object: { sha: "base-sha-123" } });

      mock.onGet("https://api.github.com/repos/bcgov/brms-rules/git/ref/heads/testuser/test-branch").replyOnce(200);

      mock
        .onGet("https://api.github.com/repos/bcgov/brms-rules/contents/tests/test.csv", {
          params: { ref: branchName },
        })
        .replyOnce(404);

      mock.onPut("https://api.github.com/repos/bcgov/brms-rules/contents/tests/test.csv").replyOnce(201);

      await expect(addCSVTestFileToReview(csvContent, branchName, filePath)).resolves.not.toThrow();

      expect(logError).not.toHaveBeenCalled();
    });

    test("updates existing CSV file in review", async () => {
      mock
        .onGet("https://api.github.com/repos/bcgov/brms-rules/git/ref/heads/dev")
        .replyOnce(200, { object: { sha: "base-sha-123" } });

      mock.onGet("https://api.github.com/repos/bcgov/brms-rules/git/ref/heads/testuser/test-branch").replyOnce(200);

      mock
        .onGet("https://api.github.com/repos/bcgov/brms-rules/contents/tests/test.csv", {
          params: { ref: branchName },
        })
        .replyOnce(200, { sha: "existing-file-sha" });

      mock.onPut("https://api.github.com/repos/bcgov/brms-rules/contents/tests/test.csv").replyOnce(200);

      await expect(addCSVTestFileToReview(csvContent, branchName, filePath)).resolves.not.toThrow();
    });

    test("handles file commit failure", async () => {
      mock
        .onGet("https://api.github.com/repos/bcgov/brms-rules/git/ref/heads/dev")
        .replyOnce(200, { object: { sha: "base-sha-123" } });

      mock.onGet("https://api.github.com/repos/bcgov/brms-rules/git/ref/heads/testuser/test-branch").replyOnce(200);

      mock.onPut("https://api.github.com/repos/bcgov/brms-rules/contents/tests/test.csv").replyOnce(500);

      await expect(addCSVTestFileToReview(csvContent, branchName, filePath)).rejects.toThrow(
        "Failed to add test file test.csv"
      );
    });
  });

  describe("removeCSVTestFileFromReview", () => {
    const branchName = "testuser/test-branch";
    const filePath = "test.csv";

    beforeEach(() => {
      mock.reset();
      initializeGithubAxiosInstance("token", "testuser");
    });

    test("successfully removes CSV file from review", async () => {
      mock
        .onGet("https://api.github.com/repos/bcgov/brms-rules/git/ref/heads/dev")
        .replyOnce(200, { object: { sha: "base-sha-123" } });

      mock.onGet("https://api.github.com/repos/bcgov/brms-rules/git/ref/heads/testuser/test-branch").replyOnce(200);

      mock
        .onGet("https://api.github.com/repos/bcgov/brms-rules/contents/tests/test.csv", {
          params: { ref: branchName },
        })
        .replyOnce(200, { sha: "test-file-sha" });

      mock.onDelete("https://api.github.com/repos/bcgov/brms-rules/contents/tests/test.csv").replyOnce(200);

      await expect(removeCSVTestFileFromReview(branchName, filePath)).resolves.not.toThrow();

      expect(logError).not.toHaveBeenCalled();
    });

    test("throws error when file does not exist", async () => {
      mock
        .onGet("https://api.github.com/repos/bcgov/brms-rules/git/ref/heads/dev")
        .replyOnce(200, { object: { sha: "base-sha-123" } });

      mock.onGet("https://api.github.com/repos/bcgov/brms-rules/git/ref/heads/testuser/test-branch").replyOnce(200);

      mock
        .onGet("https://api.github.com/repos/bcgov/brms-rules/contents/tests/test.csv", {
          params: { ref: branchName },
        })
        .replyOnce(404);

      await expect(removeCSVTestFileFromReview(branchName, filePath)).rejects.toThrow(
        "Failed to remove test file test.csv"
      );
    });

    test("handles deletion API error", async () => {
      mock
        .onGet("https://api.github.com/repos/bcgov/brms-rules/git/ref/heads/dev")
        .replyOnce(200, { object: { sha: "base-sha-123" } });

      mock.onGet("https://api.github.com/repos/bcgov/brms-rules/git/ref/heads/testuser/test-branch").replyOnce(200);

      mock
        .onGet("https://api.github.com/repos/bcgov/brms-rules/contents/tests/test.csv", {
          params: { ref: branchName },
        })
        .replyOnce(200, { sha: "test-file-sha" });

      mock.onDelete("https://api.github.com/repos/bcgov/brms-rules/contents/tests/test.csv").replyOnce(500);

      await expect(removeCSVTestFileFromReview(branchName, filePath)).rejects.toThrow(
        "Failed to remove test file test.csv"
      );
    });
  });
});
