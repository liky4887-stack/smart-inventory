export type Item = {
  id: string;
  name: string;
  barcode: string | null;
  quantity: number;
  cost_price: number;
  sell_price: number;
  min_threshold: number;
  category: string | null;
  location: string | null;
  updated_at: string;
};

export type Sale = {
  id: string;
  item_id: string;
  qty: number;
  unit_price: number;
  total: number;
  payment_method: string;
  receipt_no: string;
  created_at: string;
  items?: { name: string } | null;
};

export type Discrepancy = {
  id: string;
  item_id: string;
  system_qty: number;
  counted_qty: number;
  delta: number;
  note: string;
  resolved: boolean;
  created_at: string;
  items?: { name: string } | null;
};

export type StockAudit = {
  id: string;
  item_id: string;
  before_qty: number;
  after_qty: number;
  reason: string;
  created_at: string;
  items?: { name: string } | null;
};

export type Screen =
  | 'dashboard'
  | 'inventory'
  | 'scanner'
  | 'sales'
  | 'history'
  | 'audit'
  | 'discrepancies'
  | 'highlights';

export type RunoutPrediction = {
  days: number;
  velocity: number;
  severity: 'stable' | 'ok' | 'warn' | 'critical';
};
