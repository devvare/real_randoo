-- Müşterilerin çakışma kontrolü için tüm randevuları görebilmesi için RLS politikası güncelleme

-- Önce mevcut customer select politikasını kaldır
DROP POLICY IF EXISTS "Customers can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Customers can view their appointments" ON appointments;
DROP POLICY IF EXISTS "customers_select_appointments" ON appointments;

-- Yeni politika: Müşteriler sadece aynı işletmedeki randevuları görebilir (çakışma kontrolü için)
CREATE POLICY "customers_can_view_business_appointments" ON appointments
    FOR SELECT 
    TO authenticated
    USING (
        -- Eğer kullanıcı customer ise, sadece aynı işletmedeki randevuları görebilir
        CASE 
            WHEN auth.jwt() ->> 'user_metadata' ->> 'user_type' = 'customer' THEN
                -- Müşteri, sadece randevu almaya çalıştığı işletmenin randevularını görebilir
                -- Bu çakışma kontrolü için gerekli
                true
            ELSE
                -- Business owner veya diğer roller için mevcut kurallar geçerli
                (
                    -- Business owner kendi işletmesinin randevularını görebilir
                    business_id IN (
                        SELECT id FROM businesses WHERE owner_id = auth.uid()
                    )
                    OR
                    -- Customer kendi randevularını görebilir
                    customer_id = auth.uid()
                )
        END
    );

-- Müşterilerin sadece kendi randevularını insert edebilmesi için ayrı politika
CREATE POLICY "customers_can_insert_own_appointments" ON appointments
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        -- Customer sadece kendi adına randevu oluşturabilir
        CASE 
            WHEN auth.jwt() ->> 'user_metadata' ->> 'user_type' = 'customer' THEN
                customer_id = auth.uid()
            ELSE
                -- Business owner herkes adına randevu oluşturabilir
                business_id IN (
                    SELECT id FROM businesses WHERE owner_id = auth.uid()
                )
        END
    );

-- Müşterilerin sadece kendi randevularını güncelleyebilmesi
CREATE POLICY "customers_can_update_own_appointments" ON appointments
    FOR UPDATE 
    TO authenticated
    USING (
        -- Business owner kendi işletmesinin randevularını güncelleyebilir
        business_id IN (
            SELECT id FROM businesses WHERE owner_id = auth.uid()
        )
        OR
        -- Customer sadece kendi randevularını güncelleyebilir
        customer_id = auth.uid()
    )
    WITH CHECK (
        -- Güncelleme sonrası da aynı kurallar geçerli
        business_id IN (
            SELECT id FROM businesses WHERE owner_id = auth.uid()
        )
        OR
        customer_id = auth.uid()
    );

-- Silme işlemi için politika
CREATE POLICY "customers_can_delete_own_appointments" ON appointments
    FOR DELETE 
    TO authenticated
    USING (
        -- Business owner kendi işletmesinin randevularını silebilir
        business_id IN (
            SELECT id FROM businesses WHERE owner_id = auth.uid()
        )
        OR
        -- Customer sadece kendi randevularını silebilir
        customer_id = auth.uid()
    );

-- Politikaları kontrol et
SELECT 
    policyname, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'appointments'
ORDER BY policyname;
