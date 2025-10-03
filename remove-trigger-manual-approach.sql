-- Remove Trigger - Manuel Yaklaşım
-- Trigger sürekli hata verdiği için kaldırıp manuel çözüm uygula

-- 1. Trigger'ı tamamen kaldır
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Trigger fonksiyonunu da kaldır
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Cache temizle
NOTIFY pgrst, 'reload schema';

-- 4. Kontrol et
SELECT 'Trigger completely removed - manual approach will be used' as status;

-- 5. Trigger olmadan test için kontrol
SELECT 
    t.tgname AS trigger_name,
    c.relname AS table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'users' AND t.tgname = 'on_auth_user_created';
