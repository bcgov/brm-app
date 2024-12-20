import { useEffect, useRef, useState, RefObject, createContext } from "react";
import { CategoryObject } from "@/app/types/ruleInfo";
import { RuleMapRule, RuleNode } from "@/app/types/rulemap";
import styles from "./RuleRelationsDisplay.module.css";
import { RuleGraphControls } from "./subcomponents/RuleGraphControls";
import { DescriptionManager } from "./subcomponents/DescriptionManager";
import { RuleGraph } from "./subcomponents/RuleGraph";

interface RuleModalContextType {
  selectedRule: RuleNode | null;
  openModal: (rule: RuleNode) => void;
  closeModal: () => void;
}

export const RuleModalContext = createContext<RuleModalContextType | null>(null);

export interface RuleGraphProps {
  rules: RuleMapRule[];
  categories: CategoryObject[];
  searchTerm?: string;
  setSearchTerm?: (value: string) => void;
  embeddedCategory?: string;
  width?: number;
  height?: number;
  filter?: string | string[];
  location?: Location;
  basicLegend?: boolean;
}

/**
 * Manages the visualization of rule relationships in a graph format
 * Includes search, category filtering and draft rules toggle
 */
export default function RuleRelationsGraph({
  rules,
  categories,
  searchTerm = "",
  setSearchTerm,
  width = 1000,
  height = 1000,
  filter,
  location,
  basicLegend,
}: RuleGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const [isLegendMinimized, setIsLegendMinimized] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState(filter && filter?.length > 0 ? filter : undefined);
  const [showDraftRules, setShowDraftRules] = useState(true);
  const [selectedRule, setSelectedRule] = useState<RuleNode | null>(null);

  const modalContext: RuleModalContextType = {
    selectedRule,
    openModal: (rule: RuleNode) => setSelectedRule(rule),
    closeModal: () => setSelectedRule(null),
  };

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
    if (filter && filter?.length > 0) {
      setCategoryFilter(filter);
    }
  }, [filter]);

  const handleSearchChange = (value: string) => {
    setSearchTerm && setSearchTerm(value);
  };

  const handleCategoryChange = (value: string | string[]) => {
    setCategoryFilter(value);
  };

  const handleShowDraftRulesChange = (value: boolean) => {
    setShowDraftRules(value);
  };

  const handleLegendToggle = () => {
    setIsLegendMinimized(!isLegendMinimized);
  };

  const handleClearFilters = () => {
    setSearchTerm && setSearchTerm("");
    setCategoryFilter("");
  };

  return (
    <div ref={containerRef} className={styles.container}>
      <RuleModalContext.Provider value={modalContext}>
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
        <RuleGraph
          rules={rules}
          svgRef={svgRef}
          dimensions={dimensions}
          searchTerm={searchTerm}
          categoryFilter={categoryFilter}
          showDraftRules={showDraftRules}
        />
        <DescriptionManager />
      </RuleModalContext.Provider>
    </div>
  );
}
