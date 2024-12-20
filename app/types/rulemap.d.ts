import { RuleInfo } from "./ruleInfo";
import { Variable } from "./scenario";
export interface RuleMap {
  inputs: Variable[];
  outputs: Variable[];
  resultOutputs: Variable[];
}

export interface RuleMapRule extends RuleInfo {
  id: number;
  label?: string;
  child_rules: Rule[];
  parent_rules: Rule[];
  description: string | null;
  url: string | undefined;
}

export interface RuleNode extends d3.SimulationNodeDatum {
  id: number;
  name: string;
  label: string | undefined;
  radius: number;
  isHighlighted?: boolean;
  description: string | null;
  url: string | undefined;
  filepath: string | undefined;
  isPublished?: boolean;
  reviewBranch?: string;
}

export interface RuleLink extends d3.SimulationLinkDatum<RuleNode> {
  source: number;
  target: number;
}

export interface MaxRuleQuery {
  rules: RuleInfo[];
  categories: any[];
  total?: number;
  page?: number;
  pageSize?: number;
}
