import { Scenario } from "@/app/types/scenario";
import { getFieldValidation } from "@/app/utils/utils";
import { logError } from "@/app/utils/logger";
import {
  DefaultInput,
  ObjectArrayInput,
  ObjectLengthDisplay,
  BooleanInput,
  SelectInput,
  DateInput,
  ReadOnlyArrayDisplay,
  ReadOnlyBooleanDisplay,
  ReadOnlyStringDisplay,
  ReadOnlyNumberDisplay,
  NumberInput,
  TextInput,
} from "./subcomponents/InputComponents";
import { Flex } from "antd";

export interface rawDataProps {
  [key: string]: any;
  rulemap?: boolean;
}

export const getAutoCompleteOptions = (field: string, scenarios: Scenario[] = []) => {
  if (!scenarios) return [];
  const optionsSet = new Set<string>();

  scenarios.forEach((scenario) => {
    scenario.variables
      .filter((variable) => variable.name === field)
      .forEach((variable) => optionsSet.add(variable.value));
  });

  return Array.from(optionsSet).map((value) => ({ value, type: typeof value }));
};

export const parsePropertyName = (field: string): string => {
  const match = field.match(/\[.*?\]\.(.+)$/);
  return match ? match[1] : field;
};

export const parseSchemaTemplate = (template: string) => {
  if (!template) return null;
  const match = template.match(/(\w+)\[\{(.*)\}\]/);
  if (!match) {
    return null;
  }

  const arrayName = match[1];
  const properties = match[2].split(",").map((prop) => prop.trim());

  const objectTemplate: { [key: string]: any } = {};
  properties.forEach((prop) => {
    const [propertyName, propertyType] = prop.split(":");
    switch (propertyType.toLowerCase()) {
      case "string":
        objectTemplate[propertyName] = "";
        break;
      case "boolean":
        objectTemplate[propertyName] = false;
        break;
      case "number":
        objectTemplate[propertyName] = 0;
        break;
      default:
        objectTemplate[propertyName] = undefined;
        break;
    }
  });

  return { arrayName, objectTemplate };
};

export default function InputStyler(
  value: any,
  field: string,
  editable: boolean,
  scenarios: Scenario[] = [],
  rawData: rawDataProps | null | undefined,
  setRawData: any,
  ruleProperties: any,
  range?: boolean
) {
  const updateFieldValue = (field: string, value: any) => {
    const updatedData = { ...rawData, [field]: value };
    if (typeof setRawData === "function") {
      setRawData(updatedData);
    } else {
      logError("setRawData is not a function or is undefined");
    }
  };

  const handleValueChange = (value: any, field: string, rangeType?: "minValue" | "maxValue") => {
    let queryValue: any = value;
    if (typeof value === "string") {
      if (value === "") queryValue = "";
      else if (value.toLowerCase() === "true") queryValue = true;
      else if (value.toLowerCase() === "false") queryValue = false;
      else if (!isNaN(Number(value))) queryValue = Number(value);
    }

    if (range && rangeType) {
      const currentValue =
        typeof rawData?.[field] === "object" ? { ...rawData[field] } : { minValue: null, maxValue: null };
      currentValue[rangeType] = queryValue;
      updateFieldValue(field, currentValue);
    } else {
      updateFieldValue(field, queryValue);
    }
  };

  const handleInputChange = (value: any, field: string, rangeType?: "minValue" | "maxValue") => {
    if (range && rangeType) {
      const currentValue = rawData?.[field] || {};
      if (value === null || value === undefined) {
        delete currentValue[rangeType];
        updateFieldValue(field, Object.keys(currentValue).length === 0 ? undefined : currentValue);
      } else {
        currentValue[rangeType] = value;
        updateFieldValue(field, currentValue);
      }
    } else {
      updateFieldValue(field, value);
    }
  };

  const handleClear = (field: any, rangeType?: "minValue" | "maxValue") => {
    const inputElement = document.getElementById(rangeType ? `${field}-${rangeType}` : field) as any;

    if (inputElement) {
      inputElement.value = null;
      inputElement.dispatchEvent(new Event("input", { bubbles: true }));
    }

    if (range && rangeType) {
      const currentValue = { ...rawData?.[field] };
      delete currentValue[rangeType];
      updateFieldValue(field, Object.keys(currentValue).length === 0 ? undefined : currentValue);
    } else {
      updateFieldValue(field, undefined);
    }
  };

  const valuesArray = getAutoCompleteOptions(field, scenarios);
  let type = typeof value;
  if (valuesArray.length > 0) {
    type = typeof valuesArray[0].value;
  }

  if (editable) {
    const validationRules = getFieldValidation(
      ruleProperties?.validationCriteria,
      ruleProperties?.validationType,
      ruleProperties?.type ?? ruleProperties?.dataType
    );
    if (ruleProperties?.type === "object-array" && ruleProperties?.childFields?.length > 0) {
      return (
        <ObjectArrayInput
          show={true}
          value={value || []}
          field={field}
          ruleProperties={ruleProperties}
          handleInputChange={handleInputChange}
          scenarios={scenarios}
          rawData={rawData}
        />
      );
    }
    switch (validationRules?.type) {
      case "true-false":
        return (
          <BooleanInput
            show={validationRules?.type === "true-false"}
            value={value}
            field={field}
            handleInputChange={handleInputChange}
          />
        );
      case "select":
        return (
          <SelectInput
            show={validationRules?.type === "select"}
            value={value}
            field={field}
            options={validationRules?.options}
            handleInputChange={handleInputChange}
          />
        );
      case "multiselect":
        return (
          <SelectInput
            show={validationRules?.type === "multiselect"}
            value={value}
            field={field}
            options={validationRules?.options}
            handleInputChange={handleInputChange}
            multiple
          />
        );
      case "text":
        return (
          <TextInput
            show={validationRules?.type === "text"}
            value={value}
            field={field}
            valuesArray={valuesArray}
            handleValueChange={handleValueChange}
            handleInputChange={handleInputChange}
            handleClear={handleClear}
          />
        );
      case "number":
        return (
          <Flex gap="small" align="center" justify="space-between">
            <Flex gap="small" vertical>
              {range && <label>Minimum</label>}
              <NumberInput
                show={validationRules?.type === "number"}
                value={range ? value?.minValue ?? null : value}
                field={field}
                maximum={validationRules?.range ? validationRules?.range.max : validationRules?.max}
                minimum={validationRules?.range ? validationRules?.range.min : validationRules?.min}
                handleValueChange={(val: any) => handleValueChange(val, field, range ? "minValue" : undefined)}
                handleInputChange={(val: any) => handleInputChange(val, field, range ? "minValue" : undefined)}
              />
            </Flex>
            {range && (
              <Flex gap="small" vertical>
                <label>Maximum</label>
                <NumberInput
                  show={validationRules?.type === "number"}
                  value={value?.maxValue ?? null}
                  field={field}
                  maximum={validationRules?.range ? validationRules?.range.max : validationRules?.max}
                  minimum={validationRules?.range ? validationRules?.range.min : validationRules?.min}
                  handleValueChange={(val: any) => handleValueChange(val, field, "maxValue")}
                  handleInputChange={(val: any) => handleInputChange(val, field, "maxValue")}
                />
              </Flex>
            )}
          </Flex>
        );
      case "date":
        return (
          <Flex gap="small" align="center" justify="space-between">
            <Flex gap="small" vertical>
              {range && <label>Minimum</label>}
              <DateInput
                show={validationRules?.type === "date"}
                value={range ? value?.minValue ?? null : value}
                field={field}
                maximum={validationRules?.range ? validationRules?.range.max : validationRules?.max}
                minimum={validationRules?.range ? validationRules?.range.min : validationRules?.min}
                handleInputChange={(val: any) => handleInputChange(val, field, range ? "minValue" : undefined)}
                handleClear={() => handleClear(field, range ? "minValue" : undefined)}
              />
            </Flex>
            {range && (
              <Flex gap="small" vertical>
                <label>Maximum</label>
                <DateInput
                  show={validationRules?.type === "date"}
                  value={value?.maxValue ?? null}
                  field={field}
                  maximum={validationRules?.range ? validationRules?.range.max : validationRules?.max}
                  minimum={validationRules?.range ? validationRules?.range.min : validationRules?.min}
                  handleInputChange={(val: any) => handleInputChange(val, field, "maxValue")}
                  handleClear={() => handleClear(field, "maxValue")}
                />
              </Flex>
            )}
          </Flex>
        );
      default:
        return (
          <DefaultInput
            show={value === null || value === undefined}
            field={field}
            handleValueChange={handleValueChange}
          />
        );
    }
  } else {
    //Check if all the items in an array are objects. If not, display as a string
    // This is used to specifically generate the multiselect values without rendering nested objects
    const allObjects = Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null);
    if (Array.isArray(value) && !allObjects) {
      const stringValue = value.filter((item) => typeof item !== "object" || item === null).join(", ");
      return <ReadOnlyStringDisplay show value={stringValue} />;
    }

    return (
      <>
        <ReadOnlyArrayDisplay
          show={Array.isArray(value)}
          value={value}
          field={field}
          scenarios={scenarios}
          rawData={rawData}
          setRawData={setRawData}
          ruleProperties={ruleProperties}
        />
        <ReadOnlyBooleanDisplay show={type === "boolean" || typeof value === "boolean"} value={value} />
        <ReadOnlyStringDisplay show={type === "string" || typeof value === "string"} value={value} />
        <ReadOnlyNumberDisplay show={type === "number" || typeof value === "number"} value={value} field={field} />
      </>
    );
  }
}
