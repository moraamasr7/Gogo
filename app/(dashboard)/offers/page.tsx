import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Offer } from '@/types/database';
import OffersClient from './OffersClient';

export const revalidate = 0;

export default async function AdminOffersPage() {
  const supabase = createClient();

  const { data: offersData } = await supabase
    .from('offers')
    .select('*')
    .order('sort_order', { ascending: true });

  const offers: Offer[] = offersData || [];

  return (
    <div className="space-y-6">
      <OffersClient initialOffers={offers} />
    </div>
  );
}
