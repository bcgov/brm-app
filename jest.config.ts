import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
    "^.+\\.(js|jsx)$": ["babel-jest", { presets: ["next/babel"] }],
  },
  moduleNameMapper: {
    // "^antd(.*)$": "<rootDir>/node_modules/antd$1",
    "^@/(.*)$": "<rootDir>/$1",
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    "^antd/es/(.*)$": "<rootDir>/node_modules/antd/lib/$1",
    "^antd(.*)$": "<rootDir>/node_modules/antd/lib$1",
  },
  // transformIgnorePatterns: ["/node_modules/(?!(@ant-design|antd|rc-.*|@babel/runtime|d3.*)/.*)/"],
  transformIgnorePatterns: ["/node_modules/(?!antd|@ant-design|rc-*|@babel/runtime).+\\.js$"],

  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverage: true,
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "!app/**/*.d.ts",
    "!app/**/*.{test,spec}.{js,jsx,ts,tsx}",
    "!app/**/index.{js,jsx,ts,tsx}",
    "!**/node_modules/**",
  ],
  coverageProvider: "v8",
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
};

export default createJestConfig(config);
