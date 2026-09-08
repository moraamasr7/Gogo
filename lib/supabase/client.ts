// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zbmogwlpmamgiyijwobw.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpibW9nd2xwbWFtZ2l5aWp3b2J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4OTU5NDIsImV4cCI6MjEwNDQ3MTk0Mn0.xPxeAeTEQdJb3qB_5BjMkNPBSfg54lA1xnt5-GGfUIo';

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
