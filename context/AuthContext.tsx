import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Database } from '@/types/database';

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
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      // Get user profile
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (userError) throw userError;

      let authUser: AuthUser = userProfile;

      // Load additional profile data based on user type
      if (userProfile.user_type === 'customer') {
        const { data: customerData } = await supabase
          .from('customers')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();
        
        if (customerData) {
          authUser.customer = customerData;
        }
      } else if (userProfile.user_type === 'business') {
        const { data: businessData } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();
        
        if (businessData) {
          authUser.business = businessData;
        }
      } else if (userProfile.user_type === 'staff') {
        const { data: staffData } = await supabase
          .from('staff')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();
        
        if (staffData) {
          authUser.staff = staffData;
        }
      }

      setUser(authUser);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const register = async (userData: RegisterData) => {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

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

    if (userError) throw userError;

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
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};