import React from 'react';
import Link from 'next/link';
import { Search, ArrowLeft, Eye, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatPrice, formatDate, getStatusLabel } from '@/lib/utils';
import { Order, OrderStatus } from '@/types/database';

export const revalidate = 0;

interface OrdersPageProps {
  searchParams?: {
    status?: string;
    q?: string;
  };
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const supabase = createClient();
  const activeStatus = searchParams?.status || 'all';
  const query = searchParams?.q?.trim() || '';

  let dbQuery = supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (activeStatus !== 'all') {
    dbQuery = dbQuery.eq('status', activeStatus);
  }

  if (query) {
    dbQuery = dbQuery.or(`order_number.ilike.%${query}%,customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%`);
  }

  const { data: ordersData } = await dbQuery;
  const orders: Order[] = ordersData || [];

  const statusFilters = [
    { key: 'all', label: 'جميع الطلبات' },
    { key: 'pending', label: 'معلق' },
    { key: 'confirmed', label: 'مؤكد' },
    { key: 'processing', label: 'قيد الصب' },
    { key: 'ready_for_shipping', label: 'جاهز للشحن' },
    { key: 'completed', label: 'مكتمل' },
    { key: 'cancelled', label: 'ملغي' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            إدارة الطلبات والمبيعات
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            متابعة إيصالات العربون وتحديث مراحل تصنيع وشحن القطع
          </p>
        </div>

        <div className="text-xs font-semibold text-stone-600 bg-white border border-stone-200 px-3 py-2 rounded-xl shadow-sm self-start">
          إجمالي النتائج: <span className="font-mono font-bold text-stone-950">{orders.length}</span> طلب
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
        
        {/* Search input form */}
        <form method="GET" className="relative">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="ابحث برقم الطلب (مثال: GOGO-8F) أو اسم العميل أو الهاتف..."
            className="w-full pr-10 pl-24 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
          />
          <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
          
          {activeStatus !== 'all' && (
            <input type="hidden" name="status" value={activeStatus} />
          )}

          <button
            type="submit"
            className="absolute left-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-stone-900 text-sand-50 text-[11px] font-bold hover:bg-stone-800"
          >
            بحث
          </button>
        </form>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {statusFilters.map((tab) => {
            const isActive = activeStatus === tab.key;
            const queryParams = new URLSearchParams();
            if (tab.key !== 'all') queryParams.set('status', tab.key);
            if (query) queryParams.set('q', query);
            const href = `/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

            return (
              <Link
                key={tab.key}
                href={href}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/80'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center py-16 text-stone-400 text-xs">
            لا توجد طلبات مطابقة للبحث أو الفلتر المحدد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-stone-50/80 text-stone-400 border-b border-stone-100 font-semibold">
                  <th className="py-3.5 pr-6">رقم الطلب</th>
                  <th className="py-3.5 px-4">بيانات العميل</th>
                  <th className="py-3.5 px-4">الإجمالي</th>
                  <th className="py-3.5 px-4">العربون</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4">الإيصال</th>
                  <th className="py-3.5 px-4">التاريخ</th>
                  <th className="py-3.5 pl-6 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {orders.map((order) => {
                  const statusInfo = getStatusLabel(order.status);
                  const hasReceipt = Boolean(order.payment_screenshot_path);

                  return (
                    <tr key={order.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-4 pr-6 font-mono font-bold text-stone-900">
                        #{order.order_number}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-stone-900">{order.customer_name}</div>
                        <div className="text-[11px] text-stone-400 font-mono" dir="ltr">{order.customer_phone}</div>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-stone-900">
                        {formatPrice(order.total_amount)}
                      </td>
                      <td className="py-4 px-4 font-mono text-emerald-700">
                        {formatPrice(order.deposit_amount)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {hasReceipt ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            مرفوع ✓
                          </span>
                        ) : (
                          <span className="text-[11px] text-stone-400">
                            بدون
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-[11px] text-stone-400 whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="py-4 pl-6 text-left whitespace-nowrap">
                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-semibold shadow-sm transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 text-brass-400" />
                          <span>عرض وتحديث</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
