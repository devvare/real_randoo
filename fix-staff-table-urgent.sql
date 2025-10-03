-- URGENT: Staff table fix - invitation_code kolonu eksik
-- Bu script direkt Supabase SQL Editor'da çalıştırılacak

-- 1. Önce staff tablosu yapısını kontrol et
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'staff' 
ORDER BY ordinal_position;

-- 2. invitation_code kolonu var mı kontrol et
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staff' AND column_name = 'invitation_code'
) as invitation_code_exists;

-- 3. status kolonu var mı kontrol et  
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staff' AND column_name = 'status'
) as status_exists;

-- 4. Eksik kolonları ekle
ALTER TABLE staff ADD COLUMN IF NOT EXISTS invitation_code TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 5. Constraint'leri ekle
DO $$
BEGIN
    -- Status constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'staff_status_check'
    ) THEN
        ALTER TABLE staff ADD CONSTRAINT staff_status_check 
        CHECK (status IN ('pending', 'active', 'inactive'));
    END IF;
    
    -- Unique index for invitation_code
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'staff_invitation_code_unique'
    ) THEN
        CREATE UNIQUE INDEX staff_invitation_code_unique 
        ON staff (invitation_code) 
        WHERE invitation_code IS NOT NULL;
    END IF;
END $$;

-- 6. Mevcut staff kayıtlarını active yap
UPDATE staff 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- 7. Son kontrol - tablo yapısını göster
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'staff' 
ORDER BY ordinal_position;

-- 8. PostgREST cache'i temizle
NOTIFY pgrst, 'reload schema';
