"use client";
import React, { useState, useEffect } from "react";
import { Button, Flex, Spin, Table, Input, Tag, Segmented, Select } from "antd";
import { UnorderedListOutlined, DeploymentUnitOutlined } from "@ant-design/icons";
import type { Breakpoint, TablePaginationConfig, TableColumnsType } from "antd";
import type { ColumnFilterItem, FilterValue, SorterResult } from "antd/es/table/interface";
import {
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  DownSquareOutlined,
} from "@ant-design/icons";
import { RuleInfo } from "./types/ruleInfo";
import RuleRelationsGraph from "./components/RuleRelationsDisplay/RuleRelationsDisplay";
import { getAllRuleData } from "./utils/api";
import { fetchGraphRuleData } from "@/app/utils/graphUtils";
import { CategoryObject } from "./types/ruleInfo";
import { logError } from "./utils/logger";
import styles from "./styles/home.module.css";

interface TableParams {
  pagination?: TablePaginationConfig;
  sortField?: string;
  sortOrder?: string;
  filters?: Record<string, FilterValue | null>;
  searchTerm?: string;
}

export default function Home() {
  const [rules, setRules] = useState<RuleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [listOrMap, setListOrMap] = useState("list");
  const [categories, setCategories] = useState<ColumnFilterItem[]>([]);

  const [klammRules, setKlammRules] = useState<any[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<CategoryObject[]>([]);
  const [location, setLocation] = useState<Location>();
  const [categoryValue, setCategoryValue] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    setLocation(window.location);
  }, []);

  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 15,
      total: 0,
    },
    filters: {},
    searchTerm: "",
  });

  const fetchData = async () => {
    setLoading(true);
    setMapLoading(true);
    try {
      const response = await getAllRuleData({
        page: tableParams.pagination?.current || 1,
        pageSize: tableParams.pagination?.pageSize,
        sortField: tableParams.sortField,
        sortOrder: tableParams.sortOrder,
        filters: tableParams.filters,
        searchTerm: tableParams.searchTerm,
      });

      setRules(response.data);
      setCategories(response.categories);
      setTableParams({
        ...tableParams,
        pagination: {
          ...tableParams.pagination,
          total: response.total,
        },
      });
      setLoading(false);

      const { rules: graphRules, categories: graphCategories } = await fetchGraphRuleData();
      setKlammRules(graphRules);
      setCategoriesMap(graphCategories);
      setMapLoading(false);
    } catch (error) {
      logError(`Error loading rules: ${error}`);
      setLoading(false);
      setMapLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(tableParams)]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setTableParams({
      ...tableParams,
      searchTerm: value,
      pagination: { ...tableParams.pagination, current: 1 },
    });
  };

  const handleCategoryChange = (values: string[]) => {
    setCategoryValue(values);
    setTableParams({
      ...tableParams,
      filters: {
        ...tableParams.filters,
        filepath: values,
      },
      pagination: { ...tableParams.pagination, current: 1 },
    });
  };

  const formatFilePathTags = (filepath: string) => {
    const parts = filepath.split("/");
    return (
      <Flex gap="small" align="center" wrap={true}>
        {parts.map((part, index) => (
          <React.Fragment key={index}>{index < parts.length - 1 && <Tag color="blue">{part}</Tag>}</React.Fragment>
        ))}
      </Flex>
    );
  };

  const columns: TableColumnsType<RuleInfo> = [
    {
      title: "Rule",
      dataIndex: "title",
      key: "title",
      sorter: true,
      width: "35%",
      minWidth: 350,
      render: (_, record) => {
        const ruleLink = `/rule/${record._id}`;
        const draftLink = `${ruleLink}?version=draft`;
        return (
          <b>
            <a href={record.isPublished ? ruleLink : draftLink} className={styles.mainLink}>
              {record.title || record.filepath}
            </a>
          </b>
        );
      },
    },
    {
      title: "Categories",
      dataIndex: "filepath",
      key: "filepath",
      sorter: true,
      width: "25%",
      responsive: ["lg" as Breakpoint],
      render: (_, record) => <span>{formatFilePathTags(record.filepath)}</span>,
    },
    {
      title: "Versions",
      key: "versions",
      responsive: ["md" as Breakpoint],
      width: "auto",
      render: (_, record) => {
        const ruleLink = `/rule/${record._id}`;
        const draftLink = `${ruleLink}?version=draft`;
        return (
          <Flex gap="small" justify="end" wrap="wrap">
            <Button
              href={draftLink}
              icon={<EditOutlined />}
              type="dashed"
              size="small"
              danger
              className={styles.draftBtn}
            >
              Draft
            </Button>
            {record.reviewBranch && (
              <Button
                href={`${ruleLink}?version=inReview`}
                icon={<EyeOutlined />}
                type="dashed"
                size="small"
                className={styles.inReviewBtn}
              >
                In Review
              </Button>
            )}
            {record.isPublished && (
              <>
                <Button
                  href={`${ruleLink}?version=inDev`}
                  icon={<CheckCircleOutlined />}
                  size="small"
                  className={styles.inDevBtn}
                >
                  In Dev
                </Button>
                {process.env.NEXT_PUBLIC_IN_PRODUCTION === "true" && (
                  <Button
                    href={`${ruleLink}?version=inProduction`}
                    icon={<CheckCircleFilled />}
                    size="small"
                    className={styles.inProductionBtn}
                  >
                    In Prod
                  </Button>
                )}
                <Button
                  href={`${ruleLink}/embedded`}
                  icon={<DownSquareOutlined />}
                  size="small"
                  className={styles.embeddedBtn}
                >
                  Embeddable
                </Button>
              </>
            )}
          </Flex>
        );
      },
    },
  ];

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<RuleInfo> | SorterResult<RuleInfo>[]
  ) => {
    setTableParams((prevParams) => ({
      pagination,
      filters,
      searchTerm: prevParams.searchTerm,
      ...(!Array.isArray(sorter) && {
        sortField: sorter.field as string,
        sortOrder: sorter.order ? sorter.order : undefined,
      }),
    }));
  };

  const clearAll = () => {
    setCategoryValue([]);
    setSearchTerm("");
    setTableParams({
      pagination: { current: 1, pageSize: 15, total: 0 },
      filters: {},
      searchTerm: "",
      sortField: "",
      sortOrder: undefined,
    });
  };

  const pageContent = () => {
    if (loading) {
      return (
        <Spin tip="Loading rules..." className="spinner">
          <div className="content" />
        </Spin>
      );
    }

    if (listOrMap === "list") {
      return (
        <Table
          columns={columns}
          dataSource={rules}
          tableLayout="fixed"
          pagination={tableParams.pagination}
          loading={loading}
          onChange={handleTableChange}
          rowKey="_id"
        />
      );
    }

    if (mapLoading) {
      return (
        <Spin tip="Loading map view..." className="spinner">
          <div className="content" />
        </Spin>
      );
    }

    return (
      <RuleRelationsGraph
        rules={klammRules}
        categories={categoriesMap}
        location={location}
        filter={categoryValue}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
    );
  };

  return (
    <>
      <Flex justify="space-between" align="center" className={styles.headerWrapper}>
        <h1>SDPR Business Rules Management</h1>
        <Flex gap="small">
          <Button type="primary" href="/rule/new">
            New rule +
          </Button>
          <Button danger href="/admin">
            Admin
          </Button>
        </Flex>
      </Flex>
      <Flex gap="small">
        <Input.Search
          placeholder="Search rules..."
          onSearch={handleSearch}
          style={{ marginBottom: 16 }}
          allowClear
          aria-label="Search rules"
          role="searchbox"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select
          mode="multiple"
          options={categories}
          placeholder="Filter by category..."
          aria-label="Filter by category"
          onChange={handleCategoryChange}
          value={categoryValue}
          style={{ minWidth: 200, marginBottom: 16 }}
        />
        <Button onClick={clearAll} aria-label="Reset filters">
          Reset Filters ↻
        </Button>
      </Flex>
      <div className={styles.viewSelector}>
        <Segmented
          block
          onChange={(value) => setListOrMap(value)}
          options={[
            { label: "List View", value: "list", icon: <UnorderedListOutlined />, className: styles.segmentedControl },
            { label: "Map View", value: "map", icon: <DeploymentUnitOutlined />, className: styles.segmentedControl },
          ]}
          value={listOrMap}
        />
      </div>
      {pageContent()}
    </>
  );
}
