import React, { useState, useEffect, useRef } from "react";
import { Button, List, Select, Spin, Tooltip, message } from "antd";
import { DeleteOutlined, SyncOutlined } from "@ant-design/icons";
import type { DefaultOptionType } from "antd/es/select";
import type { FlattenOptionData } from "rc-select/lib/interface";
import { GraphNode, useDecisionGraphActions, useDecisionGraphState } from "@gorules/jdm-editor";
import type { GraphNodeProps } from "@gorules/jdm-editor";
import { SchemaSelectProps } from "@/app/types/jdm-editor";
import { KlammBREField } from "@/app/types/klamm";
import { getBREFields, getBREFieldFromName } from "@/app/utils/api";
import { logError } from "@/app/utils/logger";
import styles from "./RuleInputOutputFieldsComponent.module.css";

declare type InputOutputField = {
  id?: string;
  field: string;
  name?: string;
  description?: string;
  dataType?: string;
  validationCriteria?: string;
  validationType?: string;
  childFields?: InputOutputField[];
};

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

  const [inputOutputOptions, setInputOutputOptions] = useState<DefaultOptionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");

  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    // Get the BRE fields from Klamm
    const getFieldsFromKlamm = async () => {
      try {
        if (searchValue) {
          const data: KlammBREField[] = await getBREFields(searchValue);
          const newInputOutputOptions: DefaultOptionType[] = data.map(({ name, label, description }) => ({
            label: `${label}${description ? `: ${description}` : ""}`, // Add the description as part of the label - will be formatted properly later
            value: name,
          }));
          setInputOutputOptions(newInputOutputOptions);
        }
        setIsLoading(false);
      } catch (error: any) {
        logError("Error getting fields from Klamm:", error);
      }
    };
    // Before searching, first set the options to empty and isLoading to true while we wait
    setInputOutputOptions([]);
    setIsLoading(true);
    // Add debounce to the call to get field options from Klamm
    if (timeoutId.current) clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(getFieldsFromKlamm, SEARCH_DEBOUNCE_TIME);
    return () => {
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, [searchValue]);

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
    // Get more information from Klamm
    const klammData: KlammBREField = await getBREFieldFromName(value);
    // Update the node with the information we want to store in the json
    updateNode(id, (draft) => {
      draft.content.fields = draft.content.fields.map((input: InputOutputField) => {
        if (input.id === item.id) {
          // Get important bits of data to store in json
          input.id = klammData.id;
          input.field = klammData.name;
          input.name = klammData.label;
          input.description = klammData.description;
          input.dataType = klammData?.data_type?.name;
          input.validationCriteria = klammData?.data_validation?.validation_criteria;
          input.validationType = klammData?.data_validation?.bre_validation_type?.value;
          // Check if data type is 'object-array'
          if (klammData?.data_type?.name === "object-array") {
            input.childFields =
              klammData?.child_fields &&
              klammData?.child_fields.map((child) => ({
                id: child.id,
                name: child.label,
                field: child.name,
                description: child.description,
                dataType: child?.bre_data_type?.name,
                validationCriteria: child?.bre_data_validation?.validation_criteria,
                validationType: child?.bre_data_validation?.bre_validation_type?.value,
              }));
          } else {
            input.childFields = [];
          }
        }
        return input;
      });
      return draft;
    });
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

  const refreshFromKlamm = async () => {
    setIsLoading(true);
    try {
      const updatedFields = await Promise.all(
        inputOutputFields.map(async (field) => {
          if (field.field) {
            const klammData: KlammBREField = await getBREFieldFromName(field.field);
            return {
              id: klammData.id,
              field: klammData.name,
              name: klammData.label,
              description: klammData.description,
              dataType: klammData?.data_type?.name,
              validationCriteria: klammData?.data_validation?.validation_criteria,
              validationType: klammData?.data_validation?.bre_validation_type?.value,
              childFields:
                klammData?.data_type?.name === "object-array"
                  ? klammData?.child_fields?.map((child) => ({
                      id: child.id,
                      name: child.label,
                      field: child.name,
                      description: child.description,
                      dataType: child?.bre_data_type?.name,
                      validationCriteria: child?.bre_data_validation?.validation_criteria,
                      validationType: child?.bre_data_validation?.bre_validation_type?.value,
                    }))
                  : [],
            };
          }
          return field;
        })
      );

      updateNode(id, (draft) => {
        draft.content.fields = updatedFields;
        return draft;
      });

      message.success("Fields refreshed successfully from Klamm");
    } catch (error: any) {
      logError("Error refreshing fields from Klamm:", error);
      message.error("Failed to refresh fields from Klamm");
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
              <Button
                key="refresh fields"
                type="link"
                onClick={refreshFromKlamm}
                disabled={!isEditable || isLoading}
                aria-live="polite"
                aria-busy={isLoading}
                aria-label="Refresh fields from Klamm"
              >
                {isLoading ? (
                  <Spin size="small" aria-label="Loading..." />
                ) : (
                  <>
                    <span>Refresh Klamm </span>
                    <SyncOutlined />
                  </>
                )}
              </Button>,
            ]
          : []
      }
    >
      {inputOutputFields && inputOutputFields.length > 0 && (
        <List
          size="small"
          dataSource={inputOutputFields}
          renderItem={(item) => (
            <List.Item key={item.field}>
              {isEditable ? (
                <>
                  <Select
                    disabled={!isEditable}
                    showSearch
                    placeholder="Search Klamm fields..."
                    filterOption={() => true}
                    onSearch={(value: string) => setSearchValue(value)}
                    options={inputOutputOptions}
                    onChange={(value) => value && value.value && updateInputField(item, value)}
                    optionLabelProp="label"
                    value={item.field ? { label: item.name, value: item.field } : null}
                    notFoundContent={isLoading ? <Spin size="small" /> : null}
                    style={{ width: 200 }}
                    popupMatchSelectWidth={false}
                    className={styles.inputSelect}
                    labelInValue
                    labelRender={renderSelectLabel}
                    optionRender={renderSelectOption}
                  />
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
