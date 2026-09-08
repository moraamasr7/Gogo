import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Order } from '@/types/database';
import OrderDetailClient from './OrderDetailClient';

export const revalidate = 0;

interface OrderDetailPageProps {
  params: {
    id: string;
  };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const supabase = createClient();

  const { data: orderData, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', params.id)
    .single();

  if (error || !orderData) {
    notFound();
  }

  const order: Order = orderData;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Back button */}
      <div className="flex items-center gap-2">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-3 py-1.5 rounded-xl shadow-sm transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة لقائمة الطلبات</span>
        </Link>
      </div>

      <OrderDetailClient initialOrder={order} />

    </div>
  );
}
