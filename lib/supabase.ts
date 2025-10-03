import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Supabase bağlantı bilgileri
const supabaseUrl = 'https://crmjtblrhcebcnjcfvqm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybWp0YmxyaGNlYmNuamNmdnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NjgyODIsImV4cCI6MjA2ODI0NDI4Mn0.xJEcMJMvFRAYjU_Y2Ulkcd2xcIUOe35P9n-IvI3qEzA';

// Supabase istemcisini oluştur
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});