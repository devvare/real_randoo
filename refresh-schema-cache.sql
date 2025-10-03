-- Supabase Schema Cache Refresh
-- Bu script schema cache'i temizler ve staff tablosunu yeniden tanımlar

-- 1. Staff tablosu yapısını kontrol et
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'staff' 
ORDER BY ordinal_position;

-- 2. PostgREST schema cache'i temizle
NOTIFY pgrst, 'reload schema';

-- 3. Staff tablosu invitation_code kolonu kontrolü
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'staff' 
  AND column_name IN ('invitation_code', 'status');

-- 4. Eğer kolonlar yoksa, tekrar ekle
DO $$
BEGIN
    -- invitation_code kolonu kontrolü ve ekleme
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'invitation_code'
    ) THEN
        ALTER TABLE staff ADD COLUMN invitation_code TEXT;
        CREATE UNIQUE INDEX staff_invitation_code_unique 
        ON staff (invitation_code) 
        WHERE invitation_code IS NOT NULL;
    END IF;
    
    -- status kolonu kontrolü ve ekleme
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'status'
    ) THEN
        ALTER TABLE staff ADD COLUMN status TEXT DEFAULT 'pending';
        ALTER TABLE staff ADD CONSTRAINT staff_status_check 
        CHECK (status IN ('pending', 'active', 'inactive'));
    END IF;
    
    RAISE NOTICE 'Staff table columns checked and updated if necessary';
END $$;

-- 5. Cache refresh için PostgREST'e sinyal gönder
NOTIFY pgrst, 'reload schema';

-- 6. Son kontrol
SELECT 'Staff table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'staff' 
ORDER BY ordinal_position;
