-- EMERGENCY: Staff RLS Bypass for Testing
-- Bu script sadece test için, production'da RLS açık olmalı!

-- 1. Mevcut policy'leri listele
SELECT 'Current staff policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'staff';

-- 2. Tüm staff policy'lerini sil
DROP POLICY IF EXISTS "Anonymous can read pending staff for signup" ON staff;
DROP POLICY IF EXISTS "Anonymous can activate staff" ON staff;
DROP POLICY IF EXISTS "Staff can signup with invitation code" ON staff;
DROP POLICY IF EXISTS "business_owners_manage_staff" ON staff;
DROP POLICY IF EXISTS "staff_own_profile" ON staff;

-- 3. RLS'yi GEÇİCİ olarak kapat (SADECE TEST İÇİN!)
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;

-- 4. Cache temizle
NOTIFY pgrst, 'reload schema';

-- 5. Test için kontrol
SELECT 'EMERGENCY: Staff RLS disabled for testing' as warning;
SELECT 'Test staff signup now, then re-enable RLS!' as instruction;

-- 6. Staff tablosu durumunu kontrol et
SELECT COUNT(*) as total_staff, 
       COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_staff,
       COUNT(CASE WHEN status = 'active' THEN 1 END) as active_staff
FROM staff;
