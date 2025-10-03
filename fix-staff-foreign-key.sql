-- Fix Staff Foreign Key Constraint
-- Staff self-signup için foreign key constraint'i kaldır

-- 1. Mevcut constraint'leri kontrol et
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.table_name = 'staff' 
    AND tc.constraint_type = 'FOREIGN KEY';

-- 2. Staff user_id foreign key constraint'ini kaldır
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_user_id_fkey;

-- 3. Cache temizle
NOTIFY pgrst, 'reload schema';

-- 4. Kontrol
SELECT 'Staff foreign key constraint removed' as status;

-- 5. Staff tablosu yapısını kontrol et
\d staff;
