import { DecisionGraphType } from "@gorules/jdm-editor";
import axios from "axios";
import { RuleDataResponse, RuleDraft, RuleInfo } from "../types/ruleInfo";
import { RuleMap } from "../types/rulemap";
import { KlammBREField } from "../types/klamm";
import { downloadFileBlob, generateDescriptiveName, getShortFilenameOnly } from "./utils";
import { valueType } from "antd/es/statistic/utils";
import { RuleQuery } from "../types/rulequery";
import { logError } from "@/app/utils/logger";

const axiosAPIInstance = axios.create({
  // For server side calls, need full URL, otherwise can just use /api
  baseURL: typeof window === "undefined" ? `${process.env.NEXT_PUBLIC_SERVER_URL}/api` : "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Retrieves a rule data from the API based on the provided rule ID.
 * @param ruleId The ID of the rule data to retrieve.
 * @returns The rule data.
 * @throws If an error occurs while retrieving the rule data.
 */
export const getRuleDataById = async (ruleId: string): Promise<RuleInfo> => {
  try {
    const { data } = await axiosAPIInstance.get(`/ruleData/${ruleId}`);
    return data;
  } catch (error) {
    logError(`Error getting rule data: ${error}`);
    throw error;
  }
};

/**
 * Retrieves the draft of a rule if it exists
 * @param ruleId The ID of the rule data to retrieve.
 * @returns The draft json
 * @throws If an error occurs while retrieving the rule draft
 */
export const getRuleDraft = async (ruleId: string): Promise<RuleDraft> => {
  try {
    const { data } = await axiosAPIInstance.get(`/ruleData/draft/${ruleId}?_=${new Date().getTime()}`);
    return data;
  } catch (error) {
    logError(`Error getting rule data: ${error}`);
    throw error;
  }
};

/**
 * Retrieves all rules data from the API.
 * @returns The rule data list.
 * @throws If an error occurs while fetching the rule data.
 */
export const getAllRuleData = async (params?: RuleQuery): Promise<RuleDataResponse> => {
  try {
    const { data } = await axiosAPIInstance.get<RuleDataResponse>("/ruleData/list", { params });
    return data;
  } catch (error) {
    logError(`Error fetching rule data: ${error}`);
    throw error;
  }
};

/**
 * Gets list of all rule documents
 * @returns The rule documents list.
 * @throws If an error occurs while fetching the rule documents list.
 */
export const getAllRuleDocuments = async (): Promise<string[]> => {
  try {
    const { data } = await axiosAPIInstance.get("/documents/all");
    return data;
  } catch (error) {
    logError(`Error fetching rule data: ${error}`);
    throw error;
  }
};

/**
 * Retrieves a document from the API based on the provided document ID.
 * @param jsonFilePath The jsonFilePath of the document to retrieve.
 * @returns The content of the document.
 * @throws If an error occurs while retrieving the document.
 */
export const getDocument = async (jsonFilePath: string): Promise<DecisionGraphType> => {
  try {
    const { data } = await axiosAPIInstance.get(`/documents?ruleFileName=${encodeURIComponent(jsonFilePath)}`);
    if (!data || !data.nodes || !data.edges) {
      throw new Error("Unexpected format of the returned data");
    }
    return data;
  } catch (error) {
    logError(`Error getting the gorules document: ${error}`);
    throw error;
  }
};

/**
 * Posts a decision to the API for evaluation.
 * @param ruleContent The rule decision graph to evaluate.
 * @param context The context for the decision evaluation.
 * @returns The result of the decision evaluation.
 * @throws If an error occurs while simulating the decision.
 */
export const postDecision = async (ruleContent: DecisionGraphType, context: unknown) => {
  try {
    const { data } = await axiosAPIInstance.post(`/decisions/evaluate`, {
      ruleContent,
      context,
      trace: true,
    });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorMessage = error.response.data.message;
      logError(errorMessage);
      throw new Error(errorMessage);
    } else {
      logError(`Error simulating decision: ${error}`);
      throw error;
    }
  }
};

/**
 * Posts rule data to the API.
 * @param newRuleData The new rule data to post.
 * @returns The result of the post operation.
 * @throws If an error occurs while posting the rule data.
 */
export const postRuleData = async (newRuleData: unknown) => {
  try {
    const { data } = await axiosAPIInstance.post(`/ruleData`, newRuleData);
    return data;
  } catch (error) {
    logError(`Error posting rule data: ${error}`);
    throw error;
  }
};

/**
 * Updates a rule in the API based on the provided rule ID.
 * @param ruleId The ID of the rule to update.
 * @param updatedRuleData The updated rule data.
 * @returns The result of the update.
 * @throws If an error occurs while updating the rule.
 */
export const updateRuleData = async (ruleId: string, updatedRuleData: unknown) => {
  try {
    const { data } = await axiosAPIInstance.put(`/ruleData/${ruleId}`, updatedRuleData);
    return data;
  } catch (error) {
    logError(`Error updating rule: ${error}`);
    throw error;
  }
};

/**
 * Deletes a rule from the API based on the provided rule ID.
 * @param ruleId The ID of the rule to delete.
 * @returns The result of the deletion.
 * @throws If an error occurs while deleting the rule.
 */
export const deleteRuleData = async (ruleId: string) => {
  try {
    const { data } = await axiosAPIInstance.delete(`/ruleData/${ruleId}`);
    return data;
  } catch (error) {
    logError(`Error deleting rule: ${error}`);
    throw error;
  }
};

/**
 * Retrieves a rule map from the API
 * @param filepath The ID of the rule data to retrieve.
 * @param ruleContent The rule decision graph to evaluate.
 * @returns The rule map.
 * @throws If an error occurs while retrieving the rule data.
 */
export const getRuleMap = async (filepath: string, ruleContent?: DecisionGraphType): Promise<RuleMap> => {
  try {
    const { data } = await axiosAPIInstance.post("/rulemap", { filepath, ruleContent });
    return data;
  } catch (error) {
    logError(`Error getting rule data: ${error}`);
    throw error;
  }
};

/**
 * Assess the rule response and return the schema based on a run of the rule.
 * @param ruleResponse The response from the rule evaluation. Assesses the trace response.
 * @returns The inputs and outputs schema.
 * @throws If an error occurs while retrieving the rule data.
 */
export const getRuleRunSchema = async (ruleResponse: unknown) => {
  try {
    const { data } = await axiosAPIInstance.post(`/rulemap/rulerunschema`, ruleResponse);
    return data;
  } catch (error) {
    logError(`Error posting output schema: ${error}`);
    throw error;
  }
};

/**
 * Genererates a rule map from just the rule content
 * @param ruleContent The rule decision graph to evaluate.
 * @returns The rule map.
 * @throws If an error occurs while retrieving the rule data.
 */
export const generateSchemaFromRuleContent = async (ruleContent: DecisionGraphType): Promise<RuleMap> => {
  try {
    const { data } = await axiosAPIInstance.post("/rulemap/generateFromRuleContent", {
      ruleContent,
    });
    return data;
  } catch (error) {
    logError(`Error getting rule data: ${error}`);
    throw error;
  }
};

/**
 * Retrieves the scenarios for a rule from the API based on the provided filename
 * @param filepath The name of the rule data to retrieve.
 * @returns The scenarios for the rule.
 * @throws If an error occurs while retrieving the rule data.
 */
export const getScenariosByFilename = async (filepath: string) => {
  try {
    const { data } = await axiosAPIInstance.post("/scenario/by-filename/", { filepath });
    return data;
  } catch (error) {
    logError(`Error posting output schema: ${error}`);
    throw error;
  }
};

/**
 * Creates a new scenario for a rule
 * @param scenarioResponse The response from scenario creation.
 * @returns The confirmation of rule posting.
 * @throws If an error occurs while retrieving the rule data.
 */
export const createScenario = async (scenarioResponse: unknown) => {
  try {
    const { data } = await axiosAPIInstance.post(`/scenario`, scenarioResponse);
    return data;
  } catch (error) {
    logError(`Error posting output schema: ${error}`);
    throw error;
  }
};

/**
 *
 * @param scenarioResponse The response from scenario creation.
 * @returns The confirmation of rule posting.
 * @throws If an error occurs while retrieving the rule data.
 */

export const updateScenario = async (scenarioResponse: unknown, scenarioID?: string) => {
  try {
    const { data } = await axiosAPIInstance.put(`/scenario/${scenarioID}`, scenarioResponse);
    return data;
  } catch (error) {
    logError(`Error posting output schema: ${error}`);
    throw error;
  }
};

/**
 * Deletes a scenario by its ID
 * @param scenarioId The ID of the scenario to delete.
 * @returns The confirmation of scenario deletion.
 * @throws If an error occurs while deleting the scenario.
 */
export const deleteScenario = async (scenarioId: string) => {
  try {
    const { data } = await axiosAPIInstance.delete(`/scenario/${scenarioId}`);
    return data;
  } catch (error) {
    logError(`Error deleting scenario: ${error}`);
    throw error;
  }
};

/**
 * Runs all scenarios against a rule and exports the results as a CSV.
 * @param filepath The filename of the rule to evaluate scenarios against.
 * @param ruleContent The rule decision graph to evaluate.
 * @returns The CSV data containing the results of the scenario evaluations.
 * @throws If an error occurs while running the scenarios or generating the CSV.
 */
export const runDecisionsForScenarios = async (filepath: string, ruleContent?: DecisionGraphType) => {
  try {
    const { data } = await axiosAPIInstance.post("/scenario/run-decisions", { filepath, ruleContent });
    return data;
  } catch (error) {
    logError(`Error running scenarios: ${error}`);
    throw error;
  }
};

/**
 * Downloads a CSV file containing scenarios for a rule run.
 * @param filepath The filename for the JSON rule.
 * @param ruleContent The rule decision graph to evaluate.
 * @returns The processed CSV content as a string.
 * @throws If an error occurs during file upload or processing.
 */
export const getCSVForRuleRun = async (filepath: string, ruleContent?: DecisionGraphType): Promise<string> => {
  try {
    const response = await axiosAPIInstance.post(
      "/scenario/evaluation",
      { filepath, ruleContent },
      {
        responseType: "blob",
        headers: { "Content-Type": "application/json" },
      }
    );

    const filename = `${filepath.replace(/\.json$/, ".csv")}`;
    downloadFileBlob(response.data, "text/csv", filename);

    return "CSV downloaded successfully";
  } catch (error) {
    logError(`Error getting CSV for rule run: ${error}`);
    throw new Error("Error getting CSV for rule run");
  }
};

/**
 * Uploads a CSV file containing scenarios and processes the scenarios against the specified rule.
 * @param file The file to be uploaded.
 * @param filepath The filename for the JSON rule.
 * @param ruleContent The rule decision graph to evaluate.
 * @returns The processed CSV content as a string.
 * @throws If an error occurs during file upload or processing.
 */
export const uploadCSVAndProcess = async (
  file: File,
  filepath: string,
  ruleContent?: DecisionGraphType
): Promise<string> => {
  try {
    const response = await axiosAPIInstance.post(
      `/scenario/evaluation/upload/`,
      {
        file,
        filepath,
        ruleContent,
      },
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob",
      }
    );

    const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\.\d+/, "");
    const filename = `${filepath.replace(".json", "")}_testing_${file.name.replace(".csv", "")}_${timestamp}.csv`;
    downloadFileBlob(response.data, "text/csv", filename);

    return "File processed successfully";
  } catch (error) {
    logError(`Error processing CSV file: ${error}`);
    throw new Error("Error processing CSV file");
  }
};

/**
 * Retrieves a list of bre fields from Klamm
 * @param searchText text to filter results by
 * @returns List of bre fields
 * @throws If an error occurs while retrieving the fields
 */
export const getBREFields = async (searchText: string): Promise<KlammBREField[]> => {
  try {
    const {
      data: { data },
    } = await axiosAPIInstance.get(`/klamm/brefields?searchText=${searchText}`);
    return data;
  } catch (error) {
    logError(`Error getting rule data: ${error}`);
    throw error;
  }
};

/**
 * Retrieves a field from Klamm by field name
 * @returns BRE field with that name
 * @throws If an error occurs while retrieving the field
 */
export const getBREFieldFromName = async (fieldName: string): Promise<KlammBREField> => {
  try {
    const { data } = await axiosAPIInstance.get(`/klamm/brefield/${fieldName}`);
    return data;
  } catch (error) {
    logError(`Error getting rule data: ${error}`);
    throw error;
  }
};

export const getBRERules = async (): Promise<any[]> => {
  try {
    const {
      data: { data },
    } = await axiosAPIInstance.get(`/klamm/brerules`);
    return data;
  } catch (error) {
    logError(`Error getting rule data: ${error}`);
    throw error;
  }
};

/**
 * Generate CSV Tests for scenarios
 * @param filepath The filename for the JSON rule.
 * @param ruleContent The rule decision graph to evaluate.
 * @param simulationContext The simulation context to use for the tests.
 * @param testScenarioCount The number of scenarios to generate.
 * @returns The processed CSV content as a string.
 * @throws If an error occurs during file upload or processing.
 */

export const getCSVTests = async (
  filepath: string,
  ruleContent?: DecisionGraphType,
  simulationContext?: Record<string, any>,
  testScenarioCount?: valueType | number | null
): Promise<string> => {
  try {
    const response = await axiosAPIInstance.post(
      "/scenario/test",
      { filepath, ruleContent, simulationContext, testScenarioCount },
      {
        responseType: "blob",
        headers: { "Content-Type": "application/json" },
      }
    );

    const scenarioName = simulationContext ? `${generateDescriptiveName(simulationContext)}` : "";

    const filename = `${(scenarioName + getShortFilenameOnly(filepath)).slice(0, 250)}.csv`;

    downloadFileBlob(response.data, "text/csv", filename);

    return "CSV downloaded successfully";
  } catch (error) {
    logError(`Error getting CSV for rule run: ${error}`);
    throw new Error("Error getting CSV for rule run");
  }
};
