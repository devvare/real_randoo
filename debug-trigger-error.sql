-- Debug Trigger Error
-- Trigger fonksiyonundaki hatayı bul ve düzelt

-- 1. Mevcut trigger fonksiyonunu kontrol et
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 2. Trigger durumunu kontrol et
SELECT 
    t.tgname AS trigger_name,
    t.tgenabled AS enabled,
    c.relname AS table_name,
    p.proname AS function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'users' AND p.proname = 'handle_new_user';

-- 3. Users tablosu yapısını kontrol et
\d users;

-- 4. Basit trigger fonksiyonu (sadece users tablosu)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Sadece users tablosuna kayıt ekle (basit versiyon)
  INSERT INTO public.users (id, email, user_type, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Cache temizle
NOTIFY pgrst, 'reload schema';

-- 6. Test için kontrol
SELECT 'Simplified trigger function created' as status;
