-- Customer Data Investigation
-- Bu script müşteri verilerinin nereden geldiğini kontrol eder

-- 1. business_all_customers view'ının yapısını kontrol et
SELECT 
    schemaname, 
    viewname, 
    definition 
FROM pg_views 
WHERE viewname = 'business_all_customers';

-- 2. business_customers tablosundaki verileri kontrol et
SELECT 
    id, 
    business_id, 
    name, 
    phone, 
    email,
    created_at
FROM business_customers 
WHERE business_id = '221678e2-7952-48a0-ace4-06b8b2cc85bb'  -- GAGA business ID
LIMIT 10;

-- 3. business_all_customers view'ından gelen verileri kontrol et
SELECT 
    id, 
    business_id, 
    name, 
    phone, 
    email,
    is_vip
FROM business_all_customers 
WHERE business_id = '221678e2-7952-48a0-ace4-06b8b2cc85bb'  -- GAGA business ID
LIMIT 10;

-- 4. Problematik customer ID'sini kontrol et
SELECT 
    'users' as table_name,
    id, 
    name, 
    email
FROM users 
WHERE id = '01c0da3b-8e1c-42a8-8766-d53ca6bf61a8'

UNION ALL

SELECT 
    'business_customers' as table_name,
    id, 
    name, 
    email
FROM business_customers 
WHERE id = '01c0da3b-8e1c-42a8-8766-d53ca6bf61a8';

-- 5. appointments tablosunun foreign key constraint'lerini kontrol et
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'appointments';
