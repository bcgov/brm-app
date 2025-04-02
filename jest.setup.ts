import "@testing-library/jest-dom";
import { jest } from "@jest/globals";

process.env.NEXT_PUBLIC_GITHUB_REPO_URL = "https://api.github.com/repos/bcgov/brms-rules";
process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER = "bcgov";

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};
