/*
  # İlk Veritabanı Şeması

  1. Yeni Tablolar
    - `users` - Kullanıcı bilgileri (müşteri, işletme, personel)
    - `businesses` - İşletme detayları
    - `staff` - Personel bilgileri
    - `services` - Hizmet tanımları
    - `appointments` - Randevu kayıtları
    - `working_hours` - Çalışma saatleri

  2. Güvenlik
    - Tüm tablolarda RLS aktif
    - Kullanıcılar sadece kendi verilerine erişebilir
    - İşletmeler kendi personel ve randevularını yönetebilir
*/

-- Users tablosu (temel kullanıcı bilgileri)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('customer', 'business', 'staff')),
  name text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customers tablosu (müşteri özel bilgileri)
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  birthday date,
  favorite_businesses text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Businesses tablosu (işletme bilgileri)
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  address text NOT NULL,
  latitude decimal,
  longitude decimal,
  category text DEFAULT 'berber',
  rating decimal DEFAULT 0,
  exterior_photo text,
  interior_photo text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Staff tablosu (personel bilgileri)
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  position text NOT NULL,
  can_take_appointments boolean DEFAULT true,
  avatar text,
  created_at timestamptz DEFAULT now()
);

-- Services tablosu (hizmetler)
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  duration integer NOT NULL, -- dakika cinsinden
  price decimal NOT NULL,
  description text,
  staff_ids uuid[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Working Hours tablosu (çalışma saatleri)
CREATE TABLE IF NOT EXISTS working_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Pazar, 6=Cumartesi
  is_open boolean DEFAULT true,
  open_time time,
  close_time time,
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, day_of_week)
);

-- Appointments tablosu (randevular)
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS (Row Level Security) aktifleştir
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Users tablosu politikaları
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Customers tablosu politikaları
CREATE POLICY "Customers can read own data"
  ON customers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Customers can update own data"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Businesses can read their customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      JOIN businesses b ON b.id = a.business_id
      WHERE a.customer_id = customers.id AND b.id = auth.uid()
    )
  );

-- Businesses tablosu politikaları
CREATE POLICY "Anyone can read businesses"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Business owners can update own business"
  ON businesses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Staff tablosu politikaları
CREATE POLICY "Anyone can read staff"
  ON staff
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Business owners can manage staff"
  ON staff
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = staff.business_id AND b.id = auth.uid()
    )
  );

CREATE POLICY "Staff can read own data"
  ON staff
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Services tablosu politikaları
CREATE POLICY "Anyone can read active services"
  ON services
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Business owners can manage services"
  ON services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = services.business_id AND b.id = auth.uid()
    )
  );

-- Working Hours tablosu politikaları
CREATE POLICY "Anyone can read working hours"
  ON working_hours
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Business owners can manage working hours"
  ON working_hours
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = working_hours.business_id AND b.id = auth.uid()
    )
  );

-- Appointments tablosu politikaları
CREATE POLICY "Customers can read own appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = appointments.customer_id AND c.id = auth.uid()
    )
  );

CREATE POLICY "Business owners can read business appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = appointments.business_id AND b.id = auth.uid()
    )
  );

CREATE POLICY "Staff can read their appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.id = appointments.staff_id AND s.id = auth.uid()
    )
  );

CREATE POLICY "Customers can create appointments"
  ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = appointments.customer_id AND c.id = auth.uid()
    )
  );

CREATE POLICY "Business owners can manage appointments"
  ON appointments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = appointments.business_id AND b.id = auth.uid()
    )
  );

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Updated_at trigger'ları
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();