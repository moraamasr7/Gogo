// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://opsgjcngteynzrisqkel.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc2dqY25ndGV5bnpyaXNxa2VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2MDI0NDIsImV4cCI6MjEwMzE3ODQ0Mn0.3rT3atsdQe8QT6M17SPBDnk6e9PMLe5mDkbmYK7L-BY';

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
