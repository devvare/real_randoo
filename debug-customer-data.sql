-- Comprehensive Customer Data Debug
-- Bu script müşteri verilerinin tam durumunu kontrol eder

-- 1. business_all_customers view'ının tanımını kontrol et
SELECT 
    schemaname, 
    viewname, 
    definition 
FROM pg_views 
WHERE viewname = 'business_all_customers';

-- 2. Problematik customer ID'sini tüm tablolarda ara
SELECT 'users' as source_table, id, name, email, user_type
FROM users 
WHERE id = '01c0da3b-8e1c-42a8-8766-d53ca6bf61a8'

UNION ALL

SELECT 'business_customers' as source_table, id, name, email, 'customer' as user_type
FROM business_customers 
WHERE id = '01c0da3b-8e1c-42a8-8766-d53ca6bf61a8'

UNION ALL

SELECT 'customers' as source_table, id, name, email, 'customer' as user_type
FROM customers 
WHERE id = '01c0da3b-8e1c-42a8-8766-d53ca6bf61a8';

-- 3. GAGA işletmesi için business_all_customers view'ından gelen tüm müşterileri listele
SELECT 
    id, 
    name, 
    phone, 
    email,
    is_vip,
    business_id
FROM business_all_customers 
WHERE business_id = '221678e2-7952-48a0-ace4-06b8b2cc85bb'  -- GAGA business ID
ORDER BY name;

-- 4. GAGA işletmesi için business_customers tablosundaki müşterileri listele
SELECT 
    id, 
    name, 
    phone, 
    email,
    business_id,
    created_at
FROM business_customers 
WHERE business_id = '221678e2-7952-48a0-ace4-06b8b2cc85bb'  -- GAGA business ID
ORDER BY name;

-- 5. users tablosunda customer tipindeki kullanıcıları listele
SELECT 
    id, 
    name, 
    email,
    user_type,
    created_at
FROM users 
WHERE user_type = 'customer'
ORDER BY name
LIMIT 10;

-- 6. appointments tablosunun foreign key constraint'lerini kontrol et
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
