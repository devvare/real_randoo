-- ===================================================================
-- FIX CRITICAL APPOINTMENT ISSUES
-- ===================================================================
-- Bu script 3 kritik sorunu çözüyor:
-- 1. business_available_slots RLS policy hatası (42501)
-- 2. Müşteri randevularının takvimde görünmemesi
-- 3. Bildirim trigger sorunları

-- 1. business_available_slots RLS policy düzeltmeleri
-- ===================================================================

-- Mevcut policy'leri kaldır
DROP POLICY IF EXISTS "Business owners can manage their slots" ON business_available_slots;
DROP POLICY IF EXISTS "Everyone can view available slots" ON business_available_slots;
DROP POLICY IF EXISTS "Customers can view available slots" ON business_available_slots;

-- Yeni, daha esnek policy'ler oluştur
CREATE POLICY "Business owners can manage their slots" ON business_available_slots
    FOR ALL USING (
        business_id IN (
            SELECT id FROM businesses WHERE id = auth.uid()
        )
    );

CREATE POLICY "Everyone can view available slots" ON business_available_slots
    FOR SELECT USING (true);

-- Müşteriler kendi randevuları için slot güncelleyebilsin
CREATE POLICY "Customers can update slots for their appointments" ON business_available_slots
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE appointments.business_id = business_available_slots.business_id
            AND appointments.customer_id = auth.uid()
            AND appointments.appointment_date = business_available_slots.date
            AND appointments.start_time = business_available_slots.start_time
        )
    );

-- 2. Appointment trigger'ını düzelt
-- ===================================================================

-- Mevcut trigger'ı kaldır
DROP TRIGGER IF EXISTS sync_appointment_to_slots ON appointments;
DROP FUNCTION IF EXISTS sync_appointment_to_slots();

-- Yeni trigger fonksiyonu
CREATE OR REPLACE FUNCTION sync_appointment_to_slots()
RETURNS TRIGGER AS $$
BEGIN
    -- INSERT: Randevu oluşturulduğunda slot'u unavailable yap
    IF TG_OP = 'INSERT' THEN
        UPDATE business_available_slots 
        SET is_available = false,
            updated_at = now()
        WHERE business_id = NEW.business_id
        AND date = NEW.appointment_date
        AND start_time = NEW.start_time::TIME;
        
        -- Eğer slot yoksa oluştur
        IF NOT FOUND THEN
            INSERT INTO business_available_slots (
                business_id, date, start_time, end_time, is_available
            ) VALUES (
                NEW.business_id, 
                NEW.appointment_date, 
                NEW.start_time::TIME, 
                NEW.end_time::TIME, 
                false
            ) ON CONFLICT (business_id, date, start_time, end_time) 
            DO UPDATE SET is_available = false, updated_at = now();
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- DELETE: Randevu silindiğinde slot'u available yap
    IF TG_OP = 'DELETE' THEN
        UPDATE business_available_slots 
        SET is_available = true,
            updated_at = now()
        WHERE business_id = OLD.business_id
        AND date = OLD.appointment_date
        AND start_time = OLD.start_time::TIME;
        
        RETURN OLD;
    END IF;
    
    -- UPDATE: Randevu güncellendiğinde eski slot'u available, yeni slot'u unavailable yap
    IF TG_OP = 'UPDATE' THEN
        -- Eski slot'u available yap
        UPDATE business_available_slots 
        SET is_available = true,
            updated_at = now()
        WHERE business_id = OLD.business_id
        AND date = OLD.appointment_date
        AND start_time = OLD.start_time::TIME;
        
        -- Yeni slot'u unavailable yap
        UPDATE business_available_slots 
        SET is_available = false,
            updated_at = now()
        WHERE business_id = NEW.business_id
        AND date = NEW.appointment_date
        AND start_time = NEW.start_time::TIME;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı oluştur
CREATE TRIGGER sync_appointment_to_slots
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION sync_appointment_to_slots();

-- 3. Notification trigger'ını düzelt
-- ===================================================================

-- Mevcut trigger'ı kontrol et ve düzelt
DROP TRIGGER IF EXISTS create_appointment_notification ON appointments;
DROP TRIGGER IF EXISTS appointment_notification_trigger ON appointments;
DROP FUNCTION IF EXISTS create_appointment_notification() CASCADE;

CREATE OR REPLACE FUNCTION create_appointment_notification()
RETURNS TRIGGER AS $$
DECLARE
    business_name TEXT;
    service_name TEXT;
    customer_name TEXT;
    notification_message TEXT;
BEGIN
    -- Sadece INSERT işleminde bildirim oluştur
    IF TG_OP = 'INSERT' THEN
        -- İşletme adını al
        SELECT business_name INTO business_name 
        FROM businesses 
        WHERE id = NEW.business_id;
        
        -- Hizmet adını al
        SELECT name INTO service_name 
        FROM business_services 
        WHERE id = NEW.service_id;
        
        -- Müşteri adını al (yeni mimariye göre)
        IF NEW.customer_info IS NOT NULL THEN
            customer_name := NEW.customer_info->>'name';
        ELSE
            SELECT name INTO customer_name 
            FROM users 
            WHERE id = NEW.customer_id;
        END IF;
        
        -- Bildirim mesajını oluştur
        notification_message := customer_name || ' tarafından ' || 
                               TO_CHAR(NEW.appointment_date, 'DD.MM.YYYY') || 
                               ' tarihinde saat ' || NEW.start_time || 
                               ' için ' || service_name || ' randevusu alındı.';
        
        -- Bildirim kaydet
        INSERT INTO business_notifications (
            business_id,
            type,
            title,
            message,
            related_appointment_id,
            created_at
        ) VALUES (
            NEW.business_id,
            'new_appointment',
            'Yeni Randevu',
            notification_message,
            NEW.id,
            now()
        );
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı oluştur
CREATE TRIGGER create_appointment_notification
    AFTER INSERT ON appointments
    FOR EACH ROW EXECUTE FUNCTION create_appointment_notification();

-- 4. Grant permissions
-- ===================================================================

GRANT ALL ON business_available_slots TO authenticated, anon;
GRANT ALL ON business_notifications TO authenticated, anon;
GRANT ALL ON appointments TO authenticated, anon;

-- 5. Test verisi ekle (GAGA için slot'lar oluştur)
-- ===================================================================

DO $$
DECLARE
    gaga_business_id UUID;
    slot_date DATE;
    slot_time TIME;
    slot_end TIME;
BEGIN
    -- GAGA business ID'sini al
    SELECT id INTO gaga_business_id 
    FROM businesses 
    WHERE business_name = 'GAGA'
    LIMIT 1;
    
    IF gaga_business_id IS NOT NULL THEN
        -- Önümüzdeki 30 gün için slot'lar oluştur
        FOR i IN 0..29 LOOP
            slot_date := CURRENT_DATE + i;
            
            -- Her gün 09:00-18:00 arası 15'er dakikalık slot'lar
            slot_time := '09:00'::TIME;
            WHILE slot_time < '18:00'::TIME LOOP
                slot_end := slot_time + INTERVAL '15 minutes';
                
                INSERT INTO business_available_slots (
                    business_id, date, start_time, end_time, is_available
                ) VALUES (
                    gaga_business_id, slot_date, slot_time, slot_end, true
                ) ON CONFLICT (business_id, date, start_time, end_time) 
                DO NOTHING;
                
                slot_time := slot_time + INTERVAL '15 minutes';
            END LOOP;
        END LOOP;
        
        RAISE NOTICE 'GAGA için slot''lar oluşturuldu: %', gaga_business_id;
    ELSE
        RAISE NOTICE 'GAGA işletmesi bulunamadı!';
    END IF;
    
    -- 6. Mevcut randevuları slot'lara senkronize et
    UPDATE business_available_slots 
    SET is_available = false,
        updated_at = now()
    WHERE (business_id, date, start_time) IN (
        SELECT 
            business_id, 
            appointment_date, 
            start_time::TIME
        FROM appointments 
        WHERE status IN ('confirmed', 'pending')
        AND appointment_date >= CURRENT_DATE
    );
    
    RAISE NOTICE 'Kritik appointment sorunları düzeltildi!';
END;
$$;
