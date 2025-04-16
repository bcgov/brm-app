"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Space, Typography, Divider, Steps, Table, Collapse } from "antd";
import styles from "@/app/myss/rule.module.css";
import Link from "next/link";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// Helper to format output based on BRE structure
const formatOutputWithBRE = (outputs: any, breStructure: any) => {
  if (!outputs || !breStructure?.data?.rule_outputs) return outputs;

  const formattedOutput: Record<string, any> = {};

  // Process output fields based on BRE structure
  breStructure.data.rule_outputs.forEach((outputField: any) => {
    if (outputs.result && outputs.result[outputField.name] !== undefined) {
      formattedOutput[outputField.label || outputField.name] = {
        value: outputs.result[outputField.name],
        description: outputField.description || null,
        dataType: outputField.bre_data_type?.name || null,
      };
    }
  });

  return Object.keys(formattedOutput).length > 0 ? formattedOutput : outputs;
};

export default function RuleComplete() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentRule = searchParams.get("parentRule");
  const parentRuleId = searchParams.get("parentRuleId");
  const [outputs, setOutputs] = useState<Record<string, any> | null>(null);
  const [linkedRulePath, setLinkedRulePath] = useState<any[]>([]);
  const [breStructure, setBreStructure] = useState<any>(null);
  const [formattedOutputs, setFormattedOutputs] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    // Try to get the stored rule outputs
    try {
      const storedOutputs = sessionStorage.getItem("ruleOutputs");
      const storedBreStructure = sessionStorage.getItem("breRuleStructure");

      if (storedOutputs) {
        const parsedOutputs = JSON.parse(storedOutputs);
        setOutputs(parsedOutputs);

        // Try to get BRE structure if available
        if (storedBreStructure) {
          const parsedBreStructure = JSON.parse(storedBreStructure);
          setBreStructure(parsedBreStructure);

          // Format outputs using BRE structure
          const formatted = formatOutputWithBRE(parsedOutputs, parsedBreStructure);
          setFormattedOutputs(formatted);
        } else {
          setFormattedOutputs(parsedOutputs);
        }

        // Check for linked rules
        if (
          parsedOutputs.linkedRules &&
          Array.isArray(parsedOutputs.linkedRules) &&
          parsedOutputs.linkedRules.length > 0
        ) {
          setLinkedRulePath(parsedOutputs.linkedRules);
        }
      }
    } catch (error) {
      console.error("Error loading saved rule outputs:", error);
    }
  }, []);

  // Clear session storage when leaving page
  useEffect(() => {
    return () => {
      sessionStorage.removeItem("ruleOutputs");
      sessionStorage.removeItem("breRuleStructure");
    };
  }, []);

  const linkUrl = parentRuleId ? `/myss/${parentRule}?ruleId=${parentRuleId}` : `/myss/${parentRule}`;

  const renderOutput = (output: any) => {
    if (typeof output === "object" && output !== null) {
      if (output.value !== undefined) {
        return (
          <div>
            <div>
              <strong>Value:</strong> {String(output.value)}
            </div>
            {output.description && (
              <div>
                <Text type="secondary">Description: {output.description}</Text>
              </div>
            )}
          </div>
        );
      } else {
        return <pre>{JSON.stringify(output, null, 2)}</pre>;
      }
    }
    return String(output);
  };

  return (
    <div className={styles.fullWidthWrapper}>
      <Card className={styles.completeCard}>
        <Title level={2} style={{ textAlign: "center" }}>
          Rule Process Completed
        </Title>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          {parentRule && (
            <p>
              Parent rule: <Text strong>{parentRule}</Text>
            </p>
          )}

          {/* Show linked rule execution path if it exists */}
          {linkedRulePath.length > 0 && (
            <div className={styles.linkedRulePath}>
              <Divider>Rule Execution Path</Divider>
              <Steps
                direction="vertical"
                current={linkedRulePath.length}
                items={[
                  {
                    title: outputs?.originalParentRule || parentRule,
                    description: "Starting Rule",
                    status: "finish",
                  },
                  ...linkedRulePath.map((rule) => ({
                    title: rule.name,
                    description: `${rule.performance || ""}`,
                    status: "finish",
                  })),
                ]}
              />
              <Divider />
            </div>
          )}

          {outputs && (
            <Card title="Rule Results" style={{ marginTop: "20px", textAlign: "left" }}>
              {/* Display rule name if available */}
              {outputs.ruleLabel && <Title level={4}>{outputs.ruleLabel}</Title>}

              {/* Show inputs separately */}
              <Title level={5}>Your Inputs</Title>
              {breStructure?.data?.rule_inputs ? (
                <Table
                  dataSource={breStructure.data.rule_inputs.map((input: any) => ({
                    key: input.name,
                    name: input.label || input.name,
                    value: outputs[parentRule || ""]?.[input.name] || "Not provided",
                    description: input.description || "",
                  }))}
                  columns={[
                    { title: "Field", dataIndex: "name", key: "name" },
                    { title: "Value", dataIndex: "value", key: "value" },
                    {
                      title: "Description",
                      dataIndex: "description",
                      key: "description",
                      render: (text) => <Text type="secondary">{text}</Text>,
                    },
                  ]}
                  pagination={false}
                />
              ) : (
                <pre>{JSON.stringify(outputs[parentRule || ""] || {}, null, 2)}</pre>
              )}

              <Divider />

              {/* Show decision engine results */}
              {outputs.result && (
                <>
                  <Title level={5}>Decision Engine Results</Title>
                  {formattedOutputs && breStructure?.data?.rule_outputs ? (
                    <Collapse defaultActiveKey={["results"]}>
                      <Panel header="View Results" key="results">
                        <Table
                          dataSource={Object.entries(formattedOutputs).map(([key, value]) => ({
                            key,
                            name: key,
                            value: renderOutput(value),
                          }))}
                          columns={[
                            { title: "Output Field", dataIndex: "name", key: "name" },
                            {
                              title: "Result",
                              dataIndex: "value",
                              key: "value",
                              render: (value) => value,
                            },
                          ]}
                          pagination={false}
                        />
                      </Panel>
                    </Collapse>
                  ) : (
                    <pre>{JSON.stringify(outputs.result, null, 2)}</pre>
                  )}
                </>
              )}
            </Card>
          )}
        </div>

        <Space style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
          <Link href="/myss">
            <Button>Return to Rules List</Button>
          </Link>
          {outputs?.originalParentRule && (
            <Link href={`/myss/${outputs.originalParentRule}?ruleId=${outputs.originalParentRuleId}`}>
              <Button type="primary">Start Over</Button>
            </Link>
          )}
          {!outputs?.originalParentRule && parentRule && (
            <Link href={linkUrl}>
              <Button type="primary">Start Over</Button>
            </Link>
          )}
        </Space>
      </Card>
    </div>
  );
}
