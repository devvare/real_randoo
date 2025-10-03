-- Fix Appointments Foreign Key Constraint
-- Bu script appointments tablosundaki customer_id foreign key sorununu çözer

-- Önce mevcut foreign key constraint'i kaldır
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_customer_id_fkey;

-- Yeni foreign key constraint ekle - business_customers tablosuna referans
ALTER TABLE appointments 
ADD CONSTRAINT appointments_customer_id_fkey 
FOREIGN KEY (customer_id) 
REFERENCES business_customers(id) 
ON DELETE CASCADE;

-- RLS policy'leri de güncelle
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
