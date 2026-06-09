import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import App from "./App";
import { LanguageProvider } from "./i18n/LanguageContext";

vi.mock("./pwa/useServiceWorkerUpdate", () => ({
  useServiceWorkerUpdate: () => ({ needRefresh: false, refresh: vi.fn() }),
}));

describe("App", () => {
  it("renders the title and the rating picker on first load", () => {
    const { getByText, container } = render(<App />);
    expect(getByText("Guess the Winrate")).toBeInTheDocument();
    expect(getByText("레이팅 구간을 선택하세요")).toBeInTheDocument();
    // 9 rating-band buttons, no game round triggered (no network)
    expect(container.querySelectorAll(".rating-grid button")).toHaveLength(9);
  });

  it("shows a Lichess attribution link on the home screen", () => {
    const { getByRole } = render(<App />);
    const link = getByRole("link", { name: /Lichess/ });
    expect(link).toHaveAttribute("href", "https://lichess.org");
  });

  it("renders English copy and a language toggle under an en provider", () => {
    const { getByText, getByRole } = render(
      <LanguageProvider initialLang="en">
        <App />
      </LanguageProvider>,
    );
    expect(getByText("Pick a rating range")).toBeInTheDocument();
    expect(getByRole("button", { name: "EN" })).toBeInTheDocument();
  });
});
