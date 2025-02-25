import { renderHook, act } from "@testing-library/react";
import { useJSONUpload } from "./useJSONUpload";
import { createRuleJSONWithScenarios } from "@/app/utils/ruleScenariosFormat";
import { downloadFileBlob } from "@/app/utils/utils";

jest.mock("@/app/utils/ruleScenariosFormat", () => ({
  createRuleJSONWithScenarios: jest.fn(),
}));

jest.mock("@/app/utils/utils", () => ({
  downloadFileBlob: jest.fn(),
}));

jest.mock("antd", () => ({
  Modal: {
    confirm: jest.fn(),
  },
}));

describe("useJSONUpload", () => {
  const mockDecisionGraphRef = { current: {} };
  const mockUpdateScenarios = jest.fn();
  const mockJsonFilename = "test.json";
  const mockRuleContent = { nodes: [], edges: [] };

  let eventListeners: Record<string, Function[]> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    eventListeners = {
      change: [],
      click: [],
    };

    document.addEventListener = jest.fn((event, cb: EventListener) => {
      eventListeners[event] = eventListeners[event] || [];
      eventListeners[event].push(cb as Function);
    });

    document.removeEventListener = jest.fn((event, cb) => {
      eventListeners[event] = eventListeners[event].filter((fn) => fn !== cb);
    });

    Object.defineProperty(window, "location", {
      value: {
        pathname: "/rule/test-rule-id",
      },
      writable: true,
    });

    global.FileReader = class {
      onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
      error: ProgressEvent<FileReader> | null = null;
      readyState: number = 0;
      result: string | ArrayBuffer | null = null;
      abort(): void {}
      onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
      onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
      onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
      onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
      onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
      DONE: number = 2;
      EMPTY: number = 0;
      LOADING: number = 1;
      addEventListener(): void {}
      removeEventListener(): void {}
      dispatchEvent(): boolean {
        return true;
      }

      readAsText(blob: Blob) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (this.onload && blob instanceof File) {
            this.onload.call(reader, {
              target: { result: blob.toString() },
            } as ProgressEvent<FileReader>);
          }
        };

        setTimeout(() => {
          if (reader.onload) {
            reader.onload.call(reader, {
              target: { result: blob.toString() },
            } as ProgressEvent<FileReader>);
          }
        }, 0);
      }
    } as unknown as typeof FileReader;
  });

  describe("Event Listeners", () => {
    test("adds and removes event listeners on mount/unmount", () => {
      const { unmount } = renderHook(() =>
        useJSONUpload(mockJsonFilename, mockUpdateScenarios, mockDecisionGraphRef, mockRuleContent)
      );

      expect(document.addEventListener).toHaveBeenCalledWith("change", expect.any(Function), true);
      expect(document.addEventListener).toHaveBeenCalledWith("click", expect.any(Function));

      unmount();

      expect(document.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function), true);
      expect(document.removeEventListener).toHaveBeenCalledWith("click", expect.any(Function));
    });
  });

  describe("JSON Download Handling", () => {
    test("intercepts JSON download and adds scenarios", async () => {
      const mockUpdatedJSON = { nodes: [], edges: [], scenarios: [] };
      (createRuleJSONWithScenarios as jest.Mock).mockResolvedValue(mockUpdatedJSON);

      renderHook(() => useJSONUpload(mockJsonFilename, mockUpdateScenarios, mockDecisionGraphRef, mockRuleContent));

      const clickEvent = {
        target: {
          download: "graph.json",
        },
        preventDefault: jest.fn(),
      };

      await act(async () => {
        const clickListener = eventListeners.click[0];
        await clickListener(clickEvent);
      });

      expect(clickEvent.preventDefault).toHaveBeenCalled();
      expect(createRuleJSONWithScenarios).toHaveBeenCalledWith(mockJsonFilename, mockRuleContent);
      expect(downloadFileBlob).toHaveBeenCalledWith(
        JSON.stringify(mockUpdatedJSON, null, 2),
        "application/json",
        mockJsonFilename
      );
    });
  });

  describe("Error Handling", () => {
    test("handles file parsing errors", async () => {
      const mockFile = new File(["invalid json"], "test.json", { type: "application/json" });
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      renderHook(() => useJSONUpload(mockJsonFilename, mockUpdateScenarios, mockDecisionGraphRef, mockRuleContent));

      await act(async () => {
        const changeEvent = {
          target: {
            accept: "application/json",
            type: "file",
            files: [mockFile],
          },
        };
        const changeListener = eventListeners.change[0];
        await changeListener(changeEvent);

        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(consoleSpy).toHaveBeenCalledWith("Error parsing JSON file:", expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});
