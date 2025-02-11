import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const config: Config = {
  collectCoverage: true,
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}", // Include all TS/TSX files in src
    "!app/**/*.d.ts", // Exclude type declaration files
    "!app/**/*.{test,spec}.{ts,tsx}", // Exclude test files
    "!app/**/index.{ts,tsx}", // Optionally exclude index files
    "!**/node_modules/**", // Exclude dependencies
  ],
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
