import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Plus, Package } from 'lucide-react';
import { useStore } from '../store';
import { colors } from '../theme';
import { t, fmtCurrency } from '../i18n';
import { hapticLight, hapticMedium, hapticSuccess } from '../lib/haptics';
import { supabase } from '../lib/supabase';
import type { Item } from '../types';

type Props = {
  onItemSelect: (item: Item) => void;
  onAddNew: () => void;
};

export default function InventoryScreen({ onItemSelect, onAddNew }: Props) {
  const { items, loadItems } = useStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filtered = useMemo(() => {
    let result = items;
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.barcode || '').includes(q)
      );
    }
    if (filter === 'low') {
      result = result.filter(
        (i) => i.quantity <= i.min_threshold && i.quantity > 0
      );
    } else if (filter === 'out') {
      result = result.filter((i) => i.quantity <= 0);
    }
    return result;
  }, [items, query, filter]);

  const sellOne = useCallback(
    async (item: Item, e: React.MouseEvent) => {
      e.stopPropagation();
      hapticSuccess();
      const receipt = `INV-${Date.now()}`;
      try {
        await supabase.from('sales').insert({
          item_id: item.id,
          qty: 1,
          unit_price: item.sell_price,
          payment_method: 'cash',
          receipt_no: receipt,
        });
        await supabase
          .from('items')
          .update({
            quantity: item.quantity - 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);
        loadItems();
      } catch {
        // offline or error
      }
    },
    [loadItems]
  );

  return (
    <div className="screen-content">
      <header className="screen-header">
        <h1 className="screen-title">{t.inventory}</h1>
        <p className="screen-subtitle">{items.length} منتج</p>
      </header>

      <div className="search-bar">
        <Search size={18} color={colors.textDim} />
        <input
          type="text"
          placeholder={t.search_placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('all')}
        >
          الكل
        </button>
        <button
          className={filter === 'low' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('low')}
        >
          {t.low_stock}
        </button>
        <button
          className={filter === 'out' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('out')}
        >
          نفد
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Package size={48} color={colors.textMuted} strokeWidth={1.5} />
          <p>{t.no_data}</p>
        </div>
      ) : (
        <div className="item-list">
          {filtered.map((item) => {
            const isLow = item.quantity <= item.min_threshold;
            const isOut = item.quantity <= 0;
            return (
              <div
                key={item.id}
                className="item-row"
                onClick={() => {
                  hapticLight();
                  onItemSelect(item);
                }}
              >
                <div className="item-row-main">
                  <span className="item-name">{item.name}</span>
                  <div className="item-meta">
                    {item.barcode && (
                      <span className="item-barcode" dir="ltr">
                        {item.barcode}
                      </span>
                    )}
                    {item.category && (
                      <span className="item-category">{item.category}</span>
                    )}
                  </div>
                </div>
                <div className="item-row-end">
                  <div className="item-qty-wrap">
                    <span
                      className="item-qty"
                      style={{
                        color: isOut
                          ? colors.danger
                          : isLow
                          ? colors.warning
                          : colors.text,
                      }}
                    >
                      {item.quantity}
                    </span>
                    <span className="item-price">
                      {fmtCurrency(item.sell_price)}
                    </span>
                  </div>
                  {item.quantity > 0 && (
                    <button
                      className="sell-btn"
                      onClick={(e) => sellOne(item, e)}
                    >
                      {t.sell}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button className="fab" onClick={() => {
        hapticMedium();
        onAddNew();
      }}>
        <Plus size={28} />
      </button>
    </div>
  );
}
