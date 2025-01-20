import { useState, useEffect } from "react";
import { Checkbox, Space } from "antd";
import { Scenario } from "@/app/types/scenario";

interface ScenarioSelectionContentProps {
  scenarios: Scenario[];
  onComplete: (selectedScenarios: Scenario[]) => void;
}

export default function ScenarioSelectionContent({ scenarios, onComplete }: ScenarioSelectionContentProps) {
  const [selections, setSelections] = useState(scenarios.map((scenario) => ({ scenario, selected: true })));

  useEffect(() => {
    onComplete(selections.filter((s) => s.selected).map((s) => s.scenario));
  }, [selections, onComplete]);

  return (
    <div style={{ maxHeight: "400px", overflowY: "auto", marginTop: "20px" }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Checkbox
          checked={selections.every((s) => s.selected)}
          indeterminate={selections.some((s) => s.selected) && !selections.every((s) => s.selected)}
          onChange={(e) => {
            setSelections((prev) =>
              prev.map((s) => ({
                ...s,
                selected: e.target.checked,
              }))
            );
          }}
        >
          Select All
        </Checkbox>
        <div style={{ borderBottom: "1px solid var(--color-border-default)", margin: "0.5rem 0" }} />
        {selections.map((item, index) => (
          <Checkbox
            key={index}
            checked={item.selected}
            onChange={(e) => {
              setSelections((prev) => {
                const updated = [...prev];
                updated[index] = {
                  ...updated[index],
                  selected: e.target.checked,
                };
                return updated;
              });
            }}
          >
            {item.scenario.title}
          </Checkbox>
        ))}
      </Space>
    </div>
  );
}
