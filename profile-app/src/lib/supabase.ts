import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qgctltxcgsnbrdtbhmay.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnY3RsdHhjZ3NuYnJkdGJobWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjgwNTcsImV4cCI6MjA5MDYwNDA1N30.-TS1CofnGMGAj38OrZAvtphbHPXQWZWtysO83_960M4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
