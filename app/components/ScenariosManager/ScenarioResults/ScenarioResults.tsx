import { useState, useEffect, useRef } from "react";
import { Table, Tag, Button, Flex, message, List, Space, Spin } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, RightCircleOutlined, DownCircleOutlined } from "@ant-design/icons";
import { DecisionGraphType } from "@gorules/jdm-editor";
import styles from "./ScenarioResults.module.css";
import { runDecisionsForScenarios } from "@/app/utils/api";
import { Scenario } from "@/app/types/scenario";
import useResponsiveSize from "@/app/hooks/ScreenSizeHandler";
import { dollarFormat } from "@/app/utils/utils";
interface ScenarioResultsProps {
  scenarios: Scenario[];
  jsonFile: string;
  ruleContent?: DecisionGraphType;
}

type DataType = {
  key: string;
  name: string;
  [key: string]: any;
};

type OnChange = NonNullable<TableProps<DataType>["onChange"]>;
type Filters = Parameters<OnChange>[1];

type GetSingle<T> = T extends (infer U)[] ? U : never;
type Sorts = GetSingle<Parameters<OnChange>[2]>;

export default function ScenarioResults({ scenarios, jsonFile, ruleContent }: ScenarioResultsProps) {
  const [scenarioResults, setScenarioResults] = useState<any | null>({});
  const [loadingResults, setLoadingResults] = useState<boolean>(false);
  const [finalResults, setFinalResults] = useState<any | null>({});
  const [filteredInfo, setFilteredInfo] = useState<Filters>({});
  const [sortedInfo, setSortedInfo] = useState<Sorts>({});
  const hasError = useRef(false);
  const { isMobile, isTablet } = useResponsiveSize();

  const styleArray = (arr: any[]): string | number => {
    const allObjects = arr.every((item) => typeof item === "object" && item !== null);
    if (allObjects) {
      return arr.length;
    } else {
      return arr.filter((item) => typeof item !== "object" || item === null).join(", ");
    }
  };

  const applyConditionalStyling = (value: any, field: string): React.ReactNode => {
    if (value === null || value === undefined) {
      return null;
    }

    if (Array.isArray(value)) {
      return styleArray(value);
    }

    if (typeof value === "boolean" && field === "resultMatch") {
      return value ? (
        <span className="result-match">
          <Tag color="success" icon={<CheckCircleOutlined />}></Tag>
        </span>
      ) : (
        <span className="result-mismatch">
          <Tag color="error" icon={<CloseCircleOutlined />}></Tag>
        </span>
      );
    } else if (typeof value === "boolean") {
      return value ? <Tag color="green">TRUE</Tag> : <Tag color="red">FALSE</Tag>;
    }

    // Handle numbers with "amount" in the field name
    let displayValue = value;
    if (typeof value === "number" && field.toLowerCase().includes("amount")) {
      displayValue = `$${dollarFormat(value)}`;
    } else if (typeof value === "number") {
      displayValue = <Tag color="blue">{value}</Tag>;
    }

    // Default formatting for other values
    return <b>{displayValue}</b>;
  };

  const getValue = (value: any): string => {
    if (typeof value === "object" && value !== null) {
      if (value?.props?.children !== undefined) {
        return getValue(value.props.children);
      }
      return "";
    }
    return value === 0 ? "0" : value == null ? "null" : String(value);
  };

  const getFilters = (key: string, prefix: string = "input") => {
    const lowerCasePrefix = prefix === "input" ? "inputs" : prefix.toLowerCase();

    const filterArray = Object.values(scenarioResults)
      .map((scenario: any) => scenario?.[lowerCasePrefix]?.[key])
      .filter((result) => result != null);

    const filterSet = Array.from(new Set(filterArray));

    const filters = filterSet.map((text) => ({
      text: typeof text === "boolean" ? (text ? "True" : "False") : text,
      value: text,
      key: text,
    }));

    filters.push({ text: "No Value", value: null, key: "null" });
    return filters;
  };

  const generateColumns = (keys: string[], prefix: string) => {
    return keys.map((key) => ({
      title: key,
      dataIndex: `${prefix.toLowerCase()}_${key}`,
      key: `${prefix.toLowerCase()}_${key}`,
      render: (value: any) => applyConditionalStyling(value, key),
      filteredValue: filteredInfo[`${prefix.toLowerCase()}_${key}`] || null,
      filters: getFilters(key, prefix).sort((a, b) => a.text - b.text),
      filterSearch: true,
      textWrap: "word-break",
      onFilter: (value: string | number | boolean | any, record: DataType) => {
        let recordValue = getValue(record[`${prefix.toLowerCase()}_${key}`]);
        if (key.toLowerCase().includes("amount")) {
          value = dollarFormat(parseFloat(value));
        }
        return recordValue.toLowerCase().includes(String(value).toLowerCase());
      },
      sorter: (a: DataType, b: DataType) => {
        const aValue = getValue(a[`${prefix.toLowerCase()}_${key}`]);
        const bValue = getValue(b[`${prefix.toLowerCase()}_${key}`]);
        const isNumericValue = (value: any) => !isNaN(parseFloat(value)) && isFinite(value);
        const isDollarValue = (value: any) => /^\$/.test(value);
        if (isDollarValue(aValue) && isDollarValue(bValue)) {
          return parseFloat(aValue.replace("$", "")) - parseFloat(bValue.replace("$", ""));
        }
        if (isNumericValue(aValue) && isNumericValue(bValue)) {
          return parseFloat(aValue) - parseFloat(bValue);
        }
        return aValue.localeCompare(bValue);
      },
      sortOrder: sortedInfo.columnKey === `${prefix.toLowerCase()}_${key}` ? sortedInfo.order : null,
    }));
  };

  const formatData = (
    data: Record<
      string,
      {
        result: Record<string, any>;
        inputs: Record<string, any>;
        outputs: Record<string, any>;
        expectedResults: Record<string, any>;
        resultMatch: boolean;
      }
    >
  ): { formattedData: DataType[]; columns: TableProps<DataType>["columns"] } => {
    const uniqueInputKeys = new Set<string>();
    const uniqueResultKeys = new Set<string>();
    const uniqueExpectedKeys = new Set<string>();

    // Collect unique input and result keys
    for (const entry of Object.values(data)) {
      Object.keys(entry.inputs).forEach((key) => uniqueInputKeys.add(key));
      Object.keys(entry.result).forEach((key) => uniqueResultKeys.add(key));
      Object.keys(entry.expectedResults).forEach((key) => uniqueExpectedKeys.add(key));
    }

    const sortKeys = (keys: string[]) => keys.sort((a, b) => a.localeCompare(b));

    // Convert sets to arrays for easier iteration
    const inputKeys = sortKeys(Array.from(uniqueInputKeys));
    const resultKeys = sortKeys(Array.from(uniqueResultKeys));
    const expectedKeys = sortKeys(Array.from(uniqueExpectedKeys));

    // Format the data
    const formattedData: DataType[] = Object.entries(data).map(([name, entry], index) => {
      const formattedEntry: DataType = {
        key: (index + 1).toString(),
        name,
      };

      // Add inputs
      inputKeys.forEach((key) => {
        formattedEntry[`input_${key}`] =
          entry.inputs[key] !== undefined ? applyConditionalStyling(entry.inputs[key], key) : null;
      });

      // Add outputs
      resultKeys.forEach((key) => {
        formattedEntry[`result_${key}`] =
          entry.result[key] !== undefined ? applyConditionalStyling(entry.result[key], key) : null;
      });

      // Add expected results
      expectedKeys.forEach((key) => {
        formattedEntry[`expected_result_${key}`] =
          entry.expectedResults[key] !== undefined ? applyConditionalStyling(entry.expectedResults[key], key) : null;
      });

      formattedEntry.resultMatch = applyConditionalStyling(entry.resultMatch, "resultMatch");

      return formattedEntry;
    });

    const inputColumns = generateColumns(inputKeys, "input");
    const outputColumns = generateColumns(resultKeys, "result");
    //Unused columns for now, unless we'd like to display the expected results as columns on the frontend
    const expectedColumns = generateColumns(expectedKeys, "expected_result");

    const columns: TableColumnsType<DataType> = [
      Table.EXPAND_COLUMN,
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: (text) => <a>{text}</a>,
        fixed: "left",
        width: "10%",
        sorter: isMobile || isTablet ? undefined : (a: DataType, b: DataType) => a.name.localeCompare(b.name),
        filteredValue: isMobile || isTablet ? undefined : filteredInfo.name || null,
        sortOrder: isMobile || isTablet ? undefined : sortedInfo.columnKey === "name" ? sortedInfo.order : undefined,
        filterSearch: true,
        onFilter: (value: any, record: DataType) => record.name.toLowerCase().includes(value.toLowerCase()),
        filters:
          isMobile || isTablet
            ? undefined
            : formattedData.map((scenario) => ({
                text: scenario.name,
                value: scenario.name,
              })),
      },
      {
        title: "Inputs",
        children: inputColumns,
        responsive: ["lg", "xl", "xxl"],
      },
      {
        title: "Results",
        children: outputColumns,
        responsive: ["lg", "xl", "xxl"],
      },
    ];

    return { formattedData, columns };
  };

  const expandedRowRender = (record: { name: string }, displayExpanded: boolean) => {
    const expandedData = Object.entries(record || {}).map(([field, value], index) => ({
      key: index.toString(),
      field,
      value,
    }));
    const filteredExpected = displayExpanded
      ? expandedData
      : expandedData.filter((entry) => entry.field.includes("expected_result"));

    const expandedDataColumns = filteredExpected.map((entry) => ({
      title: displayExpanded ? entry.field : entry.field.replace("expected_result_", ""),
      dataIndex: entry.field,
      key: entry.field,
      value: applyConditionalStyling(entry.value, entry.field),
    }));

    return (
      <div className={styles.expectedResultsExpanded}>
        <Flex gap="small" vertical>
          {!displayExpanded ? <span>Expected results for scenario: {record?.name}</span> : null}
          <List
            dataSource={expandedDataColumns}
            renderItem={(item) => (
              <>
                {item.title === "key" ? null : (
                  <List.Item>
                    <List.Item.Meta title={item.title} description={item.value} />
                  </List.Item>
                )}
              </>
            )}
          />
        </Flex>
      </div>
    );
  };

  const rowExpandable = (record: DataType) => {
    if (isMobile || isTablet) {
      return true;
    }
    const resultStatus = record.resultMatch.props.className === "result-mismatch" ? true : false;
    return resultStatus;
  };

  const updateScenarioResults = async (filepath: string) => {
    try {
      setLoadingResults(true);
      const results = await runDecisionsForScenarios(filepath, ruleContent);
      // Loop through object and check if data.result is an array
      for (const key in results) {
        if (Array.isArray(results[key].result)) {
          throw new Error(
            `Error with results for: ${key}. Please update your rule and ensure that outputs are on one line.`
          );
        }
      }
      setScenarioResults(results);
    } catch (error) {
      if (!hasError.current) {
        hasError.current = true;
        message.error("Error fetching scenario results: " + error);
      }
    } finally {
      setTimeout(() => setLoadingResults(false), 300);
    }
  };

  useEffect(() => {
    hasError.current = false;
    updateScenarioResults(jsonFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonFile, scenarios]);

  useEffect(() => {
    hasError.current = false;
    setFinalResults(formatData(scenarioResults));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioResults, filteredInfo, sortedInfo]);

  const handleChange: TableProps<DataType>["onChange"] = (pagination, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(Array.isArray(sorter) ? sorter[0] : sorter);
  };

  const clearAll = () => {
    setFilteredInfo({});
    setSortedInfo({
      columnKey: "",
      order: null,
    });
  };

  const showErrorScenarios = () => {
    updateScenarioResults(jsonFile);
    const filters = Object.keys(scenarioResults).filter((key) => !scenarioResults[key].resultMatch);
    const filterObject = { name: filters };
    setFilteredInfo(filterObject);
  };

  return (
    <div>
      <div className={styles.scenarioContainer}>
        <Space>
          <Flex gap={"small"} justify="space-between" align="center">
            <Button onClick={() => updateScenarioResults(jsonFile)} size="large" type="primary">
              Re-Run Scenarios
            </Button>
            {!isMobile && !isTablet && (
              <>
                <Button onClick={showErrorScenarios} type="dashed" danger>
                  Show Error Scenarios
                </Button>
                <Button onClick={clearAll}>Clear filters and sorters</Button>
              </>
            )}
          </Flex>
        </Space>
        <Flex gap="small" vertical>
          <Table
            pagination={{ hideOnSinglePage: true, size: "small", pageSize: 10 }}
            bordered
            dataSource={finalResults.formattedData}
            columns={finalResults.columns}
            expandable={{
              expandedRowRender: (record: any) => expandedRowRender(record, isMobile || isTablet),
              rowExpandable: (record: any) => rowExpandable(record),
              columnTitle: isMobile || isTablet ? "Expand Record" : "Status",
              columnWidth: "5%",
              fixed: "left",
              expandIcon: ({ expanded, onExpand, record }) =>
                record.resultMatch.props.className !== "result-mismatch" ? (
                  rowExpandable(record) ? (
                    <Button onClick={(e) => onExpand(record, e)} aria-label="view record" size="small" type="text">
                      <Tag color="success" icon={<CheckCircleOutlined />}>
                        {expanded ? <DownCircleOutlined /> : <RightCircleOutlined />}
                      </Tag>
                    </Button>
                  ) : (
                    <Tag color="success" icon={<CheckCircleOutlined />} />
                  )
                ) : (
                  <Button
                    onClick={(e) => onExpand(record, e)}
                    aria-label="view expected results"
                    size="small"
                    type="text"
                  >
                    <Tag color="error" icon={<CloseCircleOutlined />}>
                      {expanded ? <DownCircleOutlined /> : <RightCircleOutlined />}
                    </Tag>
                  </Button>
                ),
            }}
            loading={loadingResults}
            className={styles.scenarioTable}
            size="small"
            onChange={handleChange}
            tableLayout="auto"
          />
        </Flex>
      </div>
    </div>
  );
}
