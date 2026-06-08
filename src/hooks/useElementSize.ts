import { useLayoutEffect, useState, type RefObject } from "react";

export interface Size {
  width: number;
  height: number;
}

/**
 * Measures the referenced element's content box (px) via ResizeObserver.
 * Falls back to `fallback` for any dimension that is 0 (e.g. in jsdom).
 */
export function useElementSize(
  ref: RefObject<HTMLElement>,
  fallback: Size = { width: 0, height: 0 }
): Size {
  const [size, setSize] = useState<Size>(fallback);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize({
        width: r.width > 0 ? r.width : fallback.width,
        height: r.height > 0 ? r.height : fallback.height,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, fallback.width, fallback.height]);

  return size;
}
