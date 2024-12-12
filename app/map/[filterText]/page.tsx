"use client";
import { useState, useEffect } from "react";
import { logError } from "@/app/utils/logger";
import { CategoryObject } from "@/app/types/ruleInfo";
import { getAllRuleData, getBRERules } from "@/app/utils/api";
import RuleRelationsGraph from "@/app/components/RuleRelationsDisplay/RuleRelationsDisplay";
import {
  mapRulesToGraph,
  filterRulesByCategory,
  filterRulesByFilePath,
  getRelatedRules,
  createMaxRuleData,
  filterRulesBySearchTerm,
} from "@/app/utils/graphUtils";

export default function Map({ params: { filterText } }: { params: { filterText: string } }) {
  const [isLoading, setIsLoading] = useState(true);
  const [klammRules, setKlammRules] = useState<any[]>([]);
  const [categories, setCategories] = useState<CategoryObject[]>([]);
  const [isEmbedded, setIsEmbedded] = useState(false);

  const isFilePath = (param: string) => param.includes(".json") && !isCustomFilter(param);
  const isCustomFilter = (param: string) => param.includes("embed&");

  const parseCustomFilter = (filterParam: string) => {
    const searchParams = new URLSearchParams(filterParam.split("embed&")[1]);
    return {
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
    };
  };

  const filterRules = (allRules: any[], decodedParam: string) => {
    let initialFilteredRules = [];

    if (isCustomFilter(decodedParam)) {
      setIsEmbedded(true);

      const { category, search } = parseCustomFilter(decodedParam);
      let filteredRules = [...allRules];

      if (category && search) {
        const categoryFiltered = filterRulesByCategory(filteredRules, category);
        const relatedCategoryRules = getRelatedRules(allRules, categoryFiltered);
        const expandedCategoryRules = Array.from(new Set([...categoryFiltered, ...relatedCategoryRules]));
        const searchFiltered = filterRulesBySearchTerm(filteredRules, search);
        initialFilteredRules = expandedCategoryRules.filter((rule) =>
          searchFiltered.some((searchRule) => searchRule.id === rule.id)
        );
      } else if (category) {
        const categoryFiltered = filterRulesByCategory(filteredRules, category);
        const relatedCategoryRules = getRelatedRules(allRules, categoryFiltered).filter(
          (rule) => filterRulesByCategory([rule], category).length > 0
        );
        initialFilteredRules = Array.from(new Set([...categoryFiltered, ...relatedCategoryRules]));
      } else if (search) {
        initialFilteredRules = filterRulesBySearchTerm(filteredRules, search);
      }
    } else if (isFilePath(decodedParam)) {
      const fileRule = filterRulesByFilePath(allRules, decodedParam);
      initialFilteredRules = fileRule ? [fileRule] : [];
    } else {
      initialFilteredRules = filterRulesByCategory(allRules, decodedParam);
    }

    if (initialFilteredRules.length === 0) return [];

    // Get all related rules and their connections
    const relatedRules = getRelatedRules(allRules, initialFilteredRules);

    return Array.from(new Set([...initialFilteredRules, ...relatedRules]));
  };

  useEffect(
    () => {
      getOrRefreshRuleList();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterText]
  );

  const getOrRefreshRuleList = async () => {
    setIsLoading(true);
    try {
      const maxRuleData = await getAllRuleData({
        page: 1,
        pageSize: 5000,
        searchTerm: "",
      });
      const klammRuleData = await getBRERules();

      const mappedKlammRules = mapRulesToGraph(klammRuleData, createMaxRuleData(maxRuleData));
      const decodedParam = decodeURIComponent(filterText);

      const finalFilteredRules = filterRules(mappedKlammRules, decodedParam);

      setKlammRules(finalFilteredRules);
      setCategories(maxRuleData?.categories || []);
    } catch (error: any) {
      logError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading ? (
        <p>Loading...</p>
      ) : !isEmbedded ? (
        <RuleRelationsGraph rules={klammRules} categories={categories} filter={decodeURIComponent(filterText)} />
      ) : (
        <RuleRelationsGraph rules={klammRules} categories={categories} basicLegend />
      )}
    </>
  );
}
