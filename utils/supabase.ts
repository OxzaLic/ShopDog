import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = "https://jsarfituazztwybrsunw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzYXJmaXR1YXp6dHd5YnJzdW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNzcxMjQsImV4cCI6MjA4NjY1MzEyNH0.K9WFwNbrTT2_g03hzdlzf-7y0M-XMXn78PVM-24Wgk0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
