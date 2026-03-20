import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://qopumczpjeapymxsygan.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcHVtY3pwamVhcHlteHN5Z2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzEzOTksImV4cCI6MjA4OTUwNzM5OX0.lUZFE_szvwiGuYXMDgoaqz5RToP-WwsUfwTxvVMS4gk'
)

export { supabase }