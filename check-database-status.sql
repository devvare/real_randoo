-- Database Durumu Kontrol Scripti

-- 1. Mevcut tabloları kontrol et
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('business_customers', 'business_vip_customers', 'customer_communications')
ORDER BY table_name;

-- 2. Mevcut view'ları kontrol et
SELECT table_name as view_name
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE 'business_%_customers'
ORDER BY table_name;

-- 3. business_customers tablosu varsa, yapısını kontrol et
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'business_customers'
ORDER BY ordinal_position;

-- 4. business_vip_customers tablosu varsa, yapısını kontrol et
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'business_vip_customers'
ORDER BY ordinal_position;

-- 5. Örnek business_customers verisi var mı kontrol et
SELECT COUNT(*) as customer_count FROM business_customers;

-- 6. Örnek business_vip_customers verisi var mı kontrol et
SELECT COUNT(*) as vip_customer_count FROM business_vip_customers;
