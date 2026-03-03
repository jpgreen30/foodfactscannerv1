
CREATE TABLE IF NOT EXISTS product_heavy_metals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT NOT NULL,
  product_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  test_date DATE DEFAULT CURRENT_DATE,
  lab_source TEXT NOT NULL CHECK (lab_source IN ('Consumer Reports', 'FDA TDS', 'HBBF', 'Congressional Report', 'State Lab', 'Independent', 'Healthy Babies Bright Futures')),
  arsenic_ppb DECIMAL(8,2),
  lead_ppb DECIMAL(8,2),
  cadmium_ppb DECIMAL(8,2),
  mercury_ppb DECIMAL(8,2),
  arsenic_level TEXT CHECK (arsenic_level IN ('safe', 'caution', 'avoid')),
  lead_level TEXT CHECK (lead_level IN ('safe', 'caution', 'avoid')),
  cadmium_level TEXT CHECK (cadmium_level IN ('safe', 'caution', 'avoid')),
  mercury_level TEXT CHECK (mercury_level IN ('safe', 'caution', 'avoid')),
  overall_verdict TEXT CHECK (overall_verdict IN ('safe', 'caution', 'avoid')),
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_heavy_metals_barcode ON product_heavy_metals(barcode);
CREATE INDEX IF NOT EXISTS idx_heavy_metals_product_name ON product_heavy_metals(product_name);
CREATE INDEX IF NOT EXISTS idx_heavy_metals_brand ON product_heavy_metals(brand);

ALTER TABLE product_heavy_metals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON product_heavy_metals FOR SELECT USING (true);
CREATE POLICY "Service role manage" ON product_heavy_metals FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_heavy_metals_updated_at BEFORE UPDATE ON product_heavy_metals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
