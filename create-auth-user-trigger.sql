-- Create trigger to automatically insert into users table when auth user is created
-- This fixes the foreign key constraint error for staff.user_id

-- 1. Create function to handle new auth user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table when new auth user is created
  INSERT INTO users (
    id,
    email,
    user_type,
    name,
    phone,
    is_vip,
    birthday,
    notes,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    false,
    COALESCE(NEW.raw_user_meta_data->>'birthday', NULL)::date,
    NULL,
    NULL,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT ALL ON auth.users TO postgres;
