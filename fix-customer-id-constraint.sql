-- Fix appointments.customer_id foreign key constraint
-- Change from auth.users.id reference to business_customers.id reference

-- 1. Drop existing foreign key constraint
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_customer_id_fkey;

-- 2. Add new foreign key constraint to business_customers table
ALTER TABLE appointments 
ADD CONSTRAINT appointments_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES business_customers(id) ON DELETE CASCADE;

-- 3. Update RLS policies to work with business_customers
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Businesses can view their appointments" ON appointments;
DROP POLICY IF EXISTS "Users can insert their own appointments" ON appointments;
DROP POLICY IF EXISTS "Businesses can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON appointments;
DROP POLICY IF EXISTS "Businesses can update their appointments" ON appointments;

-- Create new policies that work with business_customers
CREATE POLICY "Customers can view their appointments" ON appointments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM business_customers 
    WHERE business_customers.id = appointments.customer_id 
    AND business_customers.customer_email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Businesses can view their appointments" ON appointments
FOR SELECT USING (business_id = auth.uid());

CREATE POLICY "Customers can insert their appointments" ON appointments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM business_customers 
    WHERE business_customers.id = customer_id 
    AND business_customers.customer_email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Businesses can insert appointments" ON appointments
FOR INSERT WITH CHECK (business_id = auth.uid());

CREATE POLICY "Customers can update their appointments" ON appointments
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM business_customers 
    WHERE business_customers.id = appointments.customer_id 
    AND business_customers.customer_email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Businesses can update their appointments" ON appointments
FOR UPDATE USING (business_id = auth.uid());

-- 4. Test the constraint
SELECT 
  'appointments constraint test' as test_name,
  COUNT(*) as total_appointments,
  COUNT(DISTINCT customer_id) as unique_customers
FROM appointments;

-- 5. Show current foreign key constraints
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'appointments'
  AND kcu.column_name = 'customer_id';
