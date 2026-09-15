import { useCallback, useEffect, useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  ScanLine,
  Trophy,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import KpiCard from '../components/KpiCard';
import SyncPill from '../components/SyncPill';
import { colors } from '../theme';
import { t, fmtCurrency } from '../i18n';
import { hapticMedium, hapticHeavy } from '../lib/haptics';
import { exportReport } from '../lib/pdf';
import type { Screen } from '../types';
import type { Item } from '../types';

type Props = {
  onNavigate: (s: Screen) => void;
  onItemSelect: (item: Item) => void;
};

export default function DashboardScreen({ onNavigate, onItemSelect }: Props) {
  const { items, discrepancies, loadItems, loadDiscrepancies } = useStore();
  const [kpi, setKpi] = useState({
    sales: 0,
    txs: 0,
    profit: 0,
    top: '—',
    avg: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await Promise.all([loadItems(), loadDiscrepancies()]);
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data } = await supabase
      .from('sales')
      .select('*, items(name)')
      .gte('created_at', since);

    const salesTotal = (data || []).reduce(
      (s, r: any) => s + Number(r.total),
      0
    );
    const txs = data?.length || 0;
    const profit = (data || []).reduce((s, r: any) => {
      const it = items.find((i) => i.id === r.item_id);
      return s + (it ? (Number(r.unit_price) - Number(it.cost_price)) * Number(r.qty) : 0);
    }, 0);

    const counts: Record<string, number> = {};
    (data || []).forEach((r: any) => {
      counts[r.item_id] = (counts[r.item_id] || 0) + Number(r.qty);
    });
    const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topName =
      items.find((i) => i.id === topId)?.name || '—';

    setKpi({
      sales: salesTotal,
      txs,
      profit,
      top: topName,
      avg: txs > 0 ? salesTotal / txs : 0,
    });
  }, [items, loadItems, loadDiscrepancies]);

  useEffect(() => {
    load();
  }, [load]);

  const lowStock = items.filter((i) => i.quantity <= i.min_threshold);
  const savedAmount = discrepancies.reduce(
    (s, d) => s + Math.abs(d.delta) * 50,
    0
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleExport = async () => {
    hapticHeavy();
    await exportReport({
      totalSales: kpi.sales,
      transactions: kpi.txs,
      profit: kpi.profit,
      topProduct: kpi.top,
      lowStock,
      discrepancies: discrepancies.length,
      savedAmount,
    });
  };

  return (
    <div className="screen-content">
      <header className="screen-header">
        <div className="header-row">
          <h1 className="screen-title">{t.dashboard}</h1>
          <SyncPill />
        </div>
        <p className="screen-subtitle">{t.last_30_days}</p>
      </header>

      <button
        className="refresh-btn"
        onClick={handleRefresh}
        aria-label="refresh"
      >
        <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
      </button>

      <div className="kpi-grid">
        <KpiCard
          label={t.total_sales}
          value={fmtCurrency(kpi.sales)}
          accent={colors.primary}
          icon={<DollarSign size={20} />}
          delay={0}
        />
        <KpiCard
          label={t.transactions}
          value={String(kpi.txs)}
          accent={colors.gold}
          icon={<ShoppingBag size={20} />}
          delay={60}
        />
        <KpiCard
          label={t.profit}
          value={fmtCurrency(kpi.profit)}
          accent={colors.success}
          icon={<TrendingUp size={20} />}
          delay={120}
        />
        <KpiCard
          label={t.low_stock}
          value={String(lowStock.length)}
          accent={lowStock.length > 0 ? colors.danger : colors.success}
          icon={<AlertTriangle size={20} />}
          delay={180}
        />
      </div>

      {kpi.avg > 0 && (
        <div className="avg-ticket-bar">
          <span className="avg-label">{t.avg_ticket}</span>
          <span className="avg-value">{fmtCurrency(kpi.avg)}</span>
        </div>
      )}

      <section className="section">
        <h2 className="section-title">
          <AlertTriangle size={18} color={colors.danger} />
          {t.low_stock}
        </h2>
        {lowStock.length === 0 ? (
          <div className="empty-state">
            <p>المخزون في حالة جيدة</p>
          </div>
        ) : (
          <div className="low-stock-list">
            {lowStock.slice(0, 6).map((item) => (
              <button
                key={item.id}
                className="low-stock-row"
                onClick={() => {
                  hapticMedium();
                  onItemSelect(item);
                }}
              >
                <div className="low-stock-info">
                  <span className="low-stock-name">{item.name}</span>
                  {item.location && (
                    <span className="low-stock-loc">{item.location}</span>
                  )}
                </div>
                <div className="low-stock-qty">
                  <span className="low-stock-current">{item.quantity}</span>
                  <span className="low-stock-min">/ {item.min_threshold}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="action-buttons">
        <button
          className="action-btn action-btn-primary"
          onClick={() => {
            hapticMedium();
            onNavigate('scanner');
          }}
        >
          <ScanLine size={20} />
          <span>{t.quick_scan}</span>
        </button>
        <button
          className="action-btn action-btn-gold"
          onClick={() => {
            hapticMedium();
            onNavigate('highlights');
          }}
        >
          <Trophy size={20} />
          <span>{t.highlights}</span>
        </button>
      </div>

      <button className="action-btn action-btn-outline" onClick={handleExport}>
        <FileText size={20} />
        <span>{t.export_pdf}</span>
      </button>
    </div>
  );
}
