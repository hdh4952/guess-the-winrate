import { describe, it, expect } from "vitest";
import { useRef } from "react";
import { render } from "@testing-library/react";
import { useElementWidth } from "./useElementWidth";

function Probe() {
  const ref = useRef<HTMLDivElement>(null);
  const width = useElementWidth(ref, 280);
  return (
    <div ref={ref} data-testid="probe">
      {width}
    </div>
  );
}

describe("useElementWidth", () => {
  it("returns the fallback when the element has no measurable width (jsdom)", () => {
    const { getByTestId } = render(<Probe />);
    expect(getByTestId("probe").textContent).toBe("280");
  });
});
