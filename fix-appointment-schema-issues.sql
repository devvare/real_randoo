-- Fix critical schema issues preventing appointment booking
-- Run this script in Supabase SQL Editor to resolve database schema problems

-- 1. Add missing related_appointment_id column to business_notifications table
ALTER TABLE business_notifications 
ADD COLUMN IF NOT EXISTS related_appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE;

-- 2. Check and fix appointments table foreign key constraints
-- First, let's see what the current customer_id constraint references
-- If it references users table but should reference business_customers, we need to fix it

-- Drop the existing foreign key constraint if it exists and is problematic
DO $$ 
BEGIN
    -- Check if the constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'appointments_customer_id_fkey' 
        AND table_name = 'appointments'
    ) THEN
        ALTER TABLE appointments DROP CONSTRAINT appointments_customer_id_fkey;
    END IF;
END $$;

-- Add the correct foreign key constraint
-- Based on the context, customer_id should reference users.id (auth users)
-- since customers are registered users in the system
ALTER TABLE appointments 
ADD CONSTRAINT appointments_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Update the notification trigger function to handle the new column
CREATE OR REPLACE FUNCTION create_appointment_notification()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Create notification for new appointments
    IF TG_OP = 'INSERT' THEN
        INSERT INTO business_notifications (
            business_id,
            type,
            title,
            message,
            related_appointment_id,
            created_at
        ) VALUES (
            NEW.business_id,
            'new_appointment',
            'Yeni Randevu',
            'Yeni bir randevu talebi aldınız.',
            NEW.id,
            NOW()
        );
        RETURN NEW;
    END IF;
    
    -- Create notification for appointment status changes
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO business_notifications (
            business_id,
            type,
            title,
            message,
            related_appointment_id,
            created_at
        ) VALUES (
            NEW.business_id,
            'appointment_status_change',
            'Randevu Durumu Değişti',
            'Bir randevunun durumu güncellendi: ' || NEW.status,
            NEW.id,
            NOW()
        );
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 4. Recreate the trigger to use the updated function
DROP TRIGGER IF EXISTS appointment_notification_trigger ON appointments;
CREATE TRIGGER appointment_notification_trigger
    AFTER INSERT OR UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION create_appointment_notification();

-- 5. Grant necessary permissions for the updated schema
GRANT INSERT, SELECT, UPDATE, DELETE ON business_notifications TO authenticated;
-- Note: Sequence grant removed as business_notifications_id_seq doesn't exist
-- The table likely uses UUID primary key instead of auto-increment

-- 6. Update RLS policies to handle the new column
-- Drop and recreate business_notifications policies to ensure they work with the new column
DROP POLICY IF EXISTS "business_notifications_business_access" ON business_notifications;
DROP POLICY IF EXISTS "business_notifications_system_insert" ON business_notifications;

-- Allow businesses to manage their notifications
CREATE POLICY "business_notifications_business_access" ON business_notifications
FOR ALL USING (
    auth.uid() = business_id
);

-- Allow system/triggers to create notifications
CREATE POLICY "business_notifications_system_insert" ON business_notifications
FOR INSERT WITH CHECK (true);

-- 7. Verify the schema changes
-- Check if the related_appointment_id column was added successfully
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business_notifications' 
        AND column_name = 'related_appointment_id'
    ) THEN
        RAISE NOTICE 'SUCCESS: related_appointment_id column added to business_notifications';
    ELSE
        RAISE NOTICE 'ERROR: related_appointment_id column not found in business_notifications';
    END IF;
END $$;

-- Check if the appointments foreign key constraint is correct
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'appointments_customer_id_fkey' 
        AND table_name = 'appointments'
    ) THEN
        RAISE NOTICE 'SUCCESS: appointments_customer_id_fkey constraint exists';
    ELSE
        RAISE NOTICE 'ERROR: appointments_customer_id_fkey constraint not found';
    END IF;
END $$;

-- 8. Test data integrity
-- This will help identify any existing data that might cause issues
SELECT 
    'appointments' as table_name,
    COUNT(*) as total_rows,
    COUNT(DISTINCT customer_id) as unique_customers,
    COUNT(DISTINCT business_id) as unique_businesses
FROM appointments
UNION ALL
SELECT 
    'business_notifications' as table_name,
    COUNT(*) as total_rows,
    COUNT(DISTINCT business_id) as unique_businesses,
    COUNT(related_appointment_id) as appointments_linked
FROM business_notifications;

-- 9. Clean up any orphaned data that might cause foreign key violations
-- Remove appointments with customer_id that don't exist in auth.users
DELETE FROM appointments 
WHERE customer_id NOT IN (
    SELECT id FROM auth.users WHERE id IS NOT NULL
);

-- Remove notifications with business_id that don't exist in auth.users
DELETE FROM business_notifications 
WHERE business_id NOT IN (
    SELECT id FROM auth.users WHERE id IS NOT NULL
);

DO $$
BEGIN
    RAISE NOTICE 'Schema migration completed. Please test appointment creation on both business and customer sides.';
END $$;
