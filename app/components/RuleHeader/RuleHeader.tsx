"use client";
import { useState, useRef, useEffect } from "react";
import { Flex, Tooltip } from "antd";
import { HomeOutlined, CheckOutlined, ExportOutlined } from "@ant-design/icons";
import { RuleInfo } from "@/app/types/ruleInfo";
import { updateRuleData } from "@/app/utils/api";
import styles from "./RuleHeader.module.css";
import Link from "next/link";

export default function RuleHeader({ ruleInfo }: { ruleInfo: RuleInfo }) {
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

  if (currTitle === undefined) return null;

  return (
    <div className={styles.headerContainer}>
      <div className={styles.homeWrapper}>
        <a href="/" className={styles.homeLink}>
          <HomeOutlined className={styles.homeButton} /> Home
        </a>
      </div>
      <Flex justify="space-between" align="center" className={styles.headerWrapper}>
        <Flex gap="middle" align="center" flex={1} className={styles.headerContent}>
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
          </Flex>
          {isEditingTitle && (
            <button className={styles.editButton} onClick={isEditingTitle ? doneEditingTitle : startEditingTitle}>
              <CheckOutlined />
            </button>
          )}
        </Flex>
        <Flex gap="small" align="end">
          <Flex gap="small" align="end" vertical className={styles.rightContent}>
            <p className={styles.titleFilePath}>{ruleInfo.filepath}</p>
            {ruleInfo.name && process.env.NEXT_PUBLIC_KLAMM_URL && ruleInfo.isPublished && (
              <Tooltip title="View rule details in KLAMM">
                <Link href={`${process.env.NEXT_PUBLIC_KLAMM_URL}/rules/${ruleInfo.name}`} passHref target="_blank">
                  View In KLAMM <ExportOutlined />
                </Link>
              </Tooltip>
            )}
          </Flex>
        </Flex>
      </Flex>
    </div>
  );
}
