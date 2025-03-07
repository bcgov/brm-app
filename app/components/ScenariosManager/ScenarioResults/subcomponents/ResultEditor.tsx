import { useState, useEffect } from "react";
import { Modal, Popconfirm, message, Button, Flex } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { DecisionGraphType } from "@gorules/jdm-editor";
import { Scenario } from "@/app/types/scenario";
import { RuleMap } from "@/app/types/rulemap";
import { postDecision } from "@/app/utils/api";
import ScenarioGenerator from "../../ScenarioGenerator";
import { RULE_VERSION } from "@/app/constants/ruleVersion";

interface ResultEditorProps {
  visible: boolean;
  selectedScenario: Scenario | null;
  scenarios: Scenario[];
  jsonFile: string;
  rulemap: RuleMap | undefined;
  ruleContent: DecisionGraphType | undefined;
  version: RULE_VERSION | boolean;
  onCancel: () => void;
  onSave: () => Promise<void>;
}

export default function ResultEditor({
  visible,
  selectedScenario,
  scenarios,
  jsonFile,
  rulemap,
  ruleContent,
  version,
  onCancel,
  onSave,
}: ResultEditorProps) {
  const [simulationContext, setSimulationContext] = useState<Record<string, any>>({});
  const [resultsOfSimulation, setResultsOfSimulation] = useState<Record<string, any> | null>();

  const runSimulation = async (newContext?: Record<string, any>) => {
    if (!ruleContent) return;
    try {
      const contextToUse = newContext || simulationContext;
      const response = await postDecision(ruleContent, contextToUse, version);
      setResultsOfSimulation(response?.result);
    } catch (error) {
      message.error("Error running simulation");
    }
  };

  useEffect(() => {
    if (!visible) {
      setSimulationContext({});
      setResultsOfSimulation(null);
    }
  }, [visible]);

  useEffect(() => {
    if (selectedScenario && visible) {
      const context = {
        ...selectedScenario.variables.reduce((acc, v) => {
          acc[v.name] = v.value;
          return acc;
        }, {} as Record<string, any>),
        rulemap: true,
      };

      setSimulationContext(context);

      if (ruleContent) {
        runSimulation(context);
      }
    }
  }, [selectedScenario, visible, ruleContent]);

  const handleSaveScenario = async () => {
    if (!selectedScenario || !simulationContext) return;
    await onSave().then(() => {
      onCancel();
    });
  };

  return (
    <Modal
      title={
        <Flex gap="small" justify="space-between">
          <>Edit Scenario: ${selectedScenario?.title}</>
          <Popconfirm
            title="Cancel"
            description={`Are you sure to stop editing this scenario?\nAny changes you have made will not be saved.`}
            okText="Yes"
            cancelText="No"
            onConfirm={onCancel}
          >
            <Button shape="circle" icon={<CloseOutlined />} data-testid="modal-cancel" />
          </Popconfirm>
        </Flex>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1000}
      closable={false}
      destroyOnClose={true}
    >
      {selectedScenario && rulemap && (
        <ScenarioGenerator
          type="edit"
          scenarios={scenarios}
          simulationContext={simulationContext}
          setSimulationContext={setSimulationContext}
          resultsOfSimulation={resultsOfSimulation}
          runSimulation={runSimulation}
          resetTrigger={false}
          ruleId={selectedScenario.ruleID}
          jsonFile={jsonFile}
          rulemap={rulemap}
          editing={true}
          scenarioName={selectedScenario.title}
          setScenarioName={() => {}}
          onSave={handleSaveScenario}
        />
      )}
    </Modal>
  );
}
