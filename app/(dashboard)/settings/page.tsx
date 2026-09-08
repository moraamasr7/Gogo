import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { SettingItem } from '@/types/database';
import SettingsClient from './SettingsClient';

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const supabase = createClient();

  const { data: settingsData } = await supabase
    .from('settings')
    .select('*')
    .order('key', { ascending: true });

  const settings: SettingItem[] = settingsData || [];

  return (
    <div className="space-y-6">
      <SettingsClient initialSettings={settings} />
    </div>
  );
}
