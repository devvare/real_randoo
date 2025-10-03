-- Staff Self-Signup RLS Policy Fix
-- Bu script staff self-signup için gerekli RLS policy'lerini düzeltir

-- 1. Staff tablosu için self-signup policy'si ekle
DROP POLICY IF EXISTS "Staff can signup with invitation code" ON staff;

CREATE POLICY "Staff can signup with invitation code" 
ON staff 
FOR SELECT 
USING (
  status = 'pending' 
  AND invitation_code IS NOT NULL
);

-- 2. Staff tablosu için update policy'si (activation için)
DROP POLICY IF EXISTS "Staff can activate themselves" ON staff;

CREATE POLICY "Staff can activate themselves" 
ON staff 
FOR UPDATE 
USING (
  status = 'pending' 
  AND invitation_code IS NOT NULL
);

-- 3. Anonymous kullanıcılar için staff okuma izni
DROP POLICY IF EXISTS "Anonymous can read pending staff for signup" ON staff;

CREATE POLICY "Anonymous can read pending staff for signup" 
ON staff 
FOR SELECT 
TO anon
USING (
  status = 'pending' 
  AND invitation_code IS NOT NULL
);

-- 4. Anonymous kullanıcılar için staff güncelleme izni (activation için)
DROP POLICY IF EXISTS "Anonymous can activate staff" ON staff;

CREATE POLICY "Anonymous can activate staff" 
ON staff 
FOR UPDATE 
TO anon
USING (
  status = 'pending' 
  AND invitation_code IS NOT NULL
);

-- 5. Cache temizle
NOTIFY pgrst, 'reload schema';

-- 6. Test sorgusu
SELECT 'Staff RLS policies updated successfully' as result;
