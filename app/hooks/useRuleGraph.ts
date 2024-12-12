import { useEffect, RefObject, useRef } from "react";
import * as d3 from "d3";
import { RuleMapRule, RuleNode, RuleLink } from "@/app/types/rulemap";
import { useGraphTraversal } from "@/app/utils/graphUtils";
import {
  getNodesForCategory,
  isNodeVisible,
  isLinkVisible,
} from "../components/RuleRelationsDisplay/subcomponents/RuleFilters";
import { GraphNavigation } from "../components/RuleRelationsDisplay/subcomponents/GraphNavigation";
import { RuleNodesGroup } from "../components/RuleRelationsDisplay/subcomponents/RuleNodesGroup";
import { useRuleModal } from "../contexts/RuleModalContext";

interface UseRuleGraphProps {
  rules: RuleMapRule[];
  svgRef: RefObject<SVGSVGElement>;
  dimensions: { width: number; height: number };
  searchTerm: string;
  categoryFilter: string | undefined;
  showDraftRules: boolean;
}

// Manages the rule graph visualization using D3.js
export const useRuleGraph = ({
  rules,
  svgRef,
  dimensions,
  searchTerm,
  categoryFilter,
  showDraftRules,
}: UseRuleGraphProps) => {
  const { openModal } = useRuleModal();

  const graphFunctionsRef = useRef<{
    getAllParentRules: (id: number) => Set<number>;
    getAllChildRules: (id: number) => Set<number>;
    getParentRuleLinks: (id: number) => RuleLink[];
    getChildRuleLinks: (id: number) => RuleLink[];
  } | null>(null);

  useEffect(
    () => {
      if (!svgRef.current || !rules.length) return;

      const { width, height } = dimensions;

      // Clear previous graph
      d3.select(svgRef.current).selectAll("*").remove();

      const svg = d3
        .select(svgRef.current)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("role", "img")
        .attr("aria-label", "Rule relationships diagram")
        .attr("tabindex", "0");

      // Add zoom
      const containerGroup = svg.append("g");
      const zoom = d3
        .zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
          containerGroup.attr("transform", event.transform);
        });

      svg.call(zoom as any);

      // Add navigation controls
      GraphNavigation(svg, containerGroup, zoom);

      const uniqueRules = new Map<number, RuleMapRule>();
      rules.forEach((rule) => {
        if (!uniqueRules.has(rule.id)) {
          uniqueRules.set(rule.id, rule);
        }
      });

      // Create nodes from unique rules, so there are no duplicates in the graph
      const nodes: RuleNode[] = Array.from(uniqueRules.values()).map((rule) => ({
        id: rule.id,
        name: rule.name || "N/A",
        label: rule.label ?? rule.name,
        radius: 8,
        description: rule?.description || null,
        url: rule?.url,
        filepath: rule?.filepath,
        isPublished: rule?.isPublished,
        reviewBranch: rule?.reviewBranch,
      }));

      // Create links only between existing nodes
      const links: RuleLink[] = Array.from(uniqueRules.values()).flatMap((rule) => {
        const parentLinks =
          rule.parent_rules
            ?.filter((parent) => uniqueRules.has(parent.id))
            .map((parent) => ({
              source: parent.id,
              target: rule.id,
            })) || [];

        const childLinks =
          rule.child_rules
            ?.filter((child) => uniqueRules.has(child.id))
            .map((child) => ({
              source: rule.id,
              target: child.id,
            })) || [];

        return [...parentLinks, ...childLinks];
      });

      nodes.sort((a, b) => a.id - b.id);

      // eslint-disable-next-line react-hooks/rules-of-hooks
      graphFunctionsRef.current = useGraphTraversal(links);

      // Create simulation with base forces and constraints
      // Forces and constraints can be modified to adjust graph layout
      const simulation = d3
        .forceSimulation(nodes)
        .force(
          "link",
          d3
            .forceLink(links)
            .id((d: any) => d.id)
            .distance(150)
            .strength(0.5)
        )
        .force("charge", d3.forceManyBody().strength(-500).distanceMax(500))
        .force("x", d3.forceX().strength(0.03))
        .force("y", d3.forceY().strength(0.03))
        .force("collision", d3.forceCollide().radius(60));

      // Draw links
      const link = containerGroup
        .append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("marker-end", "url(#arrow)");

      // Add arrow marker
      containerGroup
        .append("defs")
        .append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("fill", "#999")
        .attr("d", "M0,-5L10,0L0,5");

      // Highlights parent and child rules, and links between them when a node is selected
      const highlightConnections = (nodeId: number | null) => {
        if (nodeId === null) {
          highlightSearch(searchTerm);
          link.attr("stroke", "#999").attr("stroke-opacity", 0.6).attr("stroke-width", "1");
          return;
        }

        const { getAllParentRules, getAllChildRules, getParentRuleLinks, getChildRuleLinks } =
          graphFunctionsRef.current!;
        const parentRules = getAllParentRules(nodeId);
        const childRules = getAllChildRules(nodeId);
        const parentRuleLinks = getParentRuleLinks(nodeId);
        const childRuleLinks = getChildRuleLinks(nodeId);

        ruleNodes
          .getSelection()
          .selectAll("circle")
          .attr("fill", (d: any) => {
            if (d.id === nodeId) return "#ff7f50";
            if (parentRules.has(d.id)) return "#4169e1";
            if (childRules.has(d.id)) return "#32cd32";
            return "#69b3a2";
          });

        ruleNodes
          .getSelection()
          .selectAll("text")
          .style("font-weight", (d: any) =>
            d.id === nodeId || parentRules.has(d.id) || childRules.has(d.id) ? "bold" : "normal"
          );

        link
          .attr("stroke", (line: any) => {
            if (parentRuleLinks.includes(line)) return "#4169e1";
            if (childRuleLinks.includes(line)) return "#32cd32";
            return "#999";
          })
          .attr("stroke-opacity", (line: any) =>
            parentRuleLinks.includes(line) || childRuleLinks.includes(line) ? 1 : 0.2
          )
          .attr("stroke-width", (line: any) =>
            parentRuleLinks.includes(line) || childRuleLinks.includes(line) ? "2" : "1"
          );

        ruleNodes
          .getSelection()
          .style("opacity", (d: any) => (d.id === nodeId || parentRules.has(d.id) || childRules.has(d.id) ? 1 : 0.3));
      };

      // Highlights rules that match the search term
      const highlightSearch = (term: string) => {
        const searchPattern = term.toLowerCase();
        const { getAllParentRules, getAllChildRules } = graphFunctionsRef.current!;
        const visibleNodes = getNodesForCategory(
          nodes,
          categoryFilter,
          showDraftRules,
          getAllParentRules,
          getAllChildRules
        );

        ruleNodes.getSelection().each(function (d: any) {
          const node = d3.select(this);
          const nodeIsVisible = isNodeVisible(d, searchPattern, visibleNodes, showDraftRules);
          const isDraftVisible = showDraftRules || d.isPublished;
          const matchesSearch =
            d.name.toLowerCase().includes(searchPattern) ||
            (d.filepath && d.filepath.toLowerCase().includes(searchPattern)) ||
            (d.label && d.label.toLowerCase().includes(searchPattern));

          // Handle draft visibility with display
          node.style("display", isDraftVisible ? "" : "none");

          // Handle search/filter visibility with opacity
          if (isDraftVisible) {
            node.select("circle").attr("fill", matchesSearch ? "#ff7f50" : "#69b3a2");
            node.select("text").style("font-weight", matchesSearch ? "bold" : "normal");
            node.style("opacity", nodeIsVisible ? 1 : 0.2);
          }
        });

        link.each(function (d: any) {
          const linkElement = d3.select(this);
          const isVisible = isLinkVisible(d, visibleNodes, showDraftRules);

          linkElement.style("display", isVisible ? "" : "none").style("opacity", 0.6);
        });
      };

      const handleSearch = () => {
        highlightSearch(searchTerm);
      };

      // Create RuleNodesGroup with filtered nodes
      const ruleNodes = RuleNodesGroup({
        containerGroup,
        nodes,
        simulation,
        highlightConnections,
        highlightSearch,
        searchTerm,
        openModal,
      });

      // Initial search highlight
      handleSearch();

      // Reset on background click
      svg.on("click", () => {
        // Reset link styles to base rendering
        link.attr("stroke", "#999").attr("stroke-opacity", 0.6).attr("stroke-width", "1");

        highlightSearch(searchTerm);
      });

      // Manage keyboard navigation
      svg.on("keydown", (event) => {
        switch (event.key) {
          case "Escape":
            link.attr("stroke", "#999").attr("stroke-opacity", 0.6).attr("stroke-width", "1");
            highlightSearch(searchTerm);
            break;
          case "ArrowUp":
            svg.transition().call(zoom.translateBy as any, 0, -30);
            break;
          case "ArrowDown":
            svg.transition().call(zoom.translateBy as any, 0, 30);
            break;
          case "ArrowLeft":
            svg.transition().call(zoom.translateBy as any, -30, 0);
            break;
          case "ArrowRight":
            svg.transition().call(zoom.translateBy as any, 30, 0);
            break;
          case "+":
            svg.transition().call(zoom.scaleBy as any, 1.2);
            break;
          case "-":
            svg.transition().call(zoom.scaleBy as any, 0.8);
            break;
        }
      });

      // Updates the positions of nodes and links on each animation frame
      // Core animation loop that makes the graph interactive and fluid
      // The simulation calculates new positions, and this code updates the DOM elements
      simulation.on("tick", () => {
        link
          .attr("x1", (d) => (d.source as any).x)
          .attr("y1", (d) => (d.source as any).y)
          .attr("x2", (d) => (d.target as any).x)
          .attr("y2", (d) => (d.target as any).y);

        ruleNodes.updatePositions();
      });

      return () => {
        simulation.stop();
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rules, dimensions, searchTerm, categoryFilter, showDraftRules]
  );
};
