-- Final Staff RLS Policy Fix
-- Staff self-signup için anonymous kullanıcı UPDATE izni

-- 1. Mevcut policy'leri temizle
DROP POLICY IF EXISTS "Anonymous can read pending staff for signup" ON staff;
DROP POLICY IF EXISTS "Anonymous can activate staff" ON staff;
DROP POLICY IF EXISTS "Staff can signup with invitation code" ON staff;

-- 2. Anonymous kullanıcılar için staff okuma izni (self-signup için)
CREATE POLICY "Anonymous can read pending staff for signup" 
ON staff 
FOR SELECT 
TO anon
USING (
  status = 'pending' 
  AND invitation_code IS NOT NULL
);

-- 3. Anonymous kullanıcılar için staff güncelleme izni (activation için)
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

-- 4. Cache temizle
NOTIFY pgrst, 'reload schema';

-- 5. Test için kontrol
SELECT 'Staff RLS policies updated successfully' as status;
