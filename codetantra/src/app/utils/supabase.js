import { createClient } from '@supabase/supabase-js';

// Supabase credentials (from user)
const SUPABASE_URL = 'https://boiaybahnnasmnkmnegv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvaWF5YmFobm5hc21ua21uZWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExOTgzNDIsImV4cCI6MjA3Njc3NDM0Mn0.6bMCw7jJxW7jWROiAfHVWncADuO74MEd4jsJMaoUq-M';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // we'll manage sessions manually
  },
});

export default supabase;
