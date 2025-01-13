"use client";
import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Flex, Spin, message } from "antd";
import { Simulation, DecisionGraphType } from "@gorules/jdm-editor";
import { postDecision, getRuleMap, getScenariosByFilename } from "../../utils/api";
import { RuleInfo } from "@/app/types/ruleInfo";
import { RuleMap } from "@/app/types/rulemap";
import { Scenario } from "@/app/types/scenario";
import useLeaveScreenPopup from "@/app/hooks/useLeaveScreenPopup";
import { DEFAULT_RULE_CONTENT } from "@/app/constants/defaultRuleContent";
import { RULE_VERSION } from "@/app/constants/ruleVersion";
import { logError } from "@/app/utils/logger";
import SavePublish from "../SavePublish";
import ScenariosManager from "../ScenariosManager";
import styles from "./RuleManager.module.css";
import { getVersionColor } from "@/app/utils/utils";
import VersionBar from "../VersionBar/VersionBar";

// Need to disable SSR when loading this component so it works properly
const RuleViewerEditor = dynamic(() => import("../RuleViewerEditor"), { ssr: false });

interface RuleManagerProps {
  ruleInfo: RuleInfo;
  initialRuleContent?: DecisionGraphType;
  editing?: string | boolean;
  showAllScenarioTabs?: boolean;
}

export default function RuleManager({
  ruleInfo,
  initialRuleContent = DEFAULT_RULE_CONTENT,
  editing = false,
  showAllScenarioTabs = true,
}: RuleManagerProps) {
  const { _id: ruleId, filepath: jsonFile } = ruleInfo;
  const createRuleMap = (array: any[] = [], preExistingContext?: Record<string, any>) => {
    return array.reduce(
      (acc, obj) => {
        if (preExistingContext?.hasOwnProperty(obj.field)) {
          acc[obj.field] = preExistingContext[obj.field];
        } else {
          acc[obj.field] = null;
        }
        return acc;
      },
      { rulemap: true }
    );
  };

  const [isLoading, setIsLoading] = useState(true);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [ruleContent, setRuleContent] = useState<DecisionGraphType>();
  const [rulemap, setRulemap] = useState<RuleMap>();
  const [simulation, setSimulation] = useState<Simulation>();
  const [simulationContext, setSimulationContext] = useState<Record<string, any>>();
  const [resultsOfSimulation, setResultsOfSimulation] = useState<Record<string, any> | null>();
  const { setHasUnsavedChanges } = useLeaveScreenPopup();
  const canEditGraph = editing === RULE_VERSION.draft || editing === true;
  const canEditScenarios = editing === RULE_VERSION.draft || editing === RULE_VERSION.inReview || editing === true;

  const updateRuleContent = (updatedRuleContent: DecisionGraphType) => {
    if (ruleContent !== updatedRuleContent) {
      setHasUnsavedChanges(true);
      setRuleContent(updatedRuleContent);
    }
  };

  const updateScenarios = useCallback(async () => {
    const updatedScenarios: Scenario[] = await getScenariosByFilename(jsonFile);
    setScenarios(updatedScenarios);
  }, [jsonFile]);

  useEffect(() => {
    setRuleContent(initialRuleContent);
    updateScenarios();
  }, [initialRuleContent, updateScenarios]);

  useEffect(() => {
    const canBeSchemaMapped = () => {
      if (!ruleContent?.nodes) return false;
      // Must contain an outputNode in order for schema mapping to work
      return ruleContent.nodes.some((node) => node.type === "outputNode");
    };
    const updateRuleMap = async () => {
      const updatedRulemap: RuleMap = await getRuleMap(jsonFile, ruleContent);
      setRulemap(updatedRulemap);
      const ruleMapInputs = createRuleMap(updatedRulemap?.inputs, simulationContext);
      setSimulationContext(ruleMapInputs);
    };
    if (canBeSchemaMapped()) {
      updateRuleMap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleContent]);

  const resetContextAndResults = () => {
    setSimulation(undefined);
    const ruleMapResultOutputs = createRuleMap(rulemap?.resultOutputs);
    setResultsOfSimulation(ruleMapResultOutputs);
  };

  const runSimulation = async (newContext?: unknown) => {
    if (!ruleContent) {
      throw new Error("No graph json for simulation");
    }
    if (newContext) {
      setSimulationContext(newContext);
    }
    const runContext = newContext || simulationContext;
    if (runContext) {
      console.info("Simulate:", runContext);
      try {
        message.destroy();
        const data = await postDecision(ruleContent, runContext);
        console.info("Simulation Results:", data, data?.result);
        // Check if data.result is an array and throw error as object is required
        if (Array.isArray(data?.result)) {
          throw new Error("Please update your rule and ensure that outputs are on one line.");
        }
        // Set the simulation
        setSimulation({ result: data });
        // Set the results of the simulation
        setResultsOfSimulation(data?.result);
      } catch (e: any) {
        message.error("Error during simulation run: " + e, 10);
        logError("Error during simulation run:", e);
      }
    } else {
      // Reset the result if there is no contextToSimulate (used to reset the trace)
      setSimulation({});
    }
  };

  useEffect(() => {
    // reset simulation/results when context changes
    resetContextAndResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationContext]);

  if (!ruleContent) {
    return (
      <Spin tip="Loading rule..." size="large" className="spinner">
        <div className="content" />
      </Spin>
    );
  }

  const versionColour = getVersionColor(editing.toString());

  return (
    <Flex gap="middle" vertical className={styles.rootLayout}>
      <div
        className={styles.rulesWrapper}
        style={editing !== false ? ({ "--version-color": versionColour } as React.CSSProperties) : undefined}
      >
        {editing !== false && (
          <Flex gap="small" justify="space-between" wrap className={styles.actionBar}>
            <VersionBar ruleInfo={ruleInfo} version={editing.toString()} />
            <SavePublish
              ruleInfo={ruleInfo}
              ruleContent={ruleContent}
              version={editing}
              setHasSaved={() => setHasUnsavedChanges(false)}
            />
          </Flex>
        )}
        <div className={styles.rulesGraph}>
          {isLoading && (
            <Spin tip="Loading graph..." size="large" wrapperClassName="spinnerWrapper" className="spinner">
              <div className="content" />
            </Spin>
          )}
          <RuleViewerEditor
            jsonFilename={jsonFile}
            ruleContent={ruleContent}
            updateRuleContent={updateRuleContent}
            contextToSimulate={simulationContext}
            setContextToSimulate={setSimulationContext}
            simulation={simulation}
            runSimulation={runSimulation}
            isEditable={canEditGraph}
            setLoadingComplete={() => setIsLoading(false)}
            updateScenarios={updateScenarios}
          />
        </div>
      </div>
      {scenarios && rulemap && (
        <ScenariosManager
          ruleId={ruleId}
          jsonFile={jsonFile}
          ruleContent={ruleContent}
          rulemap={rulemap}
          scenarios={scenarios}
          setScenarios={setScenarios}
          isEditing={canEditScenarios}
          showAllScenarioTabs={showAllScenarioTabs}
          createRuleMap={createRuleMap}
          setSimulationContext={setSimulationContext}
          simulationContext={simulationContext}
          runSimulation={runSimulation}
          resultsOfSimulation={resultsOfSimulation}
        />
      )}
    </Flex>
  );
}
