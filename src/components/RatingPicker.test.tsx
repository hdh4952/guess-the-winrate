import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { RatingPicker } from "./RatingPicker";
import { LanguageProvider } from "../i18n/LanguageContext";

describe("RatingPicker", () => {
  it("renders all 9 bands and reports the chosen bucket", () => {
    const onSelect = vi.fn();
    const { getByText, container } = render(<RatingPicker onSelect={onSelect} />);
    expect(container.querySelectorAll("button")).toHaveLength(9);
    fireEvent.click(getByText("1600-1800"));
    expect(onSelect).toHaveBeenCalledWith(1600);
  });

  it("renders the English heading under an en provider", () => {
    const { getByText } = render(
      <LanguageProvider initialLang="en">
        <RatingPicker onSelect={() => {}} />
      </LanguageProvider>,
    );
    expect(getByText("Pick a rating range")).toBeInTheDocument();
  });
});
