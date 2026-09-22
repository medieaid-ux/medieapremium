-- ============================================================
-- MEDIEA PREMIUM — Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor
-- ============================================================

-- 1. Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  duration TEXT,
  icon_url TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  stock_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Account Stock Table
CREATE TABLE IF NOT EXISTS account_stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  extra_info TEXT,
  status TEXT DEFAULT 'available'
    CHECK (status IN ('available', 'reserved', 'sold')),
  reserved_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  order_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast stock lookup
CREATE INDEX IF NOT EXISTS idx_stock_available 
  ON account_stock(product_id, status) 
  WHERE status = 'available';

-- 3. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  product_id UUID REFERENCES products(id),
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_whatsapp TEXT NOT NULL,
  buyer_notes TEXT,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'delivered', 'expired', 'failed')),
  midtrans_order_id TEXT UNIQUE,
  midtrans_transaction_id TEXT,
  payment_type TEXT,
  account_stock_id UUID REFERENCES account_stock(id),
  delivered_email TEXT,
  delivered_password TEXT,
  delivered_extra TEXT,
  snap_token TEXT,
  paid_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key from account_stock to orders (circular reference)
ALTER TABLE account_stock 
  ADD CONSTRAINT fk_stock_order 
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- ============================================================
-- RPC Functions
-- ============================================================

-- 4. Claim Stock Function (Anti-Collision with FOR UPDATE SKIP LOCKED)
CREATE OR REPLACE FUNCTION claim_stock(p_product_id UUID, p_order_id UUID)
RETURNS TABLE(
  stock_id UUID,
  account_email TEXT,
  account_password TEXT,
  account_extra TEXT
) AS $$
DECLARE
  v_stock account_stock%ROWTYPE;
BEGIN
  -- Lock the first available row; skip if already locked by another transaction
  SELECT * INTO v_stock
  FROM account_stock
  WHERE product_id = p_product_id
    AND status = 'available'
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'STOCK_EMPTY: No available stock for product %', p_product_id;
  END IF;

  -- Mark as sold
  UPDATE account_stock
  SET status = 'sold',
      sold_at = now(),
      order_id = p_order_id
  WHERE id = v_stock.id;

  -- Decrement stock counter
  UPDATE products
  SET stock_count = stock_count - 1,
      updated_at = now()
  WHERE id = p_product_id
    AND stock_count > 0;

  RETURN QUERY SELECT v_stock.id, v_stock.email, v_stock.password, v_stock.extra_info;
END;
$$ LANGUAGE plpgsql;

-- 5. Bulk Insert Stock Function
CREATE OR REPLACE FUNCTION bulk_insert_stock(
  p_product_id UUID,
  p_accounts JSONB
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_account JSONB;
BEGIN
  FOR v_account IN SELECT jsonb_array_elements(p_accounts)
  LOOP
    INSERT INTO account_stock (product_id, email, password, extra_info, status)
    VALUES (
      p_product_id,
      v_account->>'email',
      v_account->>'password',
      v_account->>'extra',
      'available'
    );
    v_count := v_count + 1;
  END LOOP;

  -- Update stock counter
  UPDATE products
  SET stock_count = stock_count + v_count,
      updated_at = now()
  WHERE id = p_product_id;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Decrement Stock Count Function (for manual delete)
CREATE OR REPLACE FUNCTION decrement_stock_count(p_product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock_count = GREATEST(stock_count - 1, 0),
      updated_at = now()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Bulk Delete Available Stock Function (for admin bulk delete)
CREATE OR REPLACE FUNCTION bulk_delete_available_stock(p_product_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count how many will be deleted
  SELECT COUNT(*) INTO v_count
  FROM account_stock
  WHERE product_id = p_product_id AND status = 'available';

  -- Delete all available stock for this product
  DELETE FROM account_stock
  WHERE product_id = p_product_id AND status = 'available';

  -- Update stock counter
  UPDATE products
  SET stock_count = GREATEST(stock_count - v_count, 0),
      updated_at = now()
  WHERE id = p_product_id;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Products: Public read, admin write
CREATE POLICY "Products are viewable by everyone" 
  ON products FOR SELECT USING (true);

CREATE POLICY "Products are manageable by service role" 
  ON products FOR ALL USING (auth.role() = 'service_role');

-- Account Stock: Only service role
CREATE POLICY "Stock is manageable by service role" 
  ON account_stock FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read stock (for admin dashboard)
CREATE POLICY "Authenticated users can view stock" 
  ON account_stock FOR SELECT USING (auth.role() = 'authenticated');

-- Orders: Public can insert (create order), service role manages
CREATE POLICY "Anyone can create orders" 
  ON orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Orders are viewable by everyone for status check" 
  ON orders FOR SELECT USING (true);

CREATE POLICY "Orders are manageable by service role" 
  ON orders FOR UPDATE USING (auth.role() = 'service_role');

-- ============================================================
-- Storage Bucket Setup
-- ============================================================
-- NOTE: Run this in Supabase SQL Editor or create via Dashboard:
--
-- 1. Go to Supabase Dashboard → Storage
-- 2. Create a new bucket named "product-icons"
-- 3. Set it to PUBLIC
-- 4. Allowed MIME types: image/png, image/jpeg, image/webp, image/svg+xml, image/gif
-- 5. Max file size: 2MB
--
-- Or run via SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-icons',
  'product-icons',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Anyone can view product icons"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-icons');

CREATE POLICY "Service role can manage product icons"
  ON storage.objects FOR ALL
  USING (bucket_id = 'product-icons');

-- ============================================================
-- Seed Data (Optional Demo Products)
-- ============================================================

INSERT INTO products (name, slug, description, price, duration, category, is_active, stock_count) VALUES
  ('ChatGPT Pro', 'chatgpt-pro', 'Akses penuh ke GPT-4o, DALL-E 3, dan semua fitur premium OpenAI tanpa batasan.', 95000, '1 Bulan', 'AI Tools', true, 0),
  ('Netflix Premium', 'netflix-premium', 'Streaming film & series tanpa batas dalam kualitas Ultra HD 4K. Akses semua konten.', 45000, '1 Bulan', 'Streaming', true, 0),
  ('Canva Pro', 'canva-pro', 'Desain grafis profesional dengan 100+ juta template, foto, dan elemen premium.', 35000, '1 Bulan', 'Design', true, 0),
  ('Zoom Pro', 'zoom-pro', 'Meeting tanpa batas waktu, recording cloud, dan fitur kolaborasi lengkap.', 55000, '1 Bulan', 'Productivity', true, 0),
  ('Spotify Premium', 'spotify-premium', 'Streaming musik tanpa iklan, download offline, dan kualitas audio terbaik.', 25000, '1 Bulan', 'Streaming', true, 0),
  ('YouTube Premium', 'youtube-premium', 'Nonton tanpa iklan, download video, dan akses YouTube Music Premium.', 30000, '1 Bulan', 'Streaming', true, 0),
  ('Grammarly Premium', 'grammarly-premium', 'Periksa tata bahasa, tone, dan plagiarisme dengan AI writing assistant terbaik.', 65000, '1 Bulan', 'AI Tools', true, 0),
  ('Figma Professional', 'figma-pro', 'Kolaborasi desain UI/UX real-time dengan unlimited projects dan version history.', 75000, '1 Bulan', 'Design', true, 0),
  ('Notion Plus', 'notion-plus', 'Workspace all-in-one untuk catatan, proyek, database, dan kolaborasi tim.', 40000, '1 Bulan', 'Productivity', true, 0)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- MIGRATION: If tables already exist, run these ALTER statements
-- ============================================================
-- Add buyer_notes column to orders (if table already exists):
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_notes TEXT;
--
-- Create the new RPC functions by running sections 6, 7, 8 above.
