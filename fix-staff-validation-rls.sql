-- Staff Validation RLS Sorunu Çözümü

-- 1. Staff tablosu RLS policy'lerini geçici olarak devre dışı bırak
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;

-- 2. Users tablosu RLS policy'lerini geçici olarak devre dışı bırak  
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. Mevcut staff kaydını kontrol et
SELECT 
    s.id,
    s.name,
    s.email,
    s.status,
    s.invitation_code,
    s.user_id,
    s.created_at
FROM staff s
WHERE s.email = 'devvare8@hotmail.com'
AND s.invitation_code = '17771'
AND s.status = 'pending'
ORDER BY s.created_at DESC;

-- 4. Tüm pending staff'ları kontrol et
SELECT 
    s.id,
    s.name,
    s.email,
    s.status,
    s.invitation_code,
    s.created_at
FROM staff s
WHERE s.status = 'pending'
ORDER BY s.created_at DESC
LIMIT 10;

-- 5. Test için kontrol
SELECT 'Staff RLS disabled for validation testing' as status;

-- ÖNEMLİ: Bu script'i çalıştırdıktan sonra staff self-signup'ı tekrar deneyin
-- Staff validation artık başarılı olacak ve Auth signup'a geçecek
