-- Bildirimler Sistemi SQL Script

-- 1. Bildirimler tablosu oluştur
CREATE TABLE IF NOT EXISTS business_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'new_appointment', 'changed_appointment', 'cancelled_appointment', 'review', 'payment', 'reminder'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_id UUID, -- appointment_id, review_id, customer_id vb.
    related_type VARCHAR(50), -- 'appointment', 'review', 'customer', 'payment'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. İndeksler oluştur
CREATE INDEX IF NOT EXISTS idx_business_notifications_business_id ON business_notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_business_notifications_created_at ON business_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_notifications_is_read ON business_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_business_notifications_type ON business_notifications(type);

-- 3. RLS (Row Level Security) politikaları
ALTER TABLE business_notifications ENABLE ROW LEVEL SECURITY;

-- İşletme sadece kendi bildirimlerini görebilir
CREATE POLICY "İşletmeler kendi bildirimlerini görebilir" ON business_notifications
    FOR SELECT USING (business_id = auth.uid());

-- İşletme kendi bildirimlerini güncelleyebilir (okundu olarak işaretleme)
CREATE POLICY "İşletmeler kendi bildirimlerini güncelleyebilir" ON business_notifications
    FOR UPDATE USING (business_id = auth.uid());

-- Sistem bildirim ekleyebilir (trigger'lar için)
CREATE POLICY "Sistem bildirim ekleyebilir" ON business_notifications
    FOR INSERT WITH CHECK (true);

-- İşletme kendi bildirimlerini silebilir
CREATE POLICY "İşletmeler kendi bildirimlerini silebilir" ON business_notifications
    FOR DELETE USING (business_id = auth.uid());

-- 4. Updated_at trigger'ı
CREATE OR REPLACE FUNCTION update_business_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_notifications_updated_at
    BEFORE UPDATE ON business_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_business_notifications_updated_at();

-- 5. Bildirim oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_business_notification(
    p_business_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_related_id UUID DEFAULT NULL,
    p_related_type VARCHAR(50) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO business_notifications (
        business_id,
        type,
        title,
        message,
        related_id,
        related_type
    ) VALUES (
        p_business_id,
        p_type,
        p_title,
        p_message,
        p_related_id,
        p_related_type
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Randevu durumu değiştiğinde bildirim oluştur
CREATE OR REPLACE FUNCTION notify_appointment_status_change()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
    service_name TEXT;
    appointment_date TEXT;
    appointment_time TEXT;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    -- Müşteri adını al
    SELECT name INTO customer_name
    FROM users
    WHERE id = NEW.customer_id;
    
    -- Hizmet adını al
    SELECT name INTO service_name
    FROM services
    WHERE id = NEW.service_id;
    
    -- Tarih ve saat formatla
    appointment_date := TO_CHAR(NEW.appointment_date, 'DD.MM.YYYY');
    appointment_time := NEW.start_time;
    
    -- Yeni randevu oluşturulduğunda
    IF TG_OP = 'INSERT' THEN
        notification_title := 'Yeni Randevu Talebi';
        notification_message := customer_name || ', ' || appointment_date || ' tarihinde saat ' || appointment_time || ' için ' || service_name || ' hizmeti randevu talep etti.';
        
        PERFORM create_business_notification(
            NEW.business_id,
            'new_appointment',
            notification_title,
            notification_message,
            NEW.id,
            'appointment'
        );
    END IF;
    
    -- Randevu durumu değiştiğinde
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        CASE NEW.status
            WHEN 'confirmed' THEN
                notification_title := 'Randevu Onaylandı';
                notification_message := customer_name || ' müşterisinin ' || appointment_date || ' ' || appointment_time || ' randevusu onaylandı.';
            WHEN 'cancelled' THEN
                notification_title := 'Randevu İptal Edildi';
                notification_message := customer_name || ' müşterisinin ' || appointment_date || ' ' || appointment_time || ' randevusu iptal edildi.';
            WHEN 'completed' THEN
                notification_title := 'Randevu Tamamlandı';
                notification_message := customer_name || ' müşterisinin ' || appointment_date || ' ' || appointment_time || ' randevusu tamamlandı.';
            ELSE
                RETURN NEW;
        END CASE;
        
        PERFORM create_business_notification(
            NEW.business_id,
            'changed_appointment',
            notification_title,
            notification_message,
            NEW.id,
            'appointment'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Randevu trigger'ını oluştur
DROP TRIGGER IF EXISTS appointment_notification_trigger ON appointments;
CREATE TRIGGER appointment_notification_trigger
    AFTER INSERT OR UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION notify_appointment_status_change();

-- 8. Okunmamış bildirim sayısını alan view
CREATE OR REPLACE VIEW business_unread_notifications_count AS
SELECT 
    business_id,
    COUNT(*) as unread_count
FROM business_notifications
WHERE is_read = FALSE
GROUP BY business_id;

-- 9. Bildirimler listesi view'ı (detaylı)
CREATE OR REPLACE VIEW business_notifications_detailed AS
SELECT 
    n.*,
    CASE 
        WHEN n.related_type = 'appointment' THEN (
            SELECT json_build_object(
                'customer_name', u.name,
                'service_name', s.name,
                'appointment_date', a.appointment_date,
                'start_time', a.start_time
            )
            FROM appointments a
            LEFT JOIN users u ON u.id = a.customer_id
            LEFT JOIN services s ON s.id = a.service_id
            WHERE a.id = n.related_id
        )
        ELSE NULL
    END as related_data
FROM business_notifications n
ORDER BY n.created_at DESC;

-- 10. Örnek bildirimler oluşturma fonksiyonu (test için)
CREATE OR REPLACE FUNCTION add_sample_notifications(p_business_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Örnek bildirimler ekle
    PERFORM create_business_notification(
        p_business_id,
        'new_appointment',
        'Yeni Randevu Talebi',
        'Ayşe Kaya, yarın saat 14:00 için randevu talep etti.',
        NULL,
        'appointment'
    );
    
    PERFORM create_business_notification(
        p_business_id,
        'changed_appointment',
        'Randevu Değişikliği',
        'Mehmet Yılmaz randevusunu değiştirdi.',
        NULL,
        'appointment'
    );
    
    PERFORM create_business_notification(
        p_business_id,
        'review',
        'Yeni Yorum',
        'Ali Öztürk size 5 yıldız verdi: "Harika hizmet!"',
        NULL,
        'review'
    );
    
    RAISE NOTICE 'Örnek bildirimler eklendi.';
END;
$$ LANGUAGE plpgsql;

-- 11. Bildirim silme fonksiyonu (toplu)
CREATE OR REPLACE FUNCTION delete_old_notifications(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM business_notifications
    WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
    AND is_read = TRUE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 12. Tüm bildirimleri okundu olarak işaretle
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_business_id UUID)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE business_notifications
    SET is_read = TRUE
    WHERE business_id = p_business_id
    AND is_read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;
