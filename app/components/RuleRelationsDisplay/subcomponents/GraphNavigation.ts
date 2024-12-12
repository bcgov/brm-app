import * as d3 from "d3";

// Zoom and Pan controls for graph navigation
export const GraphNavigation = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  zoom: d3.ZoomBehavior<Element, unknown>
) => {
  const controls = svg
    .append("g")
    .attr("transform", `translate(10, ${svg.node()?.getBoundingClientRect().height! - 60})`);

  controls.append("rect").attr("width", 30).attr("height", 90).attr("fill", "white").attr("stroke", "#999");

  controls
    .append("text")
    .attr("x", 15)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("cursor", "pointer")
    .text("+")
    .on("click", () => {
      svg
        .transition()
        .duration(750)
        .call(zoom.scaleBy as any, 1.3);
    });

  controls
    .append("text")
    .attr("x", 15)
    .attr("y", 50)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("cursor", "pointer")
    .text("⟲")
    .on("click", () => {
      svg
        .transition()
        .duration(750)
        .call(zoom.transform as any, d3.zoomIdentity);
    });

  controls
    .append("text")
    .attr("x", 15)
    .attr("y", 80)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("cursor", "pointer")
    .text("−")
    .on("click", () => {
      svg
        .transition()
        .duration(750)
        .call(zoom.scaleBy as any, 0.7);
    });
};
