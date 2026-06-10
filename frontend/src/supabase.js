import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ezcnelnuphfyipcsifnv.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6Y25lbG51cGhmeWlwY3NpZm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTkwMDAsImV4cCI6MjA5NjIzNTAwMH0.Q1fs1G99kJtoWcc9mUR4YdyHDo2LbEl0A1uGmyOGDEA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
