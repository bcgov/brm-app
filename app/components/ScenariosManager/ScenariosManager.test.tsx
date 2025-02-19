import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ScenariosManager, { ScenariosManagerTabs } from "./ScenariosManager";
import { Scenario } from "@/app/types/scenario";
import { RuleMap } from "@/app/types/rulemap";
import { RULE_VERSION } from "@/app/constants/ruleVersion";

jest.mock("./ScenarioViewer", () => ({
  __esModule: true,
  default: () => <div data-testid="scenario-viewer">ScenarioViewer</div>,
}));

jest.mock("./ScenarioGenerator", () => ({
  __esModule: true,
  default: () => <div data-testid="scenario-generator">ScenarioGenerator</div>,
}));

jest.mock("./ScenarioResults", () => ({
  __esModule: true,
  default: () => <div data-testid="scenario-results">ScenarioResults</div>,
}));

jest.mock("./ScenarioCSV", () => ({
  __esModule: true,
  default: () => <div data-testid="scenario-csv">ScenarioCSV</div>,
}));

jest.mock("./IsolationTester", () => ({
  __esModule: true,
  default: () => <div data-testid="isolation-tester">IsolationTester</div>,
}));

jest.mock("./ScenarioHelper/ScenarioHelper", () => ({
  __esModule: true,
  default: () => <div data-testid="scenarios-helper">ScenariosHelper</div>,
}));

jest.mock("antd", () => ({
  Flex: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="reset-button">
      {children}
    </button>
  ),
  Tabs: ({ items, onChange, activeKey, tabBarExtraContent }: any) => (
    <div data-testid="tabs">
      {tabBarExtraContent?.left}
      {items.map((item: any) => (
        <div key={item.key} data-testid={`tab-${item.key}`} onClick={() => onChange(item.key)}>
          {item.label}
          {activeKey === item.key && item.children}
        </div>
      ))}
    </div>
  ),
}));

describe("ScenariosManager", () => {
  const mockScenarios: Scenario[] = [
    {
      _id: "1",
      title: "Test Scenario",
      ruleID: "rule1",
      filepath: "/test/path",
      variables: [],
      expectedResults: [],
    },
  ];

  const mockRulemap: RuleMap = {
    inputs: [],
    outputs: [],
    resultOutputs: [],
  };

  const defaultProps = {
    ruleId: "rule1",
    ruleInfo: {
      _id: "rule1",
      name: "Test Rule",
      filepath: "/test/path",
    },
    jsonFile: "test.json",
    ruleContent: {
      nodes: [],
      edges: [],
    },
    rulemap: mockRulemap,
    scenarios: mockScenarios,
    setScenarios: jest.fn(),
    isEditing: true,
    createRuleMap: jest.fn(),
    setSimulationContext: jest.fn(),
    runSimulation: jest.fn(),
    version: RULE_VERSION.draft,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Rendering", () => {
    test("renders with default tab when showAllScenarioTabs is false", () => {
      render(<ScenariosManager {...defaultProps} showAllScenarioTabs={false} />);
      expect(screen.getByTestId(`tab-${ScenariosManagerTabs.ScenariosTab}`)).toBeInTheDocument();
      expect(screen.getByTestId(`tab-${ScenariosManagerTabs.InputsTab}`)).toBeInTheDocument();
      expect(screen.queryByTestId(`tab-${ScenariosManagerTabs.ResultsTab}`)).not.toBeInTheDocument();
    });

    test("renders all tabs when showAllScenarioTabs is true", () => {
      render(<ScenariosManager {...defaultProps} showAllScenarioTabs={true} />);
      expect(screen.getByTestId(`tab-${ScenariosManagerTabs.ScenariosTab}`)).toBeInTheDocument();
      expect(screen.getByTestId(`tab-${ScenariosManagerTabs.InputsTab}`)).toBeInTheDocument();
      expect(screen.getByTestId(`tab-${ScenariosManagerTabs.ResultsTab}`)).toBeInTheDocument();
      expect(screen.getByTestId(`tab-${ScenariosManagerTabs.CSVTab}`)).toBeInTheDocument();
      expect(screen.getByTestId(`tab-${ScenariosManagerTabs.IsolationTesterTab}`)).toBeInTheDocument();
    });

    test("shows scenarios helper when showAllScenarioTabs is true", () => {
      render(<ScenariosManager {...defaultProps} showAllScenarioTabs={true} />);
      expect(screen.getByTestId("scenarios-helper")).toBeInTheDocument();
    });
  });

  describe("Tab Switching", () => {
    test("switches tabs and resets context", () => {
      render(<ScenariosManager {...defaultProps} showAllScenarioTabs={true} />);

      fireEvent.click(screen.getByTestId(`tab-${ScenariosManagerTabs.InputsTab}`));
      expect(defaultProps.setSimulationContext).toHaveBeenCalledWith({});
      expect(defaultProps.createRuleMap).toHaveBeenCalled();
    });
  });

  describe("Reset Functionality", () => {
    test("resets simulation context when reset button is clicked", () => {
      render(<ScenariosManager {...defaultProps} showAllScenarioTabs={true} />);

      fireEvent.click(screen.getByTestId(`tab-${ScenariosManagerTabs.InputsTab}`));
      const resetButton = screen.getByTestId("reset-button");
      fireEvent.click(resetButton);

      expect(defaultProps.setSimulationContext).toHaveBeenCalledWith({});
      expect(defaultProps.createRuleMap).toHaveBeenCalled();
    });
  });
});
