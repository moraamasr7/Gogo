import React from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Clock, 
  Hammer, 
  CheckCircle2, 
  Coins, 
  ArrowUpRight, 
  ArrowLeft,
  AlertTriangle,
  Package
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatPrice, formatDate, getStatusLabel } from '@/lib/utils';
import { Order, Product } from '@/types/database';

export const revalidate = 0; // Fresh live data on each load

export default async function AdminDashboardPage() {
  const supabase = createClient();

  // 1. Fetch Orders with details
  const { data: ordersData } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  const orders: Order[] = ordersData || [];

  // 2. Fetch Products
  const { data: productsData } = await supabase
    .from('products')
    .select('*')
    .order('stock', { ascending: true });

  const products: Product[] = productsData || [];

  // 3. Compute Metrics
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const confirmedOrders = orders.filter(o => o.status === 'confirmed');
  const processingOrders = orders.filter(o => o.status === 'processing');
  const readyOrders = orders.filter(o => o.status === 'ready_for_shipping');
  const completedOrders = orders.filter(o => o.status === 'completed');

  const totalSales = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const collectedDeposits = orders
    .filter(o => ['confirmed', 'processing', 'ready_for_shipping', 'completed'].includes(o.status))
    .reduce((sum, o) => sum + Number(o.deposit_amount || 0), 0);

  const outstandingBalance = orders
    .filter(o => ['confirmed', 'processing', 'ready_for_shipping'].includes(o.status))
    .reduce((sum, o) => sum + Number(o.remaining_amount || 0), 0);

  const recentOrders = orders.slice(0, 6);
  const lowStockProducts = products.filter(p => p.stock <= 5 && p.is_active);

  return (
    <div className="space-y-8">
      
      {/* Top Welcome & Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
            لوحة قيادة المتجر
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            نظرة شاملة على الإيرادات ومراحل تنفيذ طلبات الكونكريت
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-brass-500 text-sand-50 dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-brass-400 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>عرض كل الطلبات</span>
            <ArrowLeft className="w-3.5 h-3.5 text-brass-400 dark:text-stone-950" />
          </Link>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">إجمالي المبيعات المؤكدة</span>
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono text-stone-950 dark:text-white">
            {formatPrice(totalSales)}
          </p>
          <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 block">من كافة الطلبات النشطة</span>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">العربون المحصل مقدماً</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-800 dark:text-emerald-400">
            {formatPrice(collectedDeposits)}
          </p>
          <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 block">محولة عبر فودافون كاش / إنستاباي</span>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">المتبقي للتحصيل عند التسليم</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono text-amber-900 dark:text-amber-300">
            {formatPrice(outstandingBalance)}
          </p>
          <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 block">يُحصل بواسطة مندوب الشحن</span>
        </div>

      </div>

      {/* Orders Pipeline Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        <Link href="/orders?status=pending" className="p-4 rounded-2xl bg-amber-50 border border-amber-200 hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-xs font-bold text-amber-800 mb-1">
            <span>طلبات جديدة بانتظار العربون</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-black font-mono text-amber-950">{pendingOrders.length}</span>
        </Link>

        <Link href="/orders?status=processing" className="p-4 rounded-2xl bg-purple-50 border border-purple-200 hover:border-purple-300 transition-colors">
          <div className="flex items-center justify-between text-xs font-bold text-purple-800 mb-1">
            <span>قيد الصب والتنفيذ</span>
            <Hammer className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-black font-mono text-purple-950">{processingOrders.length + confirmedOrders.length}</span>
        </Link>

        <Link href="/orders?status=ready_for_shipping" className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-800 mb-1">
            <span>جاهزة للتسليم والشحن</span>
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-2xl font-black font-mono text-indigo-950">{readyOrders.length}</span>
        </Link>

        <Link href="/orders?status=completed" className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800 mb-1">
            <span>طلبات مكتملة ومسلمة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black font-mono text-emerald-950">{completedOrders.length}</span>
        </Link>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-stone-100">
            <h2 className="text-base font-bold text-stone-900">أحدث الطلبات</h2>
            <Link href="/orders" className="text-xs font-semibold text-stone-600 hover:text-stone-900">
              إدارة الكل ←
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-10 text-stone-400 text-xs">
              لا توجد طلبات مسجلة بعد.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="text-stone-400 border-b border-stone-100 font-semibold">
                    <th className="pb-3 pr-2">رقم الطلب</th>
                    <th className="pb-3">العميل</th>
                    <th className="pb-3">الإجمالي</th>
                    <th className="pb-3">العربون</th>
                    <th className="pb-3">الحالة</th>
                    <th className="pb-3">التاريخ</th>
                    <th className="pb-3 pl-2 text-left">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {recentOrders.map((order) => {
                    const statusInfo = getStatusLabel(order.status);
                    return (
                      <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 pr-2 font-mono font-bold text-stone-900">
                          #{order.order_number}
                        </td>
                        <td className="py-3">
                          <div className="font-semibold text-stone-900">{order.customer_name}</div>
                          <div className="text-[11px] text-stone-400 font-mono" dir="ltr">{order.customer_phone}</div>
                        </td>
                        <td className="py-3 font-mono font-bold text-stone-900">
                          {formatPrice(order.total_amount)}
                        </td>
                        <td className="py-3 font-mono text-emerald-700">
                          {formatPrice(order.deposit_amount)}
                        </td>
                        <td className="py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-md border text-[11px] font-semibold ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="py-3 text-[11px] text-stone-400">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="py-3 pl-2 text-left">
                          <Link
                            href={`/orders/${order.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-semibold transition-colors"
                          >
                            <span>تفاصيل</span>
                            <ArrowLeft className="w-3 h-3" />
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

        {/* Low Stock Alerts & Quick Products */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>تنبيهات المخزون المنخفض</span>
              </h2>
              <Link href="/products" className="text-xs font-semibold text-stone-500 hover:text-stone-800">
                المخزون ←
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-stone-500 py-4 text-center">
                جميع المنتجات بمخزون كافٍ ووفير 👍
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-stone-50 border border-stone-200/80">
                    <span className="font-semibold text-stone-900 truncate max-w-[160px]">{p.name_ar}</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono font-bold">
                      متبقي {p.stock} فقط
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="p-6 rounded-3xl bg-stone-900 text-sand-50 shadow-md">
            <h3 className="font-bold text-sm mb-2 text-white">إجراءات سريعة</h3>
            <p className="text-xs text-stone-400 mb-4">
              إضافة قطعة كونكريت جديدة أو تحديث أرقام فودافون كاش وإنستاباي
            </p>
            <div className="space-y-2">
              <Link
                href="/products"
                className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold flex items-center justify-between text-sand-50 transition-colors"
              >
                <span>إضافة منتج جديد</span>
                <Package className="w-3.5 h-3.5 text-brass-400" />
              </Link>
              <Link
                href="/settings"
                className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold flex items-center justify-between text-sand-50 transition-colors"
              >
                <span>تعديل إعدادات الدفع</span>
                <Coins className="w-3.5 h-3.5 text-brass-400" />
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
