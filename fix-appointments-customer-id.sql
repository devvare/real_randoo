-- Fix Appointments Customer ID Foreign Key
-- Bu script customer_id'nin doğru tabloyu referans etmesini sağlar

-- Önce mevcut appointments tablosundaki customer_id'lerin hangi tabloda olduğunu kontrol et
SELECT 
    'users tablosunda bulunan customer_id sayısı:' as info,
    COUNT(*) as count
FROM appointments a
WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = a.customer_id)
UNION ALL
SELECT 
    'business_customers tablosunda bulunan customer_id sayısı:' as info,
    COUNT(*) as count
FROM appointments a  
WHERE EXISTS (SELECT 1 FROM business_customers bc WHERE bc.id = a.customer_id);

-- Mevcut foreign key constraint'i kaldır
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_customer_id_fkey;

-- Müşteri ID'leri business_customers tablosunda ise, onları users tablosuna taşı
-- veya doğrudan users tablosuna referans ver
ALTER TABLE appointments 
ADD CONSTRAINT appointments_customer_id_fkey 
FOREIGN KEY (customer_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- RLS policy'leri güncelle
DROP POLICY IF EXISTS "appointments_select_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_insert_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_update_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_delete_policy" ON appointments;

-- Yeni policy'ler oluştur
CREATE POLICY "appointments_select_policy" ON appointments
    FOR SELECT
    USING (business_id = auth.uid());

-- INSERT policy: Müşterinin users tablosunda olduğunu ve business_customers'da bu işletmeye ait olduğunu kontrol et
CREATE POLICY "appointments_insert_policy" ON appointments
    FOR INSERT
    WITH CHECK (
        business_id = auth.uid() AND
        EXISTS (SELECT 1 FROM users WHERE users.id = appointments.customer_id) AND
        EXISTS (
            SELECT 1 FROM business_customers 
            WHERE business_customers.id = appointments.customer_id 
            AND business_customers.business_id = auth.uid()
        )
    );

CREATE POLICY "appointments_update_policy" ON appointments
    FOR UPDATE
    USING (business_id = auth.uid())
    WITH CHECK (business_id = auth.uid());

CREATE POLICY "appointments_delete_policy" ON appointments
    FOR DELETE
    USING (business_id = auth.uid());

-- RLS'in aktif olduğundan emin ol
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Test sorgusu
SELECT 
    'Test: Appointments ile users join' as test,
    COUNT(*) as count
FROM appointments a
JOIN users u ON u.id = a.customer_id
WHERE a.business_id = (SELECT auth.uid());
