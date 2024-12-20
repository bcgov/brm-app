import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Modal, Button, Flex, App } from "antd";
import { SaveOutlined, GithubOutlined, CopyOutlined, SendOutlined } from "@ant-design/icons";
import { DecisionGraphType } from "@gorules/jdm-editor";
import { RuleInfo } from "@/app/types/ruleInfo";
import { updateRuleData } from "@/app/utils/api";
import { sendRuleForReview, getPRUrl } from "@/app/utils/githubApi";
import { logError } from "@/app/utils/logger";
import NewReviewForm from "./NewReviewForm";
import SavePublishWarnings from "./SavePublishWarnings";
import styles from "./SavePublish.module.css";
import RuleMapHelper from "./RuleMapHelper";

interface SavePublishProps {
  ruleInfo: RuleInfo;
  ruleContent: DecisionGraphType;
  setHasSaved: () => void;
  version?: string | boolean;
}

export default function SavePublish({ ruleInfo, ruleContent, setHasSaved, version }: SavePublishProps) {
  const { _id: ruleId, filepath: filePath, reviewBranch } = ruleInfo;

  const { message } = App.useApp();
  const [openNewReviewModal, setOpenNewReviewModal] = useState(false);
  const [currReviewBranch, setCurrReviewBranch] = useState(reviewBranch);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingToReview, setIsSendingToReview] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fetchPRUrl = async () => {
      if (currReviewBranch) {
        const url = await getPRUrl(currReviewBranch);
        setPrUrl(url);
      }
    };
    fetchPRUrl();
  }, [currReviewBranch]);

  const save = async () => {
    setIsSaving(true);
    try {
      await updateRuleData(ruleId, { ruleDraft: { content: ruleContent } });
      message.success("Draft saved");
    } catch (e) {
      message.error("Failed to save draft");
    }
    setIsSaving(false);
    setHasSaved();
  };

  const createOrUpdateReview = async (newReviewBranch?: string, reviewDescription: string = "") => {
    setIsSaving(true);
    setIsSendingToReview(true);
    // Save before sending to review
    await updateRuleData(ruleId, { ruleDraft: { content: ruleContent, reviewBranch: "test" } });
    // Prompt for new review branch details if they don't exist
    const branch = currReviewBranch || newReviewBranch;
    if (!branch) {
      setOpenNewReviewModal(true);
      return;
    }
    setOpenNewReviewModal(false);
    try {
      await sendRuleForReview(ruleContent, branch, filePath, reviewDescription);
      await updateRuleData(ruleId, { reviewBranch: branch });
      if (newReviewBranch) {
        setCurrReviewBranch(newReviewBranch);
      }
      message.success("Review updated/created");
    } catch (e: any) {
      logError("Unable to update/create review", e);
      message.error("Unable to update/create review");
    }

    setIsSaving(false);
    setIsSendingToReview(false);
    setHasSaved();
  };

  const createNewReview = ({
    newReviewBranch,
    reviewDescription,
  }: {
    newReviewBranch: string;
    reviewDescription: string;
  }) => {
    createOrUpdateReview(newReviewBranch, reviewDescription);
  };

  const generateEmbedCode = () => {
    const baseURL = window.location.origin;
    const embedCode = `${baseURL}${pathname}/embedded`;
    navigator.clipboard.writeText(embedCode);
    message.success("Embed code copied to clipboard");
  };

  return (
    <>
      <Modal
        title="New Review"
        open={openNewReviewModal}
        centered
        footer={null}
        onCancel={() => setOpenNewReviewModal(false)}
      >
        <NewReviewForm filePath={filePath} createNewReview={createNewReview} />
      </Modal>
      <Flex gap="small" justify="end" align="center" wrap className={styles.savePublishWrapper}>
        {reviewBranch && (version === "draft" || version === "inReview") && (
          <Button onClick={() => prUrl && window.open(prUrl, "_blank")} disabled={!prUrl}>
            <GithubOutlined />
            Comment on Pull Request
          </Button>
        )}
        {version === "draft" && (
          <>
            <Button type="primary" onClick={save} disabled={isSaving}>
              <SaveOutlined /> Save Changes
            </Button>
            <Button
              type="primary"
              onClick={() => createOrUpdateReview()}
              className={styles.sendForReviewBtn}
              disabled={isSendingToReview}
            >
              {" "}
              <SendOutlined /> Send for Review
            </Button>
          </>
        )}
        {version !== "inReview" && version !== "draft" && (
          <Flex gap="small" align="center">
            <Button type="primary" onClick={() => generateEmbedCode()}>
              <CopyOutlined /> Copy Embed Code
            </Button>
            <RuleMapHelper filePath={filePath} />
          </Flex>
        )}
      </Flex>
      <SavePublishWarnings filePath={filePath} ruleContent={ruleContent} isSaving={isSaving} />
    </>
  );
}
