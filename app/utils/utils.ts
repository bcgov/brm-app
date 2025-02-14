import dayjs from "dayjs";
import { RULE_VERSION } from "@/app/constants/ruleVersion";

/**
 * Downloads a file from a given data blob.
 *
 * @param dataBlob - The data blob to download.
 * @param type - The type of the data blob.
 * @param filename - The name of the file to be downloaded.
 */
export const downloadFileBlob = (dataBlob: any, type: string, filename: string) => {
  const blob = new Blob([dataBlob], { type });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Gets the last section of a filepath (aka the filename). Shortens if desired.
 * @param filepath
 * @param maxLength
 * @param showTrailingDots
 */
export const getShortFilenameOnly = (
  filepath: string,
  maxLength: number | null = 25,
  showTrailingDots = true
): string => {
  const filepathSections = filepath.split("/");
  const filename = filepathSections[filepathSections.length - 1];
  if (maxLength && filename.length > maxLength) {
    return `${filename.substring(0, maxLength - 3)}${showTrailingDots ? "..." : ""}`;
  }
  return filename;
};

/**
 * Converts a number to a dollar format
 * @param value
 */

export const dollarFormat = (value: number) => {
  const newValue = value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return newValue;
};

/**
 * Get Field validation formatting
 * @param validationCriteria
 * @param validationType
 * @param dataType
 * @returns Record<string, any>
 */

// Sample reusable function to get field validation parameters
export const getFieldValidation = (validationCriteria: string, validationType: string, dataType: string) => {
  const validationRules: Record<string, any> = {};
  if (dataType === "true-false") {
    validationRules["type"] = "true-false";
    return validationRules;
  }

  if (validationType)
    switch (validationType) {
      case "==": // Data equal to
        validationRules["equals"] = validationCriteria;
        break;

      case "!=": // Data not equal to
        validationRules["doesnotmatch"] = validationCriteria;
        break;

      case "regex": // Text Pattern (regex)
        validationRules["pattern"] = new RegExp(validationCriteria);
        break;

      case ">=": // Number greater than or equal to
        validationRules["min"] = dataType === "number-input" ? Number(validationCriteria) : dayjs(validationCriteria);
        break;

      case ">": // Number greater than
        validationRules["min"] =
          dataType === "number-input" ? Number(validationCriteria) + 1 : dayjs(validationCriteria);
        break;

      case "<=": // Number less than or equal to
        validationRules["max"] = dataType === "number-input" ? Number(validationCriteria) : dayjs(validationCriteria);
        break;

      case "<": // Number less than
        validationRules["max"] =
          dataType === "number-input" ? Number(validationCriteria) - 1 : dayjs(validationCriteria);
        break;

      case "(num)": // Number within range (exclusive)
      case "[num]": // Number within range (inclusive)
      case "(date)": // Date within range (exclusive)
      case "[date]": // Date within range (inclusive)
        const [minRaw, maxRaw] = validationCriteria
          .replace(/[\[\]\(\)]/g, "")
          .split(",")
          .map((s) => s.trim());
        const parseValue = (value: string) => (value === "today" ? new Date() : value);
        const min = parseValue(minRaw);
        const max = parseValue(maxRaw);

        if (minRaw && maxRaw) {
          validationRules["range"] = {
            min: dataType === "number-input" ? Number(min) : dayjs(min),
            max: dataType === "number-input" ? Number(max) : dayjs(max),
            inclusive: validationType.startsWith("["),
          };
        }
        break;

      case "[=text]": // Text Options
      case "[=texts]": // Text Multiselect Options

      case "[=num]": // Number Options
      case "[=nums]": // Number Multiselect Options

      case "[=date]": // Date Options
      case "[=dates]": // Date Multiselect Options
        const options: { value: string | number | Date | null; type: string | null | undefined; label?: string }[] =
          validationCriteria
            .replace(/[\[\]]/g, "")
            .split(",")
            .map((value) => ({ value: value.trim(), type: typeof value }));
        options.push({ value: null, type: null, label: "No Value" }); // Add null as the last option
        validationRules["options"] = options;
        break;

      default:
        console.warn(`Unknown validation type: ${validationType}`);
    }

  // Enforce proper type-based validation
  if (validationRules?.options?.length > 0) {
    validationRules["type"] = ["[=texts]", "[=dates]", "[=nums]"].includes(validationType) ? "multiselect" : "select";
  } else {
    validationRules["type"] = dataType === "number-input" ? "number" : dataType === "date" ? "date" : "text";
  }

  return validationRules;
};

/**
 * Generates a descriptive name for a scenario based on its properties
 * @param obj The object representing the scenario
 * @param maxLength The maximum length allowed for individual key-value pairs
 * @returns A string representing the descriptive name
 */
export const generateDescriptiveName = (obj: Record<string, any>, maxLength: number = 20): string => {
  return Object.entries(obj)
    .filter(([key, value]) => value !== null && key !== "rulemap")
    .map(([key, value]) => {
      if (typeof value === "object") return generateDescriptiveName(value, maxLength);
      const truncatedKey = String(key).length > maxLength ? String(key).slice(0, maxLength) : key;
      return `${truncatedKey}_${value}`;
    })
    .join("_");
};

export const getVersionColor = (version?: string): string => {
  switch (version) {
    case RULE_VERSION.draft:
      return "var(--color-in-draft)";
    case RULE_VERSION.inReview:
      return "var(--color-in-review)";
    case RULE_VERSION.inDev:
      return "var(--color-in-dev)";
    default:
      return "var(--color-in-production)";
  }
};
