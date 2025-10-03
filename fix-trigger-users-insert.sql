-- Fix Trigger - Users Tablosuna Kayıt Ekle
-- Minimal trigger çalışıyor, şimdi users tablosuna kayıt ekleme özelliğini ekle

-- 1. Çalışan trigger fonksiyonu (users tablosuna kayıt ekler)
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
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    user_type = EXCLUDED.user_type,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    updated_at = NOW();
  
  -- Log yaz (debug için)
  RAISE NOTICE 'User profile created for: % (type: %)', NEW.email, COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Cache temizle
NOTIFY pgrst, 'reload schema';

-- 3. Test için kontrol
SELECT 'Working trigger function with users table insert created' as status;
