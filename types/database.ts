export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          user_type: 'customer' | 'business' | 'staff'
          name: string
          phone: string | null
          is_vip: boolean
          birthday: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          user_type: 'customer' | 'business' | 'staff'
          name: string
          phone?: string | null
          is_vip?: boolean
          birthday?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          user_type?: 'customer' | 'business' | 'staff'
          name?: string
          phone?: string | null
          is_vip?: boolean
          birthday?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string
          birthday: string | null
          favorite_businesses: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          email?: string | null
          phone: string
          birthday?: string | null
          favorite_businesses?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string
          birthday?: string | null
          favorite_businesses?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          business_name: string
          address: string
          latitude: number | null
          longitude: number | null
          category: string
          rating: number
          exterior_photo: string | null
          interior_photo: string | null
          description: string | null
          owner_id: string
          created_at: string
        }
        Insert: {
          id: string
          business_name: string
          address: string
          latitude?: number | null
          longitude?: number | null
          category?: string
          rating?: number
          exterior_photo?: string | null
          interior_photo?: string | null
          description?: string | null
          owner_id: string
          created_at?: string
        }
        Update: {
          id?: string
          business_name?: string
          address?: string
          latitude?: number | null
          longitude?: number | null
          category?: string
          rating?: number
          exterior_photo?: string | null
          interior_photo?: string | null
          description?: string | null
          owner_id?: string
          created_at?: string
        }
      }
      staff: {
        Row: {
          id: string
          business_id: string
          name: string | null
          email: string | null
          phone: string | null
          position: string
          description: string | null
          can_take_appointments: boolean
          avatar: string | null
          user_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name?: string | null
          email?: string | null
          phone?: string | null
          position: string
          description?: string | null
          can_take_appointments?: boolean
          avatar?: string | null
          user_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          position?: string
          description?: string | null
          can_take_appointments?: boolean
          avatar?: string | null
          user_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      staff_services: {
        Row: {
          id: string
          staff_id: string
          service_id: string
          created_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          service_id: string
          created_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          service_id?: string
          created_at?: string
        }
      }
      services: {
        Row: {
          id: string
          business_id: string
          name: string
          duration: number
          price: number
          description: string | null
          staff_ids: string[]
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          duration: number
          price: number
          description?: string | null
          staff_ids?: string[]
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          duration?: number
          price?: number
          description?: string | null
          staff_ids?: string[]
          is_active?: boolean
          created_at?: string
        }
      }
      working_hours: {
        Row: {
          id: string
          business_id: string
          day_of_week: number
          is_open: boolean
          open_time: string | null
          close_time: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          day_of_week: number
          is_open?: boolean
          open_time?: string | null
          close_time?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          day_of_week?: number
          is_open?: boolean
          open_time?: string | null
          close_time?: string | null
          created_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          business_id: string
          customer_id: string
          staff_id: string | null
          service_id: string
          appointment_date: string
          start_time: string
          end_time: string
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          notes: string | null
          is_vip_appointment: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          customer_id: string
          staff_id?: string | null
          service_id: string
          appointment_date: string
          start_time: string
          end_time: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          notes?: string | null
          is_vip_appointment?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          customer_id?: string
          staff_id?: string | null
          service_id?: string
          appointment_date?: string
          start_time?: string
          end_time?: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          notes?: string | null
          is_vip_appointment?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      business_vip_customers: {
        Row: {
          id: string
          business_id: string
          customer_id: string
          vip_since: string
          vip_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          customer_id: string
          vip_since?: string
          vip_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          customer_id?: string
          vip_since?: string
          vip_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      business_customers: {
        Row: {
          id: string
          business_id: string
          customer_id: string
          added_date: string
          customer_notes: string | null
          is_active: boolean
          last_contact_date: string | null
          total_appointments: number
          cancelled_appointments: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          customer_id: string
          added_date?: string
          customer_notes?: string | null
          is_active?: boolean
          last_contact_date?: string | null
          total_appointments?: number
          cancelled_appointments?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          customer_id?: string
          added_date?: string
          customer_notes?: string | null
          is_active?: boolean
          last_contact_date?: string | null
          total_appointments?: number
          cancelled_appointments?: number
          created_at?: string
          updated_at?: string
        }
      }
      customer_communications: {
        Row: {
          id: string
          business_id: string
          customer_id: string
          communication_type: 'sms' | 'whatsapp' | 'phone' | 'email'
          message: string | null
          sent_at: string
          status: 'sent' | 'delivered' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          customer_id: string
          communication_type: 'sms' | 'whatsapp' | 'phone' | 'email'
          message?: string | null
          sent_at?: string
          status?: 'sent' | 'delivered' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          customer_id?: string
          communication_type?: 'sms' | 'whatsapp' | 'phone' | 'email'
          message?: string | null
          sent_at?: string
          status?: 'sent' | 'delivered' | 'failed'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}