-- İşletme hizmetleri ve çalışma saatleri için RLS politikalarını düzelt

-- 1. Services tablosu için RLS politikaları
DROP POLICY IF EXISTS "Business owners can manage their services" ON services;
DROP POLICY IF EXISTS "Everyone can view active services" ON services;

-- İşletme sahipleri kendi hizmetlerini yönetebilir
CREATE POLICY "Business owners can manage their services" ON services
    FOR ALL USING (
        business_id = auth.uid() OR 
        business_id IN (
            SELECT id FROM businesses WHERE id = auth.uid()
        )
    );

-- Herkes aktif hizmetleri görebilir
CREATE POLICY "Everyone can view active services" ON services
    FOR SELECT USING (is_active = true);

-- 2. Working Hours tablosu için RLS politikaları
DROP POLICY IF EXISTS "Business owners can manage their working hours" ON working_hours;
DROP POLICY IF EXISTS "Everyone can view working hours" ON working_hours;

-- İşletme sahipleri kendi çalışma saatlerini yönetebilir
CREATE POLICY "Business owners can manage their working hours" ON working_hours
    FOR ALL USING (
        business_id = auth.uid() OR 
        business_id IN (
            SELECT id FROM businesses WHERE id = auth.uid()
        )
    );

-- Herkes çalışma saatlerini görebilir
CREATE POLICY "Everyone can view working hours" ON working_hours
    FOR SELECT USING (true);

-- 3. Businesses tablosu için güncellenmiş RLS politikaları
DROP POLICY IF EXISTS "Business owners can update their profile" ON businesses;
DROP POLICY IF EXISTS "Everyone can view businesses" ON businesses;

-- İşletme sahipleri kendi profillerini güncelleyebilir
CREATE POLICY "Business owners can update their profile" ON businesses
    FOR ALL USING (id = auth.uid());

-- Herkes işletmeleri görebilir
CREATE POLICY "Everyone can view businesses" ON businesses
    FOR SELECT USING (true);

-- 4. Grant permissions
GRANT ALL ON public.services TO authenticated, anon;
GRANT ALL ON public.working_hours TO authenticated, anon;
GRANT ALL ON public.businesses TO authenticated, anon;

-- 5. GAGA işletmesi için örnek hizmetler ekle (eğer henüz yoksa)
-- Önce GAGA'nın ID'sini bul ve hizmetlerini ekle
DO $$
DECLARE
    gaga_business_id UUID;
BEGIN
    -- GAGA işletmesinin ID'sini bul
    SELECT id INTO gaga_business_id 
    FROM businesses 
    WHERE business_name ILIKE '%GAGA%' 
    LIMIT 1;
    
    -- Eğer GAGA bulunduysa, hizmetlerini ekle
    IF gaga_business_id IS NOT NULL THEN
        -- Önce mevcut örnek hizmetleri sil
        DELETE FROM services WHERE business_id = gaga_business_id;
        
        -- GAGA'ya özel hizmetler ekle
        INSERT INTO services (business_id, name, duration, price, description, is_active, created_at)
        VALUES 
            (gaga_business_id, 'Erkek Saç Kesimi', 30, 200, 'Profesyonel erkek saç kesimi ve şekillendirme', true, NOW()),
            (gaga_business_id, 'Sakal Tıraşı', 20, 100, 'Geleneksel ustura ile sakal tıraşı', true, NOW()),
            (gaga_business_id, 'Saç + Sakal Kombo', 45, 250, 'Saç kesimi ve sakal tıraşı bir arada', true, NOW()),
            (gaga_business_id, 'Saç Yıkama', 15, 50, 'Şampuan ve saç bakımı', true, NOW()),
            (gaga_business_id, 'Kaş Düzeltme', 10, 30, 'Erkek kaş düzeltme ve şekillendirme', true, NOW()),
            (gaga_business_id, 'Saç Boyama', 60, 300, 'Profesyonel saç boyama hizmeti', true, NOW());
        
        -- GAGA için çalışma saatlerini güncelle
        DELETE FROM working_hours WHERE business_id = gaga_business_id;
        
        INSERT INTO working_hours (business_id, day_of_week, is_open, open_time, close_time, created_at)
        VALUES 
            (gaga_business_id, 0, false, null, null, NOW()), -- Pazar kapalı
            (gaga_business_id, 1, true, '09:00'::time, '19:00'::time, NOW()), -- Pazartesi
            (gaga_business_id, 2, true, '09:00'::time, '19:00'::time, NOW()), -- Salı
            (gaga_business_id, 3, true, '09:00'::time, '19:00'::time, NOW()), -- Çarşamba
            (gaga_business_id, 4, true, '09:00'::time, '19:00'::time, NOW()), -- Perşembe
            (gaga_business_id, 5, true, '09:00'::time, '19:00'::time, NOW()), -- Cuma
            (gaga_business_id, 6, true, '10:00'::time, '18:00'::time, NOW()); -- Cumartesi
            
        RAISE NOTICE 'GAGA işletmesi için hizmetler ve çalışma saatleri güncellendi: %', gaga_business_id;
    ELSE
        RAISE NOTICE 'GAGA işletmesi bulunamadı';
    END IF;
END $$;

-- 6. İşletme tarafındaki form submission'ları için trigger oluştur
-- Bu trigger işletme panelinden hizmet eklendiğinde çalışacak
CREATE OR REPLACE FUNCTION handle_business_service_submission()
RETURNS trigger AS $$
BEGIN
    -- Yeni hizmet eklendiğinde log tut
    RAISE NOTICE 'Yeni hizmet eklendi: % için %', NEW.business_id, NEW.name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı services tablosuna bağla
DROP TRIGGER IF EXISTS on_service_created ON services;
CREATE TRIGGER on_service_created
    AFTER INSERT ON services
    FOR EACH ROW
    EXECUTE FUNCTION handle_business_service_submission();

-- 7. Çalışma saatleri için de benzer trigger
CREATE OR REPLACE FUNCTION handle_business_hours_submission()
RETURNS trigger AS $$
BEGIN
    RAISE NOTICE 'Çalışma saatleri güncellendi: % için gün %', NEW.business_id, NEW.day_of_week;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_working_hours_updated ON working_hours;
CREATE TRIGGER on_working_hours_updated
    AFTER INSERT OR UPDATE ON working_hours
    FOR EACH ROW
    EXECUTE FUNCTION handle_business_hours_submission();
