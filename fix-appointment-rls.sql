-- Fix Appointments RLS Policy for New Appointment Creation
-- Bu script appointments tablosundaki RLS policy sorununu çözer

-- Mevcut policy'leri kaldır
DROP POLICY IF EXISTS "appointments_select_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_insert_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_update_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_delete_policy" ON appointments;

-- Yeni policy'ler oluştur
-- SELECT policy: İşletme kendi randevularını görebilir
CREATE POLICY "appointments_select_policy" ON appointments
    FOR SELECT
    USING (business_id = auth.uid());

-- INSERT policy: İşletme kendi müşterileri için randevu oluşturabilir
CREATE POLICY "appointments_insert_policy" ON appointments
    FOR INSERT
    WITH CHECK (
        business_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM business_customers 
            WHERE business_customers.id = appointments.customer_id 
            AND business_customers.business_id = auth.uid()
        )
    );

-- UPDATE policy: İşletme kendi randevularını güncelleyebilir
CREATE POLICY "appointments_update_policy" ON appointments
    FOR UPDATE
    USING (business_id = auth.uid())
    WITH CHECK (business_id = auth.uid());

-- DELETE policy: İşletme kendi randevularını silebilir
CREATE POLICY "appointments_delete_policy" ON appointments
    FOR DELETE
    USING (business_id = auth.uid());

-- RLS'in aktif olduğundan emin ol
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Test için örnek sorgu (opsiyonel - test amaçlı)
-- SELECT * FROM appointments WHERE business_id = auth.uid();
