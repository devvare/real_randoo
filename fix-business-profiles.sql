-- İşletme profili oluşturma trigger'ını düzelt

-- 1. Önce mevcut trigger'ı güncelle - işletme kaydı için businesses tablosuna da veri eklesin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Yeni kullanıcı için users tablosuna kayıt ekle
  INSERT INTO public.users (id, email, user_type, name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  
  -- Eğer kullanıcı tipi 'business' ise businesses tablosuna da kayıt ekle
  IF COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer') = 'business' THEN
    INSERT INTO public.businesses (id, business_name, address, category, rating)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'business_name', COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))),
      COALESCE(NEW.raw_user_meta_data->>'address', 'Adres belirtilmemiş'),
      COALESCE(NEW.raw_user_meta_data->>'category', 'berber'),
      0.0
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Mevcut business kullanıcıları için businesses tablosuna kayıt ekle
INSERT INTO public.businesses (id, business_name, address, category, rating, created_at)
SELECT 
  u.id,
  COALESCE(u.name, split_part(u.email, '@', 1)) as business_name,
  'İstanbul, Türkiye' as address,
  'berber' as category,
  4.5 as rating,
  NOW() as created_at
FROM public.users u
LEFT JOIN public.businesses b ON u.id = b.id
WHERE u.user_type = 'business' 
  AND b.id IS NULL;

-- 3. Test için örnek işletmeler ekle (eğer hiç işletme yoksa)
INSERT INTO public.businesses (id, business_name, address, category, rating, interior_photo, description, created_at)
SELECT 
  gen_random_uuid(),
  sb.business_name,
  sb.address,
  sb.category,
  sb.rating,
  sb.interior_photo,
  sb.description,
  sb.created_at
FROM (
  VALUES 
    ('Salon Güzellik', 'Kadıköy, İstanbul', 'güzellik', 4.8, 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop', 'Modern güzellik salonu. Profesyonel ekibimizle size en iyi hizmeti sunuyoruz.', NOW() - INTERVAL '30 days'),
    ('Berber Ahmet', 'Beşiktaş, İstanbul', 'berber', 4.9, 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop', 'Geleneksel berberlik sanatını modern tekniklerle birleştiriyoruz.', NOW() - INTERVAL '15 days'),
    ('Kuaför Elif', 'Şişli, İstanbul', 'kuaför', 4.7, 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop', 'Saç bakımında uzman ekibimizle size özel hizmet.', NOW() - INTERVAL '7 days'),
    ('Nail Art Studio', 'Beyoğlu, İstanbul', 'tırnak', 4.6, 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop', 'Tırnak sanatında en yeni trendleri takip ediyoruz.', NOW() - INTERVAL '3 days'),
    ('Spa & Wellness', 'Nişantaşı, İstanbul', 'spa', 4.8, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop', 'Rahatlatcı spa deneyimi için bizi tercih edin.', NOW() - INTERVAL '1 day')
) AS sb(business_name, address, category, rating, interior_photo, description, created_at)
WHERE NOT EXISTS (SELECT 1 FROM public.businesses LIMIT 1);

-- 4. Örnek hizmetler ekle
INSERT INTO public.services (business_id, name, duration, price, description, is_active, created_at)
SELECT 
  b.id,
  ss.service_name,
  ss.duration,
  ss.price,
  ss.description,
  true,
  NOW()
FROM public.businesses b
CROSS JOIN (
  VALUES 
    ('Saç Kesimi', 30, 150, 'Profesyonel saç kesimi ve şekillendirme'),
    ('Saç Boyama', 120, 300, 'Kaliteli boyalarla saç boyama hizmeti'),
    ('Makyaj', 45, 200, 'Özel gün makyajı'),
    ('Kaş Dizaynı', 20, 80, 'Kaş şekillendirme ve dizayn'),
    ('Tırnak Bakımı', 60, 120, 'Manikür ve pedikür hizmeti'),
    ('Cilt Bakımı', 90, 250, 'Profesyonel cilt bakım uygulaması')
) AS ss(service_name, duration, price, description)
WHERE NOT EXISTS (SELECT 1 FROM public.services LIMIT 1);

-- 5. Çalışma saatleri ekle (Pazartesi-Cumartesi 9:00-18:00)
INSERT INTO public.working_hours (business_id, day_of_week, is_open, open_time, close_time, created_at)
SELECT 
  b.id,
  day_num,
  CASE WHEN day_num = 0 THEN false ELSE true END, -- Pazar kapalı
  CASE WHEN day_num = 0 THEN null ELSE '09:00'::time END,
  CASE WHEN day_num = 0 THEN null ELSE '18:00'::time END,
  NOW()
FROM public.businesses b
CROSS JOIN generate_series(0, 6) AS day_num
WHERE NOT EXISTS (SELECT 1 FROM public.working_hours LIMIT 1);
