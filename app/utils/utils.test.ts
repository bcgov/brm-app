import {
  getFieldValidation,
  getShortFilenameOnly,
  dollarFormat,
  generateDescriptiveName,
  getVersionColor,
} from "./utils";
import dayjs from "dayjs";

describe("getFieldValidation", () => {
  test("handles true-false dataType", () => {
    const result = getFieldValidation("", "", "true-false");
    expect(result).toEqual({ type: "true-false" });
  });

  test("handles equality validation", () => {
    const result = getFieldValidation("5", "==", "number-input");
    expect(result).toEqual({ equals: "5", type: "number" });
  });

  test("handles inequality validation", () => {
    const result = getFieldValidation("hello", "!=", "text");
    expect(result).toEqual({ doesnotmatch: "hello", type: "text" });
  });

  test("handles regex validation", () => {
    const result = getFieldValidation("^[a-z]+$", "regex", "text");
    expect(result).toEqual({ pattern: /^[a-z]+$/, type: "text" });
  });

  test("handles greater than or equal to for numbers", () => {
    const result = getFieldValidation("10", ">=", "number-input");
    expect(result).toEqual({ min: 10, type: "number" });
  });

  test("handles greater than or equal to for dates", () => {
    const date = "2023-01-01";
    const result = getFieldValidation(date, ">=", "date");
    expect(result).toEqual({ min: dayjs(date), type: "date" });
  });

  test("handles greater than for numbers", () => {
    const result = getFieldValidation("10", ">", "number-input");
    expect(result).toEqual({ min: 11, type: "number" });
  });

  test("handles less than or equal to for numbers", () => {
    const result = getFieldValidation("10", "<=", "number-input");
    expect(result).toEqual({ max: 10, type: "number" });
  });

  test("handles less than for numbers", () => {
    const result = getFieldValidation("10", "<", "number-input");
    expect(result).toEqual({ max: 9, type: "number" });
  });

  test("handles inclusive number range", () => {
    const result = getFieldValidation("[1, 10]", "[num]", "number-input");
    expect(result).toEqual({
      range: { min: 1, max: 10, inclusive: true },
      type: "number",
    });
  });

  test("handles exclusive date range", () => {
    const result = getFieldValidation("(2023-01-01, 2023-12-31)", "(date)", "date");
    expect(result).toEqual({
      range: { min: dayjs("2023-01-01"), max: dayjs("2023-12-31"), inclusive: false },
      type: "date",
    });
  });

  test("handles text options", () => {
    const result = getFieldValidation("red,green,blue", "[=text]", "text");
    expect(result).toEqual({
      options: [
        { value: "red", type: "string" },
        { value: "green", type: "string" },
        { value: "blue", type: "string" },
        { value: null, type: null, label: "No Value" },
      ],
      type: "select",
    });
  });

  test("handles number options", () => {
    const result = getFieldValidation("1,2,3", "[=num]", "number-input");
    expect(result).toEqual({
      options: [
        { value: "1", type: "string" },
        { value: "2", type: "string" },
        { value: "3", type: "string" },
        { value: null, type: null, label: "No Value" },
      ],
      type: "select",
    });
  });

  test("handles unknown validation type", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const result = getFieldValidation("", "unknown", "text");
    expect(result).toEqual({ type: "text" });
    expect(consoleSpy).toHaveBeenCalledWith("Unknown validation type: unknown");
    consoleSpy.mockRestore();
  });
});

describe("getShortFilenameOnly", () => {
  test("returns full filename when shorter than maxLength", () => {
    const result = getShortFilenameOnly("path/to/short.txt");
    expect(result).toBe("short.txt");
  });

  test("truncates filename when longer than maxLength", () => {
    const result = getShortFilenameOnly("path/to/verylongfilename.txt", 10);
    expect(result).toBe("verylon...");
  });

  test("truncates without dots when showTrailingDots is false", () => {
    const result = getShortFilenameOnly("path/to/verylongfilename.txt", 10, false);
    expect(result).toBe("verylon");
  });
});

describe("dollarFormat", () => {
  test("formats number to dollar string with two decimals", () => {
    expect(dollarFormat(1234.5)).toBe("1,234.50");
    expect(dollarFormat(1000)).toBe("1,000.00");
    expect(dollarFormat(99.99)).toBe("99.99");
  });
});

describe("generateDescriptiveName", () => {
  test("generates name from simple object", () => {
    const obj = { name: "test", value: 123 };
    expect(generateDescriptiveName(obj)).toBe("name_test_value_123");
  });

  test("filters out null values and rulemap key", () => {
    const obj = { name: "test", rulemap: "ignore", nullValue: null };
    expect(generateDescriptiveName(obj)).toBe("name_test");
  });

  test("handles nested objects", () => {
    const obj = { outer: { inner: "value" } };
    expect(generateDescriptiveName(obj)).toBe("inner_value");
  });
});

describe("getVersionColor", () => {
  test("returns correct colors for different versions", () => {
    expect(getVersionColor("draft")).toBe("var(--color-in-draft)");
    expect(getVersionColor("inReview")).toBe("var(--color-in-review)");
    expect(getVersionColor("inDev")).toBe("var(--color-in-dev)");
    expect(getVersionColor("inProduction")).toBe("var(--color-in-production)");
    expect(getVersionColor(undefined)).toBe("var(--color-in-production)");
  });
});
