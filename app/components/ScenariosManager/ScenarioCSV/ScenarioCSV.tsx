import { useState } from "react";
import { Button, Flex, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { DecisionGraphType } from "@gorules/jdm-editor";
import { logError } from "@/app/utils/logger";
import { uploadCSVAndProcess, getCSVForRuleRun } from "@/app/utils/api";
import styles from "./ScenarioCSV.module.css";

interface ScenarioCSVProps {
  jsonFile: string;
  ruleContent?: DecisionGraphType;
}

export default function ScenarioCSV({ jsonFile, ruleContent }: ScenarioCSVProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState(false);

  const handleRunUploadScenarios = async () => {
    if (!file) {
      message.error("No file uploaded.");
      return;
    }
    try {
      const csvContent = await uploadCSVAndProcess(file, jsonFile, ruleContent);
      message.success(`Scenarios Test: ${csvContent}`);
    } catch (error: any) {
      message.error("Error processing scenarios.");
      logError("Error:", error);
    }
  };

  const handleDownloadScenarios = async () => {
    try {
      const csvContent = await getCSVForRuleRun(jsonFile, ruleContent);
      message.success(`Scenario Testing Template: ${csvContent}`);
    } catch (error: any) {
      message.error("Error downloading scenarios.");
      logError("Error:", error);
    }
  };

  return (
    <div>
      <Flex gap={"small"}>
        <ol className={styles.instructionsList}>
          <li>
            Download a template CSV file:{" "}
            <Button onClick={handleDownloadScenarios} size="large" type="primary">
              Generate Scenarios/Template
            </Button>
          </li>
          <li>Add additional scenarios to the CSV file</li>
          <li>
            Upload your edited CSV file with scenarios:{" "}
            <label className="labelsmall">
              <Upload
                accept=".csv"
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
                className={styles.upload}
              >
                <Button size="large" type="primary" icon={<UploadOutlined />}>
                  Upload Scenarios
                </Button>
              </Upload>
              {!file ? `Select file for upload.` : `File Selected.`}
            </label>
          </li>
          <li>
            Run the scenarios against the GO Rules JSON file:{" "}
            <Button
              disabled={!uploadedFile}
              size="large"
              type="primary"
              onClick={handleRunUploadScenarios}
              className="styles.runButton"
            >
              Run Upload Scenarios
            </Button>
          </li>
          <li>Receive a csv file with the results! 🎉</li>
        </ol>
      </Flex>
    </div>
  );
}
