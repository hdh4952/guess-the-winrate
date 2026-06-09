import { useEffect } from "react";
import { useT } from "../i18n/useT";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function IosInstallModal({ open, onClose }: Props) {
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="install-modal-overlay" onClick={onClose}>
      <div
        className="install-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ios-install-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="ios-install-title">{t.iosInstallTitle}</h2>
        <ol>
          <li>{t.iosInstallStep1}</li>
          <li>{t.iosInstallStep2}</li>
        </ol>
        <button type="button" onClick={onClose}>
          {t.close}
        </button>
      </div>
    </div>
  );
}
