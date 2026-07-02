-- ============================================================================
-- FIXED DATABASE SETUP - RUN THIS NOW!
-- ============================================================================

-- 1. DROP EXISTING TABLES (to start fresh)
DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.stock_out CASCADE;
DROP TABLE IF EXISTS public.stock_in CASCADE;
DROP TABLE IF EXISTS public.chemicals CASCADE;

-- 2. CREATE CHEMICALS TABLE
CREATE TABLE public.chemicals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    formula TEXT,
    cas_number TEXT UNIQUE,
    hazard_class TEXT,
    total_stock DECIMAL(10, 2) DEFAULT 0,
    current_stock DECIMAL(10, 2) DEFAULT 0,
    unit TEXT DEFAULT 'kg' CHECK (unit IN ('kg', 'g', 'L', 'ml', 'mol', 'pcs')),
    min_threshold DECIMAL(10, 2) DEFAULT 0,
    location TEXT,
    supplier TEXT,
    batch_number TEXT,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.chemicals ENABLE ROW LEVEL SECURITY;

-- 3. CREATE ALERTS TABLE (WITH user_id COLUMN!)
CREATE TABLE public.alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chemical_id UUID NOT NULL REFERENCES public.chemicals (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'expiring_soon', 'expired', 'system')),
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- 4. RECREATE STOCK_IN TABLE
CREATE TABLE public.stock_in (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chemical_id UUID NOT NULL REFERENCES public.chemicals (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    quantity DECIMAL(10, 2) NOT NULL,
    unit TEXT DEFAULT 'kg' CHECK (unit IN ('kg', 'g', 'L', 'ml', 'mol', 'pcs')),
    supplier TEXT,
    batch_number TEXT,
    expiry_date DATE,
    purchase_date DATE DEFAULT CURRENT_DATE,
    cost DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.stock_in ENABLE ROW LEVEL SECURITY;

-- 5. RECREATE STOCK_OUT TABLE
CREATE TABLE public.stock_out (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chemical_id UUID NOT NULL REFERENCES public.chemicals (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    quantity DECIMAL(10, 2) NOT NULL,
    unit TEXT DEFAULT 'kg' CHECK (unit IN ('kg', 'g', 'L', 'ml', 'mol', 'pcs')),
    purpose TEXT,
    department TEXT,
    requested_by TEXT,
    approved_by TEXT,
    stock_out_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.stock_out ENABLE ROW LEVEL SECURITY;

-- 6. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_chemicals_user_id ON public.chemicals (user_id);
CREATE INDEX IF NOT EXISTS idx_chemicals_cas_number ON public.chemicals (cas_number);
CREATE INDEX IF NOT EXISTS idx_chemicals_is_active ON public.chemicals (is_active);
CREATE INDEX IF NOT EXISTS idx_chemicals_end_date ON public.chemicals (end_date);
CREATE INDEX IF NOT EXISTS idx_alerts_chemical_id ON public.alerts (chemical_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts (user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_alert_type ON public.alerts (alert_type);
CREATE INDEX IF NOT EXISTS idx_stock_in_chemical_id ON public.stock_in (chemical_id);
CREATE INDEX IF NOT EXISTS idx_stock_in_user_id ON public.stock_in (user_id);
CREATE INDEX IF NOT EXISTS idx_stock_out_chemical_id ON public.stock_out (chemical_id);
CREATE INDEX IF NOT EXISTS idx_stock_out_user_id ON public.stock_out (user_id);

-- 7. CREATE AUTO-UPDATE FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. CREATE AUTO-PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'user',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. CREATE TRIGGERS FOR UPDATED_AT
DROP TRIGGER IF EXISTS update_chemicals_updated_at ON public.chemicals;
CREATE TRIGGER update_chemicals_updated_at
BEFORE UPDATE ON public.chemicals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_alerts_updated_at ON public.alerts;
CREATE TRIGGER update_alerts_updated_at
BEFORE UPDATE ON public.alerts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_stock_in_updated_at ON public.stock_in;
CREATE TRIGGER update_stock_in_updated_at
BEFORE UPDATE ON public.stock_in
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_stock_out_updated_at ON public.stock_out;
CREATE TRIGGER update_stock_out_updated_at
BEFORE UPDATE ON public.stock_out
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. RLS POLICIES - CHEMICALS
DROP POLICY IF EXISTS "Users can view own chemicals" ON public.chemicals;
CREATE POLICY "Users can view own chemicals"
ON public.chemicals FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert chemicals" ON public.chemicals;
CREATE POLICY "Users can insert chemicals"
ON public.chemicals FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own chemicals" ON public.chemicals;
CREATE POLICY "Users can update own chemicals"
ON public.chemicals FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own chemicals" ON public.chemicals;
CREATE POLICY "Users can delete own chemicals"
ON public.chemicals FOR DELETE
USING (auth.uid() = user_id);

-- 11. RLS POLICIES - ALERTS
DROP POLICY IF EXISTS "Users can view own alerts" ON public.alerts;
CREATE POLICY "Users can view own alerts"
ON public.alerts FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own alerts" ON public.alerts;
CREATE POLICY "Users can update own alerts"
ON public.alerts FOR UPDATE
USING (auth.uid() = user_id);

-- 12. RLS POLICIES - STOCK_IN
DROP POLICY IF EXISTS "Users can view own stock_in" ON public.stock_in;
CREATE POLICY "Users can view own stock_in"
ON public.stock_in FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert stock_in" ON public.stock_in;
CREATE POLICY "Users can insert stock_in"
ON public.stock_in FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 13. RLS POLICIES - STOCK_OUT
DROP POLICY IF EXISTS "Users can view own stock_out" ON public.stock_out;
CREATE POLICY "Users can view own stock_out"
ON public.stock_out FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert stock_out" ON public.stock_out;
CREATE POLICY "Users can insert stock_out"
ON public.stock_out FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ✅ SETUP COMPLETE! ALL TABLES RECREATED CORRECTLY!
-- ============================================================================

