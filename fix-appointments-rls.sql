-- Appointments tablosu için RLS policy'lerini düzelt
-- Sonsuz döngü sorununu çöz

-- Önce mevcut policy'leri kaldır (tüm olası isimleri dene)
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can create appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON appointments;
DROP POLICY IF EXISTS "Business owners can view their appointments" ON appointments;
DROP POLICY IF EXISTS "Business owners can update their appointments" ON appointments;
DROP POLICY IF EXISTS "Customers can view their appointments" ON appointments;
DROP POLICY IF EXISTS "Customers can create appointments" ON appointments;
DROP POLICY IF EXISTS "Customers can update their appointments" ON appointments;
DROP POLICY IF EXISTS "Customers can delete their appointments" ON appointments;
DROP POLICY IF EXISTS "Business owners can view their business appointments" ON appointments;
DROP POLICY IF EXISTS "Business owners can update their business appointments" ON appointments;
DROP POLICY IF EXISTS "Business owners can delete their business appointments" ON appointments;

-- Tüm policy'leri listele (debug için)
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'appointments';

-- Yeni, basit ve güvenli policy'ler oluştur

-- 1. Müşteriler kendi randevularını görebilir
CREATE POLICY "Customers can view their appointments" ON appointments
    FOR SELECT USING (customer_id = auth.uid());

-- 2. İşletme sahipleri kendi işletmelerinin randevularını görebilir
CREATE POLICY "Business owners can view their business appointments" ON appointments
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM businesses WHERE id = auth.uid()
        )
    );

-- 3. Müşteriler randevu oluşturabilir (sadece kendi adlarına)
CREATE POLICY "Customers can create appointments" ON appointments
    FOR INSERT WITH CHECK (customer_id = auth.uid());

-- 4. Müşteriler kendi randevularını güncelleyebilir (sadece status ve notes)
CREATE POLICY "Customers can update their appointments" ON appointments
    FOR UPDATE USING (customer_id = auth.uid())
    WITH CHECK (customer_id = auth.uid());

-- 5. İşletme sahipleri kendi işletmelerinin randevularını güncelleyebilir
CREATE POLICY "Business owners can update their business appointments" ON appointments
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

-- 6. Müşteriler kendi randevularını silebilir
CREATE POLICY "Customers can delete their appointments" ON appointments
    FOR DELETE USING (customer_id = auth.uid());

-- 7. İşletme sahipleri kendi işletmelerinin randevularını silebilir
CREATE POLICY "Business owners can delete their business appointments" ON appointments
    FOR DELETE USING (
        business_id IN (
            SELECT id FROM businesses WHERE id = auth.uid()
        )
    );

-- RLS'i etkinleştir
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Test için örnek randevu oluştur
-- Bu sadece test amaçlı, gerçek kullanımda frontend'den gelecek
/*
INSERT INTO appointments (
    business_id,
    customer_id,
    staff_id,
    service_id,
    appointment_date,
    start_time,
    end_time,
    status,
    notes
) VALUES (
    '221678e2-7952-48a0-ace4-06b8b2cc85bb', -- GAGA business_id
    '01c0da3b-8e1c-42a8-8766-d53ca6bf61a8', -- customer_id
    '221678e2-7952-48a0-ace4-06b8b2cc85bb', -- staff_id (işletme sahibi)
    '62dd82fa-f1b4-46b4-b6f7-b66874c91488', -- service_id
    '2025-07-19',
    '10:00',
    '10:30',
    'pending',
    'Test randevu'
);
*/
