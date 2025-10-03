-- Fix Staff User Profile Creation
-- Staff signup sonrası users tablosuna kayıt eklenmesi için trigger düzeltmesi

-- 1. Mevcut trigger fonksiyonunu kontrol et
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 2. Trigger fonksiyonunu güncelle (staff desteği ekle)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Users tablosuna kayıt ekle
  INSERT INTO public.users (id, email, user_type, name, phone, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NOW(),
    NOW()
  );
  
  -- User type'a göre profil tablosuna kayıt ekle
  IF COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer') = 'customer' THEN
    INSERT INTO public.customers (id, first_name, last_name, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', ''),
      '',
      NOW(),
      NOW()
    );
  ELSIF COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer') = 'business' THEN
    INSERT INTO public.businesses (id, name, owner_id, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'business_name', NEW.raw_user_meta_data->>'name', ''),
      NEW.id,
      NOW(),
      NOW()
    );
  -- Staff için özel işlem yok (zaten staff tablosunda kayıt var)
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger'ı yeniden oluştur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Cache temizle
NOTIFY pgrst, 'reload schema';

-- 5. Test için kontrol
SELECT 'Staff user profile trigger updated' as status;
