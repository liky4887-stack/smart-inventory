import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ScanLine,
  FileText,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import SyncPill from '../components/SyncPill';
import { colors } from '../theme';
import { t, fmtCurrency, fmtNum } from '../i18n';
import { hapticMedium, hapticHeavy } from '../lib/haptics';
import { exportReport } from '../lib/pdf';
import type { Screen, Item } from '../types';

type Props = {
  onNavigate: (s: Screen) => void;
  onItemSelect: (item: Item) => void;
};

export default function DashboardScreen({ onNavigate, onItemSelect }: Props) {
  const { items, discrepancies, loadItems, loadDiscrepancies } = useStore();
  const [kpi, setKpi] = useState({ sales: 0, txs: 0, profit: 0, top: '—', avg: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await Promise.all([loadItems(), loadDiscrepancies()]);
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data } = await supabase
      .from('sales')
      .select('*, items(name)')
      .gte('created_at', since);

    const salesTotal = (data || []).reduce(
      (sum: number, row: any) => sum + Number(row.total),
      0
    );
    const txs = data?.length || 0;
    const profit = (data || []).reduce((sum: number, row: any) => {
      const matchedItem = items.find((i) => i.id === row.item_id);
      return sum + (matchedItem ? (Number(row.unit_price) - Number(matchedItem.cost_price)) * Number(row.qty) : 0);
    }, 0);

    const counts: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      counts[row.item_id] = (counts[row.item_id] || 0) + Number(row.qty);
    });
    const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topName = items.find((i) => i.id === topId)?.name || '—';

    setKpi({ sales: salesTotal, txs, profit, top: topName, avg: txs > 0 ? salesTotal / txs : 0 });
  }, [items, loadItems, loadDiscrepancies]);

  useEffect(() => {
    load();
  }, [load]);

  const lowStock = items.filter((i) => i.quantity <= i.min_threshold);
  const savedAmount = discrepancies.reduce((s, d) => s + Math.abs(d.delta) * 50, 0);

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
    <div className="screen-content dashboard-screen">
      <header className="screen-header">
        <div className="header-row">
          <h1 className="screen-title">أدر مخزونك في دقيقة</h1>
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

      <div className="kpi-rows">
        <div className="kpi-row">
          <span className="kpi-row-label">{t.total_sales}</span>
          <span className="kpi-row-value">{fmtCurrency(kpi.sales)}</span>
        </div>
        <div className="kpi-row">
          <span className="kpi-row-label">{t.profit}</span>
          <span className="kpi-row-value" style={{ color: colors.success }}>{fmtCurrency(kpi.profit)}</span>
        </div>
        <div className="kpi-row">
          <span className="kpi-row-label">{t.transactions}</span>
          <span className="kpi-row-value">{fmtNum(kpi.txs)}</span>
        </div>
        <div className="kpi-row">
          <span className="kpi-row-label">{t.low_stock}</span>
          <span className="kpi-row-value" style={{ color: lowStock.length > 0 ? colors.danger : colors.success }}>{fmtNum(lowStock.length)}</span>
        </div>
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
                  {item.location && <span className="low-stock-loc">{item.location}</span>}
                </div>
                <div className="low-stock-qty">
                  <span className="low-stock-current">{fmtNum(item.quantity)}</span>
                  <span className="low-stock-min">/ {fmtNum(item.min_threshold)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="dashboard-actions">
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
          className="text-link"
          onClick={() => {
            hapticMedium();
            onNavigate('highlights');
          }}
        >
          <span>{t.highlights}</span>
          <ArrowLeft size={18} />
        </button>
      </div>

      <button className="action-btn action-btn-outline" onClick={handleExport}>
        <FileText size={20} />
        <span>{t.export_pdf}</span>
      </button>
    </div>
  );
}
