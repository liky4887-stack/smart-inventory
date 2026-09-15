import { useEffect, useState } from 'react';
import {
  Trophy,
  TrendingUp,
  ShieldCheck,
  Zap,
  FileText,
  Coins,
} from 'lucide-react';
import LinearGradient from '../components/LinearGradient';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';
import { t, fmtCurrency } from '../i18n';
import { hapticHeavy } from '../lib/haptics';
import { exportReport } from '../lib/pdf';

export default function HighlightReelScreen() {
  const { items, discrepancies } = useStore();
  const [stats, setStats] = useState({
    sales: 0,
    profit: 0,
    top: '—',
    txs: 0,
  });

  useEffect(() => {
    const load = async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data } = await supabase
        .from('sales')
        .select('*, items(name)')
        .gte('created_at', since);

      const sales = (data || []).reduce(
        (s, r: any) => s + Number(r.total),
        0
      );
      const profit = (data || []).reduce((s, r: any) => {
        const it = items.find((i) => i.id === r.item_id);
        return s + (it ? (Number(r.unit_price) - Number(it.cost_price)) * Number(r.qty) : 0);
      }, 0);

      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        counts[r.item_id] = (counts[r.item_id] || 0) + Number(r.qty);
      });
      const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
      setStats({
        sales,
        profit,
        top: items.find((i) => i.id === topId)?.name || '—',
        txs: data?.length || 0,
      });
    };
    load();
  }, [items]);

  const saved = discrepancies.reduce((s, d) => s + Math.abs(d.delta) * 50, 0);
  const accuracy =
    items.length > 0
      ? Math.max(0, 100 - (discrepancies.length / items.length) * 100).toFixed(1)
      : '100';

  return (
    <div className="screen-content">
      <LinearGradient
        from={colors.gold + '14'}
        to="transparent"
        className="highlight-hero"
      >
        <div className="highlight-trophy">
          <Trophy size={40} color={colors.gold} />
        </div>
        <h1 className="highlight-title">{t.highlights}</h1>
        <p className="highlight-sub">{t.last_30_days}</p>
      </LinearGradient>

      <div className="highlight-grid">
        <div className="highlight-card highlight-card-gold" style={{ animationDelay: '0ms' }}>
          <div className="highlight-icon-wrap" style={{ background: 'rgba(251, 191, 36, 0.12)', borderColor: 'rgba(251, 191, 36, 0.2)' }}>
            <Coins size={24} color={colors.gold} />
          </div>
          <div className="highlight-info">
            <span className="highlight-label">{t.saved_amount}</span>
            <span className="highlight-value" style={{ color: colors.gold }}>
              {fmtCurrency(saved)}
            </span>
          </div>
        </div>

        <div className="highlight-card" style={{ animationDelay: '60ms' }}>
          <div className="highlight-icon-wrap" style={{ background: 'rgba(52, 211, 153, 0.12)', borderColor: 'rgba(52, 211, 153, 0.18)' }}>
            <TrendingUp size={24} color={colors.success} />
          </div>
          <div className="highlight-info">
            <span className="highlight-label">{t.gained_amount}</span>
            <span className="highlight-value" style={{ color: colors.success }}>
              {fmtCurrency(stats.profit)}
            </span>
          </div>
        </div>

        <div className="highlight-card" style={{ animationDelay: '120ms' }}>
          <div className="highlight-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.12)', borderColor: 'rgba(59, 130, 246, 0.18)' }}>
            <ShieldCheck size={24} color={colors.primary} />
          </div>
          <div className="highlight-info">
            <span className="highlight-label">{t.accuracy}</span>
            <span className="highlight-value" style={{ color: colors.primary }}>
              {accuracy}%
            </span>
          </div>
        </div>

        <div className="highlight-card" style={{ animationDelay: '180ms' }}>
          <div className="highlight-icon-wrap" style={{ background: 'rgba(251, 191, 36, 0.10)', borderColor: 'rgba(251, 191, 36, 0.15)' }}>
            <Zap size={24} color={colors.warning} />
          </div>
          <div className="highlight-info">
            <span className="highlight-label">{t.top_product}</span>
            <span className="highlight-value" style={{ color: colors.text, fontSize: '1.05rem' }}>
              {stats.top}
            </span>
          </div>
        </div>
      </div>

      <button
        className="action-btn action-btn-gold highlight-export"
        onClick={async () => {
          hapticHeavy();
          await exportReport({
            totalSales: stats.sales,
            transactions: stats.txs,
            profit: stats.profit,
            topProduct: stats.top,
            lowStock: items.filter((i) => i.quantity <= i.min_threshold),
            discrepancies: discrepancies.length,
            savedAmount: saved,
          });
        }}
      >
        <FileText size={20} />
        <span>{t.export_pdf}</span>
      </button>
    </div>
  );
}
