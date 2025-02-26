import { getNodesForCategory, isNodeVisible, isLinkVisible } from "./RuleFilters";
import { RuleNode, RuleLink } from "@/app/types/rulemap";

describe("RuleFilters", () => {
  const mockNodes: RuleNode[] = [
    {
      id: 1,
      name: "Rule1",
      filepath: "/category1/rule1",
      isPublished: true,
      label: "Rule1",
      radius: 10,
      description: "",
      url: "",
    },
    {
      id: 2,
      name: "Rule2",
      filepath: "/category1/rule2",
      isPublished: false,
      label: "Rule2",
      radius: 10,
      description: "",
      url: "",
    },
    {
      id: 3,
      name: "Rule3",
      filepath: "/category2/rule3",
      isPublished: true,
      label: "Rule3",
      radius: 10,
      description: "",
      url: "",
    },
    {
      id: 4,
      name: "Rule4",
      filepath: "/category2/rule4",
      isPublished: false,
      label: "Rule4",
      radius: 10,
      description: "",
      url: "",
    },
  ];

  const mockGetAllParentRules = (nodeId: number): Set<number> => {
    const parentMap: { [key: number]: number[] } = {
      1: [],
      2: [1],
      3: [1],
      4: [2, 3],
    };
    return new Set(parentMap[nodeId] || []);
  };

  const mockGetAllChildRules = (nodeId: number): Set<number> => {
    const childMap: { [key: number]: number[] } = {
      1: [2, 3],
      2: [4],
      3: [4],
      4: [],
    };
    return new Set(childMap[nodeId] || []);
  };

  describe("getNodesForCategory", () => {
    test("returns all published nodes when no category is specified and showDraftRules is false", () => {
      const result = getNodesForCategory(mockNodes, undefined, false, mockGetAllParentRules, mockGetAllChildRules);
      expect(result).toEqual(new Set([1, 3]));
    });

    test("returns all nodes when no category is specified and showDraftRules is true", () => {
      const result = getNodesForCategory(mockNodes, undefined, true, mockGetAllParentRules, mockGetAllChildRules);
      expect(result).toEqual(new Set([1, 2, 3, 4]));
    });

    test("returns nodes for single category with their relations", () => {
      const result = getNodesForCategory(mockNodes, "category1", true, mockGetAllParentRules, mockGetAllChildRules);
      expect(result).toEqual(new Set([1, 2, 3, 4]));
    });

    test("returns nodes for multiple categories with their relations", () => {
      const result = getNodesForCategory(
        mockNodes,
        ["category1", "category2"],
        true,
        mockGetAllParentRules,
        mockGetAllChildRules
      );
      expect(result).toEqual(new Set([1, 2, 3, 4]));
    });

    test("filters out unpublished nodes when showDraftRules is false", () => {
      const result = getNodesForCategory(mockNodes, "category1", false, mockGetAllParentRules, mockGetAllChildRules);
      expect(result).toEqual(new Set([1, 3]));
    });
  });

  describe("isNodeVisible", () => {
    const visibleNodes = new Set([1, 2, 3]);

    test("returns true for visible published node matching search", () => {
      const node = mockNodes[0];
      expect(isNodeVisible(node, "rule1", visibleNodes, true)).toBe(true);
    });

    test("returns false for node not in visible set", () => {
      const node = mockNodes[3];
      expect(isNodeVisible(node, "", visibleNodes, true)).toBe(false);
    });

    test("returns false for unpublished node when showDraftRules is false", () => {
      const node = mockNodes[1];
      expect(isNodeVisible(node, "", visibleNodes, false)).toBe(false);
    });

    test("returns false when node name doesn't match search pattern", () => {
      const node = mockNodes[0];
      expect(isNodeVisible(node, "nonexistent", visibleNodes, true)).toBe(false);
    });

    test("returns true for empty search pattern", () => {
      const node = mockNodes[0];
      expect(isNodeVisible(node, "", visibleNodes, true)).toBe(true);
    });
  });

  describe("isLinkVisible", () => {
    const visibleNodes = new Set([1, 2, 3]);

    test("returns true when both nodes are visible and published", () => {
      const link: RuleLink = {
        source: { id: 1, isPublished: true } as any,
        target: { id: 1, isPublished: true } as any,
      };
      expect(isLinkVisible(link, visibleNodes, false)).toBe(true);
    });

    test("returns true when both nodes are visible and drafts are allowed", () => {
      const link: RuleLink = {
        source: { id: 2, isPublished: false } as any,
        target: { id: 2, isPublished: false } as any,
      };
      expect(isLinkVisible(link, visibleNodes, true)).toBe(true);
    });

    test("returns false when source node is not visible", () => {
      const link: RuleLink = {
        source: { id: 4, isPublished: true } as any,
        target: { id: 1, isPublished: true } as any,
      };
      expect(isLinkVisible(link, visibleNodes, true)).toBe(false);
    });

    test("returns false when target node is not visible", () => {
      const link: RuleLink = {
        source: { id: 1, isPublished: true } as any,
        target: { id: 4, isPublished: true } as any,
      };
      expect(isLinkVisible(link, visibleNodes, true)).toBe(false);
    });

    test("returns false when source node is unpublished and showDraftRules is false", () => {
      const link: RuleLink = {
        source: { id: 2, isPublished: false } as any,
        target: { id: 1, isPublished: true } as any,
      };
      expect(isLinkVisible(link, visibleNodes, false)).toBe(false);
    });

    test("returns false when target node is unpublished and showDraftRules is false", () => {
      const link: RuleLink = {
        source: { id: 1, isPublished: true } as any,
        target: { id: 2, isPublished: false } as any,
      };
      expect(isLinkVisible(link, visibleNodes, false)).toBe(false);
    });
  });
});
