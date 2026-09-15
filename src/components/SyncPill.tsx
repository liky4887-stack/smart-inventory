import { colors } from '../theme';
import { useStore } from '../store';
import { t } from '../i18n';

export default function SyncPill() {
  const { online, pending } = useStore();
  const color = online ? colors.success : colors.warning;
  const label = !online ? t.offline : pending > 0 ? t.syncing : t.online;

  return (
    <div className="sync-pill" style={{ '--pill-color': color } as React.CSSProperties}>
      <span className="sync-dot" style={{ background: color }} />
      <span style={{ color }}>
        {label}
        {pending > 0 ? ` (${pending})` : ''}
      </span>
    </div>
  );
}
