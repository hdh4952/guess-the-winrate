import { useState } from "react";
import { useInstallPrompt } from "../pwa/useInstallPrompt";
import { IosInstallModal } from "./IosInstallModal";
import { useT } from "../i18n/useT";

export function InstallButton() {
  const t = useT();
  const { mode, promptInstall } = useInstallPrompt();
  const [modalOpen, setModalOpen] = useState(false);

  if (mode === "none") return null;

  const handleClick = () => {
    if (mode === "native") {
      promptInstall();
    } else {
      setModalOpen(true);
    }
  };

  return (
    <>
      <button type="button" className="install-button" onClick={handleClick}>
        {t.installApp}
      </button>
      <IosInstallModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
