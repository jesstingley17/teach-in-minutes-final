import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      instructional_suites: {
        Row: {
          id: string;
          user_id: string | null;
          node_id: string;
          title: string;
          sections: any;
          output_type: string;
          bloom_level: string;
          differentiation: string;
          aesthetic: string;
          institution_name: string | null;
          instructor_name: string | null;
          doodle_base64: string | null;
          doodle_prompt: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          node_id: string;
          title: string;
          sections: any;
          output_type: string;
          bloom_level: string;
          differentiation: string;
          aesthetic: string;
          institution_name?: string | null;
          instructor_name?: string | null;
          doodle_base64?: string | null;
          doodle_prompt?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          node_id?: string;
          title?: string;
          sections?: any;
          output_type?: string;
          bloom_level?: string;
          differentiation?: string;
          aesthetic?: string;
          institution_name?: string | null;
          instructor_name?: string | null;
          doodle_base64?: string | null;
          doodle_prompt?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
