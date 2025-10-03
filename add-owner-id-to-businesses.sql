-- Add owner_id column to businesses table and update existing data
-- This migration fixes the staff management system by properly linking businesses to their owners

-- 1. Add owner_id column to businesses table
ALTER TABLE businesses 
ADD COLUMN owner_id UUID REFERENCES auth.users(id);

-- 2. Update existing businesses with owner_id from users table
-- Get the business owner from the users table (user_type = 'business')
UPDATE businesses 
SET owner_id = (
    SELECT id 
    FROM users 
    WHERE user_type = 'business' 
    LIMIT 1
);

-- 3. Make owner_id NOT NULL after updating existing data
ALTER TABLE businesses 
ALTER COLUMN owner_id SET NOT NULL;

-- 4. Create index for better performance
CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);

-- 5. Update RLS policies for businesses table
DROP POLICY IF EXISTS "Users can view businesses" ON businesses;
DROP POLICY IF EXISTS "Business owners can manage their businesses" ON businesses;

-- Allow business owners to see and manage their own businesses
CREATE POLICY "Business owners can manage their businesses" ON businesses
    FOR ALL USING (owner_id = auth.uid());

-- Allow customers to view all businesses (for booking)
CREATE POLICY "Customers can view businesses" ON businesses
    FOR SELECT USING (true);

-- 6. Update database types (this is just a comment, you'll need to regenerate types)
-- Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
