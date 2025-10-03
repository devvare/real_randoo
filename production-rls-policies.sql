-- Production-Ready RLS Policies for Staff and Users Tables

-- 1. RLS'i tekrar aktif et
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Mevcut policy'leri temizle
DROP POLICY IF EXISTS "staff_select_policy" ON staff;
DROP POLICY IF EXISTS "staff_insert_policy" ON staff;
DROP POLICY IF EXISTS "staff_update_policy" ON staff;
DROP POLICY IF EXISTS "staff_delete_policy" ON staff;

DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- 3. STAFF TABLE POLICIES

-- Staff SELECT: Kendi kaydını, kendi işletmesindeki staff'ları ve pending invitation'ları görebilir
CREATE POLICY "staff_select_policy" ON staff
FOR SELECT
USING (
  -- Kendi kaydını görebilir
  user_id = auth.uid()
  OR
  -- Kendi işletmesindeki diğer staff'ları görebilir (business owner ise)
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
  OR
  -- Pending invitation'ları herkes görebilir (staff self-signup için)
  (status = 'pending' AND user_id IS NULL)
);

-- Staff INSERT: Sadece business owner kendi işletmesine staff ekleyebilir
CREATE POLICY "staff_insert_policy" ON staff
FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- Staff UPDATE: Kendi kaydını güncelleyebilir veya business owner kendi staff'larını güncelleyebilir
CREATE POLICY "staff_update_policy" ON staff
FOR UPDATE
USING (
  -- Kendi kaydını güncelleyebilir
  user_id = auth.uid()
  OR
  -- Business owner kendi işletmesindeki staff'ları güncelleyebilir
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  -- Aynı koşullar
  user_id = auth.uid()
  OR
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- Staff DELETE: Sadece business owner kendi staff'larını silebilir
CREATE POLICY "staff_delete_policy" ON staff
FOR DELETE
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- 4. USERS TABLE POLICIES

-- Users SELECT: Kendi profilini görebilir
CREATE POLICY "users_select_policy" ON users
FOR SELECT
USING (
  id = auth.uid()
);

-- Users INSERT: Kendi profilini oluşturabilir
CREATE POLICY "users_insert_policy" ON users
FOR INSERT
WITH CHECK (
  id = auth.uid()
);

-- Users UPDATE: Kendi profilini güncelleyebilir
CREATE POLICY "users_update_policy" ON users
FOR UPDATE
USING (
  id = auth.uid()
)
WITH CHECK (
  id = auth.uid()
);

-- Users DELETE: Kendi profilini silebilir
CREATE POLICY "users_delete_policy" ON users
FOR DELETE
USING (
  id = auth.uid()
);

-- 5. Test için kontrol
SELECT 'Production RLS policies created and enabled' as status;

-- 6. Policy'leri kontrol et
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('staff', 'users')
ORDER BY tablename, policyname;
