import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { router } from 'expo-router';

type UserProfile = Database['public']['Tables']['users']['Row'];
type CustomerProfile = Database['public']['Tables']['customers']['Row'];
type BusinessProfile = Database['public']['Tables']['businesses']['Row'];
type StaffProfile = Database['public']['Tables']['staff']['Row'];

interface AuthUser extends UserProfile {
  customer?: CustomerProfile;
  business?: BusinessProfile;
  staff?: StaffProfile;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  user_type: 'customer' | 'business' | 'staff';
  name: string;
  phone?: string;
  // Customer specific
  first_name?: string;
  last_name?: string;
  birthday?: string;
  // Business specific
  business_name?: string;
  address?: string;
  category?: string;
  // Staff specific
  business_id?: string;
  position?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && isMounted) {
        loadUserProfile(session.user);
      } else if (isMounted) {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && isMounted) {
        await loadUserProfile(session.user);
      } else if (isMounted) {
        setUser(null);
        setIsLoading(false);
        // Eğer oturum kapandıysa ve event SIGNED_OUT ise login sayfasına yönlendir
        if (event === 'SIGNED_OUT') {
          router.replace('/auth/login');
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Loading user profile for:', supabaseUser.id);
      
      // Önce staff tablosundan kontrol et
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, user_id, status, name, email, phone, business_id')
        .eq('user_id', supabaseUser.id)
        .eq('status', 'active')
        .single();
      
      if (staffData && !staffError) {
        console.log('User is staff, creating staff profile');
        let authUser: AuthUser = {
          id: supabaseUser.id,
          email: staffData.email || supabaseUser.email || '',
          user_type: 'staff',
          name: staffData.name || '',
          phone: staffData.phone || '',
          created_at: supabaseUser.created_at,
          updated_at: new Date().toISOString()
        };
        
        console.log('Staff profile loaded:', {
          id: authUser.id,
          email: authUser.email,
          user_type: authUser.user_type,
          name: authUser.name
        });
        
        setUser(authUser);
        setIsLoading(false);
        return;
      }
      
      // Staff değilse users tablosundan almaya çalış
      try {
        const { data: userProfile, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        if (userError && userError.code === 'PGRST116') {
          console.log('User profile not found in users table, signing out:', supabaseUser.id);
          await supabase.auth.signOut();
          setUser(null);
          setIsLoading(false);
          router.replace('/auth/login');
          return;
        } else if (userError) {
          throw userError;
        }

        let authUser: AuthUser = userProfile;
        console.log('User profile loaded from users table:', {
          id: userProfile.id,
          email: userProfile.email,
          user_type: userProfile.user_type,
          name: userProfile.name
        });
        
        setUser(authUser);
        setIsLoading(false);
        return;
      } catch (error) {
        console.error('Users table access failed, creating minimal profile:', error);
        // Minimal profil oluştur
        let authUser: AuthUser = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          user_type: 'customer',
          name: supabaseUser.user_metadata?.name || '',
          phone: supabaseUser.user_metadata?.phone || '',
          created_at: supabaseUser.created_at,
          updated_at: new Date().toISOString()
        };
        
        console.log('Minimal customer profile created:', {
          id: authUser.id,
          email: authUser.email,
          user_type: authUser.user_type
        });
        
        setUser(authUser);
        setIsLoading(false);
        return;
      }

      // Load additional profile data based on user type
      if (userProfile.user_type === 'customer') {
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();
        
        if (customerError && customerError.code === 'PGRST116') {
          // Müşteri profili yoksa oluştur
          const { data: newCustomer, error: createCustomerError } = await supabase
            .from('customers')
            .insert({
              id: supabaseUser.id,
              first_name: userProfile.name || '',
              last_name: '',
            })
            .select()
            .single();
            
          if (!createCustomerError && newCustomer) {
            authUser.customer = newCustomer;
          }
        } else if (customerData) {
          authUser.customer = customerData;
        }
      } else if (userProfile.user_type === 'business') {
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();
        
        if (businessError && businessError.code !== 'PGRST116') {
          console.error('Error loading business profile:', businessError);
        } else if (businessData) {
          authUser.business = businessData;
        }
      } else if (userProfile.user_type === 'staff') {
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();
        
        if (staffError && staffError.code !== 'PGRST116') {
          console.error('Error loading staff profile:', staffError);
        } else if (staffData) {
          authUser.staff = staffData;
        }
      }

      setUser(authUser);
      console.log('User state updated:', {
        user_type: authUser.user_type,
        hasCustomer: !!authUser.customer,
        hasBusiness: !!authUser.business,
        hasStaff: !!authUser.staff
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error.message, error.status);
        throw error;
      }
      
      if (!data.user) {
        console.error('Login failed: No user returned');
        throw new Error('Giriş başarısız oldu');
      }
      
      console.log('Login successful for user:', data.user.id);
      
      // E-posta doğrulaması kontrolü
      if (data.user.email_confirmed_at === null) {
        console.warn('Email not confirmed yet');
        throw new Error('Lütfen e-posta adresinizi doğrulayın');
      }
      
      // Kullanıcı profilini yükle
      await loadUserProfile(data.user);
      
      // Kullanıcı profilini yükledikten sonra yönlendirme yapmak için
      // users tablosuna 406 hatası alındığı için staff tablosundan kontrol edelim
      console.log('Checking user type for redirection...');
      
      // Önce staff tablosundan kontrol et
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, user_id, status')
        .eq('user_id', data.user.id)
        .eq('status', 'active')
        .single();
      
      if (staffData && !staffError) {
        console.log('User is staff, redirecting to staff dashboard');
        router.replace('/(staff)');
        return;
      }
      
      // Staff değilse users tablosundan user_type'ı almaya çalış
      try {
        const { data: userProfile, error: userError } = await supabase
          .from('users')
          .select('user_type')
          .eq('id', data.user.id)
          .single();
        
        if (!userError && userProfile?.user_type === 'business') {
          console.log('Redirecting to business dashboard');
          router.replace('/(business)');
        } else {
          console.log('Redirecting to customer dashboard (fallback)');
          router.replace('/(customer)');
        }
      } catch (error) {
        console.error('Users table query failed, defaulting to customer:', error);
        console.log('Redirecting to customer dashboard (error fallback)');
        router.replace('/(customer)');
      }
    } catch (error) {
      console.error('Login process error:', error);
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      // Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            user_type: userData.user_type,
            name: userData.name,
            phone: userData.phone,
            ...(userData.user_type === 'customer' && {
              first_name: userData.first_name,
              last_name: userData.last_name,
              birthday: userData.birthday,
            }),
            ...(userData.user_type === 'business' && {
              business_name: userData.business_name,
              address: userData.address,
              category: userData.category,
            }),
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      console.log('Auth user created:', authData.user.id);
      
      // Kullanıcı oluşturulduktan sonra oturum açma işlemi
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password,
      });
      
      if (signInError) throw signInError;
      console.log('User signed in after registration');

      // Create user profile
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          user_type: userData.user_type,
          name: userData.name,
          phone: userData.phone,
        });

      if (userError) {
        console.error('User profile creation error:', userError);
        throw userError;
      }
      
      console.log('User profile created successfully');

      // Create type-specific profile
      if (userData.user_type === 'customer') {
        const { error: customerError } = await supabase
          .from('customers')
          .insert({
            id: authData.user.id,
            first_name: userData.first_name!,
            last_name: userData.last_name!,
            birthday: userData.birthday,
          });

        if (customerError) throw customerError;
      } else if (userData.user_type === 'business') {
        const { error: businessError } = await supabase
          .from('businesses')
          .insert({
            id: authData.user.id,
            business_name: userData.business_name!,
            address: userData.address!,
            category: userData.category || 'berber',
          });

        if (businessError) throw businessError;

        // Create default working hours
        const workingHours = [];
        for (let day = 1; day <= 6; day++) { // Monday to Saturday
          workingHours.push({
            business_id: authData.user.id,
            day_of_week: day,
            is_open: true,
            open_time: '09:00',
            close_time: '18:00',
          });
        }
        // Sunday closed
        workingHours.push({
          business_id: authData.user.id,
          day_of_week: 0,
          is_open: false,
        });

        const { error: hoursError } = await supabase
          .from('working_hours')
          .insert(workingHours);

        if (hoursError) throw hoursError;
      } else if (userData.user_type === 'staff') {
        const { error: staffError } = await supabase
          .from('staff')
          .insert({
            id: authData.user.id,
            business_id: userData.business_id!,
            position: userData.position!,
          });

        if (staffError) throw staffError;
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Kullanıcıyı login sayfasına yönlendir
      setUser(null);
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};