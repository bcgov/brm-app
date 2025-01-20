import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, Flex } from "antd";
import ErrorBoundary from "./components/ErrorBoundary";
import CustomConfigProvider from "./CustomConfigProvider";
import "./styles/globals.css";
import styles from "./styles/layout.module.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | Business Rules Management App (SDPR)",
    default: "Business Rules Management App (SDPR)",
  },
  description: "System for creating and simulating results for SDPR Business Rules",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AntdRegistry>
          <CustomConfigProvider>
            <ErrorBoundary>
              <App>
                {process.env.NEXT_PUBLIC_IN_PRODUCTION !== "true" && (
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
