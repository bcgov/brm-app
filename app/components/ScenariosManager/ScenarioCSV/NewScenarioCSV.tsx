import { useState, useEffect } from "react";
import { App, Modal, Button, Flex, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { DecisionGraphType } from "@gorules/jdm-editor";
import { logError } from "@/app/utils/logger";
import { getCSVForRuleRun } from "@/app/utils/api";
import styles from "./NewScenarioCSV.module.css";

interface NewScenarioCSVProps {
  openNewCSVModal: boolean;
  jsonFile: string;
  ruleContent?: DecisionGraphType;
  confirmAddingNewCSVFile: (file: File) => void;
  cancelAddingCSVFile: () => void;
  runCSVScenarios: (fileToRun: File | null, filename: string) => void;
  existingFilenames: string[];
}

export default function NewScenarioCSV({
  openNewCSVModal,
  jsonFile,
  ruleContent,
  confirmAddingNewCSVFile,
  cancelAddingCSVFile,
  runCSVScenarios,
  existingFilenames,
}: NewScenarioCSVProps) {
  const { message } = App.useApp();

  const [file, setFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<boolean>(false);

  const handleDownloadScenarios = async () => {
    try {
      const csvContent = await getCSVForRuleRun(jsonFile, ruleContent);
      message.success(`Scenario Testing Template: ${csvContent}`);
    } catch (error: unknown) {
      message.error("Error downloading scenarios.");
      logError("Error downloading scenarios:", error instanceof Error ? error : "Unknown error occurred.");
    }
  };

  const deleteCurrentCSV = () => {
    setFile(null);
    setUploadedFile(false);
  };

  const handleOk = () => {
    file && confirmAddingNewCSVFile(file);
  };

  const handleCancel = () => {
    cancelAddingCSVFile();
  };

  useEffect(() => {
    if (openNewCSVModal) {
      deleteCurrentCSV();
    }
  }, [openNewCSVModal]);

  return (
    <Modal
      title="Create new CSV test file"
      open={openNewCSVModal}
      onOk={handleOk}
      onCancel={handleCancel}
      footer={[
        <Button key="back" onClick={handleCancel}>
          Return
        </Button>,
        <Button key="ok" type="primary" onClick={handleOk} disabled={file == null}>
          Add to table list
        </Button>,
      ]}
    >
      <Flex gap="small">
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
                customRequest={({ file, onSuccess, onError }) => {
                  const fileName = (file as File).name;
                  if (!existingFilenames.includes(fileName)) {
                    setFile(file as File);
                    message.success(`${fileName} file uploaded successfully.`);
                    onSuccess && onSuccess("ok");
                    setUploadedFile(true);
                  } else {
                    message.error("File name already exists");
                    onError && onError(new Error("File name already exists"));
                  }
                }}
                onRemove={deleteCurrentCSV}
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
            Run the uploaded scenarios against the rule (Optional):{" "}
            <Button
              disabled={!uploadedFile}
              size="large"
              type="primary"
              onClick={() => runCSVScenarios(file, file?.name || "local-tests.csv")}
              className={styles.runButton}
            >
              Run Upload Scenarios
            </Button>
          </li>
        </ol>
      </Flex>
    </Modal>
  );
}
