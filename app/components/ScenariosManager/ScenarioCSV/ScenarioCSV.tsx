import { useState, useEffect } from "react";
import dayjs from "dayjs";
import axios from "axios";
import { App, Button, Flex, Spin, Table, TableProps } from "antd";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { DecisionGraphType } from "@gorules/jdm-editor";
import { logError } from "@/app/utils/logger";
import { RuleInfo } from "@/app/types/ruleInfo";
import { CSVRow, CSVRowData } from "@/app/types/csv";
import { RULE_VERSION } from "@/app/constants/ruleVersion";
import { uploadCSVAndProcess } from "@/app/utils/api";
import { getCSVTestFilesFromBranch, addCSVTestFileToReview, removeCSVTestFileFromReview } from "@/app/utils/githubApi";
import NewScenarioCSV from "./NewScenarioCSV";
import styles from "./ScenarioCSV.module.css";

interface ScenarioCSVProps {
  ruleInfo: RuleInfo;
  jsonFile: string;
  ruleContent?: DecisionGraphType;
  version: RULE_VERSION | boolean;
}

export default function ScenarioCSV({ ruleInfo, jsonFile, ruleContent, version }: ScenarioCSVProps) {
  const { message } = App.useApp();
  const [openNewCSVModal, setOpenNewCSVModal] = useState(false);
  const [isLoadingInTestFiles, setIsLoadingInTestFiles] = useState(true);
  const [githubCSVTestsData, setGithubCSVTestsData] = useState<CSVRowData[]>([]);
  const [localTestFiles, setLocalTestFiles] = useState<File[]>([]);
  const [csvTableData, setCSVTableData] = useState<CSVRow[]>([]);
  const [scenarioRunResults, setScenarioRunResults] = useState<Record<string, boolean>>({});
  const [currentlySelectedRows, setCurrentlySelectedRows] = useState<CSVRow[]>([]);

  // get info for adding the rule to a review (branch, etc.)
  const { filepath, reviewBranch } = ruleInfo;
  const canAddToReview = version === RULE_VERSION.inReview || (version === RULE_VERSION.draft && reviewBranch);
  const branchName = canAddToReview ? reviewBranch : version === RULE_VERSION.inDev ? "dev" : "main";

  /**
   * Create a new row for the table
   */
  const createRow = (fileRowData: CSVRowData, isLocal: boolean = false): CSVRow => {
    const { filename, downloadFile, lastUpdated, updatedBy } = fileRowData;
    return {
      key: filename,
      filename,
      downloadFile,
      lastUpdated,
      updatedBy,
      actions: (
        <Flex gap={8}>
          <Button onClick={() => runCSVScenarios(downloadFile, filename)}>Run Scenarios</Button>
          {canAddToReview &&
            (isLocal ? (
              <Button onClick={() => addCSVToReview(fileRowData)}>Add to Review</Button>
            ) : (
              <Button danger type="dashed" onClick={() => removeCSVFromReview(filename)}>
                Delete from Review
              </Button>
            ))}
          {isLocal && (
            <Button danger type="dashed" onClick={() => deleteLocalCSV(filename)}>
              Delete
            </Button>
          )}
        </Flex>
      ),
    };
  };

  /**
   * Select multiple rows to run bulk operations
   */
  const rowSelection: TableProps<any>["rowSelection"] = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: CSVRow[]) => {
      setCurrentlySelectedRows(selectedRows);
    },
  };

  /**
   * Run CSV Scenarios for a test file
   */
  const runCSVScenarios = async (fileToRun: File | string | null, filename: string) => {
    if (!fileToRun) {
      message.error("No file uploaded.");
      return;
    }
    try {
      if (typeof fileToRun === "string") {
        const response = await axios.get(fileToRun as string, {
          responseType: "blob", // Ensure the response is a Blob
        });
        const blob = response.data;
        fileToRun = new File([blob], filename, { type: blob.type });
      }
      if (!fileToRun || typeof fileToRun === "string") {
        throw new Error("Cannot get valid file");
      }
      // Process it
      const { successMessage, allTestsPassed } = await uploadCSVAndProcess(fileToRun, jsonFile, ruleContent);
      // Update run result value in the table
      setScenarioRunResults((prevValues) => {
        const updatedValues = { ...prevValues };
        updatedValues[filename] = allTestsPassed;
        return updatedValues;
      });
      message.success(`Scenarios Test: ${successMessage}`);
    } catch (error: any) {
      message.error("Error processing scenarios");
      logError("Error processing scenarios:", error);
    }
  };

  /**
   * Run all scenarios for selected CSV test files
   */
  const runAllSelectedCSVScenarios = () => {
    currentlySelectedRows.forEach(({ downloadFile, filename }) => {
      runCSVScenarios(downloadFile, filename);
    });
  };

  /**
   * Upload to GitHub review
   */
  const addCSVToReview = (fileRowData: CSVRowData) => {
    try {
      if (!branchName) {
        throw new Error("No branch name exists");
      }
      const { filename, downloadFile } = fileRowData;
      if (!(downloadFile instanceof File)) {
        throw new Error("No local file to add to review");
      }
      const csvPathName = filepath.replace(".json", `/${filename}` || ""); // Get csv path name from json file name
      const reader = new FileReader(); // Use FileReader to encode file to base64
      reader.onload = async () => {
        const base64Content = reader.result?.toString().split(",")[1];
        if (base64Content) {
          await addCSVTestFileToReview(base64Content, branchName, csvPathName);
          setGithubCSVTestsData([...githubCSVTestsData, fileRowData]);
          deleteLocalCSV(filename);
        } else {
          throw new Error("Failed to encode file to base64");
        }
      };
      reader.onerror = () => {
        throw new Error("Error reading file");
      };
      if (downloadFile) {
        reader.readAsDataURL(downloadFile);
      }
    } catch (error: any) {
      message.error("Error adding CSV to review");
      console.error("Error adding CSV to review:", error);
    }
  };

  /**
   * Remove from GitHub review
   */
  const removeCSVFromReview = async (filenameToRemove: string) => {
    try {
      if (!branchName) {
        throw new Error("No branch name exists");
      }
      const csvPathName = filepath.replace(/[^/]+$/, filenameToRemove);
      await removeCSVTestFileFromReview(branchName, csvPathName);
      const githubFilesWithoutRemovedOne = githubCSVTestsData.filter(({ filename }) => filenameToRemove != filename);
      setGithubCSVTestsData(githubFilesWithoutRemovedOne);
      message.success("CSV removed from review");
    } catch (error: any) {
      message.error("Error removing CSV from review");
      console.error("Error removing CSV from review:", error);
    }
  };

  /**
   * Delete CSV test file or remove it from review
   */
  const deleteLocalCSV = (filenameToRemove: string) => {
    const localFilesWithoutRemovedOne = localTestFiles.filter(({ name }) => name != filenameToRemove);
    setLocalTestFiles(localFilesWithoutRemovedOne);
  };

  /**
   * Add test file from New modal
   */
  const confirmAddingNewCSVFile = (file: File) => {
    setLocalTestFiles([...localTestFiles, file]);
    setOpenNewCSVModal(false);
  };

  /**
   * Gets scenario test files from GitHub
   */
  useEffect(() => {
    const getGithubCSVTestFiles = async () => {
      try {
        const testFiles: CSVRowData[] = await getCSVTestFilesFromBranch(
          branchName || "main",
          `tests/${filepath.replace(".json", "")}`
        );
        setGithubCSVTestsData(testFiles);
        setIsLoadingInTestFiles(false);
      } catch (error: any) {
        message.error("Error getting CSV test files from Github");
        console.error("Error getting CSV test files from Github:", error);
      }
    };
    getGithubCSVTestFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Generates all the rows of data for the table of scenario test files
   */
  useEffect(() => {
    if (githubCSVTestsData == null) return;
    // Convert github test file data to rows in the table
    const updatedCSVTableData: CSVRow[] = githubCSVTestsData.map((testFileData) => createRow(testFileData));
    // Adds any locally updated scenario test file to the table
    localTestFiles.forEach((file) =>
      updatedCSVTableData.push(
        createRow(
          {
            filename: file.name,
            lastUpdated: file?.lastModified,
            updatedBy: "You",
            downloadFile: file,
          },
          true
        )
      )
    );
    // Add results of previous runs to the row
    const updatedCSVTableDataWithRunResults: CSVRow[] = updatedCSVTableData.map((row: CSVRow) => ({
      ...row,
      runResult:
        scenarioRunResults[row.filename] == null ? null : scenarioRunResults[row.filename] ? (
          <CheckCircleFilled className={styles.runResultIcon} style={{ color: "green" }} />
        ) : (
          <CloseCircleFilled className={styles.runResultIcon} style={{ color: "red" }} />
        ),
    }));
    // Sets the updated data
    setCSVTableData(updatedCSVTableDataWithRunResults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localTestFiles, githubCSVTestsData, scenarioRunResults]);

  const handleCancelAddingCSVFile = () => {
    setOpenNewCSVModal(false);
  };

  if (isLoadingInTestFiles) {
    return (
      <Spin tip="Loading rules..." size="large" wrapperClassName="spinnerWrapper" style={{ height: 200 }}>
        <div className="content" />
      </Spin>
    );
  }

  return (
    <div>
      <Flex vertical gap="large">
        <Table
          dataSource={csvTableData}
          rowSelection={rowSelection}
          pagination={false}
          locale={{ emptyText: "No CSV Testfiles" }}
        >
          <Table.Column
            title="CSV Test Filename"
            dataIndex="filename"
            key="filename"
            render={(text) => <div className={styles.filenameColumn}>{text}</div>}
          />
          <Table.Column
            title="Last Updated"
            dataIndex="lastUpdated"
            key="lastUpdated"
            render={(timestamp: number | string) => dayjs(timestamp).format("MM/DD/YYYY")}
          />
          <Table.Column title="Updated By" dataIndex="updatedBy" key="updatedBy" />
          <Table.Column title="Actions" dataIndex="actions" key="actions" />
          <Table.Column title="Run Result" dataIndex="runResult" key="runResult" />
        </Table>
        <Flex gap="middle">
          <Button onClick={() => runAllSelectedCSVScenarios()}>Run selected scenario CSVs</Button>
          <Button type="primary" onClick={() => setOpenNewCSVModal(true)}>
            + Create new CSV test file
          </Button>
        </Flex>
      </Flex>
      <NewScenarioCSV
        openNewCSVModal={openNewCSVModal}
        jsonFile={jsonFile}
        ruleContent={ruleContent}
        confirmAddingNewCSVFile={confirmAddingNewCSVFile}
        cancelAddingCSVFile={handleCancelAddingCSVFile}
        runCSVScenarios={runCSVScenarios}
        existingFilenames={csvTableData.map(({ filename }) => filename)}
      />
    </div>
  );
}
