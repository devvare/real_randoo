-- Appointments tablosu için RLS policy'lerini tamamen sıfırla
-- Sonsuz döngü sorununu çöz

-- 1. RLS'i geçici olarak devre dışı bırak
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- 2. Tüm policy'leri kaldır (zorla)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'appointments' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON appointments';
    END LOOP;
END $$;

-- 3. RLS'i tekrar etkinleştir
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 4. Yeni, basit ve güvenli policy'ler oluştur

-- Müşteriler kendi randevularını görebilir
CREATE POLICY "customers_view_own_appointments" ON appointments
    FOR SELECT USING (customer_id = auth.uid());

-- İşletme sahipleri kendi işletmelerinin randevularını görebilir
CREATE POLICY "business_owners_view_appointments" ON appointments
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM businesses WHERE id = auth.uid()
        )
    );

-- Müşteriler randevu oluşturabilir (sadece kendi adlarına)
CREATE POLICY "customers_create_appointments" ON appointments
    FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Müşteriler kendi randevularını güncelleyebilir
CREATE POLICY "customers_update_own_appointments" ON appointments
    FOR UPDATE USING (customer_id = auth.uid())
    WITH CHECK (customer_id = auth.uid());

-- İşletme sahipleri kendi işletmelerinin randevularını güncelleyebilir
CREATE POLICY "business_owners_update_appointments" ON appointments
    FOR UPDATE USING (
        business_id IN (
            SELECT id FROM businesses WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        business_id IN (
            SELECT id FROM businesses WHERE id = auth.uid()
        )
    );

-- Müşteriler kendi randevularını silebilir
CREATE POLICY "customers_delete_own_appointments" ON appointments
    FOR DELETE USING (customer_id = auth.uid());

-- İşletme sahipleri kendi işletmelerinin randevularını silebilir
CREATE POLICY "business_owners_delete_appointments" ON appointments
    FOR DELETE USING (
        business_id IN (
            SELECT id FROM businesses WHERE id = auth.uid()
        )
    );

-- Sonuç kontrolü
SELECT 'RLS policies updated successfully for appointments table' as result;
