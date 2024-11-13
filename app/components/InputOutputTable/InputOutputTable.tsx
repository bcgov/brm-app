import { useState, useEffect, FocusEvent } from "react";
import { Table, Tag, Input, Button, Tooltip, Flex } from "antd";
import { MinusCircleOutlined } from "@ant-design/icons";
import { RuleMap } from "@/app/types/rulemap";
import styles from "./InputOutputTable.module.css";
import { dollarFormat } from "@/app/utils/utils";
import { logError } from "@/app/utils/logger";
import FieldStyler from "../InputStyler/subcomponents/FieldStyler";

const COLUMNS = [
  {
    title: "Field",
    dataIndex: "field",
    key: "field",
  },
  {
    title: "Value",
    dataIndex: "value",
    key: "value",
  },
];

const PROPERTIES_TO_IGNORE = ["submit", "lateEntry", "rulemap"];

interface rawDataProps {
  [key: string]: any;
}

interface InputOutputTableProps {
  title: string;
  rawData: rawDataProps | null | undefined;
  setRawData?: (data: rawDataProps) => void;
  submitButtonRef?: React.RefObject<HTMLButtonElement>;
  editable?: boolean;
  rulemap?: RuleMap;
}

export default function InputOutputTable({
  title,
  rawData,
  setRawData,
  submitButtonRef,
  editable = false,
  rulemap,
}: InputOutputTableProps) {
  const [dataSource, setDataSource] = useState<object[]>([]);
  const [columns, setColumns] = useState(COLUMNS);
  const [showTable, setShowTable] = useState(true);

  const toggleTableVisibility = () => {
    setShowTable(!showTable);
  };

  const updateRawData = (field: string, value: any, setRawData: Function | undefined) => {
    const updatedData = { ...rawData, [field]: value };
    if (typeof setRawData === "function") {
      setRawData(updatedData);
    } else {
      logError("setRawData is not a function or is undefined");
    }
  };

  const parseValue = (newValue: string | null): any => {
    if (newValue?.toLowerCase() === "true") return true;
    if (newValue?.toLowerCase() === "false") return false;
    if (newValue && !isNaN(Number(newValue))) return Number(newValue);
    return newValue;
  };

  const updateFieldValue = (field: string, value: string | null) => {
    updateRawData(field, value, setRawData);
  };

  const handleClear = (field: string) => {
    updateFieldValue(field, null);
  };

  const convertAndStyleValue = (value: any, field: string, editable: boolean) => {
    if (editable) {
      return (
        <label className="labelsmall">
          <Flex gap={"small"} align="center">
            <Input
              id={field}
              value={value ?? null}
              onChange={(e) => handleInputChange(e, field)}
              defaultValue={value ?? ""}
              onBlur={(e) => handleValueChange(e, field)}
              onKeyDown={(e) => handleKeyDown(e)}
            />
            <Tooltip title="Clear value">
              <Button
                type="dashed"
                icon={<MinusCircleOutlined />}
                size="small"
                shape="circle"
                onClick={() => handleClear(field)}
              />
            </Tooltip>
          </Flex>
          <span className="label-text">{field}</span>
        </label>
      );
    }

    if (typeof value === "boolean") {
      return value ? <Tag color="green">TRUE</Tag> : <Tag color="red">FALSE</Tag>;
    }

    if (typeof value === "number" && field.toLowerCase().includes("amount")) {
      const formattedValue = dollarFormat(value);
      return <Tag color="green">${formattedValue}</Tag>;
    }

    return <b>{value}</b>;
  };

  const handleValueChange = (
    e: FocusEvent<HTMLInputElement, Element> | React.ChangeEvent<HTMLInputElement> | null,
    field: string
  ) => {
    const newValue = e?.target?.value || null;
    const queryValue = parseValue(newValue);
    updateFieldValue(field, queryValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | null, field: string) => {
    const newValue = e?.target?.value || "";
    updateFieldValue(field, newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && submitButtonRef) {
      if (submitButtonRef.current) {
        submitButtonRef.current.click();
      }
    }
  };

  useEffect(() => {
    if (rawData) {
      const propertyRuleMap = Object.values(rulemap || {}).flat();
      const newData = Object.entries(rawData)
        .filter(([field]) => !PROPERTIES_TO_IGNORE.includes(field))
        .sort(([propertyA], [propertyB]) => propertyA.localeCompare(propertyB))
        .map(([field, value], index) => {
          const propertyRule = propertyRuleMap?.find((item) => item.field === field);
          return {
            field: FieldStyler(
              propertyRule?.name ? propertyRule : { name: field, description: propertyRule?.description }
            ),
            value: convertAndStyleValue(value, field, editable),
            key: index,
          };
        });
      setDataSource(newData);
      const newColumns = COLUMNS.filter((column) => showColumn(newData, column.dataIndex));
      setColumns(newColumns);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData]);

  const showColumn = (data: any[], columnKey: string) => {
    return data.some((item) => item[columnKey] !== null && item[columnKey] !== undefined);
  };

  return (
    <div>
      <h4 className={styles.tableTitle}>
        {title} {title === "Outputs" && <Button onClick={toggleTableVisibility}>{showTable ? "Hide" : "Show"}</Button>}
      </h4>
      {showTable && (
        <Table
          columns={columns}
          showHeader={false}
          dataSource={dataSource}
          bordered
          pagination={{ hideOnSinglePage: true }}
        />
      )}
    </div>
  );
}
