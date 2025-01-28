"use client";
import type { ThemeConfig } from "antd";
import { theme } from "antd";

const { darkAlgorithm, defaultAlgorithm } = theme;

const baseTheme: ThemeConfig = {
  components: {
    Table: {
      headerBorderRadius: 0,
      rowHoverBg: "#f7f9fc",
    },
    Select: {
      optionFontSize: 16,
    },
    List: {
      itemPaddingSM: "4px 0px",
    },
  },
};

export const defaultTheme: ThemeConfig = {
  algorithm: defaultAlgorithm,
  ...baseTheme,
};

export const darkTheme: ThemeConfig = {
  algorithm: darkAlgorithm,
  ...baseTheme,
};
