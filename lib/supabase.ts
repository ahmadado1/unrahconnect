import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://yqabuipymbaylholmmoi.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxYWJ1aXB5bWJheWxob2xtbW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDc3ODIsImV4cCI6MjA5MzcyMzc4Mn0.tJly9kx4fdBzuNcyaM11ELLbu51q3AI8d2Vnq2LkYr0"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})