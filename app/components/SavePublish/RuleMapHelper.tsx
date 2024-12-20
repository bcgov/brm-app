import React, { useState, useEffect } from "react";
import { Button, Drawer, Flex, Tooltip, message } from "antd";
import { GlobalOutlined, CopyOutlined } from "@ant-design/icons";
import { fetchAndProcessRuleData } from "@/app/utils/graphUtils";
import { logError } from "@/app/utils/logger";
import RuleRelationsDisplay from "../RuleRelationsDisplay/RuleRelationsDisplay";
import { CategoryObject } from "@/app/types/ruleInfo";

interface RuleMapHelperProps {
  filePath: string;
}

export default function RuleMapHelper({ filePath }: RuleMapHelperProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [klammRules, setKlammRules] = useState<any[]>([]);
  const [categories, setCategories] = useState<CategoryObject[]>([]);
  const ruleName = filePath.split("/").pop() || filePath;

  const getOrRefreshRuleList = async () => {
    setIsLoading(true);
    try {
      const { rules, categories } = await fetchAndProcessRuleData(filePath);
      setKlammRules(rules);
      setCategories(categories);
    } catch (error: any) {
      logError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(
    () => {
      if (isDrawerOpen) {
        getOrRefreshRuleList();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDrawerOpen, filePath]
  );

  const copyEmbedCodeToClipboard = () => {
    const baseUrl = window.location.origin;
    const fullUrl = `${baseUrl}/map/${ruleName}`;

    navigator.clipboard
      .writeText(fullUrl)
      .then(() => {
        message.success("URL copied to clipboard!");
      })
      .catch(() => {
        message.error("Failed to copy URL");
      });
  };

  return (
    <>
      <Flex gap="small" justify="space-around">
        <Tooltip title="View Rule Map">
          <Button icon={<GlobalOutlined />} onClick={() => setIsDrawerOpen(true)}>
            View Map
          </Button>
        </Tooltip>
      </Flex>

      <Drawer
        title={`${ruleName} - Published Rule Relationships`}
        placement="right"
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        size="large"
        extra={
          <Button type="primary" onClick={copyEmbedCodeToClipboard}>
            <CopyOutlined /> Copy Map Embed Code
          </Button>
        }
        loading={isLoading}
      >
        <RuleRelationsDisplay rules={klammRules} categories={categories} filter={filePath} />
      </Drawer>
    </>
  );
}
