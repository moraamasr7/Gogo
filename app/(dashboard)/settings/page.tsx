import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { SettingItem } from '@/types/database';
import SettingsClient from './SettingsClient';
import AdminSecuritySettings from './AdminSecuritySettings';

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const supabase = createClient();

  // Fetch settings & current logged-in user
  const [{ data: settingsData }, { data: { user } }] = await Promise.all([
    supabase
      .from('settings')
      .select('*')
      .order('key', { ascending: true }),
    supabase.auth.getUser(),
  ]);

  const settings: SettingItem[] = settingsData || [];
  const currentEmail = user?.email || 'admin@gogoconcrete.com';

  return (
    <div className="space-y-8 max-w-4xl">
      {/* 1. Admin Account Security Credentials */}
      <AdminSecuritySettings currentEmail={currentEmail} />

      {/* 2. Public Store Configuration & Payment Settings */}
      <SettingsClient initialSettings={settings} />
    </div>
  );
}
