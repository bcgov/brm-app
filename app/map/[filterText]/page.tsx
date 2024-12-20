"use client";
import { useState, useEffect } from "react";
import { Spin } from "antd";
import { logError } from "@/app/utils/logger";
import { CategoryObject } from "@/app/types/ruleInfo";
import RuleRelationsGraph from "@/app/components/RuleRelationsDisplay/RuleRelationsDisplay";
import { fetchAndProcessRuleData } from "@/app/utils/graphUtils";

export default function Map({ params: { filterText } }: { params: { filterText: string } }) {
  const [isLoading, setIsLoading] = useState(true);
  const [klammRules, setKlammRules] = useState<any[]>([]);
  const [categories, setCategories] = useState<CategoryObject[]>([]);
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    const getOrRefreshRuleList = async () => {
      setIsLoading(true);
      try {
        const { rules, categories, isEmbedded: embedded } = await fetchAndProcessRuleData(filterText);
        setKlammRules(rules);
        setCategories(categories);
        setIsEmbedded(embedded || false);
      } catch (error: any) {
        logError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    getOrRefreshRuleList();
  }, [filterText]);

  return (
    <>
      {isLoading ? (
        <Spin tip="Loading rules..." className="spinner">
          <div className="content" />
        </Spin>
      ) : !isEmbedded ? (
        <RuleRelationsGraph rules={klammRules} categories={categories} filter={decodeURIComponent(filterText)} />
      ) : (
        <RuleRelationsGraph rules={klammRules} categories={categories} basicLegend />
      )}
    </>
  );
}
