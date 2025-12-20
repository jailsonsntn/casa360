
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pejhyxtubwokgalmdnbc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlamh5eHR1Yndva2dhbG1kbmJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxOTI1NDQsImV4cCI6MjA4MTc2ODU0NH0.2_HXkt01D2_wC_phuEVpwcD9BJWyFjK2yG7XwROzg-I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
