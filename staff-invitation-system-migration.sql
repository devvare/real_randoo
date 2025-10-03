-- Staff Self-Signup System Migration
-- Bu script staff tablosuna invitation_code ve status kolonlarını ekler

-- 1. Staff tablosuna invitation_code kolonu ekle
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS invitation_code TEXT;

-- 2. Staff tablosuna status kolonu ekle (pending/active)
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 3. Mevcut staff kayıtlarını active yap
UPDATE staff 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- 4. Status kolonu için constraint ekle
ALTER TABLE staff 
ADD CONSTRAINT staff_status_check 
CHECK (status IN ('pending', 'active', 'inactive'));

-- 5. Invitation code için unique index ekle (null değerler hariç)
CREATE UNIQUE INDEX IF NOT EXISTS staff_invitation_code_unique 
ON staff (invitation_code) 
WHERE invitation_code IS NOT NULL;

-- 6. Staff self-signup için RLS policy ekle
CREATE POLICY IF NOT EXISTS "Staff can signup with invitation code" 
ON staff 
FOR UPDATE 
USING (
  status = 'pending' 
  AND invitation_code IS NOT NULL
);

-- 7. Staff signup için view oluştur
CREATE OR REPLACE VIEW staff_pending_invitations AS
SELECT 
  id,
  business_id,
  email,
  name,
  invitation_code,
  status,
  created_at
FROM staff
WHERE status = 'pending' 
  AND invitation_code IS NOT NULL;

-- 8. RLS policy for view
ALTER TABLE staff_pending_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Anyone can read pending invitations for signup" 
ON staff_pending_invitations 
FOR SELECT 
USING (true);

COMMENT ON TABLE staff IS 'Staff table with invitation system for self-signup';
COMMENT ON COLUMN staff.invitation_code IS 'Unique invitation code for staff self-signup';
COMMENT ON COLUMN staff.status IS 'Staff status: pending (waiting signup), active, inactive';
