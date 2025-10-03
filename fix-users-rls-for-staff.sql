-- Fix RLS policies for users table to allow staff creation
-- Bu script staff ekleme işlemi için users tablosuna insert izni verir

-- 1. Mevcut users tablosu RLS policy'lerini kontrol et
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users';

-- 2. Staff ekleme için özel policy ekle
-- İşletme sahipleri kendi işletmeleri için staff kullanıcıları oluşturabilir
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

-- 3. Alternatif: Eğer yukarıdaki çalışmazsa, genel staff creation policy
-- CREATE POLICY "allow_staff_creation" ON users
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (user_type = 'staff');

-- 4. Mevcut policy'leri listele (kontrol için)
SELECT * FROM pg_policies WHERE tablename = 'users';

-- 5. users tablosu RLS durumunu kontrol et
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'users';

-- NOTLAR:
-- - Bu script çalıştırıldıktan sonra staff ekleme işlemi çalışmalı
-- - Eğer hala sorun varsa, mevcut policy'leri inceleyip çakışan olanları düzeltmek gerekebilir
-- - Test için: İşletme sahibi olarak giriş yap ve staff eklemeyi dene
