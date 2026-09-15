import { useState } from 'react';
import { AlertTriangle, ClipboardCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { hapticSuccess, hapticError } from '../lib/haptics';
import { colors } from '../theme';
import { t } from '../i18n';
import type { Item } from '../types';

type Props = {
  item: Item;
  onClose: () => void;
};

export default function AuditScreen({ item, onClose }: Props) {
  const { loadItems, loadDiscrepancies } = useStore();
  const [counted, setCounted] = useState('');
  const [reason, setReason] = useState('');
  const [alert, setAlert] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const c = parseFloat(counted);
    if (isNaN(c)) return;

    setSubmitting(true);
    const delta = c - item.quantity;

    if (delta !== 0) {
      hapticError();
      await supabase.from('discrepancies').insert({
        item_id: item.id,
        system_qty: item.quantity,
        counted_qty: c,
        note: reason || 'بدون سبب',
      });
      setAlert(`${t.discrepancy_found}: ${delta > 0 ? '+' : ''}${delta}`);
    } else {
      hapticSuccess();
    }

    await supabase.from('stock_audit').insert({
      item_id: item.id,
      before_qty: item.quantity,
      after_qty: c,
      reason: reason || 'تدقيق',
    });
    await supabase
      .from('items')
      .update({
        quantity: c,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    await Promise.all([loadItems(), loadDiscrepancies()]);
    setSubmitting(false);

    if (alert) {
      setTimeout(() => onClose(), 1500);
    } else {
      onClose();
    }
  };

  return (
    <div className="screen-content">
      <header className="screen-header">
        <h1 className="screen-title">{t.audit_mode}</h1>
        <p className="screen-subtitle">{item.name}</p>
      </header>

      <div className="audit-card">
        <div className="audit-current">
          <ClipboardCheck size={24} color={colors.primary} />
          <div>
            <span className="audit-label">{t.system_qty}</span>
            <span className="audit-value">{item.quantity}</span>
          </div>
        </div>
      </div>

      {alert && (
        <div className="audit-alert">
          <AlertTriangle size={20} color={colors.danger} />
          <span>{alert}</span>
        </div>
      )}

      <div className="form-field">
        <label className="form-label">{t.counted_qty}</label>
        <input
          type="number"
          className="form-input"
          value={counted}
          onChange={(e) => setCounted(e.target.value)}
          placeholder="0"
          dir="ltr"
          autoFocus
        />
      </div>

      <div className="form-field">
        <label className="form-label">{t.reason}</label>
        <input
          type="text"
          className="form-input"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t.note}
        />
      </div>

      <div className="form-actions">
        <button className="btn-ghost" onClick={onClose}>
          {t.cancel}
        </button>
        <button
          className="btn-primary"
          onClick={submit}
          disabled={submitting || !counted}
        >
          {t.confirm}
        </button>
      </div>
    </div>
  );
}
