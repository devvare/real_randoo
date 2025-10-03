-- ===================================================================
-- FIX CUSTOMER APPOINTMENT VISIBILITY - CRITICAL ISSUES
-- ===================================================================
-- Bu script müşteri tarafında randevu görünürlüğü ile ilgili kritik sorunları çözüyor:
-- 1. İşletme tarafından oluşturulan randevuların müşteri tarafında görünmemesi
-- 2. RLS policy hatalarının düzeltilmesi
-- 3. customer_info JSONB alanı üzerinden müşteri eşleştirmesinin sağlanması

-- 1. APPOINTMENTS TABLE RLS POLICIES - KAPSAMLI DÜZELTME
-- ===================================================================

-- Mevcut tüm appointment policy'lerini kaldır
DROP POLICY IF EXISTS "appointments_insert_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_select_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_update_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_delete_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_business_full_access" ON appointments;
DROP POLICY IF EXISTS "appointments_customer_insert" ON appointments;
DROP POLICY IF EXISTS "appointments_customer_select" ON appointments;
DROP POLICY IF EXISTS "appointments_customer_update" ON appointments;
DROP POLICY IF EXISTS "appointments_customer_own_select" ON appointments;
DROP POLICY IF EXISTS "appointments_customer_info_select" ON appointments;

-- Yeni, kapsamlı RLS policy'leri oluştur

-- İşletme sahipleri kendi randevularını tam olarak yönetebilir
CREATE POLICY "appointments_business_full_access" ON appointments
FOR ALL USING (
  auth.uid() = business_id
);

-- Müşteriler kendi randevularını görebilir (customer_id = auth.uid())
CREATE POLICY "appointments_customer_own_select" ON appointments
FOR SELECT USING (
  auth.uid() = customer_id
);

-- Müşteriler kendileri için oluşturulan randevuları görebilir (customer_info içinde email eşleşmesi)
CREATE POLICY "appointments_customer_info_select" ON appointments
FOR SELECT USING (
  auth.email() = (customer_info->>'email')::text
);

-- Müşteriler kendi randevularını oluşturabilir
CREATE POLICY "appointments_customer_insert" ON appointments
FOR INSERT WITH CHECK (
  auth.uid() = customer_id
);

-- Müşteriler kendi randevularını güncelleyebilir
CREATE POLICY "appointments_customer_update" ON appointments
FOR UPDATE USING (
  auth.uid() = customer_id OR auth.email() = (customer_info->>'email')::text
);

-- 2. BUSINESS_NOTIFICATIONS TABLE RLS POLICIES
-- ===================================================================

-- Mevcut notification policy'lerini kaldır
DROP POLICY IF EXISTS "business_notifications_insert_policy" ON business_notifications;
DROP POLICY IF EXISTS "business_notifications_select_policy" ON business_notifications;
DROP POLICY IF EXISTS "business_notifications_update_policy" ON business_notifications;
DROP POLICY IF EXISTS "business_notifications_delete_policy" ON business_notifications;
DROP POLICY IF EXISTS "business_notifications_business_access" ON business_notifications;
DROP POLICY IF EXISTS "business_notifications_system_insert" ON business_notifications;

-- Yeni notification policy'leri
CREATE POLICY "business_notifications_business_access" ON business_notifications
FOR ALL USING (
  auth.uid() = business_id
);

-- Sistem/trigger'ların bildirim oluşturabilmesi için
CREATE POLICY "business_notifications_system_insert" ON business_notifications
FOR INSERT WITH CHECK (true);

-- 3. BUSINESS_AVAILABLE_SLOTS TABLE RLS POLICIES
-- ===================================================================

-- Mevcut slot policy'lerini kaldır
DROP POLICY IF EXISTS "Business owners can manage their slots" ON business_available_slots;
DROP POLICY IF EXISTS "Everyone can view available slots" ON business_available_slots;
DROP POLICY IF EXISTS "Customers can view available slots" ON business_available_slots;
DROP POLICY IF EXISTS "Customers can update slots for their appointments" ON business_available_slots;
DROP POLICY IF EXISTS "business_available_slots_business_access" ON business_available_slots;
DROP POLICY IF EXISTS "business_available_slots_public_select" ON business_available_slots;
DROP POLICY IF EXISTS "business_available_slots_customer_update" ON business_available_slots;

-- Yeni slot policy'leri
CREATE POLICY "business_available_slots_business_access" ON business_available_slots
FOR ALL USING (
  auth.uid() = business_id
);

CREATE POLICY "business_available_slots_public_select" ON business_available_slots
FOR SELECT USING (true);

-- Müşteriler kendi randevuları için slot güncelleyebilir
CREATE POLICY "business_available_slots_customer_update" ON business_available_slots
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM appointments 
    WHERE appointments.business_id = business_available_slots.business_id
    AND (
      appointments.customer_id = auth.uid() 
      OR auth.email() = (appointments.customer_info->>'email')::text
    )
    AND appointments.appointment_date = business_available_slots.date
    AND appointments.start_time::TIME = business_available_slots.start_time
  )
);

-- 4. APPOINTMENT NOTIFICATION TRIGGER DÜZELTME
-- ===================================================================

-- Mevcut trigger'ı kaldır ve yeniden oluştur
DROP TRIGGER IF EXISTS create_appointment_notification_trigger ON appointments;
DROP FUNCTION IF EXISTS create_appointment_notification() CASCADE;

-- Yeni notification trigger fonksiyonu
CREATE OR REPLACE FUNCTION create_appointment_notification()
RETURNS TRIGGER AS $$
DECLARE
    business_name TEXT;
    customer_name TEXT;
    customer_email TEXT;
    service_name TEXT;
    notification_message TEXT;
BEGIN
    -- Sadece INSERT işleminde bildirim oluştur
    IF TG_OP = 'INSERT' THEN
        -- İşletme adını al
        SELECT businesses.business_name INTO business_name 
        FROM businesses 
        WHERE businesses.id = NEW.business_id;
        
        -- Hizmet adını al
        SELECT services.name INTO service_name 
        FROM services 
        WHERE services.id = NEW.service_id;
        
        -- Müşteri bilgilerini al (customer_info JSONB'den)
        customer_name := COALESCE(NEW.customer_info->>'name', 'Müşteri');
        customer_email := NEW.customer_info->>'email';
        
        -- Bildirim mesajını oluştur
        notification_message := format(
            'Yeni randevu: %s - %s (%s) - %s %s',
            customer_name,
            COALESCE(service_name, 'Hizmet'),
            NEW.start_time || '-' || NEW.end_time,
            TO_CHAR(NEW.appointment_date, 'DD.MM.YYYY'),
            CASE 
                WHEN NEW.status = 'confirmed' THEN '✅ Onaylandı'
                WHEN NEW.status = 'pending' THEN '⏳ Beklemede'
                ELSE '❓ ' || NEW.status
            END
        );
        
        -- Bildirim oluştur
        INSERT INTO business_notifications (
            business_id,
            type,
            title,
            message,
            related_appointment_id,
            is_read,
            created_at
        ) VALUES (
            NEW.business_id,
            'appointment_created',
            'Yeni Randevu',
            notification_message,
            NEW.id,
            false,
            NOW()
        );
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı oluştur
CREATE TRIGGER create_appointment_notification_trigger
    AFTER INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION create_appointment_notification();

-- 5. SLOT SYNC TRIGGER DÜZELTME
-- ===================================================================

-- Mevcut slot sync trigger'ını kaldır ve yeniden oluştur
DROP TRIGGER IF EXISTS sync_appointment_to_slots ON appointments;
DROP FUNCTION IF EXISTS sync_appointment_to_slots() CASCADE;

-- Yeni slot sync fonksiyonu
CREATE OR REPLACE FUNCTION sync_appointment_to_slots()
RETURNS TRIGGER AS $$
BEGIN
    -- INSERT: Randevu oluşturulduğunda slot'u unavailable yap
    IF TG_OP = 'INSERT' THEN
        -- Slot'u güncelle veya oluştur
        INSERT INTO business_available_slots (
            business_id, 
            date, 
            start_time, 
            end_time, 
            is_available,
            created_at,
            updated_at
        ) VALUES (
            NEW.business_id, 
            NEW.appointment_date, 
            NEW.start_time::TIME, 
            NEW.end_time::TIME, 
            false,
            NOW(),
            NOW()
        ) ON CONFLICT (business_id, date, start_time, end_time) 
        DO UPDATE SET 
            is_available = false, 
            updated_at = NOW();
        
        RETURN NEW;
    END IF;
    
    -- DELETE: Randevu silindiğinde slot'u available yap
    IF TG_OP = 'DELETE' THEN
        UPDATE business_available_slots 
        SET is_available = true,
            updated_at = NOW()
        WHERE business_id = OLD.business_id
        AND date = OLD.appointment_date
        AND start_time = OLD.start_time::TIME;
        
        RETURN OLD;
    END IF;
    
    -- UPDATE: Randevu güncellendiğinde slot'ları güncelle
    IF TG_OP = 'UPDATE' THEN
        -- Eski slot'u available yap (eğer tarih/saat değiştiyse)
        IF OLD.appointment_date != NEW.appointment_date OR OLD.start_time != NEW.start_time THEN
            UPDATE business_available_slots 
            SET is_available = true,
                updated_at = NOW()
            WHERE business_id = OLD.business_id
            AND date = OLD.appointment_date
            AND start_time = OLD.start_time::TIME;
            
            -- Yeni slot'u unavailable yap
            INSERT INTO business_available_slots (
                business_id, 
                date, 
                start_time, 
                end_time, 
                is_available,
                created_at,
                updated_at
            ) VALUES (
                NEW.business_id, 
                NEW.appointment_date, 
                NEW.start_time::TIME, 
                NEW.end_time::TIME, 
                false,
                NOW(),
                NOW()
            ) ON CONFLICT (business_id, date, start_time, end_time) 
            DO UPDATE SET 
                is_available = false, 
                updated_at = NOW();
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı oluştur
CREATE TRIGGER sync_appointment_to_slots
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION sync_appointment_to_slots();

-- 6. TEST QUERIES - DOĞRULAMA
-- ===================================================================

-- Test 1: Müşteri kendi randevularını görebiliyor mu?
-- SELECT * FROM appointments WHERE customer_id = auth.uid();

-- Test 2: Müşteri kendisi için oluşturulan randevuları görebiliyor mu?
-- SELECT * FROM appointments WHERE customer_info->>'email' = auth.email();

-- Test 3: İşletme kendi randevularını görebiliyor mu?
-- SELECT * FROM appointments WHERE business_id = auth.uid();

-- Test 4: Bildirimler oluşuyor mu?
-- SELECT * FROM business_notifications ORDER BY created_at DESC LIMIT 5;

-- 7. GRANT PERMISSIONS
-- ===================================================================

-- Authenticated kullanıcılar için gerekli izinler
GRANT SELECT, INSERT, UPDATE ON appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON business_notifications TO authenticated;
GRANT SELECT, UPDATE ON business_available_slots TO authenticated;

-- RLS'i etkinleştir (eğer devre dışıysa)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_available_slots ENABLE ROW LEVEL SECURITY;

-- 8. DEBUGGING - MEVCUT DURUMU KONTROL ET
-- ===================================================================

DO $$
BEGIN
    RAISE NOTICE '=== APPOINTMENT VISIBILITY FIX COMPLETED ===';
    RAISE NOTICE 'RLS Policies updated for appointments, business_notifications, business_available_slots';
    RAISE NOTICE 'Notification trigger recreated';
    RAISE NOTICE 'Slot sync trigger recreated';
    RAISE NOTICE 'Customer can now see appointments created by business via customer_info email matching';
    RAISE NOTICE '=== NEXT STEPS ===';
    RAISE NOTICE '1. Test customer calendar to see business-created appointments';
    RAISE NOTICE '2. Test appointment creation from both business and customer sides';
    RAISE NOTICE '3. Verify notifications are being created';
    RAISE NOTICE '4. Check slot availability updates';
END $$;
