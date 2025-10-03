-- VIP Müşteri Sistemi Mimari Düzeltmeleri

-- 1. Mevcut business_vip_customers tablosunu yeniden yapılandır
-- Önce mevcut tabloyu yedekle ve sil
DROP TABLE IF EXISTS business_vip_customers CASCADE;

-- 2. Yeni business_vip_customers tablosunu business_customers ile ilişkilendir
CREATE TABLE business_vip_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES business_customers(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, customer_id)
);

-- 3. RLS politikaları - business_vip_customers tablosu
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

-- İşletme sahipleri kendi VIP müşterilerini güncelleyebilir
CREATE POLICY "business_owners_can_update_their_vip_customers" ON business_vip_customers
    FOR UPDATE USING (
        business_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'business'
        )
    );

-- İşletme sahipleri kendi VIP müşterilerini silebilir
CREATE POLICY "business_owners_can_delete_their_vip_customers" ON business_vip_customers
    FOR DELETE USING (
        business_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'business'
        )
    );

-- 4. business_all_customers view'ını güncelle - VIP durumunu doğru şekilde göster
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

-- 5. Diğer view'ları da güncelle
CREATE OR REPLACE VIEW business_new_customers AS
SELECT * FROM business_all_customers
WHERE added_date >= NOW() - INTERVAL '30 days';

CREATE OR REPLACE VIEW business_regular_customers AS
SELECT * FROM business_all_customers
WHERE total_appointments >= 5;

CREATE OR REPLACE VIEW business_birthday_customers AS
SELECT * FROM business_all_customers
WHERE birthday IS NOT NULL 
AND EXTRACT(DOY FROM birthday) BETWEEN 
    EXTRACT(DOY FROM CURRENT_DATE) AND 
    EXTRACT(DOY FROM CURRENT_DATE + INTERVAL '30 days');

CREATE OR REPLACE VIEW business_distant_customers AS
SELECT * FROM business_all_customers
WHERE last_contact_date IS NULL 
OR last_contact_date < NOW() - INTERVAL '60 days';

CREATE OR REPLACE VIEW business_non_users AS
SELECT * FROM business_all_customers
WHERE phone IS NOT NULL;

-- 6. VIP müşteri yönetimi için fonksiyonlar
CREATE OR REPLACE FUNCTION add_vip_customer(p_business_id UUID, p_customer_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO business_vip_customers (business_id, customer_id, notes)
    VALUES (p_business_id, p_customer_id, p_notes)
    ON CONFLICT (business_id, customer_id) DO UPDATE SET
        notes = EXCLUDED.notes,
        updated_at = NOW();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_vip_customer(p_business_id UUID, p_customer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM business_vip_customers 
    WHERE business_id = p_business_id AND customer_id = p_customer_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_customer_vip(p_business_id UUID, p_customer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM business_vip_customers 
        WHERE business_id = p_business_id AND customer_id = p_customer_id
    );
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger - updated_at alanını güncelle
CREATE OR REPLACE FUNCTION update_vip_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_business_vip_customers_updated_at ON business_vip_customers;
CREATE TRIGGER update_business_vip_customers_updated_at
    BEFORE UPDATE ON business_vip_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_vip_updated_at_column();

-- 8. İndeksler
CREATE INDEX IF NOT EXISTS idx_business_vip_customers_business_id ON business_vip_customers(business_id);
CREATE INDEX IF NOT EXISTS idx_business_vip_customers_customer_id ON business_vip_customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_business_vip_customers_unique ON business_vip_customers(business_id, customer_id);
