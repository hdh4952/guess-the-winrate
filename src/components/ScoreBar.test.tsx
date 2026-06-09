import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LanguageProvider } from "../i18n/LanguageContext";
import { ScoreBar } from "./ScoreBar";

describe("ScoreBar", () => {
  it("shows the streak and best values with Korean labels by default", () => {
    const { getByText, container } = render(<ScoreBar streak={3} best={7} />);
    expect(getByText(/현재 연속/)).toBeInTheDocument();
    expect(getByText(/최고 기록/)).toBeInTheDocument();
    expect(container.textContent).toContain("3");
    expect(container.textContent).toContain("7");
  });

  it("renders English labels under an en provider", () => {
    const { getByText } = render(
      <LanguageProvider initialLang="en">
        <ScoreBar streak={3} best={7} />
      </LanguageProvider>,
    );
    expect(getByText(/Streak/)).toBeInTheDocument();
    expect(getByText(/Best/)).toBeInTheDocument();
  });
});
