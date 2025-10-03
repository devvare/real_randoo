-- Fix staff table missing columns
-- Bu script staff tablosuna eksik kolonları ekler

-- 1. can_book_appointments kolonu ekle
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS can_book_appointments BOOLEAN DEFAULT true;

-- 2. Diğer olası eksik kolonları da kontrol et ve ekle
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS position TEXT DEFAULT 'Staff';

-- 3. Mevcut staff kayıtları için default değerleri güncelle
UPDATE staff 
SET can_book_appointments = true 
WHERE can_book_appointments IS NULL;

UPDATE staff 
SET is_active = true 
WHERE is_active IS NULL;

-- 4. Tablo yapısını kontrol et
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'staff' 
ORDER BY ordinal_position;

-- 5. Test için staff tablosundaki mevcut kayıtları göster
SELECT id, name, email, can_book_appointments, is_active, position, description
FROM staff 
LIMIT 5;
