import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { LanguageProvider, useLanguage } from "./LanguageContext";

function Probe() {
  const { lang, setLang } = useLanguage();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <button onClick={() => setLang("en")}>to-en</button>
    </div>
  );
}

describe("LanguageProvider", () => {
  beforeEach(() => localStorage.clear());

  it("uses initialLang when provided", () => {
    const { getByTestId } = render(
      <LanguageProvider initialLang="en">
        <Probe />
      </LanguageProvider>,
    );
    expect(getByTestId("lang").textContent).toBe("en");
  });

  it("setLang updates context and persists to localStorage", () => {
    const { getByTestId, getByText } = render(
      <LanguageProvider initialLang="ko">
        <Probe />
      </LanguageProvider>,
    );
    fireEvent.click(getByText("to-en"));
    expect(getByTestId("lang").textContent).toBe("en");
    expect(localStorage.getItem("gtw-lang")).toBe("en");
  });

  it("defaults to ko when used without a provider", () => {
    const { getByTestId } = render(<Probe />);
    expect(getByTestId("lang").textContent).toBe("ko");
  });
});
