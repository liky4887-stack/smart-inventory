import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';
import { fmtDate, t } from '../i18n';
import type { StockAudit } from '../types';

export default function HistoryScreen() {
  const [rows, setRows] = useState<StockAudit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('stock_audit')
        .select('*, items(name)')
        .order('created_at', { ascending: false })
        .limit(200);
      setRows((data || []) as StockAudit[]);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="screen-content">
      <header className="screen-header">
        <h1 className="screen-title">{t.history}</h1>
        <p className="screen-subtitle">{rows.length} عملية تدقيق</p>
      </header>

      {loading ? (
        <div className="empty-state">
          <p>{t.loading}</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="empty-state">
          <History size={48} color={colors.textMuted} strokeWidth={1.5} />
          <p>{t.no_data}</p>
        </div>
      ) : (
        <div className="history-list">
          {rows.map((audit) => (
            <div key={audit.id} className="history-row">
              <div className="history-main">
                <span className="history-name">
                  {audit.items?.name || '—'}
                </span>
                <span className="history-reason">
                  {audit.reason || '—'}
                </span>
                <span className="history-ts">{fmtDate(audit.created_at)}</span>
              </div>
              <div className="history-qty">
                <span className="history-before">{audit.before_qty}</span>
                <span className="history-arrow">←</span>
                <span className="history-after">{audit.after_qty}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
