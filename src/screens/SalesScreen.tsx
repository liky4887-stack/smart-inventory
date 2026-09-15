import { useEffect, useState } from 'react';
import { Receipt, CreditCard, Banknote } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';
import { fmtCurrency, fmtDate, t } from '../i18n';
import type { Sale } from '../types';

export default function SalesScreen() {
  const [rows, setRows] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('sales')
        .select('*, items(name)')
        .order('created_at', { ascending: false })
        .limit(100);
      setRows((data || []) as Sale[]);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel('sales-rt-screen')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sales' },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const total = rows.reduce((s, r) => s + Number(r.total), 0);

  return (
    <div className="screen-content">
      <header className="screen-header">
        <h1 className="screen-title">{t.sales}</h1>
        <p className="screen-subtitle">
          {rows.length} {t.transactions} · {fmtCurrency(total)}
        </p>
      </header>

      {loading ? (
        <div className="empty-state">
          <p>{t.loading}</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="empty-state">
          <Receipt size={48} color={colors.textMuted} strokeWidth={1.5} />
          <p>{t.no_data}</p>
        </div>
      ) : (
        <div className="sales-list">
          {rows.map((sale) => (
            <div key={sale.id} className="sale-row">
              <div className="sale-icon">
                {sale.payment_method === 'cash' ? (
                  <Banknote size={18} color={colors.success} />
                ) : (
                  <CreditCard size={18} color={colors.primary} />
                )}
              </div>
              <div className="sale-main">
                <span className="sale-name">{sale.items?.name || '—'}</span>
                <span className="sale-meta">
                  {sale.receipt_no} · {fmtDate(sale.created_at)}
                </span>
              </div>
              <div className="sale-end">
                <span className="sale-total">{fmtCurrency(sale.total)}</span>
                <span className="sale-qty">× {sale.qty}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
