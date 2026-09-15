import { useCallback, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useStore } from '../store';
import { colors } from '../theme';
import { t, fmtDate } from '../i18n';
import { hapticSuccess } from '../lib/haptics';
import { supabase } from '../lib/supabase';

export default function DiscrepancyScreen() {
  const { discrepancies, loadDiscrepancies } = useStore();

  useEffect(() => {
    loadDiscrepancies();
  }, [loadDiscrepancies]);

  const resolve = useCallback(
    async (id: string) => {
      hapticSuccess();
      await supabase
        .from('discrepancies')
        .update({ resolved: true })
        .eq('id', id);
      loadDiscrepancies();
    },
    [loadDiscrepancies]
  );

  return (
    <div className="screen-content">
      <header className="screen-header">
        <h1 className="screen-title">{t.discrepancies}</h1>
        <p className="screen-subtitle">
          {discrepancies.filter((d) => !d.resolved).length} {t.unresolved}
        </p>
      </header>

      {discrepancies.length === 0 ? (
        <div className="empty-state">
          <AlertTriangle size={48} color={colors.textMuted} strokeWidth={1.5} />
          <p>{t.no_data}</p>
        </div>
      ) : (
        <div className="disc-list">
          {discrepancies.map((d) => (
            <div
              key={d.id}
              className={`disc-row ${d.resolved ? 'disc-resolved' : ''}`}
            >
              <div className="disc-header">
                <span className="disc-name">
                  {d.items?.name || '—'}
                </span>
                <span
                  className={`disc-badge ${d.resolved ? 'badge-resolved' : 'badge-unresolved'}`}
                >
                  {d.resolved ? t.resolved : t.unresolved}
                </span>
              </div>
              <div className="disc-qty-row">
                <span className="disc-qty-item">
                  <span className="disc-qty-label">{t.system_qty}</span>
                  <span className="disc-qty-val">{d.system_qty}</span>
                </span>
                <span className="disc-qty-item">
                  <span className="disc-qty-label">{t.counted_qty}</span>
                  <span className="disc-qty-val">{d.counted_qty}</span>
                </span>
                <span className="disc-qty-item">
                  <span className="disc-qty-label">{t.delta}</span>
                  <span
                    className="disc-qty-val"
                    style={{
                      color: d.delta < 0 ? colors.danger : colors.warning,
                    }}
                  >
                    {d.delta > 0 ? '+' : ''}
                    {d.delta}
                  </span>
                </span>
              </div>
              <div className="disc-footer">
                <span className="disc-note">{d.note}</span>
                <span className="disc-ts">{fmtDate(d.created_at)}</span>
              </div>
              {!d.resolved && (
                <button
                  className="btn-resolve"
                  onClick={() => resolve(d.id)}
                >
                  {t.resolve}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
