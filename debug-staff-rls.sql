-- Debug Staff RLS Policies
-- Mevcut policy'leri kontrol et ve temizle

-- 1. Mevcut tüm staff policy'lerini listele
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'staff';

-- 2. Tüm staff policy'lerini sil
DROP POLICY IF EXISTS "Anonymous can read pending staff for signup" ON staff;
DROP POLICY IF EXISTS "Anonymous can activate staff" ON staff;
DROP POLICY IF EXISTS "Staff can signup with invitation code" ON staff;
DROP POLICY IF EXISTS "business_owners_manage_staff" ON staff;
DROP POLICY IF EXISTS "staff_own_profile" ON staff;

-- 3. RLS'yi devre dışı bırak ve tekrar aç (cache temizliği için)
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- 4. Yeni policy'leri oluştur
CREATE POLICY "Anonymous can read pending staff for signup" 
ON staff 
FOR SELECT 
TO anon
USING (
  status = 'pending' 
  AND invitation_code IS NOT NULL
);

CREATE POLICY "Anonymous can activate staff" 
ON staff 
FOR UPDATE 
TO anon
USING (
  status = 'pending' 
  AND invitation_code IS NOT NULL
)
WITH CHECK (
  status = 'active'
  AND invitation_code IS NOT NULL
);

-- 5. İşletme sahipleri kendi staff'larını yönetebilir
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

-- 6. Cache temizle
NOTIFY pgrst, 'reload schema';

-- 7. Son kontrol
SELECT 'Staff RLS policies recreated successfully' as status;

-- 8. Policy'leri tekrar listele
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'staff';
