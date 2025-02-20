import { renderHook, act } from "@testing-library/react";
import useLeaveScreenPopup from "./useLeaveScreenPopup";

describe("useLeaveScreenPopup", () => {
  type MockBeforeUnloadEvent = {
    preventDefault: () => void;
    returnValue: string;
  };

  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;
  let mockEvent: MockBeforeUnloadEvent;
  let capturedHandler: ((event: MockBeforeUnloadEvent) => void) | null = null;

  beforeEach(() => {
    mockEvent = {
      preventDefault: jest.fn(),
      returnValue: "",
    };

    addEventListenerSpy = jest
      .spyOn(window, "addEventListener")
      .mockImplementation(
        (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
          if (type === "beforeunload") {
            capturedHandler = (event: MockBeforeUnloadEvent) => {
              if (typeof listener === "function") {
                listener({ ...event, type: "beforeunload" } as unknown as Event);
              } else {
                listener.handleEvent({ ...event, type: "beforeunload" } as unknown as Event);
              }
            };
          }
        }
      );
    removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    jest.clearAllMocks();
    capturedHandler = null;
  });

  describe("Event Listener Management", () => {
    test("adds beforeunload event listener on mount", () => {
      renderHook(() => useLeaveScreenPopup());
      expect(addEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
    });

    test("removes beforeunload event listener on unmount", () => {
      const { unmount } = renderHook(() => useLeaveScreenPopup());
      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
    });
  });

  describe("Unsaved Changes Handling", () => {
    test("does not prevent navigation when no unsaved changes", () => {
      renderHook(() => useLeaveScreenPopup());

      if (capturedHandler) {
        capturedHandler(mockEvent);
      }

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(mockEvent.returnValue).toBe("");
    });

    test("prevents navigation when there are unsaved changes", () => {
      const { result } = renderHook(() => useLeaveScreenPopup());

      act(() => {
        result.current.setHasUnsavedChanges(true);
      });

      expect(capturedHandler).not.toBeNull();

      if (capturedHandler) {
        capturedHandler(mockEvent);
      }

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.returnValue).toBe("");
    });
  });

  describe("State Management", () => {
    test("allows setting unsaved changes state", () => {
      const { result } = renderHook(() => useLeaveScreenPopup());

      act(() => {
        result.current.setHasUnsavedChanges(true);
      });

      if (capturedHandler) {
        capturedHandler(mockEvent);
      }
      expect(mockEvent.preventDefault).toHaveBeenCalled();

      (mockEvent.preventDefault as jest.Mock).mockClear();

      act(() => {
        result.current.setHasUnsavedChanges(false);
      });

      if (capturedHandler) {
        capturedHandler(mockEvent);
      }
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });
  });
});
