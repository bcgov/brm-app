import React, { useState, useEffect } from "react";
import { Flex, Button, Input, Popconfirm } from "antd";
import type { PopconfirmProps } from "antd";
import InputOutputTable from "../../InputOutputTable";
import { Scenario } from "@/app/types/scenario";
import { createScenario, updateScenario } from "@/app/utils/api";
import { RuleMap } from "@/app/types/rulemap";
import ScenarioFormatter from "../ScenarioFormatter";
import { getScenariosByFilename } from "@/app/utils/api";
import styles from "./ScenarioGenerator.module.css";

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
  setActiveKey?: (key: string) => void;
  setActiveScenarios?: (scenarios: Scenario[]) => void;
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
  setActiveKey,
  setActiveScenarios,
}: ScenarioGeneratorProps) {
  const [simulationRun, setSimulationRun] = useState(false);
  const [scenarioExpectedOutput, setScenarioExpectedOutput] = useState({});
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
      goRulesJSONFilename: jsonFile,
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
      setScenarioName?.("");
      setSimulationRun(false);
      setEditingScenario(false);
      setSimulationContext(newScenario);
      updateScenarios();
      setActiveKey?.("1");
    } catch (error) {
      console.error("Error creating scenario:", error);
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
    const editScenario = { ...simulationContext, ...{ rulemap: true } };
    setSimulationContext(editScenario);
    setEditingScenario(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger]);

  // Update scenarioExpectedOutput on first render to display full rulemap possible results
  useEffect(() => {
    if (resultsOfSimulation) {
      setScenarioExpectedOutput(resultsOfSimulation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              <Button size="large" type="primary" onClick={runScenarioSimulation}>
                Simulate ▶
              </Button>
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
                      <Button disabled={!scenarioName} size="large" type="primary">
                        Save Scenario ⬇️
                      </Button>
                    </Popconfirm>
                  </>
                )}
              </Flex>
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