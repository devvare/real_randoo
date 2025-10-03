-- Business Available Slots System
-- İşletmeye ait uygun saatleri dinamik olarak yönetmek için tablo ve fonksiyonlar

-- 1. Business Available Slots tablosu oluştur
CREATE TABLE IF NOT EXISTS business_available_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    slot_type VARCHAR(20) DEFAULT 'available', -- 'available', 'blocked', 'break'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: aynı işletme, tarih ve saat aralığında tekrar slot olmasın
    UNIQUE(business_id, date, start_time, end_time)
);

-- 2. RLS politikaları
ALTER TABLE business_available_slots ENABLE ROW LEVEL SECURITY;

-- İşletme sahipleri kendi slotlarını yönetebilir
CREATE POLICY "business_owners_manage_slots" ON business_available_slots
    FOR ALL 
    TO authenticated
    USING (
        business_id IN (
            SELECT id FROM businesses WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        business_id IN (
            SELECT id FROM businesses WHERE id = auth.uid()
        )
    );

-- Müşteriler sadece uygun slotları görebilir
CREATE POLICY "customers_view_available_slots" ON business_available_slots
    FOR SELECT 
    TO authenticated
    USING (
        is_available = true AND slot_type = 'available'
    );

-- 3. İşletme için slot üretme fonksiyonu (basitleştirilmiş)
CREATE OR REPLACE FUNCTION generate_business_slots(
    p_business_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS VOID AS $$
DECLARE
    date_cursor DATE;
    working_hour RECORD;
    slot_start TIME;
    slot_duration INTERVAL := '15 minutes'; -- Sabit 15 dakika slot
BEGIN
    
    -- Tarih aralığında döngü
    date_cursor := p_start_date;
    WHILE date_cursor <= p_end_date LOOP
        
        -- Bu tarih için çalışma saatlerini çek
        FOR working_hour IN 
            SELECT open_time, close_time, is_open
            FROM working_hours 
            WHERE business_id = p_business_id 
            AND day_of_week = EXTRACT(DOW FROM date_cursor)
            AND is_open = true
        LOOP
            -- Çalışma saati içinde slotlar oluştur
            slot_start := working_hour.open_time;
            
            WHILE slot_start + slot_duration <= working_hour.close_time LOOP
                -- Slot zaten var mı kontrol et
                IF NOT EXISTS (
                    SELECT 1 FROM business_available_slots 
                    WHERE business_id = p_business_id 
                    AND date = date_cursor 
                    AND start_time = slot_start
                ) THEN
                    -- Slot oluştur
                    INSERT INTO business_available_slots (
                        business_id, 
                        date, 
                        start_time, 
                        end_time, 
                        is_available,
                        slot_type
                    ) VALUES (
                        p_business_id,
                        date_cursor,
                        slot_start,
                        slot_start + slot_duration,
                        true,
                        'available'
                    );
                END IF;
                
                slot_start := slot_start + slot_duration;
            END LOOP;
        END LOOP;
        
        date_cursor := date_cursor + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Randevu oluşturulduğunda slotu blokla
CREATE OR REPLACE FUNCTION block_appointment_slot() RETURNS TRIGGER AS $$
BEGIN
    -- İlgili slotu blokla
    UPDATE business_available_slots 
    SET 
        is_available = false,
        slot_type = 'booked',
        updated_at = NOW()
    WHERE business_id = NEW.business_id
    AND date = NEW.appointment_date
    AND start_time = NEW.start_time::TIME
    AND end_time = NEW.end_time::TIME;
    
    -- Eğer slot yoksa oluştur ve blokla
    IF NOT FOUND THEN
        INSERT INTO business_available_slots (
            business_id, 
            date, 
            start_time, 
            end_time, 
            is_available,
            slot_type
        ) VALUES (
            NEW.business_id,
            NEW.appointment_date,
            NEW.start_time::TIME,
            NEW.end_time::TIME,
            false,
            'booked'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Randevu silindiğinde/iptal edildiğinde slotu serbest bırak
CREATE OR REPLACE FUNCTION unblock_appointment_slot() RETURNS TRIGGER AS $$
BEGIN
    -- İlgili slotu serbest bırak
    UPDATE business_available_slots 
    SET 
        is_available = true,
        slot_type = 'available',
        updated_at = NOW()
    WHERE business_id = OLD.business_id
    AND date = OLD.appointment_date
    AND start_time = OLD.start_time::TIME
    AND end_time = OLD.end_time::TIME;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger'ları oluştur
DROP TRIGGER IF EXISTS block_slot_on_appointment_insert ON appointments;
CREATE TRIGGER block_slot_on_appointment_insert
    AFTER INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION block_appointment_slot();

DROP TRIGGER IF EXISTS unblock_slot_on_appointment_delete ON appointments;
CREATE TRIGGER unblock_slot_on_appointment_delete
    AFTER DELETE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION unblock_appointment_slot();

-- Randevu iptal edildiğinde de slotu serbest bırak
DROP TRIGGER IF EXISTS unblock_slot_on_appointment_cancel ON appointments;
CREATE TRIGGER unblock_slot_on_appointment_cancel
    AFTER UPDATE ON appointments
    FOR EACH ROW
    WHEN (OLD.status != 'cancelled' AND NEW.status = 'cancelled')
    EXECUTE FUNCTION unblock_appointment_slot();

-- 7. İndeksler
CREATE INDEX IF NOT EXISTS idx_business_available_slots_business_date 
    ON business_available_slots(business_id, date);
CREATE INDEX IF NOT EXISTS idx_business_available_slots_available 
    ON business_available_slots(business_id, date, is_available);

-- 8. Örnek kullanım: GAGA için önümüzdeki 30 gün için slotlar oluştur
DO $$
DECLARE
    gaga_business_id UUID;
BEGIN
    -- GAGA'nın business_id'sini bul
    SELECT id INTO gaga_business_id 
    FROM businesses 
    WHERE business_name = 'GAGA' 
    LIMIT 1;
    
    IF gaga_business_id IS NOT NULL THEN
        -- Önümüzdeki 30 gün için slotlar oluştur
        PERFORM generate_business_slots(
            gaga_business_id,
            CURRENT_DATE,
            (CURRENT_DATE + INTERVAL '30 days')::DATE
        );
        
        RAISE NOTICE 'GAGA için slotlar oluşturuldu: %', gaga_business_id;
    ELSE
        RAISE NOTICE 'GAGA işletmesi bulunamadı';
    END IF;
END $$;

-- 9. View: Müşteri tarafı için uygun slotlar
CREATE OR REPLACE VIEW customer_available_slots AS
SELECT 
    bas.business_id,
    bas.date,
    bas.start_time,
    bas.end_time,
    bas.is_available,
    b.business_name
FROM business_available_slots bas
JOIN businesses b ON bas.business_id = b.id
WHERE bas.is_available = true 
AND bas.slot_type = 'available'
AND bas.date >= CURRENT_DATE;

COMMIT;
