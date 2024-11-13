"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button, Flex, Tag, Tooltip } from "antd";
import {
  HomeOutlined,
  EyeOutlined,
  EditOutlined,
  CheckOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { RuleInfo } from "@/app/types/ruleInfo";
import { RULE_VERSION } from "@/app/constants/ruleVersion";
import { updateRuleData } from "@/app/utils/api";
import styles from "./RuleHeader.module.css";

export default function RuleHeader({
  ruleInfo,
  version = RULE_VERSION.inProduction,
}: {
  ruleInfo: RuleInfo;
  version?: string;
}) {
  const pathname = usePathname();

  const [savedTitle, setSavedTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currTitle, setCurrTitle] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const { title, filepath } = ruleInfo;
    setSavedTitle(title || filepath);
    setCurrTitle(title || filepath);
  }, [ruleInfo]);

  useEffect(() => {
    if (isEditingTitle) {
      inputRef.current?.focus();
    }
  }, [isEditingTitle]);

  const startEditingTitle = () => {
    setIsEditingTitle(true);
  };

  const updateTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value !== currTitle) {
      setCurrTitle(e.target.value);
    }
  };

  const doneEditingTitle = async () => {
    setIsEditingTitle(false);
    try {
      await updateRuleData(ruleInfo._id, { title: currTitle });
      setSavedTitle(currTitle || "");
    } catch (e) {
      // If updating fails, revert to previous title name
      setCurrTitle(savedTitle);
    }
  };

  const switchVersion = (versionToSwitchTo: RULE_VERSION) => {
    // Use window.locaiton.href instead of router.push so that we can detect page changes for "unsaved changes" popup
    window.location.href = `${pathname}?version=${versionToSwitchTo}&_=${new Date().getTime()}`;
  };

  const formatVersionText = (text: string) => {
    const words = text.split(/(?=[A-Z])/);
    return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  let versionColor = "green";
  if (version === RULE_VERSION.draft) {
    versionColor = "red";
  } else if (version === RULE_VERSION.inReview) {
    versionColor = "orange";
  } else if (version === RULE_VERSION.inDev) {
    versionColor = "purple";
  }

  if (currTitle === undefined) return null;

  return (
    <div className={styles.headerContainer} style={{ background: versionColor }}>
      <Flex justify="space-between" className={styles.headerWrapper}>
        <Flex gap="middle" align="center" flex={isEditingTitle ? "1" : "none"} className={styles.headerContent}>
          <a href="/" className={styles.homeButton}>
            <HomeOutlined />
          </a>
          <Flex flex={1} vertical>
            <h1
              onClick={startEditingTitle}
              className={styles.titleHeader}
              style={{ width: isEditingTitle ? "100%" : "auto" }}
            >
              {isEditingTitle ? (
                <input
                  className={styles.titleInput}
                  ref={inputRef}
                  onBlur={doneEditingTitle}
                  value={currTitle}
                  onChange={updateTitle}
                  aria-label="Edit title"
                />
              ) : (
                currTitle
              )}
            </h1>
            <p className={styles.titleFilePath}>{ruleInfo.filepath}</p>
          </Flex>
          {isEditingTitle && (
            <button className={styles.editButton} onClick={isEditingTitle ? doneEditingTitle : startEditingTitle}>
              <CheckOutlined />
            </button>
          )}
          {ruleInfo.name &&
            process.env.NEXT_PUBLIC_KLAMM_URL &&
            version !== RULE_VERSION.inProduction &&
            version !== RULE_VERSION.inDev &&
            ruleInfo.isPublished && (
              <Tooltip title="View rule details in KLAMM">
                {" "}
                <Button
                  type="link"
                  icon={<InfoCircleOutlined />}
                  onClick={() => window.open(`${process.env.NEXT_PUBLIC_KLAMM_URL}/rules/${ruleInfo.name}`, "_blank")}
                ></Button>
              </Tooltip>
            )}
          <Tag color={versionColor}>{formatVersionText(version)}</Tag>
        </Flex>
        <Flex gap="small" align="end">
          {version !== RULE_VERSION.draft && (
            <Button onClick={() => switchVersion(RULE_VERSION.draft)} icon={<EditOutlined />} type="dashed">
              Draft
            </Button>
          )}
          {ruleInfo.reviewBranch && version !== RULE_VERSION.inReview && (
            <Button onClick={() => switchVersion(RULE_VERSION.inReview)} icon={<EyeOutlined />} type="dashed">
              In Review
            </Button>
          )}
          {version !== RULE_VERSION.inDev && ruleInfo.isPublished && (
            <Button onClick={() => switchVersion(RULE_VERSION.inDev)} icon={<CheckCircleOutlined />} type="dashed">
              In Dev
            </Button>
          )}
          {version !== RULE_VERSION.inProduction &&
            ruleInfo.isPublished &&
            process.env.NEXT_PUBLIC_IN_PRODUCTION === "true" && (
              <Button
                onClick={() => switchVersion(RULE_VERSION.inProduction)}
                icon={<CheckCircleFilled />}
                type="dashed"
              >
                In Production
              </Button>
            )}
        </Flex>
      </Flex>
    </div>
  );
}
