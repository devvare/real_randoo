-- Müşteri Yönetim Sistemi için Database Güncellemeleri

-- 1. Users tablosuna müşteri bilgileri için ek alanlar
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- 2. İşletme-Müşteri ilişki tablosu (işletmenin eklediği müşteriler)
CREATE TABLE IF NOT EXISTS business_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    customer_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_contact_date TIMESTAMP WITH TIME ZONE,
    total_appointments INTEGER DEFAULT 0,
    cancelled_appointments INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, customer_id)
);

-- 3. Müşteri iletişim geçmişi tablosu
CREATE TABLE IF NOT EXISTS customer_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    communication_type VARCHAR(20) NOT NULL CHECK (communication_type IN ('sms', 'whatsapp', 'phone', 'email')),
    message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RLS politikaları - business_customers tablosu
ALTER TABLE business_customers ENABLE ROW LEVEL SECURITY;

-- İşletme sahipleri kendi müşterilerini görebilir
CREATE POLICY "business_owners_can_view_their_customers" ON business_customers
    FOR SELECT USING (
        business_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'business'
        )
    );

-- İşletme sahipleri müşteri ekleyebilir
CREATE POLICY "business_owners_can_add_customers" ON business_customers
    FOR INSERT WITH CHECK (
        business_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'business'
        )
    );

-- İşletme sahipleri müşteri bilgilerini güncelleyebilir
CREATE POLICY "business_owners_can_update_their_customers" ON business_customers
    FOR UPDATE USING (
        business_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'business'
        )
    );

-- İşletme sahipleri müşteri silebilir
CREATE POLICY "business_owners_can_delete_their_customers" ON business_customers
    FOR DELETE USING (
        business_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'business'
        )
    );

-- 5. RLS politikaları - customer_communications tablosu
ALTER TABLE customer_communications ENABLE ROW LEVEL SECURITY;

-- İşletme sahipleri kendi iletişim geçmişini görebilir
CREATE POLICY "business_owners_can_view_their_communications" ON customer_communications
    FOR SELECT USING (
        business_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'business'
        )
    );

-- İşletme sahipleri iletişim kaydı ekleyebilir
CREATE POLICY "business_owners_can_add_communications" ON customer_communications
    FOR INSERT WITH CHECK (
        business_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'business'
        )
    );

-- 6. Müşteri istatistikleri güncelleme trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Randevu oluşturulduğunda müşteri istatistiklerini güncelle
    IF TG_OP = 'INSERT' THEN
        INSERT INTO business_customers (business_id, customer_id, total_appointments)
        VALUES (NEW.business_id, NEW.customer_id, 1)
        ON CONFLICT (business_id, customer_id) 
        DO UPDATE SET 
            total_appointments = business_customers.total_appointments + 1,
            last_contact_date = NOW(),
            updated_at = NOW();
        
        RETURN NEW;
    END IF;
    
    -- Randevu iptal edildiğinde iptal sayısını artır
    IF TG_OP = 'UPDATE' AND OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
        UPDATE business_customers 
        SET 
            cancelled_appointments = cancelled_appointments + 1,
            updated_at = NOW()
        WHERE business_id = NEW.business_id AND customer_id = NEW.customer_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Müşteri istatistikleri trigger
DROP TRIGGER IF EXISTS update_customer_stats_trigger ON appointments;
CREATE TRIGGER update_customer_stats_trigger
    AFTER INSERT OR UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_stats();

-- 8. Updated_at trigger fonksiyonu (eğer yoksa)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Updated_at trigger'ları
CREATE TRIGGER update_business_customers_updated_at
    BEFORE UPDATE ON business_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Müşteri grupları için view'lar

-- Tüm müşteriler view
CREATE OR REPLACE VIEW business_all_customers AS
SELECT 
    bc.*,
    u.name,
    u.email,
    u.phone,
    u.birthday,
    u.notes as user_notes,
    CASE 
        WHEN bvc.customer_id IS NOT NULL THEN true 
        ELSE false 
    END as is_vip,
    COALESCE(bc.total_appointments, 0) as appointment_count,
    COALESCE(bc.cancelled_appointments, 0) as cancelled_count
FROM business_customers bc
JOIN users u ON bc.customer_id = u.id
LEFT JOIN business_vip_customers bvc ON bc.business_id = bvc.business_id AND bc.customer_id = bvc.customer_id
WHERE bc.is_active = true;

-- Yeni müşteriler view (son 30 gün)
CREATE OR REPLACE VIEW business_new_customers AS
SELECT * FROM business_all_customers
WHERE added_date >= NOW() - INTERVAL '30 days';

-- Müdavim müşteriler view (son 3 ayda 3+ randevu)
CREATE OR REPLACE VIEW business_regular_customers AS
SELECT * FROM business_all_customers
WHERE total_appointments >= 3 
AND last_contact_date >= NOW() - INTERVAL '3 months';

-- Doğum günü yaklaşan müşteriler view (önümüzdeki 30 gün)
CREATE OR REPLACE VIEW business_birthday_customers AS
SELECT * FROM business_all_customers
WHERE birthday IS NOT NULL
AND (
    (EXTRACT(MONTH FROM birthday) = EXTRACT(MONTH FROM CURRENT_DATE) 
     AND EXTRACT(DAY FROM birthday) >= EXTRACT(DAY FROM CURRENT_DATE))
    OR 
    (EXTRACT(MONTH FROM birthday) = EXTRACT(MONTH FROM CURRENT_DATE + INTERVAL '30 days'))
);

-- Uzaklaşan müşteriler view (son ay randevu yapmayanlar ama daha önce yapmış)
CREATE OR REPLACE VIEW business_distant_customers AS
SELECT * FROM business_all_customers
WHERE total_appointments > 0
AND (last_contact_date IS NULL OR last_contact_date < NOW() - INTERVAL '30 days');

-- Randoo kullanmayan müşteriler view (hiç randevu yapmayanlar)
CREATE OR REPLACE VIEW business_non_users AS
SELECT * FROM business_all_customers
WHERE total_appointments = 0;

-- 11. Test verisi - örnek müşteri ekleme fonksiyonu
CREATE OR REPLACE FUNCTION add_sample_customer(
    p_business_id UUID,
    p_name VARCHAR,
    p_phone VARCHAR,
    p_email VARCHAR DEFAULT NULL,
    p_birthday DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_customer_id UUID;
BEGIN
    -- Yeni müşteri kullanıcısı oluştur
    INSERT INTO users (name, phone, email, birthday, user_type, created_by)
    VALUES (p_name, p_phone, p_email, p_birthday, 'customer', p_business_id)
    RETURNING id INTO new_customer_id;
    
    -- İşletme-müşteri ilişkisi oluştur
    INSERT INTO business_customers (business_id, customer_id)
    VALUES (p_business_id, new_customer_id);
    
    RETURN new_customer_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;
