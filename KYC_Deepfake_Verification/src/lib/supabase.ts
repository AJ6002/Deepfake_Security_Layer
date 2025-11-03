import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          date_of_birth: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          date_of_birth?: string | null;
        };
        Update: {
          full_name?: string;
          email?: string;
          phone?: string | null;
          date_of_birth?: string | null;
        };
      };
      kyc_verifications: {
        Row: {
          id: string;
          user_id: string;
          aadhaar_number: string;
          pan_number: string | null;
          address_line1: string;
          address_line2: string | null;
          city: string;
          state: string;
          pincode: string;
          document_type: string;
          document_url: string;
          photo_url: string;
          verification_status: 'pending' | 'under_review' | 'verified' | 'rejected';
          rejection_reason: string | null;
          verified_at: string | null;
          submitted_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          aadhaar_number: string;
          pan_number?: string | null;
          address_line1: string;
          address_line2?: string | null;
          city: string;
          state: string;
          pincode: string;
          document_type?: string;
          document_url: string;
          photo_url: string;
        };
        Update: {
          aadhaar_number?: string;
          pan_number?: string | null;
          address_line1?: string;
          address_line2?: string | null;
          city?: string;
          state?: string;
          pincode?: string;
          document_url?: string;
          photo_url?: string;
        };
      };
    };
  };
};
