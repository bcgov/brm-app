import { RuleLink, RuleMapRule, MaxRuleQuery } from "@/app/types/rulemap";
import { getAllRuleData, getBRERules } from "./api";
import { KlammRule } from "../types/klamm";

// Direction for traversing the rule hierarchy
type Direction = "parentRules" | "childRules";

interface GraphTraversalConfig {
  source: (link: RuleLink) => number;
  target: (link: RuleLink) => number;
  next: (link: RuleLink) => number; // Gets the next node to traverse to
  isConnected: (link: RuleLink, nodeId: number) => boolean; // Checks if link connects to current node
}

const getSourceId = (link: RuleLink): number => (link.source ? (link.source as any).id : -1);
const getTargetId = (link: RuleLink): number => (link.target ? (link.target as any).id : -1);

// Parent Rules: traverses from current rule node to parent rules (upwards)
// Child Rules: traverses from current rule node to child rules (downwards)
const directionConfig: Record<Direction, GraphTraversalConfig> = {
  parentRules: {
    source: getSourceId,
    target: getTargetId,
    next: getSourceId,
    isConnected: (link, nodeId) => getTargetId(link) === nodeId,
  },
  childRules: {
    source: getSourceId,
    target: getTargetId,
    next: getTargetId,
    isConnected: (link, nodeId) => getSourceId(link) === nodeId,
  },
};

/**
 * Recursively finds all connected nodes in a specified direction
 * @param links - Array of all graph links
 * @param nodeId - Starting node ID/initial rule node
 * @param direction - Direction to traverse (parentRules/childRules)
 * @param visited - Set of already visited nodes to prevent cycles
 * @returns Set of connected node IDs
 */
const getConnectedNodes = (
  links: RuleLink[],
  nodeId: number,
  direction: Direction,
  visited = new Set<number>()
): Set<number> => {
  const connected = new Set<number>();
  if (visited.has(nodeId)) return connected;
  visited.add(nodeId);

  const config = directionConfig[direction];

  links.forEach((link) => {
    if (config.isConnected(link, nodeId)) {
      const nextNode = config.next(link);
      connected.add(nextNode);
      const nextConnected = getConnectedNodes(links, nextNode, direction, visited);
      nextConnected.forEach((id) => connected.add(id));
    }
  });

  return connected;
};

/**
 * Determines if a link should be included in the final result
 * A link is connected if:
 * 1. Both its source and target are in the connected set
 * 2. The next node is connected and the current node is connected
 * 3. The current node is directly connected
 */
const isLinkConnected = (
  link: RuleLink,
  nodeId: number,
  connected: Set<number>,
  config: GraphTraversalConfig
): boolean => {
  const sourceId = config.source(link);
  const targetId = config.target(link);

  return (
    (connected.has(sourceId) && connected.has(targetId)) ||
    (connected.has(config.next(link)) && config.isConnected(link, nodeId)) ||
    config.isConnected(link, nodeId)
  );
};

/**
 * Gets all links that are part of the connected subgraph in the specified direction
 * Uses getConnectedNodes to find all connected nodes, then filters links
 * that are part of this connected component
 */
const getConnectedLinks = (links: RuleLink[], nodeId: number, direction: Direction): RuleLink[] => {
  const connected = getConnectedNodes(links, nodeId, direction);
  const config = directionConfig[direction];

  return links.filter((link) => isLinkConnected(link, nodeId, connected, config));
};

export const useGraphTraversal = (links: RuleLink[]) => ({
  getAllParentRules: (nodeId: number) => getConnectedNodes(links, nodeId, "parentRules"),
  getAllChildRules: (nodeId: number) => getConnectedNodes(links, nodeId, "childRules"),
  getParentRuleLinks: (nodeId: number) => getConnectedLinks(links, nodeId, "parentRules"),
  getChildRuleLinks: (nodeId: number) => getConnectedLinks(links, nodeId, "childRules"),
});

/**
 * Creates a standardized MaxRuleQuery object from an API response
 * @param apiResponse - Raw API response containing rule data
 * @returns MaxRuleQuery object with normalized data structure
 * - data: Array of rule objects from the API
 * - categories: Available rule categories
 * - total: Total number of rules
 * - page: Current page number
 * - pageSize: Number of items per page
 */
export const createMaxRuleData = (apiResponse: any): MaxRuleQuery => ({
  rules: apiResponse.data || [],
  categories: apiResponse.categories || [],
  total: apiResponse.total,
  page: apiResponse.page,
  pageSize: apiResponse.pageSize,
});

/**
 * Maps Klamm rules to graph nodes by combining data from Klamm rules and Max rules
 * @param klammRuleData - Array of rules from Klamm system
 * @param maxRuleData - Query result containing rules from Max system
 * @returns Array of enhanced rule objects with combined properties from both systems
 * - Adds URL, filepath, reviewBranch, and isPublished from Max rules
 * - Matches rules based on name property
 */
export const mapRulesToGraph = (klammRuleData: KlammRule[], maxRuleData: MaxRuleQuery) => {
  const sanitizedMaxRuleData = {
    ...maxRuleData,
    data: maxRuleData.rules.map((rule) => ({
      ...rule,
      name: rule.name || "",
    })),
  };

  return klammRuleData.map((klammRule) => {
    const matchingRule = sanitizedMaxRuleData.data.find((rule) => rule.name === klammRule.name);
    return {
      ...klammRule,
      url: matchingRule ? `${matchingRule._id}` : undefined,
      filepath: matchingRule ? matchingRule.filepath : undefined,
      reviewBranch: matchingRule?.reviewBranch,
      isPublished: matchingRule?.isPublished,
    };
  });
};

/**
 * Recursively collects all parent rules for a given rule
 * @param rule - The rule to find parents for
 * @param allRules - Complete array of rules to search through
 * @param collected - Set to store unique parent rule names (prevents cycles)
 * @returns Set of parent rule names that are parents of the given rule
 * - Traverses up the rule hierarchy following parent_rules relationships
 * - Handles circular dependencies through Set collection
 */
export const getAllParentRules = (rule: any, allRules: any[], collected = new Set<string>()) => {
  rule.parent_rules?.forEach((parent: RuleMapRule) => {
    if (parent.name && !collected.has(parent.name)) {
      collected.add(parent.name);
      const parentRule = allRules.find((r) => r.name === parent.name);
      if (parentRule) {
        getAllParentRules(parentRule, allRules, collected);
      }
    }
  });
  return collected;
};

/**
 * Recursively collects all child rules for a given rule
 * @param rule - The rule to find children for
 * @param allRules - Complete array of rules to search through
 * @param collected - Set to store unique child rule names (prevents cycles)
 * @returns Set of child rule names that are children of the given rule
 * - Traverses down the rule hierarchy following child_rules relationships
 * - Handles circular dependencies through Set collection
 */
export const getAllChildRules = (rule: any, allRules: any[], collected = new Set<string>()): Set<string> => {
  rule.child_rules?.forEach((child: RuleMapRule) => {
    if (child.name && !collected.has(child.name)) {
      collected.add(child.name);
      const childRule = allRules.find((r) => r.name === child.name);
      if (childRule) {
        getAllChildRules(childRule, allRules, collected);
      }
    }
  });
  return collected;
};

/**
 * Filters rules based on a category string matched against filepath
 * @param mappedRules - Array of mapped rule objects
 * @param category - Category string to filter by
 * @returns Array of rules whose filepath contains the category string (case-insensitive)
 * - Decodes URI-encoded category string before comparison
 */
export const filterRulesByCategory = (mappedRules: any[], category: string) => {
  const decodedCategory = decodeURIComponent(category);
  return mappedRules.filter((rule) => rule.filepath?.toLowerCase().includes(decodedCategory.toLowerCase()));
};

/**
 * Finds a single rule that exactly matches the given filepath
 * @param mappedRules - Array of mapped rule objects
 * @param filePath - Exact filepath to match
 * @returns Single rule object matching the filepath or undefined if not found
 */
export const filterRulesByFilePath = (mappedRules: any[], filePath: string) => {
  return mappedRules.find((rule) => rule.filepath === filePath || rule.filepath?.includes(filePath));
};

/**
 * Filters rules based on a search term matched against rule names, filepaths, and labels
 * @param mappedRules - Array of mapped rule objects
 * @param searchTerm - Search string to filter by
 * @returns Array of rules whose names, filepaths, or labels contain the search term (case-insensitive)
 */
export const filterRulesBySearchTerm = (mappedRules: any[], searchTerm: string) => {
  const normalizedSearchTerm = searchTerm.toLowerCase().trim();
  if (!normalizedSearchTerm) return mappedRules;

  return mappedRules.filter(
    (rule) =>
      rule.name?.toLowerCase().includes(normalizedSearchTerm) ||
      rule.filepath?.toLowerCase().includes(normalizedSearchTerm) ||
      rule.label?.toLowerCase().includes(normalizedSearchTerm)
  );
};

/**
 * Collects all rules related to a set of initial rules through parent-child relationships
 * @param mappedRules - Complete array of mapped rule objects
 * @param initialRules - Array of rules to find relations for
 * @param includeInitialRules - Whether to include the initial rules in the result
 * @returns Array of rules that are related to the initial rules
 * - Includes both parent and child rules
 * - Can optionally include the initial rules themselves
 * - Handles circular relationships through Set collection
 */
export const getRelatedRules = (mappedRules: any[], initialRules: any[], includeInitialRules = false) => {
  const relatedRuleNames = new Set<string>();
  const initialRuleNames = new Set(initialRules.map((rule) => rule.name));

  initialRules.forEach((rule) => {
    const parentRules = getAllParentRules(rule, mappedRules);
    const childRules = getAllChildRules(rule, mappedRules);
    parentRules.forEach((name) => relatedRuleNames.add(name));
    childRules.forEach((name) => relatedRuleNames.add(name));
  });

  return mappedRules.filter((rule) => {
    if (includeInitialRules && initialRuleNames.has(rule.name)) {
      return true;
    }
    return !initialRuleNames.has(rule.name) && relatedRuleNames.has(rule.name);
  });
};

/**
 * Fetches all rule data and combines it with Klamm rule data for graph visualization
 * @returns Object containing filtered rules and categories
 */
export const fetchGraphRuleData = async () => {
  const maxRuleData = await getAllRuleData({
    page: 1,
    pageSize: 10000,
    searchTerm: "",
  });
  const klammRuleData = await getBRERules();
  const mappedKlammRules = mapRulesToGraph(klammRuleData, createMaxRuleData(maxRuleData));

  const additionalUnpublishedRules = maxRuleData.data
    .filter((rule) => !rule.isPublished && !klammRuleData.some((klammRule) => klammRule.name === rule.name))
    .map((rule) => ({
      id: rule._id,
      name: rule.name,
      url: `${rule._id}?version=draft`,
      filepath: rule.filepath,
      reviewBranch: rule.reviewBranch,
      isPublished: rule.isPublished,
    }));

  const combinedGraphRules = [...mappedKlammRules, ...additionalUnpublishedRules];

  return {
    rules: combinedGraphRules,
    categories: maxRuleData?.categories || [],
  };
};

// Check if the parameter is a file path or custom filter string
export const isFilePath = (param: string) => param.includes(".json") && !param.includes("embed&");
export const isCustomFilter = (param: string) => param.includes("embed&");
export const parseCustomFilter = (filterParam: string) => {
  const searchParams = new URLSearchParams(filterParam.split("embed&")[1]);
  return {
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
  };
};

// Process custom filter strings to filter rules by category and search term
export const processCustomFilter = (mappedRules: any[], decodedParam: string) => {
  const { category, search } = parseCustomFilter(decodedParam);
  let filteredRules = [...mappedRules];

  if (category && search) {
    const categories = category.split(",");
    const categoryFiltered = categories.flatMap((cat) => filterRulesByCategory(filteredRules, cat));
    const relatedCategoryRules = getRelatedRules(mappedRules, categoryFiltered);
    const expandedCategoryRules = Array.from(new Set([...categoryFiltered, ...relatedCategoryRules]));
    const searchFiltered = filterRulesBySearchTerm(filteredRules, search);
    return expandedCategoryRules.filter((rule) => searchFiltered.some((searchRule) => searchRule.id === rule.id));
  }

  if (category) {
    const categories = category.split(",");
    const categoryFiltered = categories.flatMap((cat) => filterRulesByCategory(filteredRules, cat));
    const relatedCategoryRules = getRelatedRules(mappedRules, categoryFiltered).filter((rule) =>
      categories.some((cat) => filterRulesByCategory([rule], cat).length > 0)
    );
    return Array.from(new Set([...categoryFiltered, ...relatedCategoryRules]));
  }

  if (search) {
    return filterRulesBySearchTerm(filteredRules, search);
  }

  return [];
};

/**
 * Fetches and processes rule data based on a filter text string
 * @param filterText - Filter text string to process
 * @returns object containing filtered rules, categories, and embed status
 */

export const fetchAndProcessRuleData = async (filterText: string) => {
  const { rules, categories } = await fetchGraphRuleData();
  const decodedParam = decodeURIComponent(filterText);
  let finalFilteredRules = [];
  let isEmbedded = false;

  if (isCustomFilter(decodedParam)) {
    isEmbedded = true;
    finalFilteredRules = processCustomFilter(rules, decodedParam);
  } else if (isFilePath(decodedParam)) {
    const fileRule = filterRulesByFilePath(rules, decodedParam);
    finalFilteredRules = fileRule ? getRelatedRules(rules, [fileRule], true) : [];
  } else {
    finalFilteredRules = filterRulesByCategory(rules, decodedParam);
    if (finalFilteredRules.length > 0) {
      const relatedRules = getRelatedRules(rules, finalFilteredRules);
      finalFilteredRules = Array.from(new Set([...finalFilteredRules, ...relatedRules]));
    }
  }

  return { rules: finalFilteredRules, categories, isEmbedded };
};
