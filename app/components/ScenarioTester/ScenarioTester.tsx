import { useState, useEffect } from "react";
import { Table, Tag, Button, TableProps, Flex, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import styles from "./ScenarioTester.module.css";
import { runDecisionsForScenarios, uploadCSVAndProcess } from "@/app/utils/api";

interface ScenarioTesterProps {
  jsonFile: string;
  uploader?: boolean;
}

export default function ScenarioTester({ jsonFile, uploader }: ScenarioTesterProps) {
  const [scenarioResults, setScenarioResults] = useState<any | null>({});
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState(false);

  type DataType = {
    key: string;
    name: string;
    [key: string]: any;
  };

  const formatData = (
    data: Record<string, { inputs: Record<string, any>; outputs: Record<string, any> }>
  ): { formattedData: DataType[]; columns: TableProps<DataType>["columns"] } => {
    const uniqueInputKeys = new Set<string>();
    const uniqueOutputKeys = new Set<string>();

    // Collect unique input and output keys
    for (const entry of Object.values(data)) {
      Object.keys(entry.inputs).forEach((key) => uniqueInputKeys.add(key));
      Object.keys(entry.outputs).forEach((key) => uniqueOutputKeys.add(key));
    }

    const sortKeys = (keys: string[]) => keys.sort((a, b) => a.localeCompare(b));

    // Convert sets to arrays for easier iteration
    const inputKeys = sortKeys(Array.from(uniqueInputKeys));
    const outputKeys = sortKeys(Array.from(uniqueOutputKeys));

    const applyConditionalStyling = (value: any, property: string): React.ReactNode => {
      // Handle null or undefined values
      if (value === null || value === undefined) {
        return null;
      }

      // Handle booleans
      if (typeof value === "boolean") {
        return value ? <Tag color="green">TRUE</Tag> : <Tag color="red">FALSE</Tag>;
      }

      // Handle numbers with "amount" in the property name
      let displayValue = value;
      if (typeof value === "number" && property.toLowerCase().includes("amount")) {
        displayValue = `$${value}`;
      } else if (typeof value === "number") {
        displayValue = <Tag color="blue">{value}</Tag>;
      }

      // Default formatting for other values
      return <b>{displayValue}</b>;
    };

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
      outputKeys.forEach((key) => {
        formattedEntry[`output_${key}`] =
          entry.outputs[key] !== undefined ? applyConditionalStyling(entry.outputs[key], key) : null;
      });

      return formattedEntry;
    });

    const generateColumns = (keys: string[], prefix: string) => {
      return keys.map((key) => ({
        title: key,
        dataIndex: `${prefix.toLowerCase()}_${key}`,
        key: `${prefix.toLowerCase()}_${key}`,
        render: (value: any) => applyConditionalStyling(value, key),
      }));
    };

    const inputColumns = generateColumns(inputKeys, "input");
    const outputColumns = generateColumns(outputKeys, "output");

    const columns: TableProps<DataType>["columns"] = [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: (text) => <a>{text}</a>,
        fixed: "left",
      },
      {
        title: "Inputs",
        children: inputColumns,
      },
      {
        title: "Outputs",
        children: outputColumns,
      },
    ];

    return { formattedData, columns };
  };

  const updateScenarioResults = async (goRulesJSONFilename: string) => {
    try {
      const results = await runDecisionsForScenarios(goRulesJSONFilename);
      const formattedResults = formatData(results);
      setScenarioResults(formattedResults);
    } catch (error) {
      console.error("Error fetching scenario results:", error);
    }
  };

  useEffect(() => {
    updateScenarioResults(jsonFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonFile]);

  const handleUpload = (info: any) => {
    setFile(info.file.originFileObj);
    message.success(`${info.file.name} file uploaded successfully.`);
    console.log("File uploaded:", info.file.originFileObj);
  };

  const handleRunUploadScenarios = async () => {
    if (!file) {
      message.error("No file uploaded.");
      return;
    }

    try {
      console.log("Uploading file");
      const csvContent = await uploadCSVAndProcess(file, jsonFile);
      message.success("Scenarios processed successfully.");
      console.log("Processed CSV content:", csvContent);
    } catch (error) {
      message.error("Error processing scenarios.");
      console.error("Error:", error);
    }
  };

  return (
    <div>
      {uploader ? (
        <Flex gap={"small"}>
          <a href={`/api/scenario/evaluation/${encodeURIComponent(jsonFile)}`}>Download Scenarios</a>
          <Upload
            accept="csv"
            multiple={false}
            maxCount={1}
            customRequest={({ file, onSuccess }) => {
              setFile(file as File);
              message.success(`${(file as File).name} file uploaded successfully.`);
              onSuccess && onSuccess("ok");
              setUploadedFile(true);
            }}
            onRemove={() => {
              setFile(null);
              setUploadedFile(false);
            }}
            showUploadList={true}
          >
            <Button size="large" type="primary" icon={<UploadOutlined />}>
              Upload Scenarios
            </Button>
          </Upload>
          <Button
            disabled={!uploadedFile}
            size="large"
            type="primary"
            onClick={handleRunUploadScenarios}
            style={{ marginLeft: "10px" }}
          >
            Run Upload Scenarios
          </Button>
        </Flex>
      ) : (
        <>
          <Flex gap={"small"} justify="space-between">
            <Button onClick={() => updateScenarioResults(jsonFile)} size="large" type="primary">
              Run Scenarios
            </Button>
          </Flex>
          <Flex gap="small" vertical>
            <Table
              pagination={{ hideOnSinglePage: true }}
              bordered
              dataSource={scenarioResults.formattedData}
              columns={scenarioResults.columns}
            />
          </Flex>
        </>
      )}
    </div>
  );
}