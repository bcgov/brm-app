"use client";
import { ConfigProvider, Spin } from "antd";
import { useTheme } from "./hooks/useTheme";
import { defaultTheme, darkTheme } from "./styles/themeConfig";

export default function CustomConfigProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = useTheme();

  return (
    <ConfigProvider theme={theme === "dark" ? darkTheme : defaultTheme}>
      {theme ? children : <Spin className="spinnerFullscreen" />}
    </ConfigProvider>
  );
}
