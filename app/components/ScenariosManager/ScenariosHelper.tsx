import React, { useState } from "react";
import Image from "next/image";
import { Drawer, Button, Flex, Tooltip } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { ScenariosManagerTabs } from "./ScenariosManager";
import styles from "./ScenariosHelper.module.css";

interface ScenariosHelperProps {
  section?: string;
}

export default function ScenariosHelper({ section }: ScenariosHelperProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const getTitle = () => {
    switch (section) {
      case ScenariosManagerTabs.ScenariosTab:
        return "Simulate Scenarios";
      case ScenariosManagerTabs.InputsTab:
        return "Simulate Manual Inputs";
      case ScenariosManagerTabs.ResultsTab:
        return "Scenario Results";
      case ScenariosManagerTabs.CSVTab:
        return "CSV Tests";
      case ScenariosManagerTabs.IsolationTesterTab:
        return "Isolation Tester";
      default:
        return "";
    }
  };

  const getSectionContent = () => {
    switch (section) {
      case ScenariosManagerTabs.ScenariosTab:
        return (
          <div className={styles.introBody}>
            <div className={styles.introSection}>
              <p>
                Individual Scenarios are simulated through this tab. Each individual scenario that is saved to this rule
                can be run one at a time.
              </p>
              <p>
                Scenarios are shared across all versions of the rule. This allows users to see how different versions of
                a rule interact with various different scenarios.
              </p>
              <p>There are three main functions of this tab:</p>
              <ul className={styles.subList}>
                <li>
                  <a href="#simulating">1. Simulating Scenarios</a>
                </li>
                <li>
                  <a href="#managing">2. Managing Scenarios</a>
                </li>
                <li>
                  <a href="#editing">3. Editing Scenario Names</a>
                </li>
              </ul>
            </div>

            <Image
              src="/images/simulate-scenarios-tab.png"
              alt="Simulate Scenarios Tab"
              width={0}
              height={0}
              sizes="100vw"
              className={styles.scenarioImage}
            />

            <div className={styles.sectionsContainer}>
              <section id="simulating">
                <h2 className={styles.sectionHeading}>1. Simulating Scenarios</h2>
                <div className={styles.sectionContent}>
                  <p>
                    Saved scenarios are run by selecting the scenario name in the table, and clicking on the simulate
                    button.
                  </p>
                  <p>
                    The scenario's saved inputs for the rule are shown in the 'Inputs' window, and the final results
                    will be processed in real time through the current visible version of the rule, and returned in the
                    'Decision' window.
                  </p>
                  <p>
                    By running rules individually, you can track their progress as the scenario is processed by the
                    rule. The pathway is denoted by green highlight on the nodes and components the rule assessment runs
                    through in the decision graph.
                  </p>
                  <p>
                    Decision tables will also highlight in green the specific line that a rule is processed as meeting.
                  </p>
                </div>
              </section>

              <section id="managing">
                <h2 className={styles.sectionHeading}>2. Managing Scenarios</h2>
                <div className={styles.sectionContent}>
                  <p>
                    Scenarios can be managed by adding new scenarios, editing existing scenarios, or deleting scenarios
                    from the rule.
                  </p>
                  <p>To begin managing scenarios, click on the 'Manage Scenarios' button.</p>
                  <p>
                    This will enable three new functionalities. You will now be able to edit the scenario name, edit the
                    scenario inputs, or delete a scenario.
                  </p>
                  <p>
                    Clicking on the edit button will redirect you to the 'Simulate manual inputs' tab to update the
                    inputs and expected results for a scenario.
                  </p>
                </div>
              </section>

              <section id="editing">
                <h2 className={styles.sectionHeading}>3. Editing Scenario Names</h2>
                <div className={styles.sectionContent}>
                  <p>The 'Manage Scenarios' Button also enables the ability to rename existing scenarios.</p>
                  <p>Scenarios can be renamed by clicking on the scenario name in the table, and editing the name.</p>
                  <p>
                    Scenario names must be unique within a rule, and you will not be allowed to rename the scenario if
                    the given name is the same as another scenario.
                  </p>
                  <p>
                    When you are done editing the name, hit return, or click outside of the text box to save your new
                    scenario name.
                  </p>
                </div>
              </section>
            </div>
          </div>
        );
      case ScenariosManagerTabs.InputsTab:
        return (
          <div className={styles.introBody}>
            <div className={styles.introSection}>
              <p>
                The Simulate Manual Inputs tab allows you to test scenarios by manually entering input values and
                running them through the rule. This tab provides several key features for testing and validating rule
                behavior.
              </p>
              <p>There are seven main features in this tab:</p>
              <ol className={styles.subList}>
                <li>
                  <a href="#inputs">Inputs</a>
                </li>
                <li>
                  <a href="#info">Input Information</a>
                </li>
                <li>
                  <a href="#reset-inputs">Reset Individual Inputs</a>
                </li>
                <li>
                  <a href="#simulate">Running and Saving Scenarios</a>
                </li>
                <li>
                  <a href="#results">Results View</a>
                </li>
                <li>
                  <a href="#expected">Expected Results</a>
                </li>
                <li>
                  <a href="#reset-all">Reset All</a>
                </li>
              </ol>
            </div>

            <Image
              src="/images/simulate-manual-inputs-tab.png"
              alt="Simulate Manual Inputs Tab"
              width={0}
              height={0}
              sizes="100vw"
              className={styles.scenarioImage}
            />

            <div className={styles.sectionsContainer}>
              <section id="inputs">
                <h2 className={styles.sectionHeading}>1. Inputs</h2>
                <div className={styles.sectionContent}>
                  <p>
                    Input fields allow you to enter values for testing your rule. Each input field corresponds to a
                    variable defined in KLAMM.
                  </p>
                  <p>
                    Fields can be left blank if needed, and the type of input allowed (text, number, etc.) is determined
                    by the types and validations set in KLAMM.
                  </p>
                </div>
              </section>

              <section id="info">
                <h2 className={styles.sectionHeading}>2. Input Information</h2>
                <div className={styles.sectionContent}>
                  <p>
                    Each input field has an associated info button that provides detailed information about the input.
                  </p>
                  <p>
                    Clicking this button reveals the input's description and provides a direct link to its entry in
                    KLAMM, allowing you to quickly reference the input's full specification.
                  </p>
                </div>
              </section>

              <section id="reset-inputs">
                <h2 className={styles.sectionHeading}>3. Reset Individual Inputs</h2>
                <div className={styles.sectionContent}>
                  <p>
                    Each input field has a reset button that clears the current value, returning it to a null state.
                  </p>
                  <p>This allows you to quickly clear individual inputs without affecting other fields.</p>
                </div>
              </section>

              <section id="simulate">
                <h2 className={styles.sectionHeading}>4. Running and Saving Scenarios</h2>
                <div className={styles.sectionContent}>
                  <p>The simulate button runs your current inputs through the rule to generate results.</p>
                  <p>
                    After a successful simulation, you'll have the option to save these inputs as a new scenario. This
                    includes a field to name your scenario and a save button to store it for future use.
                  </p>
                </div>
              </section>

              <section id="results">
                <h2 className={styles.sectionHeading}>5. Results View</h2>
                <div className={styles.sectionContent}>
                  <p>
                    The results section displays the outcome of your rule simulation, showing how your inputs were
                    processed and what decisions were made.
                  </p>
                  <p>
                    This view updates each time you run a simulation, allowing you to see how different inputs affect
                    the rule's output.
                  </p>
                </div>
              </section>

              <section id="expected">
                <h2 className={styles.sectionHeading}>6. Expected Results</h2>
                <div className={styles.sectionContent}>
                  <p>
                    The expected results field allows you to specify what output you anticipate from your given inputs.
                  </p>
                  <p>
                    This feature helps validate that your rule is functioning as intended by comparing actual results
                    against expected outcomes.
                  </p>
                </div>
              </section>

              <section id="reset-all">
                <h2 className={styles.sectionHeading}>7. Reset All</h2>
                <div className={styles.sectionContent}>
                  <p>
                    The reset all button provides a quick way to clear all inputs, expected results, and actual results
                    from the tab.
                  </p>
                  <p>This allows you to quickly start fresh with a new test scenario.</p>
                </div>
              </section>
            </div>
          </div>
        );
      case ScenariosManagerTabs.ResultsTab:
        return (
          <div className={styles.introBody}>
            <div className={styles.introSection}>
              <p>
                The Scenario Results tab provides an overview of all scenarios and their current status. This tab allows
                you to manage and monitor the results of your scenarios across all versions of the rule.
              </p>
              <p>There are four main features in this tab:</p>
              <ol className={styles.subList}>
                <li>
                  <a href="#rerun">Re-Run Scenarios</a>
                </li>
                <li>
                  <a href="#status">Scenario Status</a>
                </li>
                <li>
                  <a href="#error-details">Error Details</a>
                </li>
                <li>
                  <a href="#table-controls">Table Controls</a>
                </li>
              </ol>
            </div>

            <Image
              src="/images/scenario-results-tab.png"
              alt="Scenario Results Tab"
              width={0}
              height={0}
              sizes="100vw"
              className={styles.scenarioImage}
            />

            <div className={styles.sectionsContainer}>
              <section id="rerun">
                <h2 className={styles.sectionHeading}>1. Re-Run Scenarios</h2>
                <div className={styles.sectionContent}>
                  <p>
                    The 'Re-Run Scenarios' button allows you to run all saved scenarios against the current version of
                    the rule in view.
                  </p>
                  <p>
                    This is particularly useful when making changes to a rule, as it allows you to verify that all
                    existing scenarios still behave as expected with the updated rule logic.
                  </p>
                </div>
              </section>

              <section id="status">
                <h2 className={styles.sectionHeading}>2. Scenario Status</h2>
                <div className={styles.sectionContent}>
                  <p>Each scenario displays a status indicator:</p>
                  <ul>
                    <li>
                      A green check mark (✓) indicates either:
                      <ul>
                        <li>The scenario is returning the expected results</li>
                        <li>No expected results were specified (default pass state)</li>
                      </ul>
                    </li>
                    <li>A red X (✗) indicates the scenario's actual results don't match the expected results</li>
                  </ul>
                </div>
              </section>

              <section id="error-details">
                <h2 className={styles.sectionHeading}>3. Error Details</h2>
                <div className={styles.sectionContent}>
                  <p>When a scenario shows a red X status, an expandable arrow appears next to it.</p>
                  <p>
                    Clicking this arrow reveals the expected results for the scenario, allowing you to compare them with
                    the actual results and identify any discrepancies.
                  </p>
                  <p>This feature helps in debugging and ensuring the rule is functioning as intended.</p>
                </div>
              </section>

              <section id="table-controls">
                <h2 className={styles.sectionHeading}>4. Table Controls</h2>
                <div className={styles.sectionContent}>
                  <p>The table provides several controls for managing the view of your scenarios:</p>
                  <ul>
                    <li>'Show Error Scenarios' - Instantly filters the list to display only scenarios with errors</li>
                    <li>'Clear Filters and Sorters' - Resets all active filters and sorting to their default state</li>
                  </ul>
                  <p>Additional filtering and sorting options:</p>
                  <ul>
                    <li>Each column can be filtered based on its content</li>
                    <li>Columns can be sorted in ascending or descending order</li>
                    <li>
                      All filtering and sorting is visual only and doesn't affect the underlying scenarios or results
                    </li>
                  </ul>
                </div>
              </section>
            </div>
          </div>
        );
      case ScenariosManagerTabs.CSVTab:
        return (
          <div>
            <p>Follow the instructions within this tab to utilize CSV tests.</p>
            <p>
              Specific details about the CSV Tests tab are available on The Hive:{" "}
              <a
                href="https://thehive.apps.silver.devops.gov.bc.ca/business_rules_engine/scenarios#csv_tests_tab"
                target="_blank"
              >
                BRM App CSV Tests
              </a>
            </p>
          </div>
        );
      case ScenariosManagerTabs.IsolationTesterTab:
        return (
          <div>
            <p>Follow the instructions within this tab to utilize Isolation tests.</p>
            <p>
              Specific details about the Isolation Tester tab are available on The Hive:{" "}
              <a
                href="https://thehive.apps.silver.devops.gov.bc.ca/business_rules_engine/scenarios#isolation_tester_tab"
                target="_blank"
              >
                BRM App Isolation Tester
              </a>
            </p>
          </div>
        );
      default:
        return <></>;
    }
  };

  return (
    <>
      <Flex gap={"small"} justify="space-around">
        <Tooltip title={`Learn more about the ${getTitle()} tab`}>
          <Button icon={<QuestionCircleOutlined />} onClick={() => setIsDrawerOpen(true)} />
        </Tooltip>
        <span />
      </Flex>

      <Drawer
        title={getTitle()}
        placement="bottom"
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        height={700}
      >
        {getSectionContent()}
        <p>
          More information is available on The Hive:{" "}
          <a href="https://thehive.apps.silver.devops.gov.bc.ca/business_rules_engine/scenarios" target="_blank">
            BRM App Scenarios
          </a>
        </p>
      </Drawer>
    </>
  );
}
