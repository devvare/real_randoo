-- Fix staff table foreign key constraints
-- Bu script staff tablosundaki yanlış foreign key'leri düzeltir

-- 1. Mevcut foreign key constraint'leri kontrol et
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'staff';

-- 2. Yanlış foreign key constraint'i kaldır
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_id_fkey;
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_business_id_fkey;
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_user_id_fkey;

-- 3. Doğru foreign key constraint'leri ekle
-- user_id users tablosuna referans etmeli
ALTER TABLE staff 
ADD CONSTRAINT staff_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- business_id businesses tablosuna referans etmeli
ALTER TABLE staff 
ADD CONSTRAINT staff_business_id_fkey 
FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

-- 4. Staff tablosu yapısını kontrol et
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'staff' 
ORDER BY ordinal_position;

-- 5. Mevcut staff kayıtlarını kontrol et
SELECT id, user_id, business_id, name, email, can_book_appointments, is_active
FROM staff 
LIMIT 5;

-- 6. Users ve businesses tablolarında referans edilen ID'lerin var olup olmadığını kontrol et
SELECT 'users' as table_name, count(*) as record_count FROM users
UNION ALL
SELECT 'businesses' as table_name, count(*) as record_count FROM businesses
UNION ALL
SELECT 'staff' as table_name, count(*) as record_count FROM staff;

-- NOTLAR:
-- - Bu script staff tablosundaki foreign key sorunlarını düzeltir
-- - Eğer mevcut staff kayıtları varsa ve referans ettikleri user_id/business_id yoksa, önce onları temizlemek gerekebilir
-- - Script çalıştıktan sonra staff ekleme işlemi çalışmalı
