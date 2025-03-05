import React, { useState, useEffect } from "react";
import { Flex, Button, Input, Popconfirm, Tooltip } from "antd";
import type { PopconfirmProps } from "antd";
import InputOutputTable from "../../InputOutputTable";
import { Scenario } from "@/app/types/scenario";
import { createScenario, updateScenario } from "@/app/utils/api";
import { RuleMap } from "@/app/types/rulemap";
import ScenarioFormatter from "../ScenarioFormatter";
import { getScenariosByFilename } from "@/app/utils/api";
import { logError } from "@/app/utils/logger";
import styles from "./ScenarioGenerator.module.scss";

interface ScenarioGeneratorProps {
  scenarios: Scenario[];
  resultsOfSimulation: Record<string, any> | null | undefined;
  simulationContext?: Record<string, any>;
  setSimulationContext: (data: any) => void;
  runSimulation: () => void;
  resetTrigger: boolean;
  ruleId: string;
  jsonFile: string;
  rulemap: RuleMap;
  editing?: boolean;
  scenarioName?: string;
  setScenarioName?: (name: string) => void;
  setActiveTabKey?: (key: string) => void;
  scenariosManagerTabs?: any;
  setActiveScenarios?: (scenarios: Scenario[]) => void;
  onSave?: () => Promise<void>;
}

export default function ScenarioGenerator({
  scenarios,
  resultsOfSimulation,
  simulationContext,
  setSimulationContext,
  runSimulation,
  resetTrigger,
  ruleId,
  jsonFile,
  rulemap,
  editing = true,
  scenarioName,
  setScenarioName,
  setActiveTabKey,
  scenariosManagerTabs,
  setActiveScenarios,
  onSave,
}: ScenarioGeneratorProps) {
  const [simulationRun, setSimulationRun] = useState(false);
  const [scenarioExpectedOutput, setScenarioExpectedOutput] = useState<Record<string, any>>({});
  const [editingScenario, setEditingScenario] = useState(scenarioName && scenarioName.length > 0 ? true : false);

  const updateScenarios = async () => {
    const newScenarios = await getScenariosByFilename(jsonFile);
    setActiveScenarios?.(newScenarios);
  };

  const handleSaveScenario = async () => {
    if (!simulationRun || !simulationContext || !scenarioName) return;

    const variables = Object.entries(simulationContext)
      .filter(([name, value]) => name !== "rulemap" && value !== null && value !== undefined)
      .map(([name, value]) => ({ name, value }));

    const expectedResults = Object.entries(scenarioExpectedOutput)
      .filter(([name, value]) => name !== "rulemap" && value !== null && value !== undefined)
      .map(([name, value]) => ({ name, value }));

    const newScenario: Scenario = {
      title: scenarioName,
      ruleID: ruleId,
      filepath: jsonFile,
      variables,
      expectedResults,
    };

    try {
      const existingScenario = scenarios.find((scenario) => scenario.title === scenarioName);
      if (existingScenario) {
        await updateScenario(newScenario, existingScenario._id);
      } else {
        await createScenario(newScenario);
      }
      updateScenarios();
      setActiveTabKey?.(scenariosManagerTabs.ScenariosTab);
    } catch (error: any) {
      logError("Error creating scenario:", error);
    } finally {
      onSave?.();
    }
  };

  const runScenarioSimulation = () => {
    if (!simulationContext) return;
    if (scenarios.find((scenario) => scenario.title === scenarioName)) {
      setEditingScenario(true);
    }
    runSimulation();
    setSimulationRun(true);
  };

  useEffect(() => {
    setSimulationRun(false);
    setScenarioExpectedOutput(resultsOfSimulation ?? {});
    const editScenario = { ...simulationContext, rulemap: true };
    setSimulationContext(editScenario);
    setEditingScenario(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger]);

  // Initialize expected outputs with all rulemap fields
  useEffect(() => {
    if (rulemap?.resultOutputs) {
      const expectedOutputsMap = rulemap.resultOutputs.reduce<Record<string, any>>((acc, obj: { field?: string }) => {
        if (obj?.field) {
          // Initialize all fields, keeping existing values if they exist
          acc[obj.field] = scenarioExpectedOutput?.[obj.field] ?? null;
        }
        return acc;
      }, {});
      setScenarioExpectedOutput(expectedOutputsMap);
    }
  }, [rulemap]);

  // Update simulation results while preserving all rulemap fields
  useEffect(() => {
    if (resultsOfSimulation && rulemap?.resultOutputs) {
      setScenarioExpectedOutput((prevExpected) => {
        const updatedExpected = { ...prevExpected };
        // Update only the fields that exist in resultsOfSimulation
        Object.entries(resultsOfSimulation).forEach(([key, value]) => {
          if (rulemap.resultOutputs.some((output) => output.field === key)) {
            updatedExpected[key] = value;
          }
        });
        return updatedExpected;
      });
    }
  }, [resultsOfSimulation, rulemap]);

  const cancel: PopconfirmProps["onCancel"] = (e) => {
    console.log(e);
  };

  return (
    <Flex>
      <Flex gap="middle" className={styles.scenarioGenerator}>
        {simulationContext && (
          <Flex vertical gap={"small"} align="end">
            <ScenarioFormatter
              title="Inputs"
              rawData={simulationContext}
              setRawData={(data) => setSimulationContext(data)}
              scenarios={scenarios}
              rulemap={rulemap}
            />
            <Flex gap={"small"} align="end" vertical>
              <Flex gap={"small"} align="end">
                {simulationRun && editing && (
                  <>
                    <Input
                      disabled={editingScenario}
                      value={scenarioName}
                      onChange={(e) => setScenarioName?.(e.target.value)}
                      placeholder="Enter Scenario Name"
                    />
                    <Popconfirm
                      title="Are you sure you want to save this scenario?"
                      onConfirm={() => handleSaveScenario()}
                      onCancel={cancel}
                      okText="Yes, save scenario"
                      cancelText="No"
                    >
                      <Tooltip title={!scenarioName && "Scenario name required"}>
                        <Button disabled={!scenarioName} size="large" type="primary">
                          Save Scenario ⬇️
                        </Button>
                      </Tooltip>
                    </Popconfirm>
                  </>
                )}
              </Flex>
              <Button size="large" type="primary" onClick={runScenarioSimulation}>
                Simulate ▶
              </Button>
            </Flex>
          </Flex>
        )}
        <Flex gap={"small"} vertical>
          {resultsOfSimulation && <InputOutputTable title="Results" rawData={resultsOfSimulation} rulemap={rulemap} />}
        </Flex>
        <Flex gap={"small"} vertical>
          {scenarioExpectedOutput && editing && (
            <InputOutputTable
              setRawData={(data) => {
                setScenarioExpectedOutput(data);
              }}
              title="Expected Results"
              rawData={scenarioExpectedOutput}
              editable
              rulemap={rulemap}
            />
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}
