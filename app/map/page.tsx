"use client";
import { useState, useEffect } from "react";
import { Button, Flex } from "antd";
import { HomeOutlined, ReloadOutlined } from "@ant-design/icons";
import { logError } from "@/app/utils/logger";
import { CategoryObject } from "../types/ruleInfo";
import { getAllRuleData, getBRERules } from "../utils/api";
import RuleRelationsGraph from "../components/RuleRelationsDisplay/RuleRelationsDisplay";
import styles from "./map.module.css";

export default function Map() {
  const [isLoading, setIsLoading] = useState(true);
  const [klammRules, setKlammRules] = useState<any[]>([]);
  const [categories, setCategories] = useState<CategoryObject[]>([]);
  const [location, setLocation] = useState<Location>();

  useEffect(() => {
    setLocation(window.location);
  }, []);

  const getOrRefreshRuleList = async () => {
    setIsLoading(true);
    try {
      const maxRuleData = await getAllRuleData({
        page: 1,
        pageSize: 5000,
        searchTerm: "",
      });
      const klammRuleData = await getBRERules();

      // First map Klamm rules with URLs from matching rules
      const mappedKlammRules = klammRuleData.map((klammRule) => {
        const matchingRule = maxRuleData.data.find((rule) => rule.name === klammRule.name);
        return {
          ...klammRule,
          url: matchingRule ? `${matchingRule._id}` : undefined,
          filepath: matchingRule ? matchingRule.filepath : undefined,
          reviewBranch: matchingRule?.reviewBranch,
          isPublished: matchingRule?.isPublished,
        };
      });

      // Find unpublished rules that aren't in Klamm rules
      const additionalUnpublishedRules = maxRuleData.data
        .filter((rule) => !rule.isPublished && !klammRuleData.some((klammRule) => klammRule.name === rule.name))
        .map((rule) => ({
          id: rule._id,
          name: rule.name,
          url: `${rule._id}?version=draft`,
          filepath: rule.filepath,
          reviewBranch: rule.reviewBranch,
          isPublished: rule.isPublished,
        }));

      const combinedRules = [...mappedKlammRules, ...additionalUnpublishedRules];
      setKlammRules(combinedRules || []);
      setCategories(maxRuleData?.categories || []);
    } catch (error: any) {
      logError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getOrRefreshRuleList();
  }, []);

  return (
    <>
      <Flex justify="space-between" align="center">
        <div className={styles.homeWrapper}>
          <a href="/" className={styles.homeLink}>
            <HomeOutlined className={styles.homeButton} /> Home
          </a>
        </div>
        <Flex justify="center" align="center" gap="small">
          <h1>Rule Map</h1>
          <Button type="default" onClick={getOrRefreshRuleList} icon={<ReloadOutlined />}></Button>
        </Flex>
      </Flex>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <RuleRelationsGraph rules={klammRules} categories={categories} location={location} />
        </>
      )}
    </>
  );
}
