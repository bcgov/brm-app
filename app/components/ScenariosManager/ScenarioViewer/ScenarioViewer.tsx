import React, { useState, useEffect } from "react";
import { Flex, Button, Popconfirm, message, Pagination, Input, Tooltip } from "antd";
import type { PopconfirmProps } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import InputOutputTable from "@/app/components/InputOutputTable";
import styles from "./ScenarioViewer.module.scss";
import { Scenario } from "@/app/types/scenario";
import { deleteScenario, getScenariosByFilename, updateScenario } from "@/app/utils/api";
import ScenarioFormatter from "../ScenarioFormatter";
import { RuleMap } from "@/app/types/rulemap";

interface ScenarioViewerProps {
  scenarios: Scenario[];
  jsonFile: string;
  resultsOfSimulation: Record<string, any> | null | undefined;
  setSimulationContext: (data: any) => void;
  runSimulation: () => void;
  rulemap: RuleMap;
  editing?: boolean;
  setActiveTabKey?: (key: string) => void;
  scenariosManagerTabs?: any;
  setResetTrigger?: (trigger: boolean) => void;
  setScenarioName?: (name: string) => void;
}

export default function ScenarioViewer({
  scenarios,
  jsonFile,
  resultsOfSimulation,
  setSimulationContext,
  runSimulation,
  rulemap,
  editing = true,
  setActiveTabKey,
  scenariosManagerTabs,
  setResetTrigger,
  setScenarioName,
}: ScenarioViewerProps) {
  const [scenariosDisplay, setScenariosDisplay] = useState<Scenario[] | null>(scenarios);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [manageScenarios, setManageScenarios] = useState(false);
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    setScenariosDisplay(scenarios);
  }, [scenarios]);

  const handleSelectScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    const scenarioInputs = scenario.variables.reduce((acc, variable) => {
      acc[variable.name] = variable.value;
      return acc;
    }, {} as Record<string, any>);
    setSimulationContext(scenarioInputs);
  };

  const handleRunScenario = () => {
    runSimulation();
  };

  const handleDeleteScenario = async (scenario: Scenario) => {
    const scenarioID = scenario._id || "";
    try {
      await deleteScenario(scenarioID);
      scenariosDisplay ? setScenariosDisplay(scenariosDisplay.filter((s) => s._id !== scenarioID)) : null;
      message.success("Scenario deleted");
      setManageScenarios(false);
    } catch (e) {
      message.error("Error deleting scenario");
    }
  };

  const handleEditScenario = (scenario: Scenario) => {
    setManageScenarios(false);

    const scenarioInputs = scenario.variables.reduce((acc, variable) => {
      acc[variable.name] = variable.value;
      return acc;
    }, {} as Record<string, any>);
    const editScenarioInputs = { ...scenarioInputs, rulemap: true };
    setSimulationContext(editScenarioInputs);

    setResetTrigger?.(true ? false : true);
    setScenarioName?.(scenario.title);

    setActiveTabKey?.(scenariosManagerTabs.InputsTab);
  };

  const handleStartEditing = (scenario: Scenario) => {
    if (!manageScenarios) return;
    setEditingScenarioId(scenario._id || null);
    setEditingTitle(scenario.title);
  };

  const handleSaveTitle = async (scenario: Scenario) => {
    if (!editingTitle.trim()) {
      message.error("Scenario name cannot be empty");
      return;
    }

    // Check if the name is unchanged
    if (editingTitle === scenario.title) {
      setEditingScenarioId(null);
      return;
    }

    // Check if the name already exists in other scenarios
    const nameExists = scenariosDisplay?.some(
      (s) => s._id !== scenario._id && s.title.toLowerCase() === editingTitle.trim().toLowerCase()
    );

    if (nameExists) {
      message.error("A scenario with this name already exists. Please choose a unique name.");
      return;
    }

    try {
      const updatedScenario = { ...scenario, title: editingTitle };
      await updateScenario(updatedScenario, scenario._id || "");

      setScenariosDisplay(
        (scenariosDisplay || []).map((s) => (s._id === scenario._id ? { ...s, title: editingTitle } : s))
      );

      setEditingScenarioId(null);
      message.success("Scenario name updated");
    } catch (e) {
      message.error("Error updating scenario name");
    }
  };

  const cancel: PopconfirmProps["onCancel"] = (e) => {
    console.log(e);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handlePageChange = (page: React.SetStateAction<number>) => {
    setCurrentPage(page);
  };

  // Calculate the scenarios to display based on the current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedScenarios = scenariosDisplay?.slice(startIndex, endIndex);

  return (
    <Flex className={styles.scenarioViewer}>
      <Flex className={styles.scenarioList} vertical gap={"large"}>
        {scenariosDisplay && scenariosDisplay.length > 0 ? (
          <>
            <ol>
              {paginatedScenarios?.map((scenario, index) => (
                <Flex key={startIndex + index} className={styles.scenarioList} vertical gap={"large"}>
                  <li
                    key={startIndex + index}
                    onClick={() => handleSelectScenario(scenario)}
                    className={selectedScenario === scenario ? styles.selected : ""}
                  >
                    <Flex key={startIndex + index} gap={"small"} align="center" justify="space-between">
                      <span className={styles.listItem}>
                        <span className={styles.listItemNumber}>{startIndex + index + 1}.</span>{" "}
                        {editingScenarioId === scenario._id ? (
                          <Input
                            size="small"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onPressEnter={() => handleSaveTitle(scenario)}
                            onBlur={() => handleSaveTitle(scenario)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        ) : (
                          <Tooltip title={manageScenarios ? "Click to edit scenario name" : null}>
                            <span
                              onClick={(e) => {
                                if (manageScenarios) {
                                  e.stopPropagation();
                                  handleStartEditing(scenario);
                                }
                              }}
                              style={{ cursor: manageScenarios ? "text" : "pointer" }}
                            >
                              {scenario.title}
                            </span>
                          </Tooltip>
                        )}{" "}
                      </span>
                      {manageScenarios && (
                        <>
                          <Button
                            shape="circle"
                            icon={<EditOutlined />}
                            disabled={!manageScenarios}
                            size="small"
                            type="dashed"
                            onClick={() => handleEditScenario(scenario)}
                          ></Button>
                          <Popconfirm
                            title="Are you sure you want to delete this scenario?"
                            onConfirm={() => handleDeleteScenario(scenario)}
                            onCancel={cancel}
                            okText="Yes, delete scenario"
                            cancelText="No"
                          >
                            <Button
                              shape="circle"
                              icon={<DeleteOutlined />}
                              disabled={!manageScenarios}
                              size="small"
                              danger
                            ></Button>
                          </Popconfirm>
                        </>
                      )}
                    </Flex>
                  </li>
                </Flex>
              ))}
            </ol>
            <Pagination
              current={currentPage}
              pageSize={itemsPerPage}
              total={scenariosDisplay.length}
              onChange={handlePageChange}
              hideOnSinglePage
            />
            {editing && <Button onClick={() => setManageScenarios(!manageScenarios)}>Manage Scenarios</Button>}
          </>
        ) : (
          <div>No scenarios available</div>
        )}
      </Flex>
      {selectedScenario && (
        <Flex vertical gap={"small"} className={styles.selectedScenarioDetails}>
          <Flex vertical gap={"small"} className={styles.scenarioDetails}>
            <div className={styles.variablesTable}>
              <ScenarioFormatter
                title="Inputs"
                scenarios={scenarios}
                rulemap={rulemap}
                rawData={selectedScenario.variables.reduce((acc, variable) => {
                  acc[variable.name] = variable.value;
                  return acc;
                }, {} as Record<string, any>)}
              />
            </div>
          </Flex>
          <Button size="large" type="primary" onClick={handleRunScenario}>
            Simulate ▶
          </Button>
        </Flex>
      )}

      {!resultsOfSimulation?.rulemap && (
        <>
          <Flex vertical align="center" justify="center">
            <>→</>
          </Flex>
          <Flex className={styles.resultsColumn}>
            <InputOutputTable title="Decision" rawData={resultsOfSimulation} rulemap={rulemap} />
          </Flex>
        </>
      )}
    </Flex>
  );
}
