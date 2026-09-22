-- ============================================================
-- MIGRATION SCRIPT — Jalankan di Supabase SQL Editor
-- Untuk database yang SUDAH ADA (existing tables)
-- ============================================================

-- 1. Tambah kolom buyer_notes ke tabel orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_notes TEXT;

-- 2. Tambah function decrement_stock_count (untuk hapus stok individual)
CREATE OR REPLACE FUNCTION decrement_stock_count(p_product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock_count = GREATEST(stock_count - 1, 0),
      updated_at = now()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Tambah function bulk_delete_available_stock (untuk hapus stok massal)
CREATE OR REPLACE FUNCTION bulk_delete_available_stock(p_product_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM account_stock
  WHERE product_id = p_product_id AND status = 'available';

  DELETE FROM account_stock
  WHERE product_id = p_product_id AND status = 'available';

  UPDATE products
  SET stock_count = GREATEST(stock_count - v_count, 0),
      updated_at = now()
  WHERE id = p_product_id;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 4. Tambah auto-update trigger untuk updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger dulu kalau sudah ada, baru buat ulang
DROP TRIGGER IF EXISTS trigger_products_updated_at ON products;
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Setup Storage bucket product-icons (skip jika sudah ada)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-icons',
  'product-icons',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS (skip jika sudah ada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view product icons'
  ) THEN
    CREATE POLICY "Anyone can view product icons"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'product-icons');
  END IF;
END $$;

-- ============================================================
-- SELESAI! Semua migrasi sudah dijalankan.
-- ============================================================
