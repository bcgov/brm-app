import { useEffect, useRef, useState, RefObject } from "react";
import { CategoryObject } from "@/app/types/ruleInfo";
import { RuleMapRule } from "@/app/types/rulemap";
import styles from "@/app/components/RuleRelationsDisplay/RuleRelationsDisplay.module.css";
import { RuleGraphControls } from "./subcomponents/RuleGraphControls";
import { useRuleGraph } from "../../hooks/useRuleGraph";
import { DescriptionManager } from "./subcomponents/DescriptionManager";
import { RuleModalProvider } from "../../contexts/RuleModalContext";

export interface RuleGraphProps {
  rules: RuleMapRule[];
  categories: CategoryObject[];
  embeddedCategory?: string;
  width?: number;
  height?: number;
  filter?: string;
  location?: Location;
  basicLegend?: boolean;
}

export interface GraphContentProps {
  rules: RuleMapRule[];
  svgRef: RefObject<SVGSVGElement>;
  dimensions: { width: number; height: number };
  searchTerm: string;
  categoryFilter: string | undefined;
  showDraftRules: boolean;
}

// Renders the actual SVG graph visualization using D3.js
// Separated from the main component for better readability
// and to utilize the modal context provider
function GraphContent({ rules, svgRef, dimensions, searchTerm, categoryFilter, showDraftRules }: GraphContentProps) {
  useRuleGraph({
    rules,
    svgRef,
    dimensions,
    searchTerm,
    categoryFilter,
    showDraftRules,
  });

  return <svg ref={svgRef} className={styles.svg} />;
}

/**
 * Manages the visualization of rule relationships in a graph format
 * Includes search, category filtering and draft rules toggle
 */
export default function RuleRelationsGraph({
  rules,
  categories,
  width = 1000,
  height = 1000,
  filter,
  location,
  basicLegend,
}: RuleGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const [searchTerm, setSearchTerm] = useState("");
  const [isLegendMinimized, setIsLegendMinimized] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState(filter || undefined);
  const [showDraftRules, setShowDraftRules] = useState(true);

  /**
   * Sets up a ResizeObserver to handle responsive sizing
   * Updates dimensions when the container size changes
   */
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (filter) {
      setCategoryFilter(filter);
    }
  }, [filter]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
  };

  const handleShowDraftRulesChange = (value: boolean) => {
    setShowDraftRules(value);
  };

  const handleLegendToggle = () => {
    setIsLegendMinimized(!isLegendMinimized);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
  };

  return (
    <div ref={containerRef} className={styles.container}>
      <RuleModalProvider>
        <RuleGraphControls
          searchTerm={searchTerm}
          categoryFilter={categoryFilter}
          showDraftRules={showDraftRules}
          isLegendMinimized={isLegendMinimized}
          categories={categories}
          embeddedCategory={filter}
          onSearchChange={handleSearchChange}
          onCategoryChange={handleCategoryChange}
          onShowDraftRulesChange={handleShowDraftRulesChange}
          onLegendToggle={handleLegendToggle}
          onClearFilters={handleClearFilters}
          location={location}
          basicLegend={basicLegend}
        />
        <GraphContent
          rules={rules}
          svgRef={svgRef}
          dimensions={dimensions}
          searchTerm={searchTerm}
          categoryFilter={categoryFilter}
          showDraftRules={showDraftRules}
        />
        <DescriptionManager />
      </RuleModalProvider>
    </div>
  );
}
