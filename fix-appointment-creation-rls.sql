-- ===================================================================
-- FIX APPOINTMENT CREATION RLS ISSUES - COMPREHENSIVE SOLUTION
-- ===================================================================
-- Bu script appointment creation sırasında karşılaşılan RLS policy hatalarını çözüyor
-- Hata: "new row violates row-level security policy for table business_available_slots"
-- 
-- ROOT CAUSE: sync_appointment_to_slots() trigger fonksiyonu müşteri adına 
-- business_available_slots tablosuna INSERT yapmaya çalışıyor ama RLS policy izin vermiyor
--
-- SOLUTION: Trigger fonksiyonunu SECURITY DEFINER yaparak admin yetkisiyle çalıştır
-- ve RLS policy'lerini düzelt

-- 1. Önce trigger fonksiyonunu SECURITY DEFINER olarak güncelle
-- ===================================================================

CREATE OR REPLACE FUNCTION sync_appointment_to_slots()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER  -- Bu fonksiyon admin yetkisiyle çalışacak
SET search_path = public
AS $$
BEGIN
    -- INSERT: Randevu oluşturulduğunda slot'u unavailable yap
    IF TG_OP = 'INSERT' THEN
        -- Slot'u güncelle veya oluştur (admin yetkisiyle)
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
$$;

-- Trigger'ı yeniden oluştur
DROP TRIGGER IF EXISTS sync_appointment_to_slots_trigger ON appointments;
CREATE TRIGGER sync_appointment_to_slots_trigger
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION sync_appointment_to_slots();

-- 2. business_available_slots tablosundaki RLS policy'lerini düzelt
-- ===================================================================

-- Mevcut policy'leri temizle
DROP POLICY IF EXISTS "Business owners can manage their slots" ON business_available_slots;
DROP POLICY IF EXISTS "Everyone can view available slots" ON business_available_slots;
DROP POLICY IF EXISTS "Customers can view available slots" ON business_available_slots;
DROP POLICY IF EXISTS "Customers can update slots for their appointments" ON business_available_slots;
DROP POLICY IF EXISTS "business_available_slots_business_access" ON business_available_slots;
DROP POLICY IF EXISTS "business_available_slots_public_select" ON business_available_slots;
DROP POLICY IF EXISTS "business_available_slots_customer_update" ON business_available_slots;
DROP POLICY IF EXISTS "business_owners_manage_slots" ON business_available_slots;
DROP POLICY IF EXISTS "customers_view_available_slots" ON business_available_slots;
DROP POLICY IF EXISTS "business_available_slots_owner_access" ON business_available_slots;
DROP POLICY IF EXISTS "business_available_slots_public_view" ON business_available_slots;
DROP POLICY IF EXISTS "business_available_slots_customer_booking" ON business_available_slots;
DROP POLICY IF EXISTS "business_available_slots_staff_access" ON business_available_slots;

-- Yeni, daha esnek policy'ler oluştur

-- 1. Business owners kendi slot'larını yönetebilir (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "business_available_slots_owner_access" ON business_available_slots
FOR ALL 
USING (
    business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
)
WITH CHECK (
    business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
);

-- 2. Herkes available slot'ları görebilir (SELECT)
CREATE POLICY "business_available_slots_public_view" ON business_available_slots
FOR SELECT 
USING (true);

-- 3. Müşteriler kendi randevuları için slot'ları güncelleyebilir (UPDATE)
CREATE POLICY "business_available_slots_customer_booking" ON business_available_slots
FOR UPDATE 
USING (
    -- Müşteri kendi randevusu için slot güncelleyebilir
    EXISTS (
        SELECT 1 FROM appointments 
        WHERE appointments.customer_id = auth.uid()
        AND appointments.business_id = business_available_slots.business_id
        AND appointments.appointment_date = business_available_slots.date
        AND appointments.start_time::TIME = business_available_slots.start_time
    )
    OR
    -- Veya slot henüz boşsa ve müşteri randevu oluşturuyorsa
    (is_available = true)
)
WITH CHECK (
    -- Aynı koşullar
    EXISTS (
        SELECT 1 FROM appointments 
        WHERE appointments.customer_id = auth.uid()
        AND appointments.business_id = business_available_slots.business_id
        AND appointments.appointment_date = business_available_slots.date
        AND appointments.start_time::TIME = business_available_slots.start_time
    )
    OR
    (is_available = true)
);

-- 4. Staff kendi işletmelerinin slot'larını yönetebilir
CREATE POLICY "business_available_slots_staff_access" ON business_available_slots
FOR ALL
USING (
    business_id IN (
        SELECT business_id FROM staff 
        WHERE user_id = auth.uid() 
        AND status = 'active'
    )
)
WITH CHECK (
    business_id IN (
        SELECT business_id FROM staff 
        WHERE user_id = auth.uid() 
        AND status = 'active'
    )
);

-- 2. appointments tablosundaki RLS policy'lerini kontrol et
-- ===================================================================

-- Mevcut appointment policy'lerini temizle
DROP POLICY IF EXISTS "appointments_business_access" ON appointments;
DROP POLICY IF EXISTS "appointments_customer_access" ON appointments;
DROP POLICY IF EXISTS "appointments_staff_access" ON appointments;

-- Yeni appointment policy'leri oluştur

-- Business owners kendi işletmelerinin randevularını yönetebilir
CREATE POLICY "appointments_business_owner_access" ON appointments
FOR ALL
USING (
    business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
)
WITH CHECK (
    business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
);

-- Müşteriler kendi randevularını görebilir ve oluşturabilir
CREATE POLICY "appointments_customer_access" ON appointments
FOR ALL
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

-- Staff kendi işletmelerinin randevularını görebilir ve yönetebilir
CREATE POLICY "appointments_staff_access" ON appointments
FOR ALL
USING (
    business_id IN (
        SELECT business_id FROM staff 
        WHERE user_id = auth.uid() 
        AND status = 'active'
    )
)
WITH CHECK (
    business_id IN (
        SELECT business_id FROM staff 
        WHERE user_id = auth.uid() 
        AND status = 'active'
    )
);

-- 3. Gerekli GRANT'ları ver
-- ===================================================================

-- business_available_slots için gerekli izinler
GRANT SELECT, INSERT, UPDATE, DELETE ON business_available_slots TO authenticated;
GRANT SELECT ON business_available_slots TO anon;

-- appointments için gerekli izinler
GRANT SELECT, INSERT, UPDATE, DELETE ON appointments TO authenticated;

-- 4. RLS'i aktif et
-- ===================================================================

ALTER TABLE business_available_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 5. Test ve kontrol
-- ===================================================================

-- Policy'leri kontrol et
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('business_available_slots', 'appointments')
ORDER BY tablename, policyname;

-- Tablo izinlerini kontrol et
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.table_privileges 
WHERE table_name IN ('business_available_slots', 'appointments')
AND grantee IN ('authenticated', 'anon');

SELECT 'Appointment creation RLS policies fixed successfully!' as status;
