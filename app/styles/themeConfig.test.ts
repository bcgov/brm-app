import { ThemeConfig } from "antd";
import { defaultTheme, darkTheme } from "./themeConfig";

jest.mock("antd", () => ({
  theme: {
    defaultAlgorithm: jest.fn(() => ({ type: "light" })),
    darkAlgorithm: jest.fn(() => ({ type: "dark" })),
  },
}));

describe("Theme Configuration", () => {
  describe("Base Theme Components", () => {
    test("both themes share the same base component configurations", () => {
      const expectedBaseComponents: ThemeConfig["components"] = {
        Typography: {
          titleMarginBottom: 0,
        },
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
      };

      expect(defaultTheme.components).toEqual(expectedBaseComponents);
      expect(darkTheme.components).toEqual(expectedBaseComponents);
    });
  });

  describe("Default Theme", () => {
    test("uses default algorithm", () => {
      expect(defaultTheme.algorithm).toBeDefined();
      expect(defaultTheme.algorithm).toBe(require("antd").theme.defaultAlgorithm);
    });

    test("maintains consistent base theme properties", () => {
      expect(defaultTheme.components).toBeDefined();
      expect(defaultTheme.components?.Typography?.titleMarginBottom).toBe(0);
      expect(defaultTheme.components?.Table?.headerBorderRadius).toBe(0);
      expect(defaultTheme.components?.Select?.optionFontSize).toBe(16);
    });
  });

  describe("Dark Theme", () => {
    test("uses dark algorithm", () => {
      expect(darkTheme.algorithm).toBeDefined();
      expect(darkTheme.algorithm).toBe(require("antd").theme.darkAlgorithm);
    });

    test("maintains consistent base theme properties", () => {
      expect(darkTheme.components).toBeDefined();
      expect(darkTheme.components?.Typography?.titleMarginBottom).toBe(0);
      expect(darkTheme.components?.Table?.headerBorderRadius).toBe(0);
      expect(darkTheme.components?.Select?.optionFontSize).toBe(16);
    });
  });

  describe("Theme Structure", () => {
    test("themes have required configuration properties", () => {
      const requiredProps = ["algorithm", "components"];

      requiredProps.forEach((prop) => {
        expect(defaultTheme).toHaveProperty(prop);
        expect(darkTheme).toHaveProperty(prop);
      });
    });

    test("table configurations are properly set", () => {
      const expectedTableConfig = {
        headerBorderRadius: 0,
        rowHoverBg: "#f7f9fc",
      };

      expect(defaultTheme.components?.Table).toEqual(expectedTableConfig);
      expect(darkTheme.components?.Table).toEqual(expectedTableConfig);
    });

    test("typography configurations are properly set", () => {
      const expectedTypographyConfig = {
        titleMarginBottom: 0,
      };

      expect(defaultTheme.components?.Typography).toEqual(expectedTypographyConfig);
      expect(darkTheme.components?.Typography).toEqual(expectedTypographyConfig);
    });
  });
});
