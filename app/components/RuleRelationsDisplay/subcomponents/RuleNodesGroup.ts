import * as d3 from "d3";
import { RuleNode } from "@/app/types/rulemap";

interface RuleNodesGroupProps {
  containerGroup: d3.Selection<any, any, any, any>;
  nodes: RuleNode[];
  simulation: d3.Simulation<any, undefined>;
  highlightConnections: (nodeId: number | null) => void;
  highlightSearch: (term: string) => void;
  searchTerm: string;
  openModal: (node: RuleNode) => void;
}

// Creates a group of nodes for the rule graph using d3
// Each node is a circle with a label, connected to other nodes via links
// Nodes are draggable, and clickable
export const RuleNodesGroup = ({
  containerGroup,
  nodes,
  simulation,
  highlightConnections,
  highlightSearch,
  searchTerm,
  openModal,
}: RuleNodesGroupProps) => {
  const dragstarted = (event: any) => {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  };

  const dragged = (event: any) => {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  };

  const dragended = (event: any) => {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  };

  const createNodeGroup = () => {
    //Drop Shadow on node text
    const defs = containerGroup.append("defs");
    defs
      .append("filter")
      .attr("id", "drop-shadow")
      .attr("height", "130%")
      .append("feDropShadow")
      .attr("dx", "0")
      .attr("dy", "2")
      .attr("stdDeviation", "3")
      .attr("flood-color", "rgba(0,0,0,0.25)");

    // Nodes with aria labels
    const nodeGroup = containerGroup
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("role", "button")
      .attr("tabindex", "0")
      .attr("aria-label", (d) => `Rule: ${d.name}`)
      .call(d3.drag<any, any>().on("start", dragstarted).on("drag", dragged).on("end", dragended));

    // Text labels on nodes
    nodeGroup
      .append("text")
      .each(function (d) {
        const text = d3.select(this);
        const words = (d.label || d.name).split(/\s+/);
        let line = "";
        let lineNumber = 0;
        const lineHeight = 1.2;
        const y = 4;
        const dy = 0;
        const dx = d.radius + 10;
        const padding = 8;

        const textGroup = d3.select(this.parentNode as Element).insert("g", "text");

        text
          .attr("font-size", "13px")
          .attr("dx", dx)
          .attr("dy", dy)
          .attr("cursor", "pointer")
          .attr("role", "link")
          .style("fill", "#0066cc")
          .style("font-weight", "600");

        const tspans: d3.Selection<SVGTSpanElement, any, any, any>[] = [];

        for (let i = 0; i < words.length; i++) {
          let word = words[i];
          if (line.length > 0) {
            line = `${line} ${word}`;
          } else {
            line = word;
          }

          if (line.length > 20 || i === words.length - 1) {
            const tspan = text
              .append("tspan")
              .attr("x", dx)
              .attr("dx", lineNumber === 0 ? 0 : dx)
              .attr("dy", lineNumber ? `${lineHeight}em` : y)
              .text(line);

            tspans.push(tspan);
            line = "";
            lineNumber++;
          }
        }

        const bbox = (this as SVGTextElement).getBBox();
        textGroup
          .insert("rect", "text")
          .attr("x", bbox.x - padding)
          .attr("y", bbox.y - padding)
          .attr("width", bbox.width + padding * 2)
          .attr("height", bbox.height + padding * 2)
          .attr("fill", "white")
          .attr("rx", 8)
          .attr("ry", 8)
          .style("filter", "url(#drop-shadow)");
      })
      .on("mouseover", function () {
        d3.select(this).style("fill", "#004999");
      })
      .on("mouseout", function () {
        d3.select(this).style("fill", "#0066cc");
      });

    // Circles for nodes
    nodeGroup
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", "#69b3a2")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", "2")
      .style("transition", "all 0.2s ease");

    return nodeGroup;
  };

  const nodeGroup = createNodeGroup();

  // Add event listeners for interacting with nodes
  nodeGroup
    .select("circle")
    .on("mouseover", function () {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", (d: any) => d.radius * 1.2)
        .attr("stroke", "#0066cc")
        .attr("stroke-width", "3");
    })
    .on("mouseout", function () {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", (d: any) => d.radius)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", "2");
    });

  // Focus styles for keyboard navigation
  nodeGroup.on("focus", function () {
    d3.select(this)
      .select("circle")
      .attr("stroke", "#0066cc")
      .attr("stroke-width", "4")
      .attr("r", (d: any) => d.radius * 1.1);
  });

  nodeGroup.on("blur", function () {
    d3.select(this)
      .select("circle")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", "2")
      .attr("r", (d: any) => d.radius);
  });

  nodeGroup.on("click", (event, d: any) => {
    event.stopPropagation();
    highlightConnections(d.id);
  });

  nodeGroup.selectAll("text").on("click", (event: MouseEvent, d: any) => {
    const node = d as RuleNode;
    event.stopPropagation();
    event.preventDefault();
    highlightConnections(node.id);

    const svgElement = containerGroup.node()?.ownerSVGElement;
    if (svgElement) {
      openModal(node);
    }
  });

  nodeGroup.on("keydown", (event, d: any) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      highlightSearch(searchTerm);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      const node = d as RuleNode;
      event.preventDefault();
      event.stopPropagation();
      highlightConnections(d.id);
      const svgElement = containerGroup.node()?.ownerSVGElement;
      if (svgElement) {
        openModal(node);
      }
    }
  });

  return {
    updatePositions: () => {
      nodeGroup.attr("transform", (d) => `translate(${d.x},${d.y})`);
    },
    getSelection: () => nodeGroup,
  };
};
