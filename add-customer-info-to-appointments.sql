-- Appointments tablosuna müşteri bilgisi için kolon ekle
-- Bu sayede işletme tarafında customer_id olarak auth.users.id kullanabilir,
-- asıl müşteri bilgisini ise customer_info alanında saklayabiliriz

-- Müşteri bilgisi için JSON kolonu ekle
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS customer_info JSONB;

-- Kolon açıklaması ekle
COMMENT ON COLUMN appointments.customer_info IS 'İşletme tarafından oluşturulan randevularda müşteri bilgisi (name, phone, email, business_customer_id)';

-- Index'i şimdilik atlayabiliriz, gerekirse sonra ekleriz
-- CREATE INDEX IF NOT EXISTS idx_appointments_customer_info_name 
-- ON appointments USING GIN ((customer_info->>'name') gin_trgm_ops);

-- Örnek customer_info yapısı:
-- {
--   "name": "Ahmet Ünal",
--   "phone": "545 864 6613", 
--   "email": "devvare@gmail.com",
--   "business_customer_id": "b4fa3cf8-09b7-49b7-a8de-8c2900a67e27",
--   "is_vip": true
-- }

DO $$
BEGIN
    RAISE NOTICE 'customer_info kolonu başarıyla eklendi';
END $$;
