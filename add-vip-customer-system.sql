-- VIP Müşteri Sistemi için Database Güncellemeleri

-- 1. Users tablosuna VIP alanı ekle
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;

-- 2. Business-Customer VIP ilişkisi için tablo oluştur
CREATE TABLE IF NOT EXISTS business_vip_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vip_since TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    vip_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, customer_id)
);

-- 3. VIP müşteri tablosu için RLS politikaları
ALTER TABLE business_vip_customers ENABLE ROW LEVEL SECURITY;

-- İşletme sahipleri kendi VIP müşterilerini görebilir
CREATE POLICY "business_owners_can_view_their_vip_customers" ON business_vip_customers
    FOR SELECT USING (
        business_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'business'
        )
    );

-- İşletme sahipleri VIP müşteri ekleyebilir
CREATE POLICY "business_owners_can_add_vip_customers" ON business_vip_customers
    FOR INSERT WITH CHECK (
        business_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'business'
        )
    );

-- İşletme sahipleri VIP müşteri güncelleyebilir
CREATE POLICY "business_owners_can_update_their_vip_customers" ON business_vip_customers
    FOR UPDATE USING (
        business_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'business'
        )
    );

-- İşletme sahipleri VIP müşteri silebilir
CREATE POLICY "business_owners_can_delete_their_vip_customers" ON business_vip_customers
    FOR DELETE USING (
        business_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'business'
        )
    );

-- 4. Appointments tablosuna VIP öncelik alanı ekle
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS is_vip_appointment BOOLEAN DEFAULT FALSE;

-- 5. VIP müşteri trigger fonksiyonu
CREATE OR REPLACE FUNCTION check_vip_appointment()
RETURNS TRIGGER AS $$
BEGIN
    -- Randevu oluşturulurken müşterinin VIP olup olmadığını kontrol et
    IF EXISTS (
        SELECT 1 FROM business_vip_customers 
        WHERE business_id = NEW.business_id 
        AND customer_id = NEW.customer_id
    ) THEN
        NEW.is_vip_appointment = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. VIP kontrolü için trigger
DROP TRIGGER IF EXISTS set_vip_appointment_trigger ON appointments;
CREATE TRIGGER set_vip_appointment_trigger
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION check_vip_appointment();

-- 7. Updated_at trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. VIP müşteri tablosu için updated_at trigger
CREATE TRIGGER update_business_vip_customers_updated_at
    BEFORE UPDATE ON business_vip_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Test verisi - GAGA işletmesi için örnek VIP müşteri
-- (Sadece test amaçlı, gerçek kullanımda UI'dan eklenecek)
/*
INSERT INTO business_vip_customers (business_id, customer_id, vip_notes)
SELECT 
    b.id as business_id,
    c.id as customer_id,
    'Sadık müşteri - özel indirim'
FROM users b, users c
WHERE b.email = 'devvare88@gmail.com' 
AND b.user_type = 'business'
AND c.user_type = 'customer'
AND c.email = 'test@example.com'
ON CONFLICT (business_id, customer_id) DO NOTHING;
*/

COMMIT;
