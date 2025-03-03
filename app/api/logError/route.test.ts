import { POST } from "./route";

global.Response = jest.fn().mockImplementation((body, init) => ({
  status: init?.status || 200,
  headers: new Map(Object.entries(init?.headers || {})),
  json: async () => JSON.parse(body),
})) as unknown as typeof Response;

describe("POST /log-error", () => {
  let mockConsoleError: jest.SpyInstance;

  beforeEach(() => {
    mockConsoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test("logs error and returns success response", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        error: "Test error message",
        errorInfo: "Additional error details",
      }),
    } as unknown as Request;

    const response = await POST(mockRequest);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual({ status: "Error logged successfully" });

    expect(mockConsoleError).toHaveBeenCalledWith({
      error: "Test error message",
      errorInfo: "Additional error details",
    });
  });

  test("handles missing errorInfo gracefully", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        error: "Test error message",
      }),
    } as unknown as Request;

    const response = await POST(mockRequest);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual({ status: "Error logged successfully" });

    expect(mockConsoleError).toHaveBeenCalledWith({
      error: "Test error message",
      errorInfo: undefined,
    });
  });

  test("returns 500 on invalid JSON", async () => {
    const mockRequest = {
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    } as unknown as Request;

    const response = await POST(mockRequest);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody).toEqual({ message: "Internal Server Error" });

    expect(mockConsoleError).toHaveBeenCalledWith(
      "Error processing log request:",
      expect.objectContaining({ err: expect.any(Error) })
    );
  });
});
