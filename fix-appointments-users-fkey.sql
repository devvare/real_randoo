-- Fix Appointments Foreign Key to Reference Users Table
-- Bu script appointments tablosunu users tablosuna referans edecek şekilde düzeltir

-- Önce mevcut foreign key constraint'i kaldır
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_customer_id_fkey;

-- Yeni foreign key constraint ekle - users tablosuna referans
ALTER TABLE appointments 
ADD CONSTRAINT appointments_customer_id_fkey 
FOREIGN KEY (customer_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- RLS policy'leri güncelle - müşterinin business ile ilişkisini kontrol et
DROP POLICY IF EXISTS "appointments_select_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_insert_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_update_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_delete_policy" ON appointments;

-- Yeni policy'ler oluştur
CREATE POLICY "appointments_select_policy" ON appointments
    FOR SELECT
    USING (business_id = auth.uid());

CREATE POLICY "appointments_insert_policy" ON appointments
    FOR INSERT
    WITH CHECK (
        business_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM business_all_customers 
            WHERE business_all_customers.id = appointments.customer_id 
            AND business_all_customers.business_id = auth.uid()
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

-- Test sorgusu (opsiyonel)
-- SELECT 
--     a.id, 
--     a.customer_id, 
--     u.name as customer_name,
--     a.appointment_date,
--     a.start_time
-- FROM appointments a
-- JOIN users u ON u.id = a.customer_id
-- WHERE a.business_id = auth.uid()
-- LIMIT 5;
