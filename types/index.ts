import { Database } from './database';

export type UserType = 'customer' | 'business' | 'staff';

export type User = Database['public']['Tables']['users']['Row'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type Business = Database['public']['Tables']['businesses']['Row'];
export type Staff = Database['public']['Tables']['staff']['Row'];
export type Service = Database['public']['Tables']['services']['Row'];
export type Appointment = Database['public']['Tables']['appointments']['Row'];
export type WorkingHours = Database['public']['Tables']['working_hours']['Row'];

export interface CustomerGroup {
  id: string;
  name: string;
  customers: Customer[];
  count: number;
}

// Extended types with relations
export interface BusinessWithDetails extends Business {
  services?: Service[];
  staff?: Staff[];
  working_hours?: WorkingHours[];
}

export interface AppointmentWithDetails extends Appointment {
  customer?: Customer;
  business?: Business;
  staff?: Staff;
  service?: Service;
}