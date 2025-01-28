import React, { useState, useEffect } from "react";
import { Tag, App, FloatButton } from "antd";
import { WarningFilled } from "@ant-design/icons";
import { DecisionGraphType } from "@gorules/jdm-editor";
import { getRuleMap, generateSchemaFromRuleContent } from "@/app/utils/api";
import styles from "./SavePublish.module.css";

interface SavePublishProps {
  filePath: string;
  ruleContent: DecisionGraphType;
  isSaving: boolean;
}

interface MisconnectedField {
  field: string;
  describer: string;
}

export default function SavePublishWarnings({ filePath, ruleContent, isSaving }: SavePublishProps) {
  const { notification } = App.useApp();
  const [misconnectedFields, setMisconnectedFields] = useState<MisconnectedField[]>([]);
  const [misconnectedFieldsPanelOpen, setMisconnectedFieldsPanelOpen] = useState(false);

  const getMisconnectedFields = async () => {
    // TODO: Move these API calls locally to reduce strain on server (if this solution is working well)
    // Get map from input/output nodes
    // exludes the inputs and outputs from linked rules
    const inputOutputSchemaMap = await getRuleMap(filePath, ruleContent);
    const existingKlammInputs = inputOutputSchemaMap.inputs
      .filter((input) => !input.nested)
      .map(({ field }) => field as string);
    const existingKlammOutputs = inputOutputSchemaMap.resultOutputs
      .filter((output) => !output.nested)
      .map(({ field }) => field as string);

    if (!ruleContent?.nodes || ruleContent.nodes.length < 2) return;

    // Get map the old way for comparrison
    const generatedSchemaMap = await generateSchemaFromRuleContent(ruleContent);
    const generatedInputs = generatedSchemaMap.inputs.map(({ field }) => field as string);
    const generatedOutputs = generatedSchemaMap.resultOutputs.map(({ field }) => field as string);

    const updatedMisconnectedFields: MisconnectedField[] = [];

    // Helper function to find missing or unused fields
    const findMisconnectedFields = (sourceFields: string[], targetFields: string[], describer: string) => {
      sourceFields.forEach((field) => {
        if (field && !targetFields.includes(field)) {
          updatedMisconnectedFields.push({ describer, field });
        }
      });
    };

    // Check if there are fields unlinked to Klamm input/output field
    findMisconnectedFields(generatedInputs, existingKlammInputs, "MISSING INPUT");
    findMisconnectedFields(generatedOutputs, existingKlammOutputs, "MISSING OUTPUT");

    // Check if there are fields in input/output schema that are unused
    findMisconnectedFields(existingKlammInputs, generatedInputs, "UNUSED INPUT");
    findMisconnectedFields(existingKlammOutputs, generatedOutputs, "UNUSED OUTPUT");

    setMisconnectedFields(updatedMisconnectedFields);
  };

  const warnOfMisconnectedFields = async () => {
    notification.warning({
      key: "klamm-warning",
      message: "Misconnected Klamm Fields",
      description: (
        <ul className={styles.notificationWarningList}>
          {misconnectedFields.map(({ describer, field }) => (
            <li key={`${describer}:${field}`}>
              <Tag color={describer.includes("UNUSED") ? "orange" : "red"}>
                <small>{describer}</small>
              </Tag>
              {field}
            </li>
          ))}
        </ul>
      ),
      placement: "bottomRight",
      duration: 0,
      onClose: () => setMisconnectedFieldsPanelOpen(false),
    });
  };

  useEffect(() => {
    getMisconnectedFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleContent]);

  useEffect(() => {
    if (isSaving) {
      setMisconnectedFieldsPanelOpen(true);
    }
  }, [isSaving]);

  useEffect(() => {
    if (misconnectedFieldsPanelOpen) {
      if (misconnectedFields.length > 0) {
        warnOfMisconnectedFields();
      } else {
        // Remove notification if there are no warnings
        notification.destroy("klamm-warning");
        setMisconnectedFieldsPanelOpen(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [misconnectedFields, misconnectedFieldsPanelOpen]);

  return (
    <>
      {!misconnectedFieldsPanelOpen && (
        <FloatButton
          icon={<WarningFilled style={{ color: "orange" }} />}
          badge={{ count: misconnectedFields.length, color: "orange" }}
          onClick={() => setMisconnectedFieldsPanelOpen(true)}
        />
      )}
    </>
  );
}
