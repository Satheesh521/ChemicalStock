import { createClient } from '@supabase/supabase-js';

// Database type definitions
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: 'user' | 'admin' | 'manager';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      chemicals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          formula: string | null;
          cas_number: string | null;
          hazard_class: string | null;
          total_stock: number;
          current_stock: number;
          unit: 'kg' | 'g' | 'L' | 'ml' | 'mol' | 'pcs';
          min_threshold: number;
          location: string | null;
          supplier: string | null;
          batch_number: string | null;
          start_date: string | null;
          end_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['chemicals']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['chemicals']['Insert']>;
      };
      stock_in: {
        Row: {
          id: string;
          chemical_id: string;
          user_id: string;
          quantity: number;
          unit: 'kg' | 'g' | 'L' | 'ml' | 'mol' | 'pcs';
          supplier: string | null;
          batch_number: string | null;
          expiry_date: string | null;
          purchase_date: string;
          cost: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['stock_in']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['stock_in']['Insert']>;
      };
      stock_out: {
        Row: {
          id: string;
          chemical_id: string;
          user_id: string;
          quantity: number;
          unit: 'kg' | 'g' | 'L' | 'ml' | 'mol' | 'pcs';
          purpose: string | null;
          department: string | null;
          requested_by: string | null;
          approved_by: string | null;
          stock_out_date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['stock_out']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['stock_out']['Insert']>;
      };
      alerts: {
        Row: {
          id: string;
          chemical_id: string;
          user_id: string;
          alert_type: 'low_stock' | 'expiring_soon' | 'expired' | 'system';
          message: string;
          severity: 'info' | 'warning' | 'critical';
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['alerts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['alerts']['Insert']>;
      };
    };
  };
};

import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase client initialization with AsyncStorage for session persistence
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});