import { RuleMapRule } from "./rulemap";
export interface KlammBREField {
  id?: string;
  name: string;
  label: string;
  description?: string;
  data_type?: {
    name: string;
  };
  data_validation?: {
    validation_criteria: string;
    bre_validation_type: {
      value: string;
    };
  };
  child_fields?: KlammBREField[];
  bre_data_type?: {
    name: string;
  };
  bre_data_validation?: {
    validation_criteria: string;
    bre_validation_type: {
      value: string;
    };
  };
}

interface KlammRule {
  name: string;
  parent_rules?: RuleMapRule[];
  child_rules?: RuleMapRule[];
}
