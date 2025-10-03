-- Mevcut Randevuları Slot Sistemine Senkronize Et
-- Bu script mevcut randevulara göre business_available_slots tablosunu günceller

-- 1. Mevcut onaylı/bekleyen randevulara göre slotları blokla
UPDATE business_available_slots 
SET 
    is_available = false,
    slot_type = 'booked',
    updated_at = NOW()
WHERE (business_id, date, start_time, end_time) IN (
    SELECT 
        business_id, 
        appointment_date, 
        start_time::TIME, 
        end_time::TIME
    FROM appointments 
    WHERE status IN ('confirmed', 'pending')
    AND appointment_date >= CURRENT_DATE - INTERVAL '1 day' -- Son 1 günden itibaren
);

-- 2. Kontrol için: Kaç slot bloklandı?
SELECT 
    'Bloklanan slot sayısı:' as info,
    COUNT(*) as count
FROM business_available_slots 
WHERE is_available = false AND slot_type = 'booked';

-- 3. Kontrol için: Bugün için durum
SELECT 
    date,
    COUNT(*) as total_slots,
    COUNT(CASE WHEN is_available = true THEN 1 END) as available_slots,
    COUNT(CASE WHEN is_available = false THEN 1 END) as booked_slots
FROM business_available_slots 
WHERE date = CURRENT_DATE
GROUP BY date;

-- 4. Detaylı kontrol: GAGA için bugünkü durum
SELECT 
    bas.date,
    bas.start_time,
    bas.end_time,
    bas.is_available,
    bas.slot_type,
    CASE 
        WHEN a.id IS NOT NULL THEN 'Randevu var'
        ELSE 'Randevu yok'
    END as appointment_status
FROM business_available_slots bas
LEFT JOIN appointments a ON (
    bas.business_id = a.business_id 
    AND bas.date = a.appointment_date 
    AND bas.start_time = a.start_time::TIME 
    AND bas.end_time = a.end_time::TIME
    AND a.status IN ('confirmed', 'pending')
)
WHERE bas.business_id = (
    SELECT id FROM businesses WHERE business_name = 'GAGA' LIMIT 1
)
AND bas.date = CURRENT_DATE
ORDER BY bas.start_time;

COMMIT;
