-- Fix RLS policies for appointments and business_notifications tables
-- These policies are blocking appointment creation from both business and customer sides

-- 1. Fix appointments table RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "appointments_insert_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_select_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_update_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_delete_policy" ON appointments;

-- Create comprehensive RLS policies for appointments
-- Allow businesses to manage all their appointments
CREATE POLICY "appointments_business_full_access" ON appointments
FOR ALL USING (
  auth.uid() = business_id
);

-- Allow customers to create appointments for themselves
CREATE POLICY "appointments_customer_insert" ON appointments
FOR INSERT WITH CHECK (
  auth.uid() = customer_id
);

-- Allow customers to view their own appointments
CREATE POLICY "appointments_customer_select" ON appointments
FOR SELECT USING (
  auth.uid() = customer_id
);

-- Allow customers to update their own appointments (status changes, etc.)
CREATE POLICY "appointments_customer_update" ON appointments
FOR UPDATE USING (
  auth.uid() = customer_id
);

-- 2. Fix business_notifications table RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "business_notifications_insert_policy" ON business_notifications;
DROP POLICY IF EXISTS "business_notifications_select_policy" ON business_notifications;
DROP POLICY IF EXISTS "business_notifications_update_policy" ON business_notifications;
DROP POLICY IF EXISTS "business_notifications_delete_policy" ON business_notifications;

-- Create comprehensive RLS policies for business_notifications
-- Allow businesses to manage their notifications
CREATE POLICY "business_notifications_business_access" ON business_notifications
FOR ALL USING (
  auth.uid() = business_id
);

-- Allow system/triggers to create notifications (for appointment notifications)
-- This is needed when customers create appointments and trigger notifications
CREATE POLICY "business_notifications_system_insert" ON business_notifications
FOR INSERT WITH CHECK (
  -- Allow if the business exists and the notification is valid
  business_id IS NOT NULL AND
  type IS NOT NULL AND
  message IS NOT NULL
);

-- 3. Ensure RLS is enabled on both tables
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_notifications ENABLE ROW LEVEL SECURITY;

-- 4. Grant necessary permissions to authenticated users
GRANT INSERT, SELECT, UPDATE ON appointments TO authenticated;
GRANT INSERT, SELECT, UPDATE ON business_notifications TO authenticated;

-- 5. Create function to handle appointment notifications
-- This function will be called by triggers and needs elevated permissions
CREATE OR REPLACE FUNCTION create_appointment_notification(
  p_business_id UUID,
  p_appointment_id UUID,
  p_customer_name TEXT,
  p_service_name TEXT,
  p_appointment_date DATE,
  p_start_time TIME
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
BEGIN
  INSERT INTO business_notifications (
    business_id,
    type,
    title,
    message,
    related_appointment_id,
    is_read,
    created_at
  ) VALUES (
    p_business_id,
    'new_appointment',
    'Yeni Randevu',
    p_customer_name || ' tarafından ' || p_service_name || ' hizmeti için ' || 
    p_appointment_date || ' tarihinde ' || p_start_time || ' saatinde randevu oluşturuldu.',
    p_appointment_id,
    false,
    NOW()
  );
END;
$$;

-- 6. Update appointment creation trigger to use the secure function
CREATE OR REPLACE FUNCTION handle_appointment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  customer_name TEXT;
  service_name TEXT;
BEGIN
  -- Get customer name
  SELECT name INTO customer_name
  FROM users
  WHERE id = NEW.customer_id;
  
  -- Get service name
  SELECT name INTO service_name
  FROM services
  WHERE id = NEW.service_id;
  
  -- Create notification using secure function
  PERFORM create_appointment_notification(
    NEW.business_id,
    NEW.id,
    COALESCE(customer_name, 'Bilinmeyen Müşteri'),
    COALESCE(service_name, 'Bilinmeyen Hizmet'),
    NEW.appointment_date,
    NEW.start_time
  );
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS appointment_notification_trigger ON appointments;

-- Create trigger for appointment notifications
CREATE TRIGGER appointment_notification_trigger
AFTER INSERT ON appointments
FOR EACH ROW
EXECUTE FUNCTION handle_appointment_notification();

-- 7. Test the policies with some sample queries (commented out for safety)
-- These would be the queries that should now work:

/*
-- Business creating appointment (should work)
INSERT INTO appointments (business_id, customer_id, service_id, appointment_date, start_time, end_time, status)
VALUES (auth.uid(), 'customer-uuid', 'service-uuid', '2025-07-23', '12:00', '12:30', 'pending');

-- Customer creating appointment (should work)
INSERT INTO appointments (business_id, customer_id, service_id, appointment_date, start_time, end_time, status)
VALUES ('business-uuid', auth.uid(), 'service-uuid', '2025-07-23', '14:00', '14:30', 'pending');

-- Business viewing their appointments (should work)
SELECT * FROM appointments WHERE business_id = auth.uid();

-- Customer viewing their appointments (should work)
SELECT * FROM appointments WHERE customer_id = auth.uid();
*/
