import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { env } from "next-runtime-env";
import { Button, Input, List, Select, Spin, Tooltip, message } from "antd";
import { DeleteOutlined, SyncOutlined } from "@ant-design/icons";
import type { DefaultOptionType } from "antd/es/select";
import type { FlattenOptionData } from "rc-select/lib/interface";
import { logError } from "@/app/utils/logger";
import { GraphNode, useDecisionGraphActions, useDecisionGraphState } from "@gorules/jdm-editor";
import type { GraphNodeProps } from "@gorules/jdm-editor";
import { SchemaSelectProps } from "@/app/types/jdm-editor";
import { InputOutputField } from "./InputOutputField";
import KlammRuleInputOutputDataSource from "./KlammRuleInputOutputDataSource";
import styles from "./RuleInputOutputFieldsComponent.module.css";

interface RuleInputOutputFieldsComponent extends GraphNodeProps {
  fieldsTypeLabel: string;
  setInputOutputSchema: (schema: SchemaSelectProps[]) => void;
  isEditable: boolean;
}

const SEARCH_DEBOUNCE_TIME = 500;

export default function RuleInputOutputFieldsComponent({
  specification,
  id,
  isSelected,
  name,
  fieldsTypeLabel = "Input",
  setInputOutputSchema,
  isEditable,
}: RuleInputOutputFieldsComponent) {
  const { updateNode } = useDecisionGraphActions();
  const node = useDecisionGraphState((state) => (state.decisionGraph?.nodes || []).find((n) => n.id === id));
  const inputOutputFields: InputOutputField[] = node?.content?.fields || [];

  const [inputOutputSource, setInputOutputSource] = useState<{
    getFieldsFromSource: (searchValue: string) => Promise<DefaultOptionType[]>;
    getInfoForField: (field: string) => any;
    refreshFields: (fields: InputOutputField[]) => Promise<InputOutputField[]>;
  } | null>(null);
  const [inputOutputOptions, setInputOutputOptions] = useState<DefaultOptionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    // This is where we would set the data source for input/output fields
    // Currently only Klamm is supported but an alternative source could be added here
    if (env("NEXT_PUBLIC_KLAMM_URL")) {
      setInputOutputSource(KlammRuleInputOutputDataSource);
    }
  }, []);

  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!inputOutputSource?.getFieldsFromSource) return;
    // Get the BRE fields from data source such as Klamm
    const getFieldsFromSource = async () => {
      try {
        if (searchValue) {
          const newInputOutputOptions: DefaultOptionType[] = await inputOutputSource.getFieldsFromSource(searchValue);
          setInputOutputOptions(newInputOutputOptions);
        }
        setIsLoading(false);
      } catch (error: any) {
        logError("Error getting fields from Data Source:", error);
      }
    };
    // Before searching, first set the options to empty and isLoading to true while we wait
    setInputOutputOptions([]);
    setIsLoading(true);
    // Add debounce to the call to get field options from source provider
    if (timeoutId.current) clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(getFieldsFromSource, SEARCH_DEBOUNCE_TIME);
    return () => {
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, [inputOutputSource, searchValue]);

  useEffect(() => {
    // Add a new field by default if one doesn't exist when editing
    if (isEditable && inputOutputFields?.length == 0) {
      updateNode(id, (draft) => {
        draft.content = { fields: [{ field: "", name: "" }] };
        return draft;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (inputOutputFields?.length == 0) return;
    // Map the fields from the schema
    const schemafiedInputs = inputOutputFields.filter(({ field }) => field).map(({ field, name }) => ({ field, name }));
    setInputOutputSchema(schemafiedInputs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputOutputFields]);

  const addInputField = () => {
    updateNode(id, (draft) => {
      if (!draft.content?.fields) {
        draft.content = { fields: [] };
      }
      draft.content.fields.push({ field: "", name: "" });
      return draft;
    });
  };

  const updateInputField = async (item: InputOutputField, { value, label }: { value: string; label?: string }) => {
    // Set initial values from selection
    updateNode(id, (draft) => {
      draft.content.fields = draft.content.fields.map((input: InputOutputField) => {
        if (input.id === item.id) {
          input.field = value;
          input.name = label;
        }
        return input;
      });
      return draft;
    });
    // Update value from input/output source if it exists
    if (inputOutputSource?.getInfoForField) {
      // Get the field data from the source
      const inputData = inputOutputSource.getInfoForField(value);
      // Update the appropriate node with the source data
      updateNode(id, (draft) => {
        draft.content.fields = draft.content.fields.map((input: InputOutputField) => {
          if (input.id === item.id) {
            input = { ...input, ...inputData };
          }
          return input;
        });
        return draft;
      });
    }
  };

  const deleteInputField = (item: InputOutputField) => {
    updateNode(id, (draft) => {
      draft.content.fields = draft.content.fields.filter((input: InputOutputField) => input.id !== item.id);
      return draft;
    });
  };

  const renderSelectLabel = ({ label }: { label: React.ReactNode }) => {
    if (!label) {
      return null;
    }
    const [name] = label?.toString().split(":"); // first part of label is the name (don't want description here)
    return name;
  };

  const renderSelectOption = ({ label }: FlattenOptionData<DefaultOptionType>) => {
    if (!label) {
      return null;
    }
    const [name, description] = label?.toString().split(":");
    return (
      <>
        <span>{name}</span>
        {description ? <span className={styles.selectDescription}>{description}</span> : ""}
      </>
    );
  };

  const renderLabel = (label: string) => {
    const [name, description] = label?.toString().split(":");
    return (
      <Tooltip title={description} placement="left">
        <span>{name}</span>
      </Tooltip>
    );
  };

  const refreshAllFields = async () => {
    setIsLoading(true);
    try {
      const updatedFields = await inputOutputSource?.refreshFields(inputOutputFields);
      updateNode(id, (draft) => {
        draft.content.fields = updatedFields;
        return draft;
      });
      message.success("Fields refreshed successfully from data source");
    } catch (error: any) {
      logError("Error refreshing fields from data source:", error);
      message.error("Failed to refresh fields from data source");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GraphNode
      id={id}
      specification={specification}
      name={name}
      isSelected={isSelected}
      actions={
        isEditable
          ? [
              <Button
                key="add row"
                type="link"
                onClick={addInputField}
                disabled={!isEditable}
                aria-label={`Add ${fieldsTypeLabel}`}
              >
                Add {fieldsTypeLabel} +
              </Button>,
              inputOutputSource?.refreshFields && (
                <Button
                  key="refresh fields"
                  type="link"
                  onClick={refreshAllFields}
                  disabled={!isEditable || isLoading}
                  aria-live="polite"
                  aria-busy={isLoading}
                  aria-label="Refresh fields from data source"
                >
                  {isLoading ? (
                    <Spin size="small" aria-label="Loading..." />
                  ) : (
                    <>
                      <span>Refresh from source </span>
                      <SyncOutlined />
                    </>
                  )}
                </Button>
              ),
            ]
          : []
      }
      className={styles.ruleNode}
    >
      {inputOutputFields && inputOutputFields.length > 0 && (
        <List
          size="small"
          dataSource={inputOutputFields}
          renderItem={(item) => (
            <List.Item key={item.field}>
              {isEditable ? (
                <>
                  {inputOutputSource?.getFieldsFromSource ? (
                    <Select
                      disabled={!isEditable}
                      showSearch
                      placeholder="Search fields..."
                      filterOption={() => true}
                      onSearch={(value: string) => setSearchValue(value)}
                      options={inputOutputOptions}
                      onChange={(value) => value && value.value && updateInputField(item, value)}
                      optionLabelProp="label"
                      value={item.field ? { label: item.name, value: item.field } : null}
                      notFoundContent={isLoading ? <Spin size="small" /> : null}
                      style={{ width: 200 }}
                      popupMatchSelectWidth={600}
                      className={styles.inputSelect}
                      labelInValue
                      labelRender={renderSelectLabel}
                      optionRender={renderSelectOption}
                    />
                  ) : (
                    <Input
                      placeholder="Field name"
                      defaultValue={item.field}
                      onBlur={({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
                        updateInputField(item, { value })
                      }
                    />
                  )}
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    style={{ marginLeft: "4px" }}
                    onClick={() => deleteInputField(item)}
                    disabled={!isEditable}
                  />
                </>
              ) : (
                item.name && <span>{renderLabel(item.name)}</span>
              )}
            </List.Item>
          )}
        />
      )}
    </GraphNode>
  );
}
