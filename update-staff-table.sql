-- Staff tablosunu personel yönetimi için güncelle
-- Eksik kolonları ekle

-- 1. Staff tablosuna eksik kolonları ekle
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Staff-Service ilişki tablosu oluştur (many-to-many)
CREATE TABLE IF NOT EXISTS staff_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(staff_id, service_id)
);

-- 3. Staff tablosu için RLS politikaları
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- İşletme sahibi kendi personellerini görebilir
DROP POLICY IF EXISTS "staff_business_owner_select" ON staff;
CREATE POLICY "staff_business_owner_select" ON staff
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM businesses WHERE owner_id = auth.uid()
        )
    );

-- İşletme sahibi kendi personellerini ekleyebilir
DROP POLICY IF EXISTS "staff_business_owner_insert" ON staff;
CREATE POLICY "staff_business_owner_insert" ON staff
    FOR INSERT WITH CHECK (
        business_id IN (
            SELECT id FROM businesses WHERE owner_id = auth.uid()
        )
    );

-- İşletme sahibi kendi personellerini güncelleyebilir
DROP POLICY IF EXISTS "staff_business_owner_update" ON staff;
CREATE POLICY "staff_business_owner_update" ON staff
    FOR UPDATE USING (
        business_id IN (
            SELECT id FROM businesses WHERE owner_id = auth.uid()
        )
    );

-- İşletme sahibi kendi personellerini silebilir
DROP POLICY IF EXISTS "staff_business_owner_delete" ON staff;
CREATE POLICY "staff_business_owner_delete" ON staff
    FOR DELETE USING (
        business_id IN (
            SELECT id FROM businesses WHERE owner_id = auth.uid()
        )
    );

-- Personel kendi bilgilerini görebilir
DROP POLICY IF EXISTS "staff_own_select" ON staff;
CREATE POLICY "staff_own_select" ON staff
    FOR SELECT USING (user_id = auth.uid());

-- Personel kendi bilgilerini güncelleyebilir (sadece bazı alanlar)
DROP POLICY IF EXISTS "staff_own_update" ON staff;
CREATE POLICY "staff_own_update" ON staff
    FOR UPDATE USING (user_id = auth.uid());

-- 4. Staff-Services tablosu için RLS politikaları
ALTER TABLE staff_services ENABLE ROW LEVEL SECURITY;

-- İşletme sahibi kendi personellerinin hizmetlerini yönetebilir
DROP POLICY IF EXISTS "staff_services_business_owner" ON staff_services;
CREATE POLICY "staff_services_business_owner" ON staff_services
    FOR ALL USING (
        staff_id IN (
            SELECT id FROM staff WHERE business_id IN (
                SELECT id FROM businesses WHERE owner_id = auth.uid()
            )
        )
    );

-- Personel kendi hizmetlerini görebilir
DROP POLICY IF EXISTS "staff_services_own_select" ON staff_services;
CREATE POLICY "staff_services_own_select" ON staff_services
    FOR SELECT USING (
        staff_id IN (
            SELECT id FROM staff WHERE user_id = auth.uid()
        )
    );

-- 5. Updated_at trigger'ı ekle
CREATE OR REPLACE FUNCTION update_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_staff_updated_at_trigger ON staff;
CREATE TRIGGER update_staff_updated_at_trigger
    BEFORE UPDATE ON staff
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_updated_at();

-- 6. Staff için view oluştur (hizmetlerle birlikte)
CREATE OR REPLACE VIEW staff_with_services AS
SELECT 
    s.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', srv.id,
                'name', srv.name,
                'duration', srv.duration,
                'price', srv.price
            )
        ) FILTER (WHERE srv.id IS NOT NULL),
        '[]'::json
    ) as services
FROM staff s
LEFT JOIN staff_services ss ON s.id = ss.staff_id
LEFT JOIN services srv ON ss.service_id = srv.id
GROUP BY s.id, s.business_id, s.name, s.email, s.phone, s.position, s.description, s.can_take_appointments, s.avatar, s.user_id, s.is_active, s.created_at, s.updated_at;

-- 7. View için RLS politikaları
ALTER VIEW staff_with_services SET (security_invoker = true);

COMMENT ON TABLE staff IS 'Personel bilgileri tablosu - güncellenmiş';
COMMENT ON TABLE staff_services IS 'Personel-Hizmet ilişki tablosu';
COMMENT ON VIEW staff_with_services IS 'Personel bilgileri ve hizmetleri birlikte gösteren view';
