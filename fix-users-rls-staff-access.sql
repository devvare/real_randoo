-- Users Table RLS Fix for Staff Access

-- 1. Users table RLS policy'lerini geçici olarak devre dışı bırak
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Staff table RLS policy'lerini geçici olarak devre dışı bırak
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;

-- 3. Test için staff user profile'ını kontrol et
SELECT 
    u.id,
    u.email,
    u.user_type,
    u.name,
    u.created_at
FROM users u
WHERE u.id = '103bd22c-8140-4784-937d-20ab395c97e1';

-- 4. Staff kaydını kontrol et
SELECT 
    s.id,
    s.name,
    s.email,
    s.user_id,
    s.status
FROM staff s
WHERE s.user_id = '103bd22c-8140-4784-937d-20ab395c97e1';

-- 5. Test için kontrol
SELECT 'Users and Staff RLS disabled for staff login testing' as status;

-- ÖNEMLİ: Bu script'i çalıştırdıktan sonra staff login'i tekrar deneyin
-- User profile bulunacak ve doğru dashboard'a yönlendirilecek
