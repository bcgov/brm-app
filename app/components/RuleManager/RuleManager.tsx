"use client";
import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Flex, Spin, message } from "antd";
import { Simulation, DecisionGraphType } from "@gorules/jdm-editor";
import equal from "fast-deep-equal";
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
  version: RULE_VERSION | boolean;
  showAllScenarioTabs?: boolean;
  showHeader?: boolean;
}

export default function RuleManager({
  ruleInfo,
  initialRuleContent = DEFAULT_RULE_CONTENT,
  version,
  showAllScenarioTabs = true,
  showHeader = true,
}: RuleManagerProps) {
  const { _id: ruleId, filepath } = ruleInfo;
  const fullFilepath = `${version === RULE_VERSION.inProduction ? "prod" : "dev"}/${filepath}`;
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
  const [ruleContent, setRuleContent] = useState<DecisionGraphType | null>();
  const [rulemap, setRulemap] = useState<RuleMap>();
  const [nestedRuleMap, setNestedRuleMap] = useState<RuleMap>();
  const [simulation, setSimulation] = useState<Simulation>();
  const [simulationContext, setSimulationContext] = useState<Record<string, any>>();
  const [resultsOfSimulation, setResultsOfSimulation] = useState<Record<string, any> | null>();
  const { setHasUnsavedChanges } = useLeaveScreenPopup();
  const canEditGraph = version === RULE_VERSION.draft || version === true;
  const canEditScenarios = version === RULE_VERSION.draft || version === RULE_VERSION.inReview || version === true;

  const updateRuleContent = (updatedRuleContent: DecisionGraphType) => {
    if (version === RULE_VERSION.draft && !equal(ruleContent, updatedRuleContent)) {
      setHasUnsavedChanges(true);
      setRuleContent(updatedRuleContent);
    }
  };

  const updateScenarios = useCallback(async () => {
    const updatedScenarios: Scenario[] = await getScenariosByFilename(filepath);
    setScenarios(updatedScenarios);
  }, [filepath]);

  useEffect(() => {
    setRuleContent(initialRuleContent);
    updateScenarios();
  }, [initialRuleContent, updateScenarios]);

  useEffect(() => {
    if (ruleContent) {
      const canBeSchemaMapped = () => {
        if (!ruleContent?.nodes) return false;
        // Must contain an outputNode in order for schema mapping to work
        return ruleContent.nodes.some((node) => node.type === "outputNode");
      };
      const updateRuleMap = async () => {
        const updatedRulemap: RuleMap = await getRuleMap(fullFilepath, ruleContent, version);
        setNestedRuleMap(updatedRulemap);
        // Exclude inputs from linked rules
        updatedRulemap.inputs = updatedRulemap.inputs.filter((input) => !input.nested);
        setRulemap(updatedRulemap);
        const ruleMapInputs = createRuleMap(updatedRulemap?.inputs, simulationContext);
        setSimulationContext(ruleMapInputs);
      };
      if (canBeSchemaMapped()) {
        updateRuleMap();
      }
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
    if (runContext && version !== false) {
      console.info("Simulate:", runContext);
      try {
        message.destroy();
        const data = await postDecision(ruleContent, runContext, version);
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
        console.log(e);
        message.error("Error during simulation run");
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

  if (ruleContent === undefined) {
    return (
      <Spin tip="Loading rule..." size="large" className="spinner">
        <div className="content" />
      </Spin>
    );
  }

  const versionColour = getVersionColor(version.toString());

  return (
    <Flex gap="middle" vertical className={styles.rootLayout}>
      <div
        className={styles.rulesWrapper}
        style={
          showHeader && version !== false ? ({ "--version-color": versionColour } as React.CSSProperties) : undefined
        }
      >
        {ruleContent ? (
          <>
            {showHeader && version !== false && (
              <Flex gap="middle" justify="space-between" wrap className={styles.actionBar}>
                <VersionBar ruleInfo={ruleInfo} version={version.toString()} />
                <SavePublish
                  ruleInfo={ruleInfo}
                  ruleContent={ruleContent}
                  version={version}
                  setHasSaved={() => setHasUnsavedChanges(false)}
                  ruleMap={nestedRuleMap}
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
                jsonFilename={fullFilepath}
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
          </>
        ) : (
          <Flex justify="center" align="center" style={{ margin: 32, height: 500 }}>
            <h3>Sorry, the &apos;{version}&apos; version of this rule does not exist</h3>
          </Flex>
        )}
      </div>
      {scenarios && rulemap && ruleContent && (
        <ScenariosManager
          ruleId={ruleId}
          ruleInfo={ruleInfo}
          jsonFile={filepath}
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
          version={version}
        />
      )}
    </Flex>
  );
}
