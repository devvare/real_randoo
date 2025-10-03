-- Re-enable Staff RLS After Testing
-- Test başarılı olduktan sonra RLS'yi tekrar aç

-- 1. RLS'yi tekrar aç
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- 2. Production için güvenli policy'leri oluştur
CREATE POLICY "business_owners_manage_staff" 
ON staff 
FOR ALL 
TO authenticated
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- 3. Staff kendi profilini görebilir
CREATE POLICY "staff_own_profile" 
ON staff 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- 4. Cache temizle
NOTIFY pgrst, 'reload schema';

-- 5. Kontrol
SELECT 'Staff RLS re-enabled successfully' as status;
