-- Detailed Trigger Analysis
-- Trigger fonksiyonundaki hatayı detaylı analiz et

-- 1. Mevcut trigger fonksiyonunu tam olarak göster
SELECT 
    proname as function_name,
    prosrc as function_source,
    proargtypes,
    prorettype
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 2. Trigger durumunu kontrol et
SELECT 
    t.tgname AS trigger_name,
    t.tgenabled AS enabled,
    c.relname AS table_name,
    p.proname AS function_name,
    t.tgtype
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'users' AND p.proname = 'handle_new_user';

-- 3. Users tablosu yapısını detaylı kontrol et
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Auth.users tablosu yapısını kontrol et (trigger'ın NEW kaynağı)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'auth'
ORDER BY ordinal_position;

-- 5. Trigger'ı geçici olarak devre dışı bırak
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 6. Çok basit trigger fonksiyonu (sadece log)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Sadece log yaz, hiçbir şey yapma
  RAISE NOTICE 'Trigger called for user: %', NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger'ı yeniden oluştur
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Cache temizle
NOTIFY pgrst, 'reload schema';

-- 9. Test için kontrol
SELECT 'Minimal trigger function created for testing' as status;
