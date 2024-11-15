import React, { useState, useMemo } from "react";
import { Flex, Button, Tabs } from "antd";
import type { TabsProps } from "antd";
import { DecisionGraphType } from "@gorules/jdm-editor";
import { Scenario } from "@/app/types/scenario";
import { RuleMap } from "@/app/types/rulemap";
import ScenarioViewer from "./ScenarioViewer";
import ScenarioGenerator from "./ScenarioGenerator";
import ScenarioResults from "./ScenarioResults";
import ScenarioCSV from "./ScenarioCSV";
import styles from "./ScenariosManager.module.css";
import IsolationTester from "./IsolationTester";
import ScenariosHelper from "./ScenariosHelper";

interface ScenariosManagerProps {
  ruleId: string;
  jsonFile: string;
  ruleContent: DecisionGraphType;
  rulemap: RuleMap;
  scenarios: Scenario[];
  setScenarios: (scenarios: Scenario[]) => void;
  isEditing: boolean;
  showAllScenarioTabs?: boolean;
  createRuleMap: (array: any[], preExistingContext?: Record<string, any>) => RuleMap;
  simulationContext?: Record<string, any>;
  setSimulationContext: (newContext: Record<string, any>) => void;
  runSimulation: (newContext?: Record<string, any>) => void;
  resultsOfSimulation?: Record<string, any> | null;
}

export enum ScenariosManagerTabs {
  ScenariosTab = "1",
  InputsTab = "2",
  ResultsTab = "3",
  CSVTab = "4",
  IsolationTesterTab = "5",
}

export default function ScenariosManager({
  ruleId,
  jsonFile,
  ruleContent,
  rulemap,
  scenarios = [],
  setScenarios,
  isEditing,
  showAllScenarioTabs,
  createRuleMap,
  simulationContext,
  setSimulationContext,
  runSimulation,
  resultsOfSimulation,
}: ScenariosManagerProps) {
  const [resetTrigger, setResetTrigger] = useState<boolean>(false);
  const [activeTabKey, setActiveTabKey] = useState<string>(
    showAllScenarioTabs ? ScenariosManagerTabs.InputsTab : ScenariosManagerTabs.ScenariosTab
  );
  const [scenarioName, setScenarioName] = useState<string>("");

  const handleTabChange = (key: string) => {
    handleReset(() => {
      setActiveTabKey(key);
    });
  };

  const handleReset = (callback?: () => void) => {
    setSimulationContext({});
    setScenarioName("");
    const ruleMapInputs = createRuleMap(rulemap?.inputs);
    setSimulationContext(ruleMapInputs);
    setResetTrigger((prev) => !prev);
    if (callback) callback();
  };

  const scenariosTab = scenarios && rulemap && (
    <Flex gap="small" vertical>
      <ScenarioViewer
        scenarios={scenarios}
        jsonFile={jsonFile}
        setSimulationContext={setSimulationContext}
        resultsOfSimulation={resultsOfSimulation}
        runSimulation={runSimulation}
        rulemap={rulemap}
        editing={isEditing}
        setActiveTabKey={setActiveTabKey}
        scenariosManagerTabs={ScenariosManagerTabs}
        setResetTrigger={setResetTrigger}
        setScenarioName={setScenarioName}
      />
    </Flex>
  );

  const inputsTab = scenarios && rulemap && ruleId && (
    <Flex gap="small " className={styles.scenarioGeneratorTab}>
      <ScenarioGenerator
        scenarios={scenarios}
        simulationContext={simulationContext}
        setSimulationContext={setSimulationContext}
        resultsOfSimulation={resultsOfSimulation}
        runSimulation={runSimulation}
        resetTrigger={resetTrigger}
        ruleId={ruleId}
        jsonFile={jsonFile}
        rulemap={rulemap}
        editing={isEditing}
        scenarioName={scenarioName}
        setScenarioName={setScenarioName}
        setActiveTabKey={setActiveTabKey}
        scenariosManagerTabs={ScenariosManagerTabs}
        setActiveScenarios={setScenarios}
      />
      <Button onClick={() => handleReset()} size="large" type="primary">
        Reset ↻
      </Button>
    </Flex>
  );

  const resultsTab = (
    <Flex gap="small">
      <ScenarioResults scenarios={scenarios} jsonFile={jsonFile} ruleContent={ruleContent} />
    </Flex>
  );

  const csvTab = (
    <Flex gap="small">
      <ScenarioCSV jsonFile={jsonFile} ruleContent={ruleContent} />
    </Flex>
  );

  const isolationTestTab = (
    <Flex gap="small">
      <IsolationTester
        scenarios={scenarios}
        simulationContext={simulationContext}
        setSimulationContext={setSimulationContext}
        resetTrigger={resetTrigger}
        jsonFile={jsonFile}
        rulemap={rulemap}
        ruleContent={ruleContent}
      />
      <Button onClick={() => handleReset()} size="large" type="primary">
        Reset ↻
      </Button>
    </Flex>
  );

  const items: TabsProps["items"] = [
    {
      key: ScenariosManagerTabs.ScenariosTab,
      label: (
        <span
          //Manual styling to work around rendering bug in antd Tabs
          style={{
            display: "inline-block",
            width: "130px",
          }}
        >
          Simulate scenarios
        </span>
      ),
      children: scenariosTab,
      disabled: false,
    },
    {
      key: ScenariosManagerTabs.InputsTab,
      label: "Simulate manual inputs",
      children: inputsTab,
      disabled: false,
    },
    {
      key: ScenariosManagerTabs.ResultsTab,
      label: "Scenario Results",
      children: resultsTab,
      disabled: !showAllScenarioTabs,
    },
    {
      key: ScenariosManagerTabs.CSVTab,
      label: "CSV Tests",
      children: csvTab,
      disabled: !showAllScenarioTabs,
    },
    {
      key: ScenariosManagerTabs.IsolationTesterTab,
      label: "Isolation Tester",
      children: isolationTestTab,
      disabled: !showAllScenarioTabs,
    },
  ];

  const filteredItems = useMemo(
    () => (showAllScenarioTabs ? items : items.filter((item) => !item.disabled)),
    [showAllScenarioTabs, items]
  );

  return (
    <Flex justify="space-between" align="center" className={styles.contentSection}>
      <Flex gap="middle" justify="space-between">
        <Tabs
          className={styles.tabs}
          activeKey={activeTabKey}
          defaultActiveKey={showAllScenarioTabs ? ScenariosManagerTabs.InputsTab : ScenariosManagerTabs.ScenariosTab}
          items={filteredItems}
          onChange={handleTabChange}
          tabBarExtraContent={showAllScenarioTabs ? { left: <ScenariosHelper section={activeTabKey} /> } : undefined}
          tabBarGutter={15}
        ></Tabs>
      </Flex>
    </Flex>
  );
}
