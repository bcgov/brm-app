import React, { useState, useEffect } from "react";
import { App, Button, Drawer, Flex, Select, Spin, Tag } from "antd";
import { DefaultOptionType } from "antd/es/cascader";
import { EditOutlined } from "@ant-design/icons";
import { GraphNode, useDecisionGraphActions, useDecisionGraphState } from "@gorules/jdm-editor";
import type { DecisionGraphType, GraphNodeProps } from "@gorules/jdm-editor";
import { RULE_VERSION } from "@/app/constants/ruleVersion";
import { getAllRuleData } from "@/app/utils/api";
import { getShortFilenameOnly, getVersionColor } from "@/app/utils/utils";
import { fetchRuleContentByVersion } from "@/app/hooks/getRuleDataForVersion";
import RuleManager from "../../RuleManager";
import styles from "./LinkRuleComponent.module.css";

interface LinkRuleComponent extends GraphNodeProps {
  isEditable: boolean;
}

const getFilepathAndVersionFromKey = (key: string) => {
  const filepathMatches = key?.split("?version=");
  if (!filepathMatches) {
    return { filepath: key, version: "released" };
  }
  return { filepath: filepathMatches[0], version: filepathMatches[1] || "released" };
};

export default function LinkRuleComponent({ specification, id, isSelected, name, isEditable }: LinkRuleComponent) {
  const { updateNode } = useDecisionGraphActions();
  const node = useDecisionGraphState((state) => (state.decisionGraph?.nodes || []).find((n) => n.id === id));
  const { filepath, version } = getFilepathAndVersionFromKey(node?.content?.key);

  const { message } = App.useApp();
  const [openRuleDrawer, setOpenRuleDrawer] = useState(false);
  const [ruleOptions, setRuleOptions] = useState<DefaultOptionType[]>([]);
  const [selectedRuleContent, setSelectedRuleContent] = useState<DecisionGraphType | null>();

  const updateRuleContent = async (updatedJsonFilename: string, version: string) => {
    try {
      const ruleContent = await fetchRuleContentByVersion(updatedJsonFilename, version);
      setSelectedRuleContent(ruleContent);
    } catch (error) {
      console.error("Error fetching rule content", error);
      setSelectedRuleContent(null);
    }
  };

  useEffect(() => {
    const getRuleOptions = async () => {
      const ruleData = await getAllRuleData();
      setRuleOptions(
        ruleData?.data.map(({ title, filepath }) => ({
          label: title || filepath,
          value: filepath,
        }))
      );
    };
    if (openRuleDrawer) {
      getRuleOptions();
    }
  }, [openRuleDrawer]);

  useEffect(() => {
    if (filepath) {
      updateRuleContent(filepath, version);
    }
  }, [filepath, version]);

  const showRuleDrawer = () => {
    setOpenRuleDrawer(true);
  };

  const closeRuleDrawer = () => {
    if (selectedRuleContent === null) {
      onChangeSelectionVersion("released");
      message.error("Linked rule switched back to released version since rule content didn't exist for version");
    }
    setOpenRuleDrawer(false);
  };

  const onChangeSelection = (updatedJsonFilename: string) => {
    // Update the graph with the jsonFilename. We use "key" to keep in line with how goRules handing linking rules
    updateNode(id, (draft) => {
      draft.content = { ...draft.content, key: updatedJsonFilename };
      return draft;
    });
  };

  const onChangeSelectionVersion = (updatedVersion: string) => {
    // Update the graph with the jsonFilename. We use "key" to keep in line with how goRules handing linking rules
    updateNode(id, (draft) => {
      // Remove any version key if one already exists
      if (draft.content?.key?.includes("?version=")) {
        draft.content.key = draft.content.key.split("?version=")[0];
      }
      // If updating version to something other than 'released', add the version key
      if (updatedVersion !== "released") {
        draft.content.key += `?version=${updatedVersion}`;
      }
      return draft;
    });
  };

  return (
    <GraphNode id={id} specification={specification} name={name} isSelected={isSelected} className={styles.ruleNode}>
      <Button onClick={showRuleDrawer}>
        {filepath ? getShortFilenameOnly(filepath) : "Add rule"}
        <EditOutlined />
      </Button>
      {version && version !== "released" && (
        <div className={styles.versionTag}>
          <Tag color={getVersionColor(version)}>{version.toUpperCase()}</Tag>
        </div>
      )}
      <Drawer title={name} onClose={closeRuleDrawer} open={openRuleDrawer} width="80%">
        {ruleOptions ? (
          <>
            <Flex gap="small">
              {isEditable && (
                <Select
                  disabled={!isEditable}
                  placeholder="Select version"
                  options={[
                    { label: "Draft", value: "draft" },
                    { label: "In Review", value: "inReview" },
                    { label: "Released", value: "released" },
                  ]}
                  value={version}
                  onChange={onChangeSelectionVersion}
                />
              )}
              <Select
                disabled={!isEditable}
                showSearch
                placeholder="Select rule"
                filterOption={(input, option) =>
                  (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
                }
                options={ruleOptions}
                onChange={onChangeSelection}
                value={filepath}
                className={styles.ruleSelect}
              />
              <Button onClick={closeRuleDrawer}>Done</Button>
            </Flex>
            {filepath && (
              <RuleManager
                ruleInfo={{ _id: id, filepath }}
                initialRuleContent={selectedRuleContent}
                version={(version as RULE_VERSION) || false}
                showAllScenarioTabs={false}
                showHeader={false}
              />
            )}
          </>
        ) : (
          <Spin tip="Loading rules..." size="large" className="spinner">
            <div className="content" />
          </Spin>
        )}
      </Drawer>
    </GraphNode>
  );
}
