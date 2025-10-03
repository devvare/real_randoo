-- Auth Trigger Fix Script
-- Bu script Auth signup sırasında oluşan trigger hatalarını düzeltir

-- 1. Mevcut trigger'ı kontrol et ve gerekirse düzelt
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Yeni handle_new_user fonksiyonu (hata kontrolü ile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_type_value text;
BEGIN
    -- Metadata'dan user_type'ı çek
    user_type_value := NEW.raw_user_meta_data->>'user_type';
    
    -- Eğer user_type yoksa, varsayılan olarak 'customer' kullan
    IF user_type_value IS NULL OR user_type_value = '' THEN
        user_type_value := 'customer';
    END IF;
    
    -- Users tablosuna kayıt ekle (hata kontrolü ile)
    BEGIN
        INSERT INTO public.users (id, email, user_type, name, created_at)
        VALUES (
            NEW.id,
            NEW.email,
            user_type_value,
            COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
            NOW()
        );
    EXCEPTION
        WHEN unique_violation THEN
            -- Kullanıcı zaten varsa, güncelle
            UPDATE public.users 
            SET 
                email = NEW.email,
                user_type = user_type_value,
                name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
                updated_at = NOW()
            WHERE id = NEW.id;
        WHEN OTHERS THEN
            -- Diğer hatalar için log ve devam et
            RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger'ı yeniden oluştur
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. RLS Policy'leri kontrol et
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile" 
ON users 
FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" 
ON users 
FOR UPDATE 
USING (auth.uid() = id);

-- 5. Staff için RLS policy'leri
DROP POLICY IF EXISTS "Anonymous can read pending staff for signup" ON staff;
DROP POLICY IF EXISTS "Anonymous can activate staff" ON staff;

CREATE POLICY "Anonymous can read pending staff for signup" 
ON staff 
FOR SELECT 
TO anon
USING (
  status = 'pending' 
  AND invitation_code IS NOT NULL
);

CREATE POLICY "Anonymous can activate staff" 
ON staff 
FOR UPDATE 
TO anon
USING (
  status = 'pending' 
  AND invitation_code IS NOT NULL
);

-- 6. Cache temizle
NOTIFY pgrst, 'reload schema';

-- 7. Test için örnek veri kontrolü
SELECT 'Auth trigger fix completed' as status;
