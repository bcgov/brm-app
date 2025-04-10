import type { Metadata } from "next";
import { PublicEnvScript, env } from "next-runtime-env";
import { Inter } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, Flex } from "antd";
import ErrorBoundary from "./components/ErrorBoundary";
import CustomConfigProvider from "./CustomConfigProvider";
import "./styles/globals.scss";
import styles from "./styles/layout.module.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: `%s | ${env("NEXT_PUBLIC_APP_NAME") || "Business Rules Management App"}`,
    default: env("NEXT_PUBLIC_APP_NAME") || "Business Rules Management App",
  },
  description: env("NEXT_PUBLIC_APP_DESCRIPTION") || "System for creating and simulating results for Business Rules",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <PublicEnvScript />
      </head>
      <body className={inter.className}>
        <AntdRegistry>
          <CustomConfigProvider>
            <ErrorBoundary>
              <App>
                {env("NEXT_PUBLIC_IN_PRODUCTION") !== "true" && (
                  <div className={styles.alertBanner}>YOU ARE USING A DEVELOPMENT VERSION OF THE APP</div>
                )}
                <Flex justify="center" className={styles.layoutWrapper}>
                  {children}
                </Flex>
              </App>
            </ErrorBoundary>
          </CustomConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
