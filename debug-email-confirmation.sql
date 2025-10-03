-- Debug Email Confirmation ve RLS Sorunları

-- 1. Auth kullanıcısını kontrol et
SELECT 
    id,
    email,
    email_confirmed_at,
    confirmation_sent_at,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'devvare2@gmail.com'
ORDER BY created_at DESC
LIMIT 3;

-- 2. Staff kaydını kontrol et
SELECT 
    s.id,
    s.name,
    s.email,
    s.status,
    s.invitation_code,
    s.user_id,
    s.created_at
FROM staff s
WHERE s.email = 'devvare2@gmail.com'
ORDER BY s.created_at DESC
LIMIT 3;

-- 3. Users table kaydını kontrol et
SELECT 
    u.id,
    u.email,
    u.user_type,
    u.name,
    u.created_at
FROM users u
WHERE u.email = 'devvare2@gmail.com'
ORDER BY u.created_at DESC
LIMIT 3;

-- 4. RLS Policy'leri geçici olarak devre dışı bırak
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 5. Test için kontrol
SELECT 'RLS disabled for debugging' as status;

-- ÖNEMLİ NOTLAR:
-- 1. Supabase Dashboard > Authentication > Settings > "Enable email confirmations" kontrol edin
-- 2. SMTP Settings yapılandırılmış mı kontrol edin
-- 3. Spam klasörünü kontrol edin
-- 4. Email confirmation bypass için: "Enable email confirmations" = OFF yapın (geçici)
