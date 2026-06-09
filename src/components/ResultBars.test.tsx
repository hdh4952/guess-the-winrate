import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ResultBars } from "./ResultBars";
import { LanguageProvider } from "../i18n/LanguageContext";

describe("ResultBars", () => {
  it("shows the perspective win-rate percentage and sample count", () => {
    const { container } = render(
      <ResultBars counts={{ white: 60, draws: 20, black: 20 }} perspective="white" />
    );
    const rate = container.querySelector(".rate");
    expect(rate?.textContent).toContain("백");
    expect(rate?.textContent).toMatch(/60\.0%/);
    expect(rate?.textContent).toContain("100"); // total games (sample count)
  });

  it("uses the black share when perspective is black", () => {
    const { container } = render(
      <ResultBars counts={{ white: 60, draws: 20, black: 20 }} perspective="black" />
    );
    const rate = container.querySelector(".rate");
    expect(rate?.textContent).toContain("흑");
    expect(rate?.textContent).toMatch(/20\.0%/);
  });

  it("renders English legend, win-rate label and games sample under an en provider", () => {
    const { container } = render(
      <LanguageProvider initialLang="en">
        <ResultBars counts={{ white: 60, draws: 10, black: 30 }} perspective="white" />
      </LanguageProvider>,
    );
    expect(container.textContent).toContain("White 60.0%");
    expect(container.textContent).toContain("Draw 10.0%");
    expect(container.textContent).toContain("Black 30.0%");
    expect(container.textContent).toContain("White win rate");
    expect(container.textContent).toContain("(100 games)");
  });
});
