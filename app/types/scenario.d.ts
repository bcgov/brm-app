export interface Scenario {
  _id?: string; //optional for create scenario as generated id
  title: string;
  ruleID: string;
  filepath: string;
  variables: Variable[];
  expectedResults: any[];
}

export interface Variable {
  name: string;
  value: any;
  type?: string;
  field?: string;
  nested?: string | boolean;
}
