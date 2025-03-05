import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import SavePublishWarnings from "./SavePublishWarnings";
import { getRuleMap, generateSchemaFromRuleContent } from "@/app/utils/api";
import { RULE_VERSION } from "@/app/constants/ruleVersion";

jest.mock("@/app/utils/api", () => ({
  getRuleMap: jest.fn(),
  generateSchemaFromRuleContent: jest.fn(),
}));

describe("SavePublishWarnings", () => {
  let mockNotification: any;

  beforeEach(() => {
    mockNotification = {
      warning: jest.fn(),
    };

    (global as any).App = {
      useApp: () => ({
        notification: {
          ...mockNotification,
        },
      }),
    };

    (getRuleMap as jest.Mock).mockResolvedValue({
      inputs: [{ field: "existingInput" }],
      resultOutputs: [{ field: "existingOutput" }],
    });

    (generateSchemaFromRuleContent as jest.Mock).mockResolvedValue({
      inputs: [{ field: "generatedInput" }],
      resultOutputs: [{ field: "generatedOutput" }],
    });
  });

  const defaultProps = {
    filePath: "/path/to/rule.json",
    ruleContent: {
      nodes: [
        { id: "1", type: "input", name: "Input 1", position: { x: 0, y: 0 } },
        { id: "2", type: "output", name: "Output 1", position: { x: 100, y: 0 } },
      ],
      edges: [],
    },
    isSaving: false,
  };

  describe("Initial Rendering", () => {
    test("renders float button when there are warnings", async () => {
      render(<SavePublishWarnings {...defaultProps} />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    test("shows correct warning count in badge", async () => {
      render(<SavePublishWarnings {...defaultProps} />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(screen.getByText("4")).toBeInTheDocument();
    });
  });

  describe("RuleMap Updates", () => {
    test("updates warnings when ruleMap prop changes", async () => {
      const { rerender } = render(<SavePublishWarnings {...defaultProps} />);

      const newRuleMap = {
        inputs: [{ name: "newInput", value: "", field: "newInput" }],
        outputs: [],
        resultOutputs: [{ name: "newOutput", value: "", field: "newOutput" }],
      };

      rerender(<SavePublishWarnings {...defaultProps} ruleMap={newRuleMap} />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(getRuleMap).toHaveBeenCalled();
    });

    test("updates warnings when ruleContent changes", async () => {
      const { rerender } = render(<SavePublishWarnings {...defaultProps} />);

      const newContent = {
        nodes: [
          { id: "3", type: "input", name: "Input 3", position: { x: 0, y: 0 } },
          { id: "4", type: "output", name: "Output 4", position: { x: 100, y: 0 } },
        ],
        edges: [],
      };

      rerender(<SavePublishWarnings {...defaultProps} ruleContent={newContent} version={RULE_VERSION.draft} />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(generateSchemaFromRuleContent).toHaveBeenCalledWith(newContent, RULE_VERSION.draft);
    });
  });
});
