-- Müşteri Yönetim Sistemi için Database Tabloları

-- 1. İşletme-Müşteri ilişki tablosu (işletmenin eklediği müşteriler)
-- Bu tablo işletmenin kendi müşteri listesini tutar
CREATE TABLE IF NOT EXISTS business_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    customer_birthday DATE,
    customer_notes TEXT,
    is_vip BOOLEAN DEFAULT FALSE,
    added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_contact_date TIMESTAMP WITH TIME ZONE,
    total_appointments INTEGER DEFAULT 0,
    cancelled_appointments INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, customer_phone)
);

-- 2. Müşteri iletişim geçmişi tablosu
CREATE TABLE IF NOT EXISTS customer_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES business_customers(id) ON DELETE CASCADE,
    communication_type VARCHAR(20) NOT NULL CHECK (communication_type IN ('sms', 'whatsapp', 'phone', 'email')),
    message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS politikaları - business_customers tablosu
ALTER TABLE business_customers ENABLE ROW LEVEL SECURITY;

-- İşletme sahipleri kendi müşterilerini görebilir
DROP POLICY IF EXISTS "business_owners_can_view_their_customers" ON business_customers;
CREATE POLICY "business_owners_can_view_their_customers" ON business_customers
    FOR SELECT USING (
        business_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'business'
        )
    );

-- İşletme sahipleri müşteri ekleyebilir
DROP POLICY IF EXISTS "business_owners_can_insert_customers" ON business_customers;
CREATE POLICY "business_owners_can_insert_customers" ON business_customers
    FOR INSERT WITH CHECK (
        business_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'business'
        )
    );

-- İşletme sahipleri kendi müşterilerini güncelleyebilir
DROP POLICY IF EXISTS "business_owners_can_update_their_customers" ON business_customers;
CREATE POLICY "business_owners_can_update_their_customers" ON business_customers
    FOR UPDATE USING (
        business_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'business'
        )
    );

-- İşletme sahipleri kendi müşterilerini silebilir
DROP POLICY IF EXISTS "business_owners_can_delete_their_customers" ON business_customers;
CREATE POLICY "business_owners_can_delete_their_customers" ON business_customers
    FOR DELETE USING (
        business_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'business'
        )
    );

-- 4. RLS politikaları - customer_communications tablosu
ALTER TABLE customer_communications ENABLE ROW LEVEL SECURITY;

-- İşletme sahipleri kendi müşteri iletişimlerini görebilir
DROP POLICY IF EXISTS "business_owners_can_view_customer_communications" ON customer_communications;
CREATE POLICY "business_owners_can_view_customer_communications" ON customer_communications
    FOR SELECT USING (
        business_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'business'
        )
    );

-- İşletme sahipleri müşteri iletişimi ekleyebilir
DROP POLICY IF EXISTS "business_owners_can_insert_customer_communications" ON customer_communications;
CREATE POLICY "business_owners_can_insert_customer_communications" ON customer_communications
    FOR INSERT WITH CHECK (
        business_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'business'
        )
    );

-- 5. Müşteri grupları için view'lar
-- Tüm müşteriler
CREATE OR REPLACE VIEW business_all_customers AS
SELECT 
    bc.id,
    bc.business_id,
    bc.customer_name as name,
    bc.customer_phone as phone,
    bc.customer_email as email,
    bc.customer_birthday as birthday,
    bc.added_date,
    bc.last_contact_date,
    bc.total_appointments,
    bc.cancelled_appointments,
    bc.customer_notes,
    COALESCE(bvc.customer_id IS NOT NULL, false) as is_vip
FROM business_customers bc
LEFT JOIN business_vip_customers bvc ON bc.id = bvc.customer_id AND bc.business_id = bvc.business_id
WHERE bc.is_active = true;

-- Yeni müşteriler (son 30 gün)
CREATE OR REPLACE VIEW business_new_customers AS
SELECT * FROM business_all_customers
WHERE added_date >= NOW() - INTERVAL '30 days';

-- Müdavim müşteriler (5+ randevu)
CREATE OR REPLACE VIEW business_regular_customers AS
SELECT * FROM business_all_customers
WHERE total_appointments >= 5;

-- Doğum günü yaklaşan müşteriler (30 gün içinde)
CREATE OR REPLACE VIEW business_birthday_customers AS
SELECT * FROM business_all_customers
WHERE birthday IS NOT NULL 
AND EXTRACT(DOY FROM birthday) BETWEEN 
    EXTRACT(DOY FROM CURRENT_DATE) AND 
    EXTRACT(DOY FROM CURRENT_DATE + INTERVAL '30 days');

-- Uzaklaşan müşteriler (60+ gün iletişim yok)
CREATE OR REPLACE VIEW business_distant_customers AS
SELECT * FROM business_all_customers
WHERE last_contact_date IS NULL 
OR last_contact_date < NOW() - INTERVAL '60 days';

-- Randoo kullanmayan müşteriler (sadece telefon numarası var, user_id yok)
CREATE OR REPLACE VIEW business_non_users AS
SELECT * FROM business_all_customers
WHERE phone IS NOT NULL;

-- 6. Trigger fonksiyonu - updated_at alanını güncelle
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger oluştur
DROP TRIGGER IF EXISTS update_business_customers_updated_at ON business_customers;
CREATE TRIGGER update_business_customers_updated_at
    BEFORE UPDATE ON business_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Örnek müşteri ekleme fonksiyonu
CREATE OR REPLACE FUNCTION add_sample_customers(business_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO business_customers (
        business_id, 
        customer_name, 
        customer_phone, 
        customer_email,
        customer_birthday,
        customer_notes,
        total_appointments,
        cancelled_appointments,
        last_contact_date
    ) VALUES 
    (business_user_id, 'Ayşe Kaya', '+90 555 123 45 67', 'ayse@example.com', '1990-05-15', 'Düzenli müşteri', 12, 1, NOW() - INTERVAL '2 days'),
    (business_user_id, 'Mehmet Yılmaz', '+90 555 234 56 78', 'mehmet@example.com', '1985-08-22', 'Yeni müşteri', 5, 0, NOW() - INTERVAL '1 week'),
    (business_user_id, 'Fatma Demir', '+90 555 345 67 89', 'fatma@example.com', '1992-12-10', 'Müdavim müşteri', 8, 2, NOW() - INTERVAL '3 days'),
    (business_user_id, 'Ali Özkan', '+90 555 456 78 90', 'ali@example.com', '1988-03-18', 'VIP müşteri', 15, 0, NOW() - INTERVAL '1 day'),
    (business_user_id, 'Zeynep Acar', '+90 555 567 89 01', 'zeynep@example.com', '1995-07-25', 'Uzaklaşan müşteri', 3, 1, NOW() - INTERVAL '70 days')
    ON CONFLICT (business_id, customer_phone) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 8. İndeksler
CREATE INDEX IF NOT EXISTS idx_business_customers_business_id ON business_customers(business_id);
CREATE INDEX IF NOT EXISTS idx_business_customers_phone ON business_customers(customer_phone);
CREATE INDEX IF NOT EXISTS idx_business_customers_added_date ON business_customers(added_date);
CREATE INDEX IF NOT EXISTS idx_business_customers_last_contact ON business_customers(last_contact_date);
CREATE INDEX IF NOT EXISTS idx_customer_communications_business_id ON customer_communications(business_id);
CREATE INDEX IF NOT EXISTS idx_customer_communications_customer_id ON customer_communications(customer_id);
