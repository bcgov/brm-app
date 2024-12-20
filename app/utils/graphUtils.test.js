import {
  createMaxRuleData,
  mapRulesToGraph,
  getAllParentRules,
  getAllChildRules,
  filterRulesByCategory,
  filterRulesByFilePath,
  filterRulesBySearchTerm,
  getRelatedRules,
  useGraphTraversal,
  fetchGraphRuleData,
  fetchAndProcessRuleData,
  isFilePath,
  isCustomFilter,
  parseCustomFilter,
} from "./graphUtils";

import { getAllRuleData, getBRERules } from "./api";

// Mock the API module
jest.mock("./api", () => ({
  getAllRuleData: jest.fn(),
  getBRERules: jest.fn(),
}));

describe("createMaxRuleData", () => {
  test("handles empty API response", () => {
    const result = createMaxRuleData({});
    expect(result).toEqual({
      rules: [],
      categories: [],
      total: undefined,
      page: undefined,
      pageSize: undefined,
    });
  });

  test("normalizes complete API response", () => {
    const apiResponse = {
      data: [{ id: 1, name: "Rule1" }],
      categories: ["cat1", "cat2"],
      total: 100,
      page: 1,
      pageSize: 10,
    };
    const result = createMaxRuleData(apiResponse);
    expect(result).toEqual({
      rules: apiResponse.data,
      categories: apiResponse.categories,
      total: apiResponse.total,
      page: apiResponse.page,
      pageSize: apiResponse.pageSize,
    });
  });
});

describe("mapRulesToGraph", () => {
  const klammRules = [
    { name: "Rule1", type: "klamm" },
    { name: "Rule2", type: "klamm" },
  ];

  const maxRules = {
    rules: [
      { name: "Rule1", _id: "1", filepath: "/path1", reviewBranch: "main", isPublished: true },
      { name: "Rule3", _id: "3", filepath: "/path3", reviewBranch: "dev", isPublished: false },
    ],
    categories: [],
    total: 2,
    page: 1,
    pageSize: 10,
  };

  test("combines Klamm and Max rules correctly", () => {
    const result = mapRulesToGraph(klammRules, maxRules);
    expect(result).toEqual([
      {
        name: "Rule1",
        type: "klamm",
        url: "1",
        filepath: "/path1",
        reviewBranch: "main",
        isPublished: true,
      },
      {
        name: "Rule2",
        type: "klamm",
        url: undefined,
        filepath: undefined,
        reviewBranch: undefined,
        isPublished: undefined,
      },
    ]);
  });
});

describe("rule hierarchy functions", () => {
  const mockRules = [
    { name: "Parent", child_rules: [{ name: "Child" }] },
    { name: "Child", parent_rules: [{ name: "Parent" }] },
    { name: "Isolated" },
  ];

  test("getAllParentRules finds all parent rules", () => {
    const result = getAllParentRules(mockRules[1], mockRules);
    expect(result).toEqual(new Set(["Parent"]));
  });

  test("getAllChildRules finds all child rules", () => {
    const result = getAllChildRules(mockRules[0], mockRules);
    expect(result).toEqual(new Set(["Child"]));
  });
});

describe("filtering functions", () => {
  const mockRules = [
    { name: "Rule1", filepath: "/category1/rule1", label: "First" },
    { name: "Rule2", filepath: "/category2/rule2", label: "Second" },
  ];

  test("filterRulesByCategory filters by filepath", () => {
    const result = filterRulesByCategory(mockRules, "category1");
    expect(result).toEqual([mockRules[0]]);
  });

  test("filterRulesByFilePath finds exact match", () => {
    const result = filterRulesByFilePath(mockRules, "/category1/rule1");
    expect(result).toEqual(mockRules[0]);
  });

  test("filterRulesBySearchTerm searches across fields", () => {
    const result = filterRulesBySearchTerm(mockRules, "First");
    expect(result).toEqual([mockRules[0]]);
  });
});

describe("useGraphTraversal", () => {
  const mockLinks = [
    { source: { id: 1 }, target: { id: 2 } },
    { source: { id: 2 }, target: { id: 3 } },
  ];

  test("traverses parent and child relationships", () => {
    const { getAllParentRules, getAllChildRules } = useGraphTraversal(mockLinks);

    const parentRules = getAllParentRules(3);
    expect(parentRules).toEqual(new Set([1, 2]));

    const childRules = getAllChildRules(1);
    expect(childRules).toEqual(new Set([2, 3]));
  });
});

describe("getRelatedRules", () => {
  const mockRules = [
    { name: "Root", child_rules: [{ name: "Child" }] },
    { name: "Child", parent_rules: [{ name: "Root" }] },
    { name: "Unrelated" },
  ];

  test("finds related rules with initial rules included", () => {
    const result = getRelatedRules(mockRules, [mockRules[0]], true);
    expect(result).toContainEqual(mockRules[0]);
    expect(result).toContainEqual(mockRules[1]);
    expect(result).not.toContainEqual(mockRules[2]);
  });

  test("finds related rules without initial rules", () => {
    const result = getRelatedRules(mockRules, [mockRules[0]], false);
    expect(result).toContainEqual(mockRules[1]);
    expect(result.length).toBe(1);
  });

  test("handles circular dependencies", () => {
    const circularRules = [
      { name: "A", child_rules: [{ name: "B" }] },
      { name: "B", child_rules: [{ name: "C" }], parent_rules: [{ name: "A" }] },
      { name: "C", child_rules: [{ name: "A" }], parent_rules: [{ name: "B" }] },
    ];
    const result = getRelatedRules(circularRules, [circularRules[0]], false);
    expect(result.map((r) => r.name).sort()).toEqual(["B", "C"]);
  });

  test("handles multiple initial rules", () => {
    const result = getRelatedRules(mockRules, [mockRules[0], mockRules[1]], false);
    expect(result).toHaveLength(0);
  });

  test("handles empty initial rules", () => {
    const result = getRelatedRules(mockRules, [], true);
    expect(result).toHaveLength(0);
  });
});

describe("graph traversal edge cases", () => {
  test("handles links with missing source or target", () => {
    const invalidLinks = [
      { source: { id: 1 }, target: null },
      { source: null, target: { id: 2 } },
    ];
    const { getAllParentRules, getAllChildRules } = useGraphTraversal(invalidLinks);
    expect(getAllParentRules(1).size).toBe(0);
    expect(getAllChildRules(2).size).toBe(0);
  });

  test("handles cyclic graph structures", () => {
    const cyclicLinks = [
      { source: { id: 1 }, target: { id: 2 } },
      { source: { id: 2 }, target: { id: 3 } },
      { source: { id: 3 }, target: { id: 1 } },
    ];
    const { getAllParentRules } = useGraphTraversal(cyclicLinks);
    expect(getAllParentRules(1)).toEqual(new Set([1, 2, 3]));
  });
});

describe("filter functions edge cases", () => {
  test("filterRulesByCategory handles URI-encoded categories", () => {
    const rules = [{ filepath: "/path/with spaces/rule" }];
    expect(filterRulesByCategory(rules, "with%20spaces")).toHaveLength(1);
  });

  test("filterRulesBySearchTerm handles special characters", () => {
    const rules = [{ name: "Rule (special chars) [test]" }];
    expect(filterRulesBySearchTerm(rules, "(special")).toHaveLength(1);
  });

  test("filterRulesBySearchTerm trims whitespace", () => {
    const rules = [{ name: "test" }];
    expect(filterRulesBySearchTerm(rules, "  test  ")).toHaveLength(1);
  });
});

describe("fetchGraphRuleData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("combines published and unpublished rules correctly", async () => {
    const mockMaxRuleData = {
      data: [
        { _id: "1", name: "Rule1", isPublished: true, filepath: "/path1" },
        { _id: "2", name: "Rule2", isPublished: false, filepath: "/path2" },
      ],
      categories: ["cat1"],
    };

    const mockKlammRules = [{ name: "Rule1", type: "klamm" }];

    getAllRuleData.mockResolvedValue(mockMaxRuleData);
    getBRERules.mockResolvedValue(mockKlammRules);

    const result = await fetchGraphRuleData();

    expect(result.rules).toHaveLength(2);
    expect(result.categories).toEqual(["cat1"]);
  });
});

describe("fetchAndProcessRuleData", () => {
  const mockMaxRules = [
    {
      name: "Rule1",
      _id: "123",
      filepath: "/category1/rule1.json",
      isPublished: true,
      reviewBranch: "main",
      child_rules: [],
      parent_rules: [],
    },
    {
      name: "Rule2",
      _id: "456",
      filepath: "/category2/rule2.json",
      isPublished: true,
      reviewBranch: "main",
      child_rules: [],
      parent_rules: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getAllRuleData.mockResolvedValue({
      data: mockMaxRules,
      categories: ["category1", "category2"],
    });
    getBRERules.mockResolvedValue(mockMaxRules);
  });

  test("processes filepath filter", async () => {
    const result = await fetchAndProcessRuleData("/category1/rule1.json");
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0]).toMatchObject({
      name: "Rule1",
      filepath: "/category1/rule1.json",
    });
    expect(result.isEmbedded).toBe(false);
  });

  test("processes custom filter with category and search", async () => {
    const result = await fetchAndProcessRuleData("embed&category=category1&search=Rule1");
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0]).toMatchObject({
      name: "Rule1",
      filepath: "/category1/rule1.json",
    });
    expect(result.isEmbedded).toBe(true);
  });

  test("processes category-only filter", async () => {
    const result = await fetchAndProcessRuleData("category1");
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0]).toMatchObject({
      name: "Rule1",
      filepath: "/category1/rule1.json",
    });
    expect(result.isEmbedded).toBe(false);
  });
});

describe("custom filter helpers", () => {
  test("isFilePath correctly identifies file paths", () => {
    expect(isFilePath("/path/to/rule.json")).toBe(true);
    expect(isFilePath("embed&category=test")).toBe(false);
  });

  test("isCustomFilter correctly identifies custom filters", () => {
    expect(isCustomFilter("embed&category=test")).toBe(true);
    expect(isCustomFilter("/path/to/rule.json")).toBe(false);
  });

  test("parseCustomFilter extracts search and category parameters", () => {
    const result = parseCustomFilter("embed&category=test&search=query");
    expect(result).toEqual({
      category: "test",
      search: "query",
    });
  });

  test("parseCustomFilter handles missing parameters", () => {
    const result = parseCustomFilter("embed&category=test");
    expect(result).toEqual({
      category: "test",
      search: "",
    });
  });
});
