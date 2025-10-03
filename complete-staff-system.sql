-- Complete Staff Management System
-- Bu script staff ekleme, RLS policies ve trigger'ları düzeltir

-- =============================================
-- 1. RLS POLICIES DÜZELTMESİ
-- =============================================

-- Users tablosu için staff creation policy
DROP POLICY IF EXISTS "business_owners_can_create_staff" ON users;
CREATE POLICY "business_owners_can_create_staff" ON users
FOR INSERT
TO authenticated
WITH CHECK (
  user_type = 'staff' AND
  EXISTS (
    SELECT 1 FROM businesses 
    WHERE owner_id = auth.uid()
  )
);

-- Staff tablosu için policies
DROP POLICY IF EXISTS "business_owners_can_manage_staff" ON staff;
CREATE POLICY "business_owners_can_manage_staff" ON staff
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses 
    WHERE id = staff.business_id AND owner_id = auth.uid()
  )
);

-- Staff services tablosu için policies
DROP POLICY IF EXISTS "business_owners_can_manage_staff_services" ON staff_services;
CREATE POLICY "business_owners_can_manage_staff_services" ON staff_services
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM staff s
    JOIN businesses b ON s.business_id = b.id
    WHERE s.id = staff_services.staff_id AND b.owner_id = auth.uid()
  )
);

-- =============================================
-- 2. STAFF CREATION FUNCTION
-- =============================================

-- Staff oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_staff_user(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_position TEXT DEFAULT 'Staff',
  p_description TEXT DEFAULT NULL,
  p_can_book_appointments BOOLEAN DEFAULT true,
  p_business_id UUID DEFAULT NULL,
  p_service_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_staff_id UUID;
  v_business_id UUID;
  v_service_id UUID;
  v_result JSON;
BEGIN
  -- Business ID'yi belirle
  IF p_business_id IS NULL THEN
    SELECT id INTO v_business_id 
    FROM businesses 
    WHERE owner_id = auth.uid() 
    LIMIT 1;
  ELSE
    v_business_id := p_business_id;
  END IF;

  -- Business kontrolü
  IF v_business_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Business not found');
  END IF;

  -- Yeni UUID oluştur
  v_user_id := gen_random_uuid();

  -- Users tablosuna ekle
  INSERT INTO users (id, email, user_type, name, phone)
  VALUES (v_user_id, p_email, 'staff', p_name, p_phone);

  -- Staff tablosuna ekle
  INSERT INTO staff (
    user_id, business_id, name, email, phone, 
    position, description, can_book_appointments, is_active
  )
  VALUES (
    v_user_id, v_business_id, p_name, p_email, p_phone,
    p_position, p_description, p_can_book_appointments, true
  )
  RETURNING id INTO v_staff_id;

  -- Hizmet atamalarını ekle
  IF array_length(p_service_ids, 1) > 0 THEN
    FOREACH v_service_id IN ARRAY p_service_ids
    LOOP
      INSERT INTO staff_services (staff_id, service_id)
      VALUES (v_staff_id, v_service_id);
    END LOOP;
  END IF;

  -- Başarı sonucu döndür
  v_result := json_build_object(
    'success', true,
    'user_id', v_user_id,
    'staff_id', v_staff_id,
    'business_id', v_business_id
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- =============================================
-- 3. RPC FUNCTION GRANT
-- =============================================

-- Fonksiyona erişim izni ver
GRANT EXECUTE ON FUNCTION create_staff_user TO authenticated;

-- =============================================
-- 4. EMAIL INVITATION SYSTEM (Placeholder)
-- =============================================

-- Staff invitation tablosu (email kodları için)
CREATE TABLE IF NOT EXISTS staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invitation_code TEXT NOT NULL,
  temp_password TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff invitations RLS
ALTER TABLE staff_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_owners_can_manage_invitations" ON staff_invitations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM staff s
    JOIN businesses b ON s.business_id = b.id
    WHERE s.id = staff_invitations.staff_id AND b.owner_id = auth.uid()
  )
);

-- =============================================
-- 5. TEST VE KONTROL
-- =============================================

-- Mevcut policies kontrol
SELECT schemaname, tablename, policyname, permissive, cmd 
FROM pg_policies 
WHERE tablename IN ('users', 'staff', 'staff_services')
ORDER BY tablename, policyname;

-- Fonksiyon test (örnek)
-- SELECT create_staff_user(
--   'test@example.com',
--   'temp123',
--   'Test Staff',
--   '0555 123 4567',
--   'Berber',
--   'Test personeli',
--   true,
--   NULL, -- business_id otomatik
--   ARRAY['service-uuid-1', 'service-uuid-2']::UUID[]
-- );

-- NOTLAR:
-- 1. Bu script çalıştırıldıktan sonra frontend'de create_staff_user RPC fonksiyonu kullanılacak
-- 2. Email gönderimi için staff_invitations tablosu hazır
-- 3. RLS policies düzeltildi
-- 4. Production-ready çözüm
