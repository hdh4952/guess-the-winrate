import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { LanguageProvider } from "../i18n/LanguageContext";
import { UpdateToast } from "./UpdateToast";

describe("UpdateToast", () => {
  it("renders nothing when not visible", () => {
    const { container } = render(
      <UpdateToast visible={false} onRefresh={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows the Korean message and refresh button when visible", () => {
    const { getByText, getByRole } = render(
      <UpdateToast visible onRefresh={() => {}} />,
    );
    expect(getByText("새 버전이 있어요")).toBeInTheDocument();
    expect(getByRole("button", { name: "새로고침" })).toBeInTheDocument();
    expect(getByRole("status")).toBeInTheDocument();
  });

  it("calls onRefresh when the button is clicked", () => {
    const onRefresh = vi.fn();
    const { getByRole } = render(
      <UpdateToast visible onRefresh={onRefresh} />,
    );
    fireEvent.click(getByRole("button", { name: "새로고침" }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it("renders English copy under an en provider", () => {
    const { getByText, getByRole } = render(
      <LanguageProvider initialLang="en">
        <UpdateToast visible onRefresh={() => {}} />
      </LanguageProvider>,
    );
    expect(getByText("A new version is available")).toBeInTheDocument();
    expect(getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });
});
