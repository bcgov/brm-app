import { RULE_VERSION } from "../constants/ruleVersion";
import {
  getRuleDataById,
  getRuleDraftByFilepath,
  getAllRuleData,
  getDocument,
  postDecision,
  postRuleData,
  updateRuleData,
  deleteRuleData,
  getRuleMap,
  axiosAPIInstance,
  getRuleRunSchema,
  generateSchemaFromRuleContent,
  getScenariosByFilename,
  createScenario,
  updateScenario,
  deleteScenario,
  runDecisionsForScenarios,
  getCSVForRuleRun,
  uploadCSVAndProcess,
  getBREFields,
  getBREFieldFromName,
  getBRERules,
  getCSVTests,
} from "./api";
import { logError } from "./logger";
import { DecisionGraphType } from "@gorules/jdm-editor";
import { RuleInfo, RuleDraft, RuleDataResponse } from "../types/ruleInfo";
import { RuleQuery } from "../types/rulequery";
import MockAdapter from "axios-mock-adapter";
import { downloadFileBlob } from "./utils";

jest.mock("./logger", () => ({
  logError: jest.fn(),
}));

jest.mock("./utils", () => ({
  downloadFileBlob: jest.fn(),
}));

describe("getRuleDataById", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosAPIInstance);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  test("successfully retrieves rule data by ID", async () => {
    const mockRuleData: RuleInfo = {
      _id: "123",
      name: "Test Rule",
      filepath: "test/path.json",
    };

    mock.onGet("/ruleData/123").reply(200, mockRuleData);

    const result = await getRuleDataById("123");

    expect(result).toEqual(mockRuleData);
    expect(logError).not.toHaveBeenCalled();
  });

  test("throws error and logs when API request fails", async () => {
    const errorMessage = "Request failed with status code 500";
    mock.onGet("/ruleData/123").reply(500);

    await expect(getRuleDataById("123")).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error getting rule data: Error: ${errorMessage}`);
  });

  test("handles API not found error", async () => {
    const errorMessage = "Request failed with status code 404";
    mock.onGet("/ruleData/456").reply(404);

    await expect(getRuleDataById("456")).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error getting rule data: Error: ${errorMessage}`);
  });
});

describe("getRuleDraftByFilepath", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosAPIInstance);
    jest.clearAllMocks();
    jest.spyOn(Date.prototype, "getTime").mockImplementation(() => 1234567890);
  });

  afterEach(() => {
    mock.restore();
    jest.restoreAllMocks();
  });

  test("successfully retrieves rule draft by filepath", async () => {
    const mockDraftData: RuleDraft = {
      _id: "123",
      content: { nodes: [], edges: [] },
    };

    mock.onGet("/ruleData/draft/filepath?filepath=test.json&_=1234567890").reply(200, mockDraftData);

    const result = await getRuleDraftByFilepath("test.json");

    expect(result).toEqual(mockDraftData);
    expect(logError).not.toHaveBeenCalled();
  });

  test("throws error and logs when API request fails", async () => {
    const errorMessage = "Request failed with status code 500";
    mock.onGet("/ruleData/draft/filepath?filepath=test.json&_=1234567890").reply(500);

    await expect(getRuleDraftByFilepath("test.json")).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error getting rule data: Error: ${errorMessage}`);
  });

  test("handles draft not found error", async () => {
    const errorMessage = "Request failed with status code 404";
    mock.onGet("/ruleData/draft/filepath?filepath=test.json&_=1234567890").reply(404);

    await expect(getRuleDraftByFilepath("test.json")).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error getting rule data: Error: ${errorMessage}`);
  });
});

describe("getAllRuleData", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosAPIInstance);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  test("successfully retrieves all rule data without params", async () => {
    const mockResponse: RuleDataResponse = {
      data: [
        { _id: "1", name: "Rule 1", filepath: "path1.json" },
        { _id: "2", name: "Rule 2", filepath: "path2.json" },
      ],
      total: 2,
      categories: [{ text: "Category 1", value: "cat1" }],
    };

    mock.onGet("/ruleData/list").reply(200, mockResponse);

    const result = await getAllRuleData();

    expect(result).toEqual(mockResponse);
    expect(logError).not.toHaveBeenCalled();
  });

  test("successfully retrieves filtered rule data with query params", async () => {
    const mockResponse: RuleDataResponse = {
      data: [{ _id: "1", name: "Rule 1", filepath: "path1.json" }],
      total: 1,
      categories: [{ text: "Category 1", value: "cat1" }],
    };

    const queryParams: RuleQuery = {
      searchTerm: "Rule 1",
      filters: { category: ["cat1"] },
      page: 1,
      pageSize: 10,
    };

    mock.onGet("/ruleData/list", { params: queryParams }).reply(200, mockResponse);

    const result = await getAllRuleData(queryParams);

    expect(result).toEqual(mockResponse);
    expect(logError).not.toHaveBeenCalled();
  });

  test("handles API error", async () => {
    const errorMessage = "Request failed with status code 500";
    mock.onGet("/ruleData/list").reply(500);

    await expect(getAllRuleData()).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error fetching rule data: Error: ${errorMessage}`);
  });
});

describe("getDocument", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosAPIInstance);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  test("successfully retrieves document", async () => {
    const mockDocument = {
      nodes: [{ id: "1", type: "start" }],
      edges: [{ id: "e1", source: "1", target: "2" }],
    };

    mock.onGet("/documents?ruleFileName=test%2Frule.json").reply(200, mockDocument);

    const result = await getDocument("test/rule.json");

    expect(result).toEqual(mockDocument);
    expect(logError).not.toHaveBeenCalled();
  });

  test("throws error for invalid document format", async () => {
    const invalidDocument = {
      someOtherData: true,
    };

    mock.onGet("/documents?ruleFileName=test%2Frule.json").reply(200, invalidDocument);

    await expect(getDocument("test/rule.json")).rejects.toThrow("Unexpected format of the returned data");
    expect(logError).toHaveBeenCalledWith("Error getting the gorules document", expect.any(Error));
  });

  test("handles API error", async () => {
    const errorMessage = "Request failed with status code 500";
    mock.onGet("/documents?ruleFileName=test%2Frule.json").reply(500);

    await expect(getDocument("test/rule.json")).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith("Error getting the gorules document", expect.any(Error));
  });

  test("properly encodes filepath with special characters", async () => {
    const mockDocument = {
      nodes: [],
      edges: [],
    };

    mock.onGet("/documents?ruleFileName=test%2Fspecial%20rule%20%26%20more.json").reply(200, mockDocument);

    await getDocument("test/special rule & more.json");

    expect(mock.history.get[0].url).toBe("/documents?ruleFileName=test%2Fspecial%20rule%20%26%20more.json");
  });
});

describe("postDecision", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosAPIInstance);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  test("successfully evaluates decision", async () => {
    const mockRuleContent: DecisionGraphType = {
      nodes: [{ id: "1", type: "start", name: "Start", position: { x: 0, y: 0 } }],
      edges: [
        {
          id: "e1",
          sourceId: "1",
          targetId: "2",
          name: "Edge 1",
        },
      ],
    };
    const mockContext = { input: "test" };
    const mockResponse = {
      result: { output: "success" },
      trace: { nodeId: "1", result: "processed" },
    };

    mock
      .onPost("/decisions/evaluate", {
        ruleContent: JSON.stringify(mockRuleContent),
        context: mockContext,
        trace: true,
        ruleDir: "dev",
      })
      .reply(200, mockResponse);

    const result = await postDecision(mockRuleContent, mockContext, RULE_VERSION.draft);

    expect(result).toEqual(mockResponse);
    expect(logError).not.toHaveBeenCalled();
  });

  test("handles axios error with response message", async () => {
    const mockRuleContent = { nodes: [], edges: [] };
    const mockContext = { input: "test" };
    const errorMessage = "Invalid rule format";

    mock.onPost("/decisions/evaluate").reply(400, { message: errorMessage });

    await expect(postDecision(mockRuleContent, mockContext, RULE_VERSION.draft)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(errorMessage);
  });

  test("handles general error", async () => {
    const mockRuleContent = { nodes: [], edges: [] };
    const mockContext = { input: "test" };
    const errorMessage = "Network Error";

    mock.onPost("/decisions/evaluate").networkError();

    await expect(postDecision(mockRuleContent, mockContext, RULE_VERSION.draft)).rejects.toThrow();
    expect(logError).toHaveBeenCalledWith(`Error simulating decision: Error: ${errorMessage}`);
  });
});

describe("postRuleData", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosAPIInstance);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  test("successfully posts new rule data", async () => {
    const newRuleData = {
      name: "New Rule",
      filepath: "rules/newrule.json",
      content: {
        nodes: [],
        edges: [],
      },
    };

    const mockResponse = {
      _id: "123",
      ...newRuleData,
    };

    mock.onPost("/ruleData", newRuleData).reply(200, mockResponse);

    const result = await postRuleData(newRuleData);

    expect(result).toEqual(mockResponse);
    expect(logError).not.toHaveBeenCalled();
  });

  test("handles API error with specific message", async () => {
    const newRuleData = { name: "Invalid Rule" };
    const errorMessage = "Request failed with status code 400";

    mock.onPost("/ruleData").reply(400);

    await expect(postRuleData(newRuleData)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error posting rule data: Error: ${errorMessage}`);
  });

  test("handles network error", async () => {
    const newRuleData = { name: "Test Rule" };
    const errorMessage = "Network Error";

    mock.onPost("/ruleData").networkError();

    await expect(postRuleData(newRuleData)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error posting rule data: Error: ${errorMessage}`);
  });
});

describe("updateRuleData", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosAPIInstance);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  test("successfully updates rule data", async () => {
    const ruleId = "123";
    const updatedRuleData = {
      name: "Updated Rule",
      filepath: "rules/updated-rule.json",
      content: {
        nodes: [{ id: "1", type: "start" }],
        edges: [],
      },
    };

    const mockResponse = {
      _id: ruleId,
      ...updatedRuleData,
    };

    mock.onPut(`/ruleData/${ruleId}`, updatedRuleData).reply(200, mockResponse);

    const result = await updateRuleData(ruleId, updatedRuleData);

    expect(result).toEqual(mockResponse);
    expect(logError).not.toHaveBeenCalled();
  });

  test("handles API error with specific message", async () => {
    const ruleId = "123";
    const updatedRuleData = { name: "Invalid Rule" };
    const errorMessage = "Request failed with status code 400";

    mock.onPut(`/ruleData/${ruleId}`).reply(400);

    await expect(updateRuleData(ruleId, updatedRuleData)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error updating rule: Error: ${errorMessage}`);
  });

  test("handles network error", async () => {
    const ruleId = "123";
    const updatedRuleData = { name: "Test Rule" };
    const errorMessage = "Network Error";

    mock.onPut(`/ruleData/${ruleId}`).networkError();

    await expect(updateRuleData(ruleId, updatedRuleData)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error updating rule: Error: ${errorMessage}`);
  });

  test("handles not found error", async () => {
    const ruleId = "nonexistent";
    const updatedRuleData = { name: "Test Rule" };
    const errorMessage = "Request failed with status code 404";

    mock.onPut(`/ruleData/${ruleId}`).reply(404);

    await expect(updateRuleData(ruleId, updatedRuleData)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error updating rule: Error: ${errorMessage}`);
  });
});

describe("deleteRuleData", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosAPIInstance);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  test("successfully deletes rule data", async () => {
    const ruleId = "123";
    const mockResponse = { message: "Rule deleted successfully" };

    mock.onDelete(`/ruleData/${ruleId}`).reply(200, mockResponse);

    const result = await deleteRuleData(ruleId);

    expect(result).toEqual(mockResponse);
    expect(logError).not.toHaveBeenCalled();
  });

  test("handles API error with specific message", async () => {
    const ruleId = "123";
    const errorMessage = "Request failed with status code 400";

    mock.onDelete(`/ruleData/${ruleId}`).reply(400);

    await expect(deleteRuleData(ruleId)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error deleting rule: Error: ${errorMessage}`);
  });

  test("handles not found error", async () => {
    const ruleId = "nonexistent";
    const errorMessage = "Request failed with status code 404";

    mock.onDelete(`/ruleData/${ruleId}`).reply(404);

    await expect(deleteRuleData(ruleId)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error deleting rule: Error: ${errorMessage}`);
  });

  test("handles network error", async () => {
    const ruleId = "123";
    const errorMessage = "Network Error";

    mock.onDelete(`/ruleData/${ruleId}`).networkError();

    await expect(deleteRuleData(ruleId)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error deleting rule: Error: ${errorMessage}`);
  });
});

describe("getRuleMap", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosAPIInstance);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  test("successfully retrieves rule map with filepath only", async () => {
    const filepath = "test/rule.json";
    const mockResponse = {
      inputs: [{ name: "input1", type: "string" }],
      outputs: [{ name: "output1", type: "number" }],
      resultOutputs: [{ name: "result1", type: "boolean" }],
    };

    mock.onPost("/rulemap", { ruleDir: "prod", filepath }).reply(200, mockResponse);

    const result = await getRuleMap(filepath);

    expect(result).toEqual(mockResponse);
    expect(logError).not.toHaveBeenCalled();
  });

  test("successfully retrieves rule map with filepath and rule content", async () => {
    const filepath = "test/rule.json";
    const ruleContent: DecisionGraphType = {
      nodes: [{ id: "1", type: "start", name: "Start", position: { x: 0, y: 0 } }],
      edges: [{ id: "e1", sourceId: "1", targetId: "2" }],
    };
    const mockResponse = {
      inputs: [{ name: "input1", type: "string" }],
      outputs: [{ name: "output1", type: "number" }],
      resultOutputs: [{ name: "result1", type: "boolean" }],
    };

    mock.onPost("/rulemap", { ruleDir: "dev", filepath, ruleContent }).reply(200, mockResponse);

    const result = await getRuleMap(filepath, ruleContent, RULE_VERSION.inDev);

    expect(result).toEqual(mockResponse);
    expect(logError).not.toHaveBeenCalled();
  });

  test("handles API error", async () => {
    const filepath = "test/rule.json";
    const errorMessage = "Request failed with status code 500";

    mock.onPost("/rulemap").reply(500);

    await expect(getRuleMap(filepath)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error getting rule data: Error: ${errorMessage}`);
  });

  test("handles network error", async () => {
    const filepath = "test/rule.json";
    const errorMessage = "Network Error";

    mock.onPost("/rulemap").networkError();

    await expect(getRuleMap(filepath)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error getting rule data: Error: ${errorMessage}`);
  });
});

describe("getRuleRunSchema", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosAPIInstance);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  test("successfully generates schema from rule response", async () => {
    const mockRuleResponse = {
      result: {
        output: { value: 42 },
      },
      trace: {
        nodeId: "123",
        input: { field: "test" },
      },
    };

    const mockSchemaResponse = {
      inputs: [{ name: "field", type: "string" }],
      outputs: [{ name: "output.value", type: "number" }],
    };

    mock.onPost("/rulemap/rulerunschema", mockRuleResponse).reply(200, mockSchemaResponse);

    const result = await getRuleRunSchema(mockRuleResponse);

    expect(result).toEqual(mockSchemaResponse);
    expect(logError).not.toHaveBeenCalled();
  });

  test("handles empty rule response", async () => {
    const mockRuleResponse = {};
    const mockSchemaResponse = {
      inputs: [],
      outputs: [],
    };

    mock.onPost("/rulemap/rulerunschema", mockRuleResponse).reply(200, mockSchemaResponse);

    const result = await getRuleRunSchema(mockRuleResponse);

    expect(result).toEqual(mockSchemaResponse);
    expect(logError).not.toHaveBeenCalled();
  });

  test("handles API error", async () => {
    const mockRuleResponse = { invalid: "data" };
    const errorMessage = "Request failed with status code 400";

    mock.onPost("/rulemap/rulerunschema", mockRuleResponse).reply(400);

    await expect(getRuleRunSchema(mockRuleResponse)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error posting output schema: Error: ${errorMessage}`);
  });

  test("handles network error", async () => {
    const mockRuleResponse = {};
    const errorMessage = "Network Error";

    mock.onPost("/rulemap/rulerunschema").networkError();

    await expect(getRuleRunSchema(mockRuleResponse)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error posting output schema: Error: ${errorMessage}`);
  });
});

describe("generateSchemaFromRuleContent", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosAPIInstance);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  test("successfully generates schema from rule content", async () => {
    const mockRuleContent: DecisionGraphType = {
      nodes: [
        { id: "1", type: "start", name: "Input", position: { x: 0, y: 0 } },
        { id: "2", type: "expression", name: "Process", position: { x: 100, y: 0 } },
      ],
      edges: [{ id: "e1", sourceId: "1", targetId: "2" }],
    };

    const mockResponse = {
      inputs: [{ name: "input1", type: "string" }],
      outputs: [{ name: "output1", type: "number" }],
      resultOutputs: [{ name: "result1", type: "boolean" }],
    };

    mock
      .onPost("/rulemap/generateFromRuleContent", {
        ruleDir: "prod",
        ruleContent: mockRuleContent,
      })
      .reply(200, mockResponse);

    const result = await generateSchemaFromRuleContent(mockRuleContent, RULE_VERSION.inProduction);

    expect(result).toEqual(mockResponse);
    expect(logError).not.toHaveBeenCalled();
  });

  test("handles empty rule content", async () => {
    const emptyRuleContent: DecisionGraphType = {
      nodes: [],
      edges: [],
    };

    const mockResponse = {
      inputs: [],
      outputs: [],
      resultOutputs: [],
    };

    mock
      .onPost("/rulemap/generateFromRuleContent", {
        ruleContent: emptyRuleContent,
        ruleDir: "prod",
      })
      .reply(200, mockResponse);

    const result = await generateSchemaFromRuleContent(emptyRuleContent, RULE_VERSION.inProduction);

    expect(result).toEqual(mockResponse);
    expect(logError).not.toHaveBeenCalled();
  });

  test("handles API error", async () => {
    const mockRuleContent: DecisionGraphType = {
      nodes: [],
      edges: [],
    };
    const errorMessage = "Request failed with status code 500";

    mock.onPost("/rulemap/generateFromRuleContent").reply(500);

    await expect(generateSchemaFromRuleContent(mockRuleContent, RULE_VERSION.inProduction)).rejects.toThrow(
      errorMessage
    );
    expect(logError).toHaveBeenCalledWith(`Error getting rule data: Error: ${errorMessage}`);
  });

  test("handles network error", async () => {
    const mockRuleContent: DecisionGraphType = {
      nodes: [],
      edges: [],
    };
    const errorMessage = "Network Error";

    mock.onPost("/rulemap/generateFromRuleContent").networkError();

    await expect(generateSchemaFromRuleContent(mockRuleContent, RULE_VERSION.inProduction)).rejects.toThrow(
      errorMessage
    );
    expect(logError).toHaveBeenCalledWith(`Error getting rule data: Error: ${errorMessage}`);
  });
});

describe("getScenariosByFilename", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosAPIInstance);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  test("successfully retrieves scenarios for a rule", async () => {
    const filepath = "test/rule.json";
    const mockScenarios = [
      {
        _id: "1",
        name: "Scenario 1",
        filepath: "test/rule.json",
        context: { input: "test1" },
        expectedOutput: { result: "success" },
      },
      {
        _id: "2",
        name: "Scenario 2",
        filepath: "test/rule.json",
        context: { input: "test2" },
        expectedOutput: { result: "failure" },
      },
    ];

    mock.onPost("/scenario/by-filename/", { filepath }).reply(200, mockScenarios);

    const result = await getScenariosByFilename(filepath);

    expect(result).toEqual(mockScenarios);
    expect(logError).not.toHaveBeenCalled();
  });

  test("handles empty scenarios list", async () => {
    const filepath = "test/rule.json";
    mock.onPost("/scenario/by-filename/", { filepath }).reply(200, []);

    const result = await getScenariosByFilename(filepath);

    expect(result).toEqual([]);
    expect(logError).not.toHaveBeenCalled();
  });

  test("handles API error", async () => {
    const filepath = "test/rule.json";
    const errorMessage = "Request failed with status code 500";

    mock.onPost("/scenario/by-filename/").reply(500);

    await expect(getScenariosByFilename(filepath)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error posting output schema: Error: ${errorMessage}`);
  });

  test("handles network error", async () => {
    const filepath = "test/rule.json";
    const errorMessage = "Network Error";

    mock.onPost("/scenario/by-filename/").networkError();

    await expect(getScenariosByFilename(filepath)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error posting output schema: Error: ${errorMessage}`);
  });
});

describe("createScenario", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosAPIInstance);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  test("successfully creates a new scenario", async () => {
    const newScenario = {
      name: "Test Scenario",
      filepath: "test/rule.json",
      context: { input: "test" },
      expectedOutput: { result: "success" },
    };

    const mockResponse = {
      _id: "123",
      ...newScenario,
    };

    mock.onPost("/scenario", newScenario).reply(200, mockResponse);

    const result = await createScenario(newScenario);

    expect(result).toEqual(mockResponse);
    expect(logError).not.toHaveBeenCalled();
  });

  test("handles validation error response", async () => {
    const invalidScenario = {
      name: "Invalid Scenario",
    };
    const errorMessage = "Invalid scenario format";

    mock.onPost("/scenario").reply(400, { message: errorMessage });

    await expect(createScenario(invalidScenario)).rejects.toThrow();
    expect(logError).toHaveBeenCalledWith(`Error posting output schema: Error: Request failed with status code 400`);
  });

  test("handles API error", async () => {
    const scenario = {
      name: "Test Scenario",
      filepath: "test/rule.json",
    };
    const errorMessage = "Request failed with status code 500";

    mock.onPost("/scenario").reply(500);

    await expect(createScenario(scenario)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error posting output schema: Error: ${errorMessage}`);
  });

  test("handles network error", async () => {
    const scenario = {
      name: "Test Scenario",
      filepath: "test/rule.json",
    };
    const errorMessage = "Network Error";

    mock.onPost("/scenario").networkError();

    await expect(createScenario(scenario)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error posting output schema: Error: ${errorMessage}`);
  });
});

describe("updateScenario", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosAPIInstance);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  test("successfully updates an existing scenario", async () => {
    const scenarioId = "123";
    const updatedScenario = {
      name: "Updated Test Scenario",
      filepath: "test/rule.json",
      context: { input: "updated-test" },
      expectedOutput: { result: "updated-success" },
    };

    const mockResponse = {
      _id: scenarioId,
      ...updatedScenario,
    };

    mock.onPut(`/scenario/${scenarioId}`, updatedScenario).reply(200, mockResponse);

    const result = await updateScenario(updatedScenario, scenarioId);

    expect(result).toEqual(mockResponse);
    expect(logError).not.toHaveBeenCalled();
  });

  test("handles validation error response", async () => {
    const scenarioId = "123";
    const invalidScenario = {
      name: "Invalid Updated Scenario",
    };
    const errorMessage = "Invalid scenario format";

    mock.onPut(`/scenario/${scenarioId}`).reply(400, { message: errorMessage });

    await expect(updateScenario(invalidScenario, scenarioId)).rejects.toThrow();
    expect(logError).toHaveBeenCalledWith(`Error posting output schema: Error: Request failed with status code 400`);
  });

  test("handles scenario not found error", async () => {
    const nonexistentId = "999";
    const scenario = {
      name: "Test Scenario",
      filepath: "test/rule.json",
    };
    const errorMessage = "Request failed with status code 404";

    mock.onPut(`/scenario/${nonexistentId}`).reply(404);

    await expect(updateScenario(scenario, nonexistentId)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error posting output schema: Error: ${errorMessage}`);
  });

  test("handles network error", async () => {
    const scenarioId = "123";
    const scenario = {
      name: "Test Scenario",
      filepath: "test/rule.json",
    };
    const errorMessage = "Network Error";

    mock.onPut(`/scenario/${scenarioId}`).networkError();

    await expect(updateScenario(scenario, scenarioId)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error posting output schema: Error: ${errorMessage}`);
  });
});

describe("deleteScenario", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosAPIInstance);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  test("successfully deletes a scenario", async () => {
    const scenarioId = "123";
    const mockResponse = { message: "Scenario deleted successfully" };

    mock.onDelete(`/scenario/${scenarioId}`).reply(200, mockResponse);

    const result = await deleteScenario(scenarioId);

    expect(result).toEqual(mockResponse);
    expect(logError).not.toHaveBeenCalled();
  });

  test("handles scenario not found error", async () => {
    const nonexistentId = "999";
    const errorMessage = "Request failed with status code 404";

    mock.onDelete(`/scenario/${nonexistentId}`).reply(404);

    await expect(deleteScenario(nonexistentId)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error deleting scenario: Error: ${errorMessage}`);
  });

  test("handles API error", async () => {
    const scenarioId = "123";
    const errorMessage = "Request failed with status code 500";

    mock.onDelete(`/scenario/${scenarioId}`).reply(500);

    await expect(deleteScenario(scenarioId)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error deleting scenario: Error: ${errorMessage}`);
  });

  test("handles network error", async () => {
    const scenarioId = "123";
    const errorMessage = "Network Error";

    mock.onDelete(`/scenario/${scenarioId}`).networkError();

    await expect(deleteScenario(scenarioId)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error deleting scenario: Error: ${errorMessage}`);
  });
});

describe("runDecisionsForScenarios", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosAPIInstance);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  test("successfully runs decisions for scenarios with filepath only", async () => {
    const filepath = "test/rule.json";
    const mockResponse = {
      results: [
        {
          scenarioId: "1",
          passed: true,
          output: { result: "success" },
        },
        {
          scenarioId: "2",
          passed: false,
          output: { result: "failure" },
        },
      ],
      summary: {
        total: 2,
        passed: 1,
        failed: 1,
      },
    };

    mock.onPost("/scenario/run-decisions", { filepath, ruleDir: "prod" }).reply(200, mockResponse);

    const result = await runDecisionsForScenarios(filepath, RULE_VERSION.inProduction);

    expect(result).toEqual(mockResponse);
    expect(logError).not.toHaveBeenCalled();
  });

  test("successfully runs decisions with filepath and rule content", async () => {
    const filepath = "test/rule.json";
    const ruleContent: DecisionGraphType = {
      nodes: [{ id: "1", type: "start", name: "Start", position: { x: 0, y: 0 } }],
      edges: [{ id: "e1", sourceId: "1", targetId: "2" }],
    };
    const mockResponse = {
      results: [{ scenarioId: "1", passed: true, output: { result: "success" } }],
      summary: { total: 1, passed: 1, failed: 0 },
    };

    mock.onPost("/scenario/run-decisions", { filepath, ruleContent, ruleDir: "prod" }).reply(200, mockResponse);

    const result = await runDecisionsForScenarios(filepath, RULE_VERSION.inProduction, ruleContent);

    expect(result).toEqual(mockResponse);
    expect(logError).not.toHaveBeenCalled();
  });

  test("handles API error", async () => {
    const filepath = "test/rule.json";
    const errorMessage = "Request failed with status code 500";

    mock.onPost("/scenario/run-decisions").reply(500);

    await expect(runDecisionsForScenarios(filepath)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error running scenarios: Error: ${errorMessage}`);
  });

  test("handles network error", async () => {
    const filepath = "test/rule.json";
    const errorMessage = "Network Error";

    mock.onPost("/scenario/run-decisions").networkError();

    await expect(runDecisionsForScenarios(filepath)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error running scenarios: Error: ${errorMessage}`);
  });
});

describe("getCSVForRuleRun", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosAPIInstance);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  test("successfully downloads CSV with filepath only", async () => {
    const filepath = "test/rule.json";
    const mockBlob = new Blob(["test,data"], { type: "text/csv" });

    mock.onPost("/scenario/evaluation", { filepath }).reply(200, mockBlob);

    const result = await getCSVForRuleRun(filepath);

    expect(result).toBe("CSV downloaded successfully");
    expect(downloadFileBlob).toHaveBeenCalledWith(mockBlob, "text/csv", "test/rule.csv");
    expect(logError).not.toHaveBeenCalled();
  });

  test("successfully downloads CSV with filepath and rule content", async () => {
    const filepath = "test/rule.json";
    const ruleContent: DecisionGraphType = {
      nodes: [{ id: "1", type: "start", name: "Start", position: { x: 0, y: 0 } }],
      edges: [{ id: "e1", sourceId: "1", targetId: "2" }],
    };
    const mockBlob = new Blob(["test,data"], { type: "text/csv" });

    mock.onPost("/scenario/evaluation", { filepath, ruleContent }).reply(200, mockBlob);

    const result = await getCSVForRuleRun(filepath, ruleContent);

    expect(result).toBe("CSV downloaded successfully");
    expect(downloadFileBlob).toHaveBeenCalledWith(mockBlob, "text/csv", "test/rule.csv");
    expect(logError).not.toHaveBeenCalled();
  });

  test("handles API error", async () => {
    const filepath = "test/rule.json";
    const errorMessage = "Error getting CSV for rule run";

    mock.onPost("/scenario/evaluation").reply(500);

    await expect(getCSVForRuleRun(filepath)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error getting CSV for rule run: Error: Request failed with status code 500`);
    expect(downloadFileBlob).not.toHaveBeenCalled();
  });

  test("handles network error", async () => {
    const filepath = "test/rule.json";
    const errorMessage = "Error getting CSV for rule run";

    mock.onPost("/scenario/evaluation").networkError();

    await expect(getCSVForRuleRun(filepath)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error getting CSV for rule run: Error: Network Error`);
    expect(downloadFileBlob).not.toHaveBeenCalled();
  });
});

describe("uploadCSVAndProcess", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosAPIInstance);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  test("successfully processes CSV file with all tests passed", async () => {
    const file = new File(["test,data"], "test.csv", { type: "text/csv" });
    const filepath = "test/rule.json";
    const mockBlob = new Blob(["processed,data"], { type: "text/csv" });

    mock.onPost("/scenario/evaluation/upload/").reply(200, mockBlob, {
      "x-all-tests-passed": "true",
    });

    const result = await uploadCSVAndProcess(file, filepath);

    expect(result).toEqual({
      successMessage: "File processed successfully",
      allTestsPassed: true,
    });
    expect(downloadFileBlob).toHaveBeenCalledWith(
      mockBlob,
      "text/csv",
      expect.stringContaining("test/rule_testing_test_")
    );
    expect(logError).not.toHaveBeenCalled();
  });

  test("successfully processes CSV file with some tests failed", async () => {
    const file = new File(["test,data"], "test.csv", { type: "text/csv" });
    const filepath = "test/rule.json";
    const mockBlob = new Blob(["processed,data"], { type: "text/csv" });

    mock.onPost("/scenario/evaluation/upload/").reply(200, mockBlob, {
      "x-all-tests-passed": "false",
    });

    const result = await uploadCSVAndProcess(file, filepath);

    expect(result).toEqual({
      successMessage: "File processed successfully",
      allTestsPassed: false,
    });
    expect(downloadFileBlob).toHaveBeenCalledWith(
      mockBlob,
      "text/csv",
      expect.stringContaining("test/rule_testing_test_")
    );
    expect(logError).not.toHaveBeenCalled();
  });

  test("successfully processes CSV with rule content", async () => {
    const file = new File(["test,data"], "test.csv", { type: "text/csv" });
    const filepath = "test/rule.json";
    const ruleContent: DecisionGraphType = {
      nodes: [{ id: "1", type: "start", name: "Start", position: { x: 0, y: 0 } }],
      edges: [{ id: "e1", sourceId: "1", targetId: "2" }],
    };
    const mockBlob = new Blob(["processed,data"], { type: "text/csv" });

    mock.onPost("/scenario/evaluation/upload/").reply(200, mockBlob, {
      "x-all-tests-passed": "true",
    });

    const result = await uploadCSVAndProcess(file, filepath, ruleContent);

    expect(result).toEqual({
      successMessage: "File processed successfully",
      allTestsPassed: true,
    });
    expect(downloadFileBlob).toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
  });

  test("handles API error", async () => {
    const file = new File(["test,data"], "test.csv", { type: "text/csv" });
    const filepath = "test/rule.json";

    mock.onPost("/scenario/evaluation/upload/").reply(500);

    await expect(uploadCSVAndProcess(file, filepath)).rejects.toThrow("Error processing CSV file");
    expect(logError).toHaveBeenCalledWith(`Error processing CSV file: Error: Request failed with status code 500`);
    expect(downloadFileBlob).not.toHaveBeenCalled();
  });

  test("handles network error", async () => {
    const file = new File(["test,data"], "test.csv", { type: "text/csv" });
    const filepath = "test/rule.json";

    mock.onPost("/scenario/evaluation/upload/").networkError();

    await expect(uploadCSVAndProcess(file, filepath)).rejects.toThrow("Error processing CSV file");
    expect(logError).toHaveBeenCalledWith(`Error processing CSV file: Error: Network Error`);
    expect(downloadFileBlob).not.toHaveBeenCalled();
  });
});

describe("getBREFields", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosAPIInstance);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  test("successfully retrieves BRE fields with search text", async () => {
    const searchText = "test";
    const mockResponse = {
      data: [
        {
          id: "1",
          name: "test_field",
          label: "Test Field",
          data_type: { name: "string" },
        },
        {
          id: "2",
          name: "test_number",
          label: "Test Number",
          data_type: { name: "number" },
        },
      ],
    };

    mock.onGet(`/klamm/brefields?searchText=${searchText}`).reply(200, mockResponse);

    const result = await getBREFields(searchText);

    expect(result).toEqual(mockResponse.data);
    expect(logError).not.toHaveBeenCalled();
  });

  test("handles empty search results", async () => {
    const searchText = "nonexistent";
    const mockResponse = { data: [] };

    mock.onGet(`/klamm/brefields?searchText=${searchText}`).reply(200, mockResponse);

    const result = await getBREFields(searchText);

    expect(result).toEqual([]);
    expect(logError).not.toHaveBeenCalled();
  });

  test("handles API error", async () => {
    const searchText = "test";
    const errorMessage = "Request failed with status code 500";

    mock.onGet(`/klamm/brefields?searchText=${searchText}`).reply(500);

    await expect(getBREFields(searchText)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error getting rule data: Error: ${errorMessage}`);
  });

  test("handles network error", async () => {
    const searchText = "test";
    const errorMessage = "Network Error";

    mock.onGet(`/klamm/brefields?searchText=${searchText}`).networkError();

    await expect(getBREFields(searchText)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error getting rule data: Error: ${errorMessage}`);
  });
});

describe("getBREFieldFromName", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosAPIInstance);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  test("successfully retrieves BRE field by field name", async () => {
    const fieldName = "test_field";
    const mockResponse = {
      id: "1",
      name: "test_field",
      label: "Test Field",
      data_type: { name: "string" },
      description: "A test field",
      data_validation: {
        validation_criteria: "length <= 50",
        bre_validation_type: {
          value: "text",
        },
      },
    };

    mock.onGet(`/klamm/brefield/${fieldName}`).reply(200, mockResponse);

    const result = await getBREFieldFromName(fieldName);

    expect(result).toEqual(mockResponse);
    expect(logError).not.toHaveBeenCalled();
  });

  test("handles field not found error", async () => {
    const fieldName = "nonexistent_field";
    const errorMessage = "Request failed with status code 404";

    mock.onGet(`/klamm/brefield/${fieldName}`).reply(404);

    await expect(getBREFieldFromName(fieldName)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error getting rule data: Error: ${errorMessage}`);
  });

  test("handles API error", async () => {
    const fieldName = "test_field";
    const errorMessage = "Request failed with status code 500";

    mock.onGet(`/klamm/brefield/${fieldName}`).reply(500);

    await expect(getBREFieldFromName(fieldName)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error getting rule data: Error: ${errorMessage}`);
  });

  test("handles network error", async () => {
    const fieldName = "test_field";
    const errorMessage = "Network Error";

    mock.onGet(`/klamm/brefield/${fieldName}`).networkError();

    await expect(getBREFieldFromName(fieldName)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error getting rule data: Error: ${errorMessage}`);
  });

  test("handles field with nested child fields", async () => {
    const fieldName = "parent_field";
    const mockResponse = {
      id: "1",
      name: "parent_field",
      label: "Parent Field",
      data_type: { name: "object" },
      child_fields: [
        {
          id: "2",
          name: "child_field",
          label: "Child Field",
          data_type: { name: "string" },
        },
      ],
    };

    mock.onGet(`/klamm/brefield/${fieldName}`).reply(200, mockResponse);

    const result = await getBREFieldFromName(fieldName);

    expect(result).toEqual(mockResponse);
    expect(result.child_fields).toBeDefined();
    expect(result.child_fields?.length).toBe(1);
    expect(logError).not.toHaveBeenCalled();
  });
});

describe("getBRERules", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosAPIInstance);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  test("successfully retrieves BRE rules", async () => {
    const mockResponse = [
      {
        name: "Rule1",
        parent_rules: [
          {
            id: 1,
            name: "ParentRule1",
            filepath: "rules/parent1.json",
            description: "Parent rule 1",
            label: "Parent 1",
            url: "http://example.com/1",
            child_rules: [],
          },
        ],
        child_rules: [
          {
            id: 2,
            name: "ChildRule1",
            filepath: "rules/child1.json",
            description: "Child rule 1",
            label: "Child 1",
            url: "http://example.com/2",
            parent_rules: [],
          },
        ],
      },
    ];

    mock.onGet("/klamm/brerules").reply(200, mockResponse);

    const result = await getBRERules();

    expect(result).toEqual(mockResponse);
    expect(logError).not.toHaveBeenCalled();
  });

  test("successfully handles empty rules list", async () => {
    mock.onGet("/klamm/brerules").reply(200, []);

    const result = await getBRERules();

    expect(result).toEqual([]);
    expect(logError).not.toHaveBeenCalled();
  });

  test("handles API error", async () => {
    const errorMessage = "Request failed with status code 500";

    mock.onGet("/klamm/brerules").reply(500);

    await expect(getBRERules()).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error getting rule data: Error: ${errorMessage}`);
  });

  test("handles network error", async () => {
    const errorMessage = "Network Error";

    mock.onGet("/klamm/brerules").networkError();

    await expect(getBRERules()).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error getting rule data: Error: ${errorMessage}`);
  });

  test("handles malformed response data", async () => {
    const malformedResponse = [
      {
        name: "InvalidRule",
      },
    ];

    mock.onGet("/klamm/brerules").reply(200, malformedResponse);

    const result = await getBRERules();

    expect(result).toEqual(malformedResponse);
    expect(logError).not.toHaveBeenCalled();
  });
});

describe("getCSVTests", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosAPIInstance);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  test("handles API error", async () => {
    const filepath = "test/rule.json";
    const errorMessage = "Error getting CSV for rule run";

    mock.onPost("/scenario/test").reply(500);

    await expect(getCSVTests(filepath)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error getting CSV for rule run: Error: Request failed with status code 500`);
    expect(downloadFileBlob).not.toHaveBeenCalled();
  });

  test("handles network error", async () => {
    const filepath = "test/rule.json";
    const errorMessage = "Error getting CSV for rule run";

    mock.onPost("/scenario/test").networkError();

    await expect(getCSVTests(filepath)).rejects.toThrow(errorMessage);
    expect(logError).toHaveBeenCalledWith(`Error getting CSV for rule run: Error: Network Error`);
    expect(downloadFileBlob).not.toHaveBeenCalled();
  });
});
