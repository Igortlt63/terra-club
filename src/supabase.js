import { createClient } from '@supabase/supabase-js'

// Замените эти значения на ваши из Supabase → Settings → API
const SUPABASE_URL = 'https://https://qopumczpjeapymxsygan.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcHVtY3pwamVhcHlteHN5Z2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzEzOTksImV4cCI6MjA4OTUwNzM5OX0.lUZFE_szvwiGuYXMDgoaqz5RToP-WwsUfwTxvVMS4gk'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)