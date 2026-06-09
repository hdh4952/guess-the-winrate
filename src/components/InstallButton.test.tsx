import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { InstallButton } from "./InstallButton";

// Variables referenced inside vi.mock factories MUST start with "mock".
const mockPromptInstall = vi.fn();
let mockMode: "none" | "native" | "ios" = "none";

vi.mock("../pwa/useInstallPrompt", () => ({
  useInstallPrompt: () => ({ mode: mockMode, promptInstall: mockPromptInstall }),
}));

describe("InstallButton", () => {
  beforeEach(() => {
    mockMode = "none";
    mockPromptInstall.mockClear();
  });

  it("renders nothing when mode is none", () => {
    const { container } = render(<InstallButton />);
    expect(container.firstChild).toBeNull();
  });

  it("calls promptInstall when clicked in native mode", () => {
    mockMode = "native";
    const { getByRole } = render(<InstallButton />);
    fireEvent.click(getByRole("button", { name: /앱 설치/ }));
    expect(mockPromptInstall).toHaveBeenCalledOnce();
  });

  it("opens the iOS instructions modal when clicked in ios mode", () => {
    mockMode = "ios";
    const { getByRole, getByText, queryByRole } = render(<InstallButton />);
    expect(queryByRole("dialog")).toBeNull();
    fireEvent.click(getByRole("button", { name: /앱 설치/ }));
    expect(getByRole("dialog")).toBeInTheDocument();
    expect(getByText("홈 화면에 추가")).toBeInTheDocument();
  });
});
