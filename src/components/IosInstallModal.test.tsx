import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { LanguageProvider } from "../i18n/LanguageContext";
import { IosInstallModal } from "./IosInstallModal";

describe("IosInstallModal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(<IosInstallModal open={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows the title and both steps when open (Korean)", () => {
    const { getByText, getByRole } = render(<IosInstallModal open onClose={() => {}} />);
    expect(getByRole("dialog")).toBeInTheDocument();
    expect(getByText("홈 화면에 추가")).toBeInTheDocument();
    expect(getByText("하단 공유 버튼을 누르세요")).toBeInTheDocument();
    expect(getByText("'홈 화면에 추가'를 선택하세요")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    const { getByRole } = render(<IosInstallModal open onClose={onClose} />);
    fireEvent.click(getByRole("button", { name: "닫기" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onClose = vi.fn();
    const { getByRole } = render(<IosInstallModal open onClose={onClose} />);
    fireEvent.click(getByRole("dialog").parentElement!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(<IosInstallModal open onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders English copy under an en provider", () => {
    const { getByText, getByRole } = render(
      <LanguageProvider initialLang="en">
        <IosInstallModal open onClose={() => {}} />
      </LanguageProvider>,
    );
    expect(getByText("Add to Home Screen")).toBeInTheDocument();
    expect(getByRole("button", { name: "Close" })).toBeInTheDocument();
  });
});
