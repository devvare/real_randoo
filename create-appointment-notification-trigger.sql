-- Randevu oluşturulduğunda otomatik bildirim oluşturan trigger fonksiyonu

-- Önce trigger fonksiyonunu oluştur
CREATE OR REPLACE FUNCTION create_appointment_notification()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
    service_name TEXT;
    notification_message TEXT;
BEGIN
    -- Müşteri adını customer_info JSONB'den al
    customer_name := COALESCE((NEW.customer_info->>'name'), 'Bilinmeyen Müşteri');
    
    -- Hizmet adını services tablosundan al
    SELECT name INTO service_name 
    FROM services 
    WHERE id = NEW.service_id;
    
    service_name := COALESCE(service_name, 'Bilinmeyen Hizmet');
    
    -- Bildirim mesajını oluştur
    notification_message := customer_name || ' için ' || service_name || ' randevusu oluşturuldu. Tarih: ' || 
                           TO_CHAR(NEW.appointment_date, 'DD.MM.YYYY') || ' Saat: ' || NEW.start_time;
    
    -- İşletmeye bildirim gönder
    INSERT INTO business_notifications (
        business_id,
        title,
        message,
        type,
        related_appointment_id,
        is_read,
        created_at
    ) VALUES (
        NEW.business_id,
        'Yeni Randevu',
        notification_message,
        'appointment_created',
        NEW.id,
        false,
        NOW()
    );
    
    -- Log için
    RAISE NOTICE 'Randevu bildirimi oluşturuldu: %', notification_message;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı appointments tablosuna ekle
DROP TRIGGER IF EXISTS appointment_notification_trigger ON appointments;
CREATE TRIGGER appointment_notification_trigger
    AFTER INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION create_appointment_notification();

-- RLS policy'lerini kontrol et ve gerekirse düzelt
DO $$
BEGIN
    -- business_notifications tablosu için RLS policy'leri kontrol et
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'business_notifications' 
        AND policyname = 'Business owners can manage their notifications'
    ) THEN
        CREATE POLICY "Business owners can manage their notifications"
        ON business_notifications
        FOR ALL
        USING (business_id = auth.uid());
    END IF;
    
    RAISE NOTICE 'Bildirim trigger ve policy''leri başarıyla oluşturuldu';
END $$;
