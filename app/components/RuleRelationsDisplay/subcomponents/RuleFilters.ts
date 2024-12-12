import { RuleNode, RuleLink } from "@/app/types/rulemap";

// Returns nodes for a specific category
// If category is empty, returns all nodes
// If showDraftRules is false, only returns published nodes
// Also returns all parent rules and child rules of the matching nodes
export const getNodesForCategory = (
  nodes: RuleNode[],
  category: string | undefined,
  showDraftRules: boolean,
  getAllParentRules: (nodeId: number) => Set<number>,
  getAllChildRules: (nodeId: number) => Set<number>
): Set<number> => {
  const matchingNodes = new Set<number>();

  nodes.forEach((node) => {
    if (!showDraftRules && !node.isPublished) return;

    if (!category) {
      matchingNodes.add(node.id);
      return;
    }

    if (node.filepath?.includes(category)) {
      matchingNodes.add(node.id);

      const parentRules = getAllParentRules(node.id);
      const childRules = getAllChildRules(node.id);

      parentRules.forEach((id) => {
        const parentNode = nodes.find((n) => n.id === id);
        if (parentNode && (showDraftRules || parentNode.isPublished)) {
          matchingNodes.add(id);
        }
      });

      childRules.forEach((id) => {
        const childNode = nodes.find((n) => n.id === id);
        if (childNode && (showDraftRules || childNode.isPublished)) {
          matchingNodes.add(id);
        }
      });
    }
  });

  return matchingNodes;
};

// Returns links that connect nodes in the visible set
// If showDraftRules is false, only returns links between published nodes
// Also returns links that connect parent rules and child rules of the visible nodes
// This is used to highlight connections when a node is selected
export const isNodeVisible = (
  node: RuleNode,
  searchPattern: string,
  visibleNodes: Set<number>,
  showDraftRules: boolean
): boolean => {
  return (
    (showDraftRules || (node.isPublished ?? false)) &&
    visibleNodes.has(node.id) &&
    (searchPattern === "" || node.name.toLowerCase().includes(searchPattern))
  );
};

// Returns links that connect nodes in the visible set
export const isLinkVisible = (link: RuleLink, visibleNodes: Set<number>, showDraftRules: boolean): boolean => {
  const sourceVisible =
    visibleNodes.has((link.source as any).id) && (showDraftRules || (link.source as any).isPublished);
  const targetVisible =
    visibleNodes.has((link.target as any).id) && (showDraftRules || (link.target as any).isPublished);
  return sourceVisible && targetVisible;
};
