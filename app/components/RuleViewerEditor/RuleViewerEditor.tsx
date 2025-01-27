"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import type { ReactFlowInstance } from "reactflow";
import "@gorules/jdm-editor/dist/style.css";
import { Spin } from "antd";
import { ApartmentOutlined, PlayCircleOutlined, LoginOutlined, LogoutOutlined, BookOutlined } from "@ant-design/icons";
import {
  JdmConfigProvider,
  DecisionGraph,
  NodeSpecification,
  DecisionGraphType,
  DecisionGraphRef,
  Simulation,
  createJdmNode,
  CustomNodeSpecification,
  NodeKind,
} from "@gorules/jdm-editor";
import { SchemaSelectProps, PanelType } from "@/app/types/jdm-editor";
import LinkRuleComponent from "./subcomponents/LinkRuleComponent";
import SimulatorPanel from "./subcomponents/SimulatorPanel";
import RuleInputOutputFieldsComponent from "./subcomponents/RuleInputOutputFieldsComponent";
import NotesComponent from "./subcomponents/NotesComponent";
import { useJSONUpload } from "@/app/hooks/useJSONUpload";

interface RuleViewerEditorProps {
  jsonFilename: string;
  ruleContent: DecisionGraphType;
  updateRuleContent: (updateGraph: DecisionGraphType) => void;
  contextToSimulate?: Record<string, any> | null;
  setContextToSimulate?: (results: Record<string, any>) => void;
  simulation?: Simulation;
  runSimulation?: (results: unknown) => void;
  isEditable?: boolean;
  setLoadingComplete: () => void;
  updateScenarios: () => void;
}

export default function RuleViewerEditor({
  jsonFilename,
  ruleContent,
  updateRuleContent,
  contextToSimulate,
  setContextToSimulate,
  simulation,
  runSimulation,
  isEditable = true,
  setLoadingComplete,
  updateScenarios,
}: RuleViewerEditorProps) {
  const decisionGraphRef: any = useRef<DecisionGraphRef>();
  const [reactFlowRef, setReactFlowRef] = useState<ReactFlowInstance>();
  const [inputsSchema, setInputsSchema] = useState<SchemaSelectProps[]>([]);
  const [outputsSchema, setOutputsSchema] = useState<SchemaSelectProps[]>([]);

  useEffect(() => {
    // Ensure graph is in view
    const fitGraphToView = () => {
      if (reactFlowRef) {
        reactFlowRef.fitView();
        // Set timeout to fix issue with trying to fit view because fully loaded
        setTimeout(() => {
          reactFlowRef.fitView();
        }, 100);
      }
    };
    // Fit to view
    fitGraphToView();
  }, [jsonFilename, reactFlowRef]);

  // Can set additional react flow options here if we need to change how graph looks when it's loaded in
  const reactFlowInit = (reactFlow: ReactFlowInstance) => {
    setLoadingComplete();
    setReactFlowRef(reactFlow);
  };

  useJSONUpload(jsonFilename, updateScenarios, decisionGraphRef, ruleContent);

  const additionalComponents: NodeSpecification[] = useMemo(
    () => [
      // This is to add the decision node - note that this may be added to the DecisionGraph library eventually
      {
        type: NodeKind.Decision,
        displayName: "Rule",
        shortDescription: "Linked rule to execute",
        icon: <ApartmentOutlined />,
        color: "#faad14",
        generateNode: () => ({ name: "Linked Rule", content: { key: "" } }),
        renderNode: ({ specification, id, selected, data }) => (
          <LinkRuleComponent
            specification={specification}
            id={id}
            isSelected={selected}
            name={data?.name}
            isEditable={isEditable}
          />
        ),
      },
      // Input node - overrides existing one (but duplication occurs atm)
      {
        type: NodeKind.Input,
        displayName: "Request",
        shortDescription: "Provides input context",
        color: "#12AB83",
        icon: <LoginOutlined />,
        disabled: true,
        generateNode: ({ index }) => ({
          name: "Request",
          type: NodeKind.Input,
          content: { fields: [] },
        }),
        renderNode: ({ specification, id, selected, data }) => (
          <RuleInputOutputFieldsComponent
            specification={specification}
            id={id}
            isSelected={selected}
            name={data?.name}
            fieldsTypeLabel="Input"
            setInputOutputSchema={setInputsSchema}
            isEditable={isEditable}
          />
        ),
      },
      // Output node - overrides existing one (but duplication occurs atm)
      {
        type: NodeKind.Output,
        displayName: "Response",
        shortDescription: "Outputs the context",
        color: "#12AB83",
        icon: <LogoutOutlined />,
        disabled: true,
        generateNode: ({ index }) => ({
          name: "Response",
          type: NodeKind.Output,
          content: { fields: [] },
        }),
        renderNode: ({ specification, id, selected, data }) => (
          <RuleInputOutputFieldsComponent
            specification={specification}
            id={id}
            isSelected={selected}
            name={data?.name}
            fieldsTypeLabel="Output"
            setInputOutputSchema={setOutputsSchema}
            isEditable={isEditable}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Simulator custom panel
  const panels: PanelType[] = useMemo(
    () =>
      (runSimulation &&
        setContextToSimulate && [
          {
            id: "simulator",
            title: "Simulator",
            icon: <PlayCircleOutlined />,
            renderPanel: () => (
              <SimulatorPanel
                contextToSimulate={contextToSimulate}
                runSimulation={runSimulation}
                setContextToSimulate={setContextToSimulate}
              />
            ),
          } as PanelType,
        ]) ||
      [],
    [contextToSimulate, runSimulation, setContextToSimulate]
  );

  const customNodes: CustomNodeSpecification<any, any>[] = useMemo(
    () => [
      // Custom notes node
      createJdmNode({
        kind: "noteNode",
        displayName: "Note",
        icon: <BookOutlined />,
        color: "grey",
        generateNode: ({ index }) => ({
          name: "Note",
          kind: "noteNode",
          config: {
            value: "",
          },
        }),
        renderNode: ({ specification, id, selected, data }) => (
          <NotesComponent
            specification={specification}
            id={id}
            isSelected={selected}
            name={data?.name}
            isEditable={isEditable}
          />
        ),
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  if (!ruleContent || !additionalComponents || !panels) {
    return (
      <Spin tip="Loading graph..." size="large" className="spinner">
        <div className="content" />
      </Spin>
    );
  }

  return (
    <JdmConfigProvider>
      <DecisionGraph
        ref={decisionGraphRef}
        value={ruleContent}
        simulate={simulation}
        configurable
        onReactFlowInit={reactFlowInit}
        panels={panels}
        components={additionalComponents}
        customNodes={customNodes}
        onChange={(updatedGraphValue) => updateRuleContent(updatedGraphValue)}
        disabled={!isEditable}
        inputsSchema={inputsSchema}
        outputsSchema={outputsSchema}
      />
    </JdmConfigProvider>
  );
}
