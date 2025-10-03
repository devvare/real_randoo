-- Fix staff table id column to have default UUID generation
-- This fixes the "null value in column id" error

-- 1. Add default UUID generation to staff table id column
ALTER TABLE staff 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Verify the table structure
-- You can run this to check: SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'id';
