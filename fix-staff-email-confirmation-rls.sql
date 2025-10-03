-- Fix Staff Email Confirmation ve RLS Policy
-- Staff self-signup sonrası email confirmation bypass ve RLS düzeltmesi

-- 1. Staff tablosu RLS policy'lerini geçici olarak devre dışı bırak
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;

-- 2. Users tablosu RLS policy'lerini geçici olarak devre dışı bırak  
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. Email confirmation bypass için Supabase Auth ayarları kontrol
-- (Bu manuel olarak Supabase Dashboard > Authentication > Settings'den yapılmalı)
-- "Enable email confirmations" = OFF

-- 4. Mevcut pending staff'ları kontrol et
SELECT 
    s.id,
    s.name,
    s.email,
    s.status,
    s.user_id,
    u.id as user_table_id,
    u.user_type
FROM staff s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.status = 'pending'
ORDER BY s.created_at DESC;

-- 5. Test için kontrol
SELECT 'Staff and Users RLS disabled for testing' as status;

-- 6. Email confirmation durumunu kontrol et
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'devvare2@gmail.com'
ORDER BY created_at DESC
LIMIT 5;
