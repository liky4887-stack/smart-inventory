import { Save, Clock, TrendingDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { hapticSuccess, hapticMedium } from '../lib/haptics';
import { colors } from '../theme';
import { t, fmtCurrency, fmtNum } from '../i18n';
import { predictRunout } from '../lib/predictor';
import type { Item, RunoutPrediction } from '../types';

type Props = {
  item: Item;
  onClose: () => void;
  onAudit: (item: Item) => void;
  onDelete: (item: Item) => void;
};

export default function ItemDetailScreen({ item, onClose, onAudit, onDelete }: Props) {
  const { loadItems } = useStore();
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(String(item.sell_price));
  const [cost, setCost] = useState(String(item.cost_price));
  const [qty, setQty] = useState(String(item.quantity));
  const [minTh, setMinTh] = useState(String(item.min_threshold));
  const [prediction, setPrediction] = useState<RunoutPrediction | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    predictRunout(item.id, item.quantity).then(setPrediction);
  }, [item.id, item.quantity]);

  const save = async () => {
    setSaving(true);
    hapticSuccess();
    await supabase
      .from('items')
      .update({
        name,
        sell_price: parseFloat(price) || 0,
        cost_price: parseFloat(cost) || 0,
        quantity: parseFloat(qty) || 0,
        min_threshold: parseFloat(minTh) || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id);
    await loadItems();
    setSaving(false);
    onClose();
  };

  const severityColor =
    prediction?.severity === 'critical'
      ? colors.danger
      : prediction?.severity === 'warn'
      ? colors.warning
      : prediction?.severity === 'ok'
      ? colors.primary
      : colors.success;

  return (
    <div className="sheet-content">
      <div className="item-detail-header">
        <div>
          <h2 className="item-detail-name">{name}</h2>
          {item.barcode && (
            <span className="item-detail-barcode" dir="ltr">
              {item.barcode}
            </span>
          )}
        </div>
        {item.category && (
          <span className="item-detail-cat">{item.category}</span>
        )}
      </div>

      {prediction && (
        <div className="prediction-card" style={{ borderColor: severityColor + '44' }}>
          <div className="prediction-icon" style={{ color: severityColor }}>
            <Clock size={20} />
          </div>
          <div className="prediction-info">
            <span className="prediction-label">{t.days_until_empty}</span>
            <span className="prediction-value" style={{ color: severityColor }}>
              {isFinite(prediction.days)
                ? `${prediction.days.toFixed(1)} ${t.days}`
                : t.predict_stable}
            </span>
          </div>
          {prediction.velocity > 0 && (
            <div className="prediction-velocity">
              <TrendingDown size={14} color={colors.textDim} />
              <span>{fmtNum(prediction.velocity)}/يوم</span>
            </div>
          )}
        </div>
      )}

      <div className="form-grid">
        <div className="form-field">
          <label className="form-label">{t.name}</label>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="form-label">{t.quantity}</label>
          <input
            className="form-input"
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            dir="ltr"
          />
        </div>
        <div className="form-field">
          <label className="form-label">{t.sell_price}</label>
          <input
            className="form-input"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            dir="ltr"
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

      <div className="detail-actions">
        <button
          className="action-btn action-btn-outline"
          onClick={() => {
            hapticMedium();
            onAudit(item);
          }}
        >
          <Save size={18} />
          <span>{t.audit_mode}</span>
        </button>
        <button
          className="btn-danger-outline"
          onClick={() => {
            hapticMedium();
            onDelete(item);
          }}
        >
          {t.delete}
        </button>
      </div>

      <button
        className="btn-primary btn-full"
        onClick={save}
        disabled={saving}
      >
        {t.save}
      </button>
    </div>
  );
}
