import { renderHook, act } from "@testing-library/react";
import { useTheme } from "./useTheme";

const originalMatchMedia = window.matchMedia;

describe("useTheme", () => {
  let mediaQueryMock: any;
  let changeHandler: ((e: MediaQueryListEvent) => void) | null = null;

  beforeEach(() => {
    changeHandler = null;

    mediaQueryMock = {
      matches: false,
      addEventListener: jest.fn((event, handler) => {
        if (event === "change") {
          changeHandler = handler;
        }
      }),
      removeEventListener: jest.fn(),
    };

    window.matchMedia = jest.fn().mockImplementation(() => mediaQueryMock);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  describe("Initial Theme Detection", () => {
    test("returns light theme when user prefers light mode", () => {
      mediaQueryMock.matches = false;
      const { result } = renderHook(() => useTheme());
      expect(result.current).toBe("light");
    });

    test("returns dark theme when user prefers dark mode", () => {
      mediaQueryMock.matches = true;
      const { result } = renderHook(() => useTheme());
      expect(result.current).toBe("dark");
    });
  });

  describe("Theme Change Listener", () => {
    test("adds event listener on mount", () => {
      renderHook(() => useTheme());
      expect(mediaQueryMock.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    });

    test("removes event listener on unmount", () => {
      const { unmount } = renderHook(() => useTheme());
      unmount();
      expect(mediaQueryMock.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    });

    test("updates theme when system preference changes", () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        if (changeHandler) {
          changeHandler({ matches: true } as MediaQueryListEvent);
        }
      });
      expect(result.current).toBe("dark");

      act(() => {
        if (changeHandler) {
          changeHandler({ matches: false } as MediaQueryListEvent);
        }
      });
      expect(result.current).toBe("light");
    });
  });
});
