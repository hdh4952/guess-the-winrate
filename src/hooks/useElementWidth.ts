import { useLayoutEffect, useState, type RefObject } from "react";

/**
 * Measures the referenced element's width (px) via ResizeObserver.
 * Returns `fallback` until a non-zero width is measured (e.g. in jsdom).
 */
export function useElementWidth(
  ref: RefObject<HTMLElement>,
  fallback = 0
): number {
  const [width, setWidth] = useState<number>(fallback);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      setWidth(w > 0 ? w : fallback);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, fallback]);

  return width;
}
