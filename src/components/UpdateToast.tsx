import { useT } from "../i18n/useT";

interface Props {
  visible: boolean;
  onRefresh: () => void;
}

export function UpdateToast({ visible, onRefresh }: Props) {
  const t = useT();
  if (!visible) return null;
  return (
    <div className="update-toast" role="status">
      <span>{t.updateAvailable}</span>
      <button type="button" onClick={onRefresh}>
        {t.refresh}
      </button>
    </div>
  );
}
