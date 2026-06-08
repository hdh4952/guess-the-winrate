import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the title and the rating picker on first load", () => {
    const { getByText, container } = render(<App />);
    expect(getByText("Guess the Winrate")).toBeInTheDocument();
    expect(getByText("레이팅 구간을 선택하세요")).toBeInTheDocument();
    // 9 rating-band buttons, no game round triggered (no network)
    expect(container.querySelectorAll(".rating-grid button")).toHaveLength(9);
  });
});
