import axios, { AxiosInstance } from "axios";
import { logError } from "./logger";
import { CSVRowData } from "@/app/types/csv";
import { getShortFilenameOnly } from "./utils";
import { getRuleDataByFilepath } from "./api";

const GITHUB_REPO_URL = "https://api.github.com/repos/bcgov/brms-rules";
const GITHUB_REPO_OWNER = "bcgov";
const GITHUB_BASE_BRANCH = "dev";

export enum AuthFailureReasons {
  NO_OAUTH = "No OAuth token",
  NOT_VALID = "OAuth token not valid",
  NO_ORG_ACCESS = "OAuth token gives no org access",
}

let githubAuthUsername = "";
let axiosGithubInstance: AxiosInstance = axios.create();

export const initializeGithubAxiosInstance = async (oauthToken?: string, oauthUsername?: string) => {
  if (!oauthToken) {
    throw new Error("No oauth token to initialize");
  }
  axiosGithubInstance = axios.create({
    headers: { Authorization: `Bearer ${oauthToken}` },
  });
  if (oauthUsername) {
    githubAuthUsername = oauthUsername;
  }
};

export const isGithubAuthTokenValid = async (oauthToken?: string): Promise<{ valid: boolean; reason?: string }> => {
  if (!oauthToken) {
    return { valid: false, reason: AuthFailureReasons.NO_OAUTH };
  }
  // Check that the oauth token is legit
  const url = "https://api.github.com/user";
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${oauthToken}`,
    },
  });
  if (!response.ok) {
    return { valid: false, reason: AuthFailureReasons.NOT_VALID };
  }
  initializeGithubAxiosInstance(oauthToken, githubAuthUsername);
  // Check that the user has authorized the organization (bcgov) properly
  try {
    await axiosGithubInstance.get(`${GITHUB_REPO_URL}/git/ref/heads/${GITHUB_BASE_BRANCH}`);
  } catch (error) {
    return { valid: false, reason: AuthFailureReasons.NO_ORG_ACCESS };
  }
  return { valid: true };
};

export const generateBranchName = (filePath: string) => {
  return `${githubAuthUsername}/${getShortFilenameOnly(filePath, 15, false).replace(" ", "-")}`;
};

export const generateCommitMessage = (isNewFile: boolean, filePath: string) => {
  return `${isNewFile ? "Updated" : "Added"} ${getShortFilenameOnly(filePath)}`;
};

export const generateReviewMessage = (isNewFile: boolean, filePath: string) => {
  const initialMessage = `${isNewFile ? "Updating" : "Adding"} ${getShortFilenameOnly(filePath)}`;
  // Generate link to the review of this file
  const linkToReview = new URL(window.location.href);
  const searchParams = new URLSearchParams(linkToReview.search);
  searchParams.set("version", "inReview");
  linkToReview.search = searchParams.toString();
  return `${initialMessage}.\n\nReview: ${linkToReview.href}`;
};

// Get the SHA of the latest commit of the base branch
const getShaOfLatestCommit = async () => {
  const refUrl = `${GITHUB_REPO_URL}/git/ref/heads/${GITHUB_BASE_BRANCH}`;
  const refResponse = await axiosGithubInstance.get(refUrl);
  return refResponse.data.object.sha;
};

// Check if the new branch already exists
const doesBranchExist = async (branchName: string) => {
  try {
    const newBranchRefUrl = `${GITHUB_REPO_URL}/git/ref/heads/${branchName}`;
    await axiosGithubInstance.get(newBranchRefUrl);
    return true;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return false;
    } else {
      throw error; // Rethrow if error is not due to branch not existing
    }
  }
};

// Create a new branch from the base branch SHA if it doesn't exist
const createNewBranch = async (branchName: string, sha: string) => {
  try {
    const refsUrl = `${GITHUB_REPO_URL}/git/refs`;
    await axiosGithubInstance.post(refsUrl, {
      ref: `refs/heads/${branchName}`,
      sha,
    });
    console.log(`New branch ${branchName} created`);
  } catch (error: any) {
    logError("Failed creating new branch", error);
    throw error;
  }
};

/**
 * Attempt to fetch the file to get its SHA (if it exists)
 * @param branchName
 * @param filePath
 * @returns
 */
const getFileIfAlreadyExists = async (
  branchName: string,
  filePath: string
): Promise<{ sha: string; content: string } | null> => {
  try {
    const contentsUrl = `${GITHUB_REPO_URL}/contents/${filePath}`;
    const getFileResponse = await axiosGithubInstance.get(contentsUrl, {
      params: { ref: branchName }, // Ensure we're checking the correct branch
    });
    return getFileResponse.data;
  } catch (error: any) {
    if (error.response && error.response.status !== 404) {
      logError("Error getting file", error);
      throw error; // Rethrow if error is not due to the file not existing
    }
    return null;
  }
};

//
/**
 * Commit file changes to branch (or add new file entirely)
 * @param branchName
 * @param filePath
 * @param contentBase64
 * @param commitMessage
 * @returns
 */
const _commitFileToBranch = async (
  branchName: string,
  filePath: string,
  contentBase64: string,
  commitMessage: string
) => {
  try {
    // If the file already exists, get its sha
    const file = await getFileIfAlreadyExists(branchName, filePath);
    // Prepare the request body, including the SHA if the file exists
    const requestBody: any = {
      message: commitMessage || generateCommitMessage(!!file, filePath),
      content: contentBase64,
      branch: branchName,
    };
    if (file?.sha) {
      requestBody["sha"] = file?.sha; // Include the SHA to update the existing file
    }
    // Create or update the file
    const contentsUrl = `${GITHUB_REPO_URL}/contents/${filePath}`;
    await axiosGithubInstance.put(contentsUrl, requestBody);
    console.log("File updated");
    return file?.sha;
  } catch (error: any) {
    logError(`Failed to commit file ${filePath} to branch ${branchName}`, error);
    throw error;
  }
};

// Check if a PR already exists for the branch
const doesPRExist = async (branchName: string): Promise<boolean> => {
  return (await getPRUrl(branchName)) !== null;
};

// Create a new pull request
const createPR = async (branchName: string, prTitle: string, reviewDescription: string) => {
  try {
    const prUrl = `${GITHUB_REPO_URL}/pulls`;
    const prResponse = await axiosGithubInstance.post(prUrl, {
      title: prTitle,
      body: reviewDescription,
      head: branchName,
      base: GITHUB_BASE_BRANCH,
    });
    console.log("Pull request created successfully:", prResponse.data.html_url);
  } catch (error: any) {
    logError(`Failed creating a PR for ${branchName}`, error);
    throw error;
  }
};

// Get the PR URL for a branch if it exists
export const getPRUrl = async (branchName: string): Promise<string | null> => {
  if (!branchName) return null;
  try {
    const listPrsUrl = `${GITHUB_REPO_URL}/pulls?state=open&head=${GITHUB_REPO_OWNER}:${branchName}`;
    const openPrsResponse = await axiosGithubInstance.get(listPrsUrl);
    const openPrs = openPrsResponse.data;
    if (openPrs.length > 0) {
      return openPrs[0].html_url;
    }
    return null;
  } catch (error: any) {
    console.error(`Failed getting PR URL for ${branchName}`, error);
    return null;
  }
};

// Get json file from branch
export const getFileAsJsonIfAlreadyExists = async (filePath: string, branchName?: string) => {
  try {
    if (!branchName) {
      // Get branch name from db
      const { reviewBranch } = await getRuleDataByFilepath(filePath);
      if (!reviewBranch) {
        throw new Error("No branch in review for filepath");
      } else {
        branchName = reviewBranch;
      }
    }
    const newBranchRefUrl = `${GITHUB_REPO_URL}/git/ref/heads/${branchName}`;
    await axiosGithubInstance.get(newBranchRefUrl);
    const file = await getFileIfAlreadyExists(branchName, `rules/${filePath}`);
    if (!file || !file.content) {
      throw new Error("File does not exist");
    }
    return JSON.parse(Buffer.from(file.content, "base64").toString("utf-8"));
  } catch (error: any) {
    logError(`Error getting ${filePath} as JSON for ${branchName}`, error);
    throw error;
  }
};

/**
 * Ensure that the branch exists before trying to use it
 * @param branchName
 */
const _ensureBranchExists = async (branchName: string) => {
  try {
    const baseSha = await getShaOfLatestCommit();
    console.log("Base SHA:", baseSha);
    const branchExists = await doesBranchExist(branchName);
    if (!branchExists) {
      await createNewBranch(branchName, baseSha);
    }
  } catch (error: any) {
    logError("Error checking for branch:", error);
    throw error;
  }
};

/**
 * Do whole process of adding file to a branch and sending it off for review
 * @param ruleContent
 * @param branchName
 * @param filePath
 * @param reviewDescription
 */
export const sendRuleForReview = async (
  ruleContent: object,
  branchName: string,
  filePath: string,
  reviewDescription: string
) => {
  try {
    await _ensureBranchExists(branchName);
    const commitMessage = generateCommitMessage(true, filePath);
    const contentBase64 = Buffer.from(JSON.stringify(ruleContent, null, 2)).toString("base64");
    await _commitFileToBranch(branchName, `rules/${filePath}`, contentBase64, commitMessage);
    const prExists = await doesPRExist(branchName);
    if (!prExists) {
      await createPR(branchName, commitMessage, reviewDescription);
    }
  } catch (error: any) {
    logError("Error creating branch or committing file:", error);
    throw error;
  }
};

/**
 * Get the CSV test files from a branch and path name
 * @param branchName
 * @param filePath
 * @returns
 */
export const getCSVTestFilesFromBranch = async (branchName: string, filePath: string): Promise<CSVRowData[]> => {
  try {
    // Get the list of files
    const url = `${GITHUB_REPO_URL}/contents/${filePath}`;
    const filesResponse = await axiosGithubInstance.get(url, {
      params: { ref: branchName }, // Ensure we're checking the correct branch
    });
    const files = filesResponse.data;
    // For each file, get the latest commit details to get update info
    const fileDetails = await Promise.all(
      files.map(async (file: any) => {
        const commitsUrl = `${GITHUB_REPO_URL}/commits?path=${file.path}&per_page=1&sha=${branchName}`;
        const commitsResponse = await axiosGithubInstance.get(commitsUrl);
        console.log(file, commitsResponse);
        const commits = commitsResponse.data;
        return {
          filename: file.name,
          downloadFile: file.download_url,
          lastUpdated: commits[0]?.commit?.author?.date,
          updatedBy: commits[0]?.author?.login,
        };
      })
    );
    return fileDetails;
  } catch (error: any) {
    if (error.status == 404) {
      return [];
    } else {
      logError(`Error getting ${filePath} as CSV for ${branchName}`, error);
      throw error;
    }
  }
};

/**
 * Add a new CSV test file to a review
 * @param csvTests
 * @param branchName
 * @param filePath
 */
export const addCSVTestFileToReview = async (csvTests: any, branchName: string, filePath: string) => {
  try {
    _ensureBranchExists(branchName);
    const commitMessage = `Adding tests ${filePath}`;
    await _commitFileToBranch(branchName, `tests/${filePath}`, csvTests, commitMessage);
  } catch {
    throw new Error(`Failed to add test file ${filePath}`);
  }
};

/**
 * Remove CSV test file from a review
 * @param branchName
 * @param filePath
 */
export const removeCSVTestFileFromReview = async (branchName: string, filePath: string) => {
  try {
    _ensureBranchExists(branchName);
    // If the file already exists, get its sha
    const file = await getFileIfAlreadyExists(branchName, `tests/${filePath}`);
    if (!file) {
      throw new Error(`No file to remove: ${filePath}`);
    }
    // Delete the file
    await axiosGithubInstance.delete(`${GITHUB_REPO_URL}/contents/tests/${filePath}`, {
      data: {
        message: `Removing tests ${filePath}`,
        branch: branchName,
        sha: file.sha,
      },
    });
  } catch {
    throw new Error(`Failed to remove test file ${filePath}`);
  }
};
