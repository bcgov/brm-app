import { useState, useEffect } from "react";
import { Table, Tag, Input, Button, Radio, AutoComplete, InputNumber, Flex } from "antd";
import { Scenario } from "@/app/types/scenario";
import styles from "./ScenarioFormatter.module.css";
import { RuleMap } from "@/app/types/rulemap";

const COLUMNS = [
  {
    title: "Property",
    dataIndex: "property",
    key: "property",
  },
  {
    title: "Value",
    dataIndex: "value",
    key: "value",
  },
];

const PROPERTIES_TO_IGNORE = ["submit", "lateEntry", "rulemap"];

interface rawDataProps {
  rulemap?: boolean;
}

interface ScenarioFormatterProps {
  title: string;
  rawData: rawDataProps | null | undefined;
  setRawData?: (data: object) => void;
  scenarios?: Scenario[];
  rulemap: RuleMap;
}

export default function ScenarioFormatter({ title, rawData, setRawData, scenarios, rulemap }: ScenarioFormatterProps) {
  const [dataSource, setDataSource] = useState<object[]>([]);
  const [columns, setColumns] = useState(COLUMNS);
  const [showTable, setShowTable] = useState(true);

  const toggleTableVisibility = () => {
    setShowTable(!showTable);
  };

  const getAutoCompleteOptions = (property: string) => {
    if (!scenarios) return [];
    const optionsSet = new Set<string>();

    scenarios.forEach((scenario) => {
      scenario.variables
        .filter((variable) => variable.name === property)
        .forEach((variable) => optionsSet.add(variable.value));
    });

    return Array.from(optionsSet).map((value) => ({ value, type: typeof value }));
  };

  const convertAndStyleValue = (value: any, property: string, editable: boolean) => {
    const valuesArray = getAutoCompleteOptions(property);
    let type = typeof value;
    if (getAutoCompleteOptions(property).length > 0) {
      type = typeof valuesArray[0].value;
    }

    if (editable) {
      if (type === "boolean" || typeof value === "boolean") {
        return (
          <Flex gap={"small"} align="center" vertical>
            <label className="labelsmall">
              <Radio.Group onChange={(e) => handleInputChange(e.target.value, property)} value={value}>
                <Radio value={true}>Yes</Radio>
                <Radio value={false}>No</Radio>
              </Radio.Group>
              <span className="label-text">{property}</span>
            </label>
          </Flex>
        );
      }

      if (type === "string" || typeof value === "string") {
        return (
          <>
            <label className="labelsmall">
              <AutoComplete
                options={valuesArray}
                defaultValue={value}
                onBlur={(e) => handleValueChange((e.target as HTMLInputElement).value, property)}
                style={{ width: 200 }}
                onChange={(val) => handleInputChange(val, property)}
              />
              <span className="label-text">{property}</span>
            </label>
          </>
        );
      }

      if (type === "number" || typeof value === "number") {
        return (
          <>
            <label className="labelsmall">
              <InputNumber
                value={value}
                onBlur={(e) => handleValueChange(e.target.value, property)}
                onChange={(val) => handleInputChange(val, property)}
              />
              <span className="label-text">{property}</span>
            </label>
          </>
        );
      }

      if (value === null || value === undefined) {
        return (
          <>
            <label className="labelsmall">
              <Input onBlur={(e) => handleValueChange(e.target.value, property)} />
              <span className="label-text">{property}</span>
            </label>
          </>
        );
      }
    } else {
      if (type === "boolean" || typeof value === "boolean") {
        return (
          <Radio.Group onChange={() => null} value={value}>
            <Radio value={true}>Yes</Radio>
            <Radio value={false}>No</Radio>
          </Radio.Group>
        );
      }

      if (type === "string" || typeof value === "string") {
        return <Tag color="blue">{value}</Tag>;
      }

      if (type === "number" || typeof value === "number") {
        if (property.toLowerCase().includes("amount")) {
          return <Tag color="green">${value}</Tag>;
        } else {
          return <Tag color="blue">{value}</Tag>;
        }
      }

      if (value === null || value === undefined) {
        return null;
      }
    }

    return <b>{value}</b>;
  };

  const handleValueChange = (value: any, property: string) => {
    let queryValue: any = value;
    if (typeof value === "string") {
      if (value.toLowerCase() === "true") {
        queryValue = true;
      } else if (value.toLowerCase() === "false") {
        queryValue = false;
      } else if (!isNaN(Number(value))) {
        queryValue = Number(value);
      }
    }

    const updatedData = { ...rawData, [property]: queryValue } || {};

    if (typeof setRawData === "function") {
      setRawData(updatedData);
    } else {
      console.error("setRawData is not a function or is undefined");
    }
  };

  const handleInputChange = (val: any, property: string) => {
    const updatedData = { ...rawData, [property]: val };
    if (typeof setRawData === "function") {
      setRawData(updatedData);
    }
  };

  const showColumn = (data: any[], columnKey: string) => {
    return data.some((item) => item[columnKey] !== null && item[columnKey] !== undefined);
  };

  useEffect(() => {
    if (rawData) {
      const editable = title === "Inputs" && rawData.rulemap === true;
      const propertyRuleMap = Object.values(rulemap || {}).flat();
      const newData = Object.entries(rawData)
        .filter(([property]) => !PROPERTIES_TO_IGNORE.includes(property))
        .sort(([propertyA], [propertyB]) => propertyA.localeCompare(propertyB))
        .map(([property, value], index) => ({
          property: propertyRuleMap?.find((item) => item.property === property)?.name || property,
          value: convertAndStyleValue(value, property, editable),
          key: index,
        }));
      // Check if data.result is an array
      if (Array.isArray(rawData)) {
        throw new Error("Please update your rule and ensure that outputs are on one line.");
      }
      setDataSource(newData);
      const newColumns = COLUMNS.filter((column) => showColumn(newData, column.dataIndex));
      setColumns(newColumns);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData]);

  return (
    <div>
      <h4 className={styles.tableTitle}>
        {title} {title === "Outputs" && <Button onClick={toggleTableVisibility}>{showTable ? "Hide" : "Show"}</Button>}
      </h4>
      {showTable && (
        <>
          <Table columns={columns} showHeader={false} dataSource={dataSource} pagination={{ hideOnSinglePage: true }} />
        </>
      )}
    </div>
  );
}