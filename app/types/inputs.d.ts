import { Scenario } from "./scenario";

export interface InputProps {
  show: boolean;
  field: string;
  handleInputChange?: (value: any, field: string) => void;
  handleValueChange?: (value: string, field: string) => void;
}

export interface ChildFieldInputProps {
  field: string;
  item: any;
  each: any;
  index: number;
  scenarios: any;
  rawData: any;
  value: any;
  handleInputChange?: (value: any, field: string) => void;
}

export interface ObjectArrayInputProps extends InputProps {
  value: any[];
  ruleProperties?: any;
  scenarios?: Scenario[];
  rawData?: any;
  handleInputChange?: (value: any, field: string) => void;
  setRawData?: (data: any) => void;
}

export interface ObjectLengthDisplayProps {
  show: boolean;
  value: any;
}

export interface BooleanInputProps extends InputProps {
  value: boolean;
  handleInputChange: (value: any, field: string) => void;
}

export interface SelectInputProps extends InputProps {
  value: any;
  options: any[];
  handleInputChange: (value: any, field: string) => void;
  multiple?: boolean;
}

export interface DateInputProps extends InputProps {
  value: any;
  maximum: datejs.Date | null | undefined;
  minimum: datejs.Date | null | undefined;
  handleInputChange: (value: any, field: string) => void;
  handleClear: (field: string) => void;
}

export interface TextInputProps extends InputProps {
  value: any;
  valuesArray: any[];
  handleValueChange: (value: string, field: string) => void;
  handleInputChange: (value: any, field: string) => void;
  handleClear: (field: string) => void;
}

export interface NumberInputProps extends InputProps {
  value: any;
  maximum: number | null | undefined;
  minimum: number | null | undefined;
  handleValueChange: (value: string, field: string) => void;
  handleInputChange: (value: any, field: string) => void;
}

export interface ReadOnlyProps {
  show: boolean;
  value: any;
}

export interface ReadOnlyNumberDisplayProps extends ReadOnlyProps {
  field: string;
}

export interface ReadOnlyArrayDisplayProps extends ObjectArrayInputProps {
  handleInputChange?: (value: any, field: string) => void;
}
