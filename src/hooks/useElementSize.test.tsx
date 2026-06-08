import { describe, it, expect } from "vitest";
import { useRef } from "react";
import { render } from "@testing-library/react";
import { useElementSize } from "./useElementSize";

function Probe() {
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(ref, { width: 280, height: 200 });
  return (
    <div ref={ref} data-testid="probe">
      {width}x{height}
    </div>
  );
}

describe("useElementSize", () => {
  it("returns the fallback dimensions when unmeasurable (jsdom)", () => {
    const { getByTestId } = render(<Probe />);
    expect(getByTestId("probe").textContent).toBe("280x200");
  });
});
