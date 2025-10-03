-- Staff Invitation System
-- Email davet sistemi ile staff oluşturma

-- =============================================
-- 1. STAFF INVITATION TABLE
-- =============================================

-- Staff davet tablosu (email ile davet takibi için)
CREATE TABLE IF NOT EXISTS staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  job_position TEXT,
  phone TEXT,
  description TEXT,
  can_book_appointments BOOLEAN DEFAULT true,
  service_ids UUID[],
  invitation_code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_accepted BOOLEAN DEFAULT false,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies for staff_invitations
ALTER TABLE staff_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_owners_can_manage_invitations" ON staff_invitations;
CREATE POLICY "business_owners_can_manage_invitations" ON staff_invitations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses 
    WHERE id = staff_invitations.business_id AND owner_id = auth.uid()
  )
);

-- =============================================
-- 2. ENHANCED STAFF CREATION WITH EMAIL
-- =============================================

-- Staff davet oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_staff_invitation(
  p_email TEXT,
  p_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_job_position TEXT DEFAULT 'Staff',
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
  v_business_id UUID;
  v_invitation_id UUID;
  v_invitation_code TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
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

  -- Email zaten kayıtlı mı kontrol et
  IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
    RETURN json_build_object('success', false, 'error', 'Email already registered');
  END IF;

  -- Davet kodu oluştur (8 karakter)
  v_invitation_code := upper(substring(md5(random()::text) from 1 for 8));
  
  -- Son kullanma tarihi (7 gün)
  v_expires_at := NOW() + INTERVAL '7 days';

  -- Davet kaydı oluştur
  INSERT INTO staff_invitations (
    business_id, email, name, job_position, phone, description,
    can_book_appointments, service_ids, invitation_code, 
    expires_at, created_by
  )
  VALUES (
    v_business_id, p_email, p_name, p_job_position, p_phone, p_description,
    p_can_book_appointments, p_service_ids, v_invitation_code,
    v_expires_at, auth.uid()
  )
  RETURNING id INTO v_invitation_id;

  -- Başarı sonucu döndür
  v_result := json_build_object(
    'success', true,
    'invitation_id', v_invitation_id,
    'invitation_code', v_invitation_code,
    'email', p_email,
    'expires_at', v_expires_at
  );

  RETURN v_result;
END;
$$;

-- =============================================
-- 3. STAFF INVITATION ACCEPTANCE
-- =============================================

-- Davet kabul etme fonksiyonu
CREATE OR REPLACE FUNCTION accept_staff_invitation(
  p_invitation_code TEXT,
  p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation RECORD;
  v_user_id UUID;
  v_staff_id UUID;
  v_service_id UUID;
  v_result JSON;
BEGIN
  -- Davet kodunu kontrol et
  SELECT * INTO v_invitation
  FROM staff_invitations
  WHERE invitation_code = p_invitation_code
    AND expires_at > NOW()
    AND is_accepted = false;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation code');
  END IF;

  -- Email zaten kayıtlı mı kontrol et
  IF EXISTS (SELECT 1 FROM users WHERE email = v_invitation.email) THEN
    RETURN json_build_object('success', false, 'error', 'Email already registered');
  END IF;

  -- Yeni UUID oluştur
  v_user_id := gen_random_uuid();

  -- Users tablosuna ekle
  INSERT INTO users (id, email, user_type, name, phone)
  VALUES (v_user_id, v_invitation.email, 'staff', v_invitation.name, v_invitation.phone);

  -- Staff tablosuna ekle
  INSERT INTO staff (
    user_id, business_id, name, email, phone, 
    job_position, description, can_book_appointments, is_active
  )
  VALUES (
    v_user_id, v_invitation.business_id, v_invitation.name, v_invitation.email, v_invitation.phone,
    v_invitation.job_position, v_invitation.description, v_invitation.can_book_appointments, true
  )
  RETURNING id INTO v_staff_id;

  -- Hizmet atamalarını ekle
  IF array_length(v_invitation.service_ids, 1) > 0 THEN
    FOREACH v_service_id IN ARRAY v_invitation.service_ids
    LOOP
      INSERT INTO staff_services (staff_id, service_id)
      VALUES (v_staff_id, v_service_id);
    END LOOP;
  END IF;

  -- Daveti kabul edildi olarak işaretle
  UPDATE staff_invitations
  SET is_accepted = true, accepted_at = NOW()
  WHERE id = v_invitation.id;

  -- Başarı sonucu döndür
  v_result := json_build_object(
    'success', true,
    'user_id', v_user_id,
    'staff_id', v_staff_id,
    'business_id', v_invitation.business_id,
    'message', 'Staff account created successfully'
  );

  RETURN v_result;
END;
$$;

-- =============================================
-- 4. UTILITY FUNCTIONS
-- =============================================

-- Aktif davetleri listele
CREATE OR REPLACE FUNCTION get_pending_invitations(p_business_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  job_position TEXT,
  invitation_code TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_business_id UUID;
BEGIN
  -- Business ID'yi belirle
  IF p_business_id IS NULL THEN
    SELECT businesses.id INTO v_business_id 
    FROM businesses 
    WHERE owner_id = auth.uid() 
    LIMIT 1;
  ELSE
    v_business_id := p_business_id;
  END IF;

  RETURN QUERY
  SELECT 
    si.id,
    si.email,
    si.name,
    si.position,
    si.invitation_code,
    si.expires_at,
    si.created_at
  FROM staff_invitations si
  WHERE si.business_id = v_business_id
    AND si.is_accepted = false
    AND si.expires_at > NOW()
  ORDER BY si.created_at DESC;
END;
$$;

-- Süresi dolmuş davetleri temizle
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM staff_invitations
  WHERE expires_at < NOW() AND is_accepted = false;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

-- =============================================
-- 5. EXAMPLE USAGE
-- =============================================

/*
-- Davet oluştur
SELECT create_staff_invitation(
  'staff@example.com',
  'Ahmet Yılmaz',
  '0555 123 4567',
  'Berber',
  'Deneyimli personel',
  true,
  NULL,
  ARRAY['service-uuid-1', 'service-uuid-2']::UUID[]
);

-- Davet kabul et
SELECT accept_staff_invitation('ABC12345', 'newpassword123');

-- Bekleyen davetleri listele
SELECT * FROM get_pending_invitations();

-- Süresi dolmuş davetleri temizle
SELECT cleanup_expired_invitations();
*/
