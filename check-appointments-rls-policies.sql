-- Appointments tablosundaki RLS politikalarını kontrol et
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'appointments'
ORDER BY policyname;

-- Ayrıca RLS'in aktif olup olmadığını kontrol et
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    forcerowsecurity as force_rls
FROM pg_tables 
WHERE tablename = 'appointments';
