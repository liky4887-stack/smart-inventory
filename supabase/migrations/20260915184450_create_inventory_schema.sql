/*
# Smart Inventory — Database Schema

1. New Tables
- `items` — product catalog with stock levels, pricing, thresholds
  - id (uuid PK), name, barcode, quantity, cost_price, sell_price, min_threshold, category, location, updated_at
- `sales` — append-only sales transaction log
  - id (uuid PK), item_id (FK→items), qty, unit_price, total (generated), payment_method, receipt_no, created_at
- `stock_audit` — append-only audit trail of physical counts
  - id (uuid PK), item_id (FK→items), before_qty, after_qty, reason, created_at
- `discrepancies` — flagged differences between system and counted stock
  - id (uuid PK), item_id (FK→items), system_qty, counted_qty, delta (generated), note, resolved, created_at

2. Security
- RLS enabled on all tables
- Single-tenant (no auth): TO anon, authenticated with USING (true) / WITH CHECK (true)
- sales and stock_audit are append-only: REVOKE UPDATE, DELETE from anon and authenticated

3. Realtime
- items, sales, discrepancies added to supabase_realtime publication

4. Seed Data
- 12 sample items across categories (electronics, food, stationery, cleaning)
- 20 sample sales transactions over the last 30 days
*/

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  barcode text UNIQUE,
  quantity numeric DEFAULT 0,
  cost_price numeric DEFAULT 0,
  sell_price numeric DEFAULT 0,
  min_threshold numeric DEFAULT 5,
  category text,
  location text,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id) ON DELETE SET NULL,
  qty numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total numeric GENERATED ALWAYS AS (qty * unit_price) STORED,
  payment_method text DEFAULT 'cash',
  receipt_no text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id) ON DELETE SET NULL,
  before_qty numeric,
  after_qty numeric,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discrepancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id) ON DELETE SET NULL,
  system_qty numeric,
  counted_qty numeric,
  delta numeric GENERATED ALWAYS AS (counted_qty - system_qty) STORED,
  note text,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE discrepancies ENABLE ROW LEVEL SECURITY;

-- items: full CRUD for anon
DROP POLICY IF EXISTS "anon_select_items" ON items;
CREATE POLICY "anon_select_items" ON items FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_items" ON items;
CREATE POLICY "anon_insert_items" ON items FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_items" ON items;
CREATE POLICY "anon_update_items" ON items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_items" ON items;
CREATE POLICY "anon_delete_items" ON items FOR DELETE TO anon, authenticated USING (true);

-- sales: INSERT + SELECT only (append-only)
DROP POLICY IF EXISTS "anon_select_sales" ON sales;
CREATE POLICY "anon_select_sales" ON sales FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sales" ON sales;
CREATE POLICY "anon_insert_sales" ON sales FOR INSERT TO anon, authenticated WITH CHECK (true);

-- stock_audit: INSERT + SELECT only (append-only)
DROP POLICY IF EXISTS "anon_select_audit" ON stock_audit;
CREATE POLICY "anon_select_audit" ON stock_audit FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_audit" ON stock_audit;
CREATE POLICY "anon_insert_audit" ON stock_audit FOR INSERT TO anon, authenticated WITH CHECK (true);

-- discrepancies: full CRUD for anon
DROP POLICY IF EXISTS "anon_select_disc" ON discrepancies;
CREATE POLICY "anon_select_disc" ON discrepancies FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_disc" ON discrepancies;
CREATE POLICY "anon_insert_disc" ON discrepancies FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_disc" ON discrepancies;
CREATE POLICY "anon_update_disc" ON discrepancies FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_disc" ON discrepancies;
CREATE POLICY "anon_delete_disc" ON discrepancies FOR DELETE TO anon, authenticated USING (true);

-- Append-only protection
REVOKE UPDATE, DELETE ON sales FROM anon, authenticated;
REVOKE UPDATE, DELETE ON stock_audit FROM anon, authenticated;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE items;
ALTER PUBLICATION supabase_realtime ADD TABLE sales;
ALTER PUBLICATION supabase_realtime ADD TABLE discrepancies;

-- Seed items
INSERT INTO items (name, barcode, quantity, cost_price, sell_price, min_threshold, category, location) VALUES
('قهوة عربية', '6281000012345', 48, 15, 25, 10, 'مشروبات', 'رف A1'),
('شاي أحمر', '6281000012346', 3, 8, 15, 8, 'مشروبات', 'رف A2'),
('تمر المدينة', '6281000012347', 25, 30, 50, 5, 'أغذية', 'رف B1'),
('ماء معدني 600مل', '6281000012348', 120, 1, 3, 24, 'مشروبات', 'رف A3'),
('شوكولاتة فاخرة', '6281000012349', 15, 12, 22, 6, 'أغذية', 'رف B2'),
('دفتر 200 ورقة', '6281000012350', 40, 5, 12, 10, 'قرطاسية', 'رف C1'),
('قلم جاف أزرق', '6281000012351', 2, 1, 4, 20, 'قرطاسية', 'رف C2'),
('منظف زجاج', '6281000012352', 18, 7, 14, 5, 'منظفات', 'رف D1'),
('مناشف ورقية', '6281000012353', 35, 6, 11, 10, 'منظفات', 'رف D2'),
('سماعات بلوتوث', '6281000012354', 8, 80, 150, 3, 'إلكترونيات', 'رف E1'),
('شاحن سريع USB-C', '6281000012355', 22, 25, 45, 5, 'إلكترونيات', 'رف E2'),
('علبة تخزين', '6281000012356', 30, 10, 18, 8, 'منظفات', 'رف D3')
ON CONFLICT (barcode) DO NOTHING;

-- Seed sales (last 30 days)
DO $$
DECLARE
  item_record RECORD;
  i int;
  qty_val int;
  days_ago int;
BEGIN
  FOR item_record IN SELECT id, sell_price FROM items LOOP
    FOR i IN 1..2 LOOP
      qty_val := floor(random() * 3 + 1)::int;
      days_ago := floor(random() * 30)::int;
      INSERT INTO sales (item_id, qty, unit_price, payment_method, receipt_no, created_at)
      VALUES (
        item_record.id,
        qty_val,
        item_record.sell_price,
        CASE WHEN random() > 0.5 THEN 'cash' ELSE 'card' END,
        'INV-' || floor(random() * 100000)::text,
        now() - (days_ago || ' days')::interval
      );
    END LOOP;
  END LOOP;
END $$;

-- Seed a discrepancy
INSERT INTO discrepancies (item_id, system_qty, counted_qty, note, resolved)
SELECT id, quantity, quantity - 2, 'عدد فعلي أقل من النظام أثناء الجرد', false
FROM items WHERE barcode = '6281000012351' LIMIT 1;
