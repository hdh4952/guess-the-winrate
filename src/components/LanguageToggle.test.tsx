import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { LanguageProvider } from "../i18n/LanguageContext";
import { LanguageToggle } from "./LanguageToggle";

describe("LanguageToggle", () => {
  beforeEach(() => localStorage.clear());

  it("marks the active language as pressed", () => {
    const { getByRole } = render(
      <LanguageProvider initialLang="ko">
        <LanguageToggle />
      </LanguageProvider>,
    );
    expect(getByRole("button", { name: "KO" })).toHaveAttribute("aria-pressed", "true");
    expect(getByRole("button", { name: "EN" })).toHaveAttribute("aria-pressed", "false");
  });

  it("switches language and persists on click", () => {
    const { getByRole } = render(
      <LanguageProvider initialLang="ko">
        <LanguageToggle />
      </LanguageProvider>,
    );
    fireEvent.click(getByRole("button", { name: "EN" }));
    expect(getByRole("button", { name: "EN" })).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("gtw-lang")).toBe("en");
  });
});
