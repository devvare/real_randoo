-- VIP Müşteri Tablosu Düzeltmeleri

-- 1. business_vip_customers tablosuna notes kolonu ekle
ALTER TABLE business_vip_customers 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. VIP müşteri ekleme sayfası için view güncelle
-- business_customers tablosundan müşteri listesi çekmek için
CREATE OR REPLACE VIEW available_customers_for_vip AS
SELECT 
    bc.id,
    bc.customer_name as name,
    bc.customer_phone as phone,
    bc.customer_email as email,
    bc.business_id,
    CASE WHEN bvc.customer_id IS NOT NULL THEN true ELSE false END as is_already_vip
FROM business_customers bc
LEFT JOIN business_vip_customers bvc ON bc.id = bvc.customer_id AND bc.business_id = bvc.business_id
WHERE bc.is_active = true;

-- 3. Müşteri profil sayfası için VIP durumu kontrolü
CREATE OR REPLACE FUNCTION is_customer_vip(p_business_id UUID, p_customer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM business_vip_customers 
        WHERE business_id = p_business_id AND customer_id = p_customer_id
    );
END;
$$ LANGUAGE plpgsql;

-- 4. VIP müşteri ekleme fonksiyonu
CREATE OR REPLACE FUNCTION add_vip_customer(p_business_id UUID, p_customer_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO business_vip_customers (business_id, customer_id, notes)
    VALUES (p_business_id, p_customer_id, p_notes)
    ON CONFLICT (business_id, customer_id) DO NOTHING;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 5. VIP müşteri kaldırma fonksiyonu
CREATE OR REPLACE FUNCTION remove_vip_customer(p_business_id UUID, p_customer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM business_vip_customers 
    WHERE business_id = p_business_id AND customer_id = p_customer_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
