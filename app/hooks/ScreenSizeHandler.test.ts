import { renderHook, act } from "@testing-library/react";
import useResponsiveSize from "./ScreenSizeHandler";

describe("useResponsiveSize", () => {
  let originalInnerWidth: number;
  let resizeEvent: Event;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    resizeEvent = new Event("resize");

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  describe("Initial Size Detection", () => {
    test("identifies desktop view when width > 992", () => {
      window.innerWidth = 1200;
      const { result } = renderHook(() => useResponsiveSize());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
    });

    test("identifies tablet view when 480 < width <= 992", () => {
      window.innerWidth = 800;
      const { result } = renderHook(() => useResponsiveSize());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
    });

    test("identifies mobile view when width <= 480", () => {
      window.innerWidth = 400;
      const { result } = renderHook(() => useResponsiveSize());

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
    });
  });

  describe("Window Resize Handling", () => {
    test("adds resize listener on mount", () => {
      const addEventListenerSpy = jest.spyOn(window, "addEventListener");
      renderHook(() => useResponsiveSize());

      expect(addEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    });

    test("removes resize listener on unmount", () => {
      const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
      const { unmount } = renderHook(() => useResponsiveSize());

      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    });

    test("updates screen size state on window resize", () => {
      const { result } = renderHook(() => useResponsiveSize());

      act(() => {
        window.innerWidth = 800;
        window.dispatchEvent(resizeEvent);
      });

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);

      act(() => {
        window.innerWidth = 400;
        window.dispatchEvent(resizeEvent);
      });

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
    });
  });
});
