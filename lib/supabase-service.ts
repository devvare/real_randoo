import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Service role key ile RLS bypass için özel client
const supabaseUrl = 'https://crmjtblrhcebcnjcfvqm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybWp0YmxyaGNlYmNuamNmdnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY2ODI4MiwiZXhwIjoyMDY4MjQ0MjgyfQ.Vv8VJMvQJqHPJKJqJqHPJKJqJqHPJKJqJqHPJKJqJqH'; // Bu gerçek service key değil, sadece örnek

// UYARI: Service role sadece server-side veya güvenli operasyonlar için kullanılmalı
// Bu client sadece çakışma kontrolü gibi güvenli okuma işlemleri için kullanılacak
export const supabaseService = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
