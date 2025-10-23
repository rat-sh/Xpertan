
import 'react-native-get-random-values'; // <- ADD THIS FIRST
import 'react-native-url-polyfill/auto';
console.log('=== SUPABASE.TS STARTING ===');
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

// Safe fallback to prevent crash
const supabaseUrl = SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = SUPABASE_ANON_KEY || 'placeholder-key';

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!isSupabaseConfigured) {
  console.warn('âš ï¸ Missing Supabase env vars');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string;
          role: 'student' | 'teacher';
          batch_id: string | null;
          parent_contact: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      exams: {
        Row: {
          id: string;
          title: string;
          key: string;
          questions: any;
          duration: number;
          negative_marking: number;
          positive_marks: number;
          teacher_id: string;
          batch_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['exams']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['exams']['Insert']>;
      };
      exam_attempts: {
        Row: {
          id: string;
          exam_id: string;
          student_id: string;
          answers: any;
          question_times: any;
          score: number;
          total_marks: number;
          completed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['exam_attempts']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['exam_attempts']['Insert']>;
      };
      batches: {
        Row: {
          id: string;
          name: string;
          teacher_id: string;
          teacher_name: string;
          student_count: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['batches']['Row'], 'id' | 'created_at' | 'student_count'>;
        Update: Partial<Database['public']['Tables']['batches']['Insert']>;
      };
    };
  };
}
