import React from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Clock, 
  Hammer, 
  CheckCircle2, 
  Coins, 
  ArrowLeft,
  AlertTriangle,
  Package,
  Sparkles,
  Tag,
  TrendingUp
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatPrice, formatDate, getStatusLabel } from '@/lib/utils';
import { Order, Product, Offer } from '@/types/database';

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

  // 3. Fetch Offers
  const { data: offersData } = await supabase
    .from('offers')
    .select('*')
    .order('sort_order', { ascending: true });

  const offers: Offer[] = offersData || [];
  const activeOffers = offers.filter(o => o.is_active);

  // 4. Compute Metrics
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

  // Today's snapshot
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayOrders = orders.filter(o => new Date(o.created_at) >= todayStart);
  const todaySales = todayOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const recentOrders = orders.slice(0, 6);
  const lowStockProducts = products.filter(p => p.stock <= 5 && p.is_active);

  return (
    <div className="space-y-8">
      
      {/* Top Welcome & Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
              لوحة قيادة المتجر
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sand-200 dark:bg-stone-800 text-stone-800 dark:text-brass-400 text-[11px] font-bold">
              Gogo Concrete 🏺
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            نظرة شاملة ولحظية على الإيرادات، مراحل تنفيذ قطع الكونكريت، ومتابعة الطلبات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/orders"
            className="px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-brass-500 text-sand-50 dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-brass-400 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>إدارة الطلبات</span>
            <ArrowLeft className="w-3.5 h-3.5 text-brass-400 dark:text-stone-950" />
          </Link>
          <Link
            href="/products"
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 text-xs font-bold transition-all"
          >
            <span>المنتجات</span>
          </Link>
        </div>
      </div>

      {/* Today's Highlight Strip (5-second owner overview) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-sand-100 via-white to-sand-50 dark:from-stone-900 dark:via-stone-900 dark:to-stone-800 border border-sand-200/80 dark:border-stone-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-stone-900 dark:bg-brass-500 text-sand-50 dark:text-stone-950 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-900 dark:text-white block">نشاط اليوم</span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">تحديث فوري ومباشر لطلبات اليوم</span>
          </div>
        </div>

        <div className="flex items-center gap-6 sm:gap-10">
          <div>
            <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 block">طلبات اليوم</span>
            <span className="text-lg font-black font-mono text-stone-900 dark:text-white">
              {todayOrders.length} طلب
            </span>
          </div>
          <div className="h-8 w-px bg-stone-200 dark:bg-stone-800" />
          <div>
            <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 block">مبيعات اليوم</span>
            <span className="text-lg font-black font-mono text-stone-900 dark:text-white">
              {formatPrice(todaySales)}
            </span>
          </div>
          <div className="h-8 w-px bg-stone-200 dark:bg-stone-800" />
          <div>
            <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 block">بانتظار التأكيد</span>
            <span className="text-lg font-black font-mono text-amber-600 dark:text-amber-400">
              {pendingOrders.length}
            </span>
          </div>
        </div>
      </div>

      {/* Urgent Attention Alert Banner (If pending orders exist) */}
      {pendingOrders.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                لديكِ {pendingOrders.length} طلب جديد بانتظار مراجعة إيصال التحويل!
              </h3>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-400 mt-0.5">
                قام العملاء برفع صور الإيصالات وفي انتظار تأكيدكِ لبدء خلط وصب القطع وإرسال رسالة واتساب.
              </p>
            </div>
          </div>
          <Link
            href="/orders?status=pending"
            className="px-3.5 py-1.5 rounded-xl bg-amber-900 dark:bg-amber-500 text-white dark:text-stone-950 text-xs font-bold hover:bg-amber-800 dark:hover:bg-amber-400 transition-colors shrink-0 self-start sm:self-center"
          >
            مراجعة الطلبات الآن ←
          </Link>
        </div>
      )}

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
        
        <Link 
          href="/orders?status=pending" 
          className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
            <span>طلبات جديدة</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-2xl font-black font-mono text-amber-950 dark:text-amber-100">{pendingOrders.length}</span>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 block mt-0.5">بانتظار فحص العربون</span>
        </Link>

        <Link 
          href="/orders?status=processing" 
          className="p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-bold text-purple-800 dark:text-purple-300 mb-1">
            <span>قيد الصب والتنفيذ</span>
            <Hammer className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-2xl font-black font-mono text-purple-950 dark:text-purple-100">{processingOrders.length + confirmedOrders.length}</span>
          <span className="text-[10px] text-purple-700 dark:text-purple-400 block mt-0.5">في الورشة حالياً</span>
        </Link>

        <Link 
          href="/orders?status=ready_for_shipping" 
          className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-bold text-indigo-800 dark:text-indigo-300 mb-1">
            <span>جاهزة للشحن</span>
            <ShoppingBag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-2xl font-black font-mono text-indigo-950 dark:text-indigo-100">{readyOrders.length}</span>
          <span className="text-[10px] text-indigo-700 dark:text-indigo-400 block mt-0.5">جاهزة للاستلام</span>
        </Link>

        <Link 
          href="/orders?status=completed" 
          className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
            <span>طلبات مكتملة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-2xl font-black font-mono text-emerald-950 dark:text-emerald-100">{completedOrders.length}</span>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block mt-0.5">تم تسليمها للعميل</span>
        </Link>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-stone-100 dark:border-stone-800">
            <h2 className="text-base font-bold text-stone-900 dark:text-white">أحدث الطلبات</h2>
            <Link href="/orders" className="text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white">
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
                  <tr className="text-stone-400 border-b border-stone-100 dark:border-stone-800 font-semibold">
                    <th className="pb-3 pr-2">رقم الطلب</th>
                    <th className="pb-3">العميل</th>
                    <th className="pb-3">الإجمالي</th>
                    <th className="pb-3">العربون</th>
                    <th className="pb-3">الحالة</th>
                    <th className="pb-3">التاريخ</th>
                    <th className="pb-3 pl-2 text-left">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-medium">
                  {recentOrders.map((order) => {
                    const statusInfo = getStatusLabel(order.status);
                    return (
                      <tr key={order.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors">
                        <td className="py-3 pr-2 font-mono font-bold text-stone-900 dark:text-white">
                          #{order.order_number}
                        </td>
                        <td className="py-3">
                          <div className="font-semibold text-stone-900 dark:text-white">{order.customer_name}</div>
                          <div className="text-[11px] text-stone-400 font-mono" dir="ltr">{order.customer_phone}</div>
                        </td>
                        <td className="py-3 font-mono font-bold text-stone-900 dark:text-white">
                          {formatPrice(order.total_amount)}
                        </td>
                        <td className="py-3 font-mono text-emerald-700 dark:text-emerald-400">
                          {formatPrice(order.deposit_amount)}
                        </td>
                        <td className="py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-md border text-[11px] font-semibold ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="py-3 text-[11px] text-stone-400 dark:text-stone-500">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="py-3 pl-2 text-left">
                          <Link
                            href={`/orders/${order.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-[11px] font-semibold transition-colors"
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

        {/* Low Stock Alerts & Quick Products & Active Offers */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active Offers Preview Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100 dark:border-stone-800">
              <h2 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-brass-500" />
                <span>العروض النشطة بالمتجر</span>
              </h2>
              <Link href="/offers" className="text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-300">
                إدارة العروض ←
              </Link>
            </div>

            {activeOffers.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-stone-400 dark:text-stone-500 mb-2">لا توجد عروض أو بنرات معروضة حالياً</p>
                <Link
                  href="/offers"
                  className="text-xs font-bold text-brass-600 dark:text-brass-400 hover:underline"
                >
                  + إنشاء بنر عرض ترويجي
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeOffers.map(offer => (
                  <div key={offer.id} className="p-3 rounded-xl bg-sand-50 dark:bg-stone-800/60 border border-sand-200/60 dark:border-stone-700/60 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-stone-900 dark:text-white block line-clamp-1">{offer.title}</span>
                      {offer.badge_text && (
                        <span className="text-[10px] text-brass-700 dark:text-brass-400 font-semibold">{offer.badge_text}</span>
                      )}
                    </div>
                    {offer.discount_percentage ? (
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[10px] font-mono font-bold shrink-0">
                        {offer.discount_percentage}% خصم
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold shrink-0">
                        نشط
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock Alerts */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100 dark:border-stone-800">
              <h2 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>تنبيهات المخزون المنخفض</span>
              </h2>
              <Link href="/products" className="text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-300">
                المخزون ←
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-stone-500 dark:text-stone-400 py-4 text-center">
                جميع المنتجات بمخزون كافٍ ووفير 👍
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60">
                    <span className="font-semibold text-stone-900 dark:text-white truncate max-w-[160px]">{p.name_ar}</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-mono font-bold">
                      متبقي {p.stock} فقط
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="p-6 rounded-3xl bg-stone-900 dark:bg-stone-800/90 text-sand-50 shadow-md border border-stone-800 dark:border-stone-700">
            <h3 className="font-bold text-sm mb-1 text-white">إجراءات سريعة</h3>
            <p className="text-xs text-stone-400 mb-4">
              إضافة قطعة كونكريت جديدة، تعديل العروض، أو أرقام فودافون كاش
            </p>
            <div className="space-y-2">
              <Link
                href="/products"
                className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 dark:bg-stone-700 dark:hover:bg-stone-600 text-xs font-bold flex items-center justify-between text-sand-50 transition-colors"
              >
                <span>إضافة منتج جديد</span>
                <Package className="w-3.5 h-3.5 text-brass-400" />
              </Link>
              <Link
                href="/offers"
                className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 dark:bg-stone-700 dark:hover:bg-stone-600 text-xs font-bold flex items-center justify-between text-sand-50 transition-colors"
              >
                <span>إدارة بنرات العروض الترويجية</span>
                <Tag className="w-3.5 h-3.5 text-brass-400" />
              </Link>
              <Link
                href="/settings"
                className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 dark:bg-stone-700 dark:hover:bg-stone-600 text-xs font-bold flex items-center justify-between text-sand-50 transition-colors"
              >
                <span>تعديل إعدادات التحويل والدفع</span>
                <Coins className="w-3.5 h-3.5 text-brass-400" />
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
