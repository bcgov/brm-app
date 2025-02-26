import { formatScenariosForJSON, convertTestsToScenarios, createRuleJSONWithScenarios } from "./ruleScenariosFormat";
import { getScenariosByFilename } from "./api";
import { DEFAULT_RULE_CONTENT } from "../constants/defaultRuleContent";

jest.mock("./api", () => ({
  getScenariosByFilename: jest.fn(),
}));

describe("ruleScenariosFormat", () => {
  describe("formatScenariosForJSON", () => {
    test("formats scenarios correctly", () => {
      const mockScenarios = [
        {
          title: "Test Scenario",
          ruleID: "123",
          filepath: "/test/path",
          variables: [
            { name: "input1", value: "value1" },
            { name: "input2", value: 42 },
          ],
          expectedResults: [
            { name: "output1", value: true },
            { name: "output2", value: "result" },
          ],
        },
      ];

      const result = formatScenariosForJSON(mockScenarios);

      expect(result).toEqual({
        tests: [
          {
            name: "Test Scenario",
            input: {
              input1: "value1",
              input2: 42,
            },
            output: {
              output1: true,
              output2: "result",
            },
          },
        ],
      });
    });

    test("handles empty scenarios array", () => {
      const result = formatScenariosForJSON([]);
      expect(result).toEqual({ tests: [] });
    });

    test("uses default name when title is missing", () => {
      const mockScenarios = [
        {
          title: "",
          ruleID: "",
          filepath: "",
          variables: [],
          expectedResults: [],
        },
      ];

      const result = formatScenariosForJSON(mockScenarios);
      expect(result.tests[0].name).toBe("Default name");
    });
  });

  describe("convertTestsToScenarios", () => {
    test("converts test data to scenarios correctly", () => {
      const mockTests = [
        {
          name: "Test Case",
          ruleID: "123",
          filepath: "/test/path",
          input: {
            field1: "value1",
            field2: 42,
          },
          output: {
            result1: true,
            result2: "success",
          },
        },
      ];

      const result = convertTestsToScenarios(mockTests);

      expect(result).toEqual([
        {
          title: "Test Case",
          ruleID: "123",
          filepath: "/test/path",
          variables: [
            { name: "field1", value: "value1" },
            { name: "field2", value: 42 },
          ],
          expectedResults: [
            { name: "result1", value: true },
            { name: "result2", value: "success" },
          ],
        },
      ]);
    });

    test("handles missing optional fields", () => {
      const mockTests = [
        {
          name: "Test Case",
          input: { field1: "value1" },
          output: { result1: true },
        },
      ];

      const result = convertTestsToScenarios(mockTests);

      expect(result[0].ruleID).toBe("");
      expect(result[0].filepath).toBe("");
    });
  });

  describe("createRuleJSONWithScenarios", () => {
    const mockRuleContent = {
      nodes: [
        {
          id: "1",
          type: "input",
          name: "Input Node",
          position: { x: 0, y: 0 },
        },
      ],
      edges: [],
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test("creates complete rule JSON with scenarios", async () => {
      const mockScenarios = [
        {
          title: "Test",
          variables: [{ name: "input1", value: "test" }],
          expectedResults: [{ name: "output1", value: true }],
        },
      ];

      (getScenariosByFilename as jest.Mock).mockResolvedValue(mockScenarios);

      const result = await createRuleJSONWithScenarios("test.json", mockRuleContent);

      expect(result).toEqual({
        ...DEFAULT_RULE_CONTENT,
        ...mockRuleContent,
        tests: [
          {
            name: "Test",
            input: { input1: "test" },
            output: { output1: true },
          },
        ],
      });
    });

    test("handles API errors", async () => {
      (getScenariosByFilename as jest.Mock).mockRejectedValue(new Error("API Error"));

      await expect(createRuleJSONWithScenarios("test.json", mockRuleContent)).rejects.toThrow("API Error");
    });
  });
});
