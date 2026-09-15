import { useEffect, useState, useCallback } from 'react';
import {
  subscribeRealtime,
  trySync,
  useNetworkStatus,
  useStore,
} from './store';
import { doLoadItems, doLoadDiscrepancies } from './store';
import { hapticMedium } from './lib/haptics';
import BottomNav from './components/BottomNav';
import Sheet from './components/Sheet';
import ConfirmDialog from './components/ConfirmDialog';
import DashboardScreen from './screens/DashboardScreen';
import InventoryScreen from './screens/InventoryScreen';
import ScannerScreen from './screens/ScannerScreen';
import SalesScreen from './screens/SalesScreen';
import HistoryScreen from './screens/HistoryScreen';
import AuditScreen from './screens/AuditScreen';
import DiscrepancyScreen from './screens/DiscrepancyScreen';
import HighlightReelScreen from './screens/HighlightReelScreen';
import ItemDetailScreen from './screens/ItemDetailScreen';
import { supabase } from './lib/supabase';
import { t } from './i18n';
import { colors } from './theme';
import type { Screen, Item } from './types';

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [auditItem, setAuditItem] = useState<Item | null>(null);
  const [deleteItem, setDeleteItem] = useState<Item | null>(null);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newBarcode, setNewBarcode] = useState('');
  const [sheetKey, setSheetKey] = useState(0);

  useNetworkStatus();

  useEffect(() => {
    subscribeRealtime();
    trySync();
    doLoadItems();
    doLoadDiscrepancies();
  }, []);

  const navigate = useCallback((s: Screen) => {
    setScreen(s);
  }, []);

  const handleItemSelect = useCallback((item: Item) => {
    setSelectedItem(item);
    setSheetKey((k) => k + 1);
  }, []);

  const handleScan = useCallback((item: Item) => {
    setSelectedItem(item);
    setScreen('inventory');
    setSheetKey((k) => k + 1);
  }, []);

  const handleNew = useCallback((barcode: string) => {
    setNewBarcode(barcode);
    setShowAddNew(true);
    setScreen('inventory');
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteItem) return;
    hapticMedium();
    await supabase.from('items').delete().eq('id', deleteItem.id);
    await doLoadItems();
    setDeleteItem(null);
    setSelectedItem(null);
  }, [deleteItem]);

  return (
    <div className="app" dir="rtl">
      <div className="app-shell">
        <main className="app-main" key={screen}>
          {screen === 'dashboard' && (
            <DashboardScreen onNavigate={navigate} onItemSelect={handleItemSelect} />
          )}
          {screen === 'inventory' && (
            <InventoryScreen
              onItemSelect={handleItemSelect}
              onAddNew={() => {
                setNewBarcode('');
                setShowAddNew(true);
              }}
            />
          )}
          {screen === 'scanner' && (
            <ScannerScreen onScan={handleScan} onNew={handleNew} />
          )}
          {screen === 'sales' && <SalesScreen />}
          {screen === 'history' && <HistoryScreen />}
          {screen === 'discrepancies' && <DiscrepancyScreen />}
          {screen === 'highlights' && <HighlightReelScreen />}
        </main>

        <BottomNav current={screen} onNavigate={navigate} />

        {selectedItem && (
          <Sheet
            key={sheetKey}
            open={!!selectedItem}
            onClose={() => setSelectedItem(null)}
            title={t.edit}
          >
            <ItemDetailScreen
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onAudit={(item) => {
                setSelectedItem(null);
                setAuditItem(item);
              }}
              onDelete={(item) => {
                setDeleteItem(item);
              }}
            />
          </Sheet>
        )}

        {auditItem && (
          <Sheet
            open={!!auditItem}
            onClose={() => setAuditItem(null)}
            title={t.audit_mode}
          >
            <AuditScreen item={auditItem} onClose={() => setAuditItem(null)} />
          </Sheet>
        )}

        {showAddNew && (
          <AddItemSheet
            barcode={newBarcode}
            onClose={() => setShowAddNew(false)}
            onCreated={(item) => {
              setShowAddNew(false);
              setSelectedItem(item);
              setSheetKey((k) => k + 1);
            }}
          />
        )}

        <ConfirmDialog
          open={!!deleteItem}
          title={t.confirm_delete}
          message={deleteItem?.name}
          confirmLabel={t.delete}
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteItem(null)}
        />
      </div>
    </div>
  );
}

function AddItemSheet({
  barcode,
  onClose,
  onCreated,
}: {
  barcode: string;
  onClose: () => void;
  onCreated: (item: Item) => void;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [qty, setQty] = useState('');
  const [minTh, setMinTh] = useState('5');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { data } = await supabase
      .from('items')
      .insert({
        name: name || t.new_product,
        barcode: barcode || null,
        sell_price: parseFloat(price) || 0,
        cost_price: parseFloat(cost) || 0,
        quantity: parseFloat(qty) || 0,
        min_threshold: parseFloat(minTh) || 5,
      })
      .select()
      .single();
    setSaving(false);
    if (data) onCreated(data as Item);
  };

  return (
    <Sheet open onClose={onClose} title={t.add_item}>
      <div className="sheet-content">
        {barcode && (
          <div className="form-field">
            <label className="form-label">باركود</label>
            <input className="form-input" value={barcode} disabled dir="ltr" />
          </div>
        )}
        <div className="form-field">
          <label className="form-label">{t.name}</label>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.new_product}
            autoFocus
          />
        </div>
        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">{t.quantity}</label>
            <input
              className="form-input"
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              dir="ltr"
              placeholder="0"
            />
          </div>
          <div className="form-field">
            <label className="form-label">{t.min_threshold}</label>
            <input
              className="form-input"
              type="number"
              value={minTh}
              onChange={(e) => setMinTh(e.target.value)}
              dir="ltr"
            />
          </div>
        </div>
        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">{t.sell_price}</label>
            <input
              className="form-input"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              dir="ltr"
              placeholder="0"
            />
          </div>
          <div className="form-field">
            <label className="form-label">{t.cost_price}</label>
            <input
              className="form-input"
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              dir="ltr"
              placeholder="0"
            />
          </div>
        </div>
        <button
          className="btn-primary btn-full"
          onClick={save}
          disabled={saving}
        >
          {saving ? t.loading : t.save}
        </button>
      </div>
    </Sheet>
  );
}
