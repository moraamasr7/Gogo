'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  MessageCircle, 
  Receipt, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Check, 
  X, 
  ZoomIn, 
  Save, 
  AlertCircle 
} from 'lucide-react';
import { Order, OrderStatus } from '@/types/database';
import { formatPrice, formatDate, getStatusLabel } from '@/lib/utils';
import { generateAdminCustomerWhatsAppUrl, defaultStatusMessages, getWhatsAppStatusTemplate } from '@/lib/whatsapp';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';

interface OrderDetailClientProps {
  initialOrder: Order;
}

export default function OrderDetailClient({ initialOrder }: OrderDetailClientProps) {
  const supabase = createClient();
  const [order, setOrder] = useState<Order>(initialOrder);
  const [status, setStatus] = useState<OrderStatus>(initialOrder.status);
  const [adminNotes, setAdminNotes] = useState<string>(initialOrder.admin_notes || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Receipt Modal State
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Fetch Signed URL on demand
  const handleViewReceipt = async () => {
    if (!order.payment_screenshot_path) {
      toast.error('لم يقم العميل برفع صورة إيصال لهذا الطلب');
      return;
    }

    if (receiptUrl) {
      setShowReceiptModal(true);
      return;
    }

    setIsLoadingReceipt(true);
    try {
      const res = await fetch('/api/receipt-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: order.payment_screenshot_path }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل جلب رابط الإيصال');

      setReceiptUrl(data.signedUrl);
      setShowReceiptModal(true);
    } catch (err: any) {
      toast.error(err.message || 'تعذر تحميل الإيصال');
    } finally {
      setIsLoadingReceipt(false);
    }
  };

  const [customerMessage, setCustomerMessage] = useState<string>(
    defaultStatusMessages[initialOrder.status] || ''
  );

  // When status changes in dropdown, auto-suggest the matching message
  const handleStatusChange = (newStatus: OrderStatus) => {
    setStatus(newStatus);
    setCustomerMessage(defaultStatusMessages[newStatus] || '');
  };

  // Update Status & Notes
  const handleUpdateOrder = async (openWhatsAppImmediately = false) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status,
          admin_notes: adminNotes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

      setOrder(prev => ({
        ...prev,
        status,
        admin_notes: adminNotes.trim() || null,
      }));

      toast.success('تم تحديث حالة الطلب لحظياً بنجاح! ✨');

      if (openWhatsAppImmediately) {
        const url = generateAdminCustomerWhatsAppUrl(
          order.customer_phone,
          order.customer_name,
          order.order_number,
          status,
          getWhatsAppStatusTemplate(order.customer_name, order.order_number, status, customerMessage)
        );
        window.open(url, '_blank');
      }
    } catch (err: any) {
      toast.error(err.message || 'فشل تحديث الطلب');
    } finally {
      setIsUpdating(false);
    }
  };

  const statusInfo = getStatusLabel(order.status);
  const whatsappUrl = generateAdminCustomerWhatsAppUrl(
    order.customer_phone,
    order.customer_name,
    order.order_number,
    status,
    getWhatsAppStatusTemplate(order.customer_name, order.order_number, status, customerMessage)
  );

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-black text-xl text-stone-900">
              #{order.order_number}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-xs text-stone-500">
            تاريخ التسجيل: {formatDate(order.created_at)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>تواصل مع العميل عبر واتساب</span>
          </a>

          {order.payment_screenshot_path && (
            <button
              type="button"
              onClick={handleViewReceipt}
              disabled={isLoadingReceipt}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-sand-50 text-xs font-bold shadow-sm transition-colors"
            >
              <Receipt className="w-4 h-4 text-brass-400" />
              <span>{isLoadingReceipt ? 'جاري الفتح...' : 'معاينة إيصال التحويل'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Items and Customer Info */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Items Breakdown Table */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-stone-900 pb-3 border-b border-stone-100">
              القطع المطلوبة ({order.order_items?.length || 0})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="text-stone-400 border-b border-stone-100 font-semibold">
                    <th className="pb-3">المنتج</th>
                    <th className="pb-3">اللون</th>
                    <th className="pb-3">الكمية</th>
                    <th className="pb-3">سعر الوحدة</th>
                    <th className="pb-3 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {order.order_items?.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/50">
                      <td className="py-3 font-semibold text-stone-900">
                        {item.product_name_ar}
                      </td>
                      <td className="py-3 text-stone-600">
                        {item.selected_color || 'افتراضي'}
                      </td>
                      <td className="py-3 font-mono font-bold text-stone-800">
                        {item.quantity}
                      </td>
                      <td className="py-3 font-mono text-stone-600">
                        {formatPrice(item.unit_price)}
                      </td>
                      <td className="py-3 font-mono font-bold text-stone-900 text-left">
                        {formatPrice(item.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Breakdown */}
            <div className="pt-4 border-t border-stone-100 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>إجمالي قيمة المنتجات:</span>
                <span className="font-mono font-bold text-stone-900">{formatPrice(order.total_amount)}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <span>العربون المطلوب ({order.deposit_percentage}%):</span>
                <span className="font-mono text-sm">{formatPrice(order.deposit_amount)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>المتبقي عند التسليم:</span>
                <span className="font-mono font-bold text-stone-900">{formatPrice(order.remaining_amount)}</span>
              </div>
            </div>

          </div>

          {/* Customer Details Card */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-stone-900 pb-3 border-b border-stone-100">
              بيانات العميل والتوصيل
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-stone-400 block text-[10px]">الاسم:</span>
                  <span className="font-bold text-stone-900">{order.customer_name}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-stone-400 block text-[10px]">الهاتف (واتساب):</span>
                  <span className="font-mono font-bold text-stone-900" dir="ltr">{order.customer_phone}</span>
                </div>
              </div>

              <div className="sm:col-span-2 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-stone-400 block text-[10px]">عنوان التوصيل:</span>
                  <span className="font-medium text-stone-800 leading-relaxed">{order.customer_address}</span>
                </div>
              </div>

              {order.customer_email && (
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-stone-400 block text-[10px]">البريد الإلكتروني:</span>
                    <span className="font-mono text-stone-800" dir="ltr">{order.customer_email}</span>
                  </div>
                </div>
              )}

              {order.customer_notes && (
                <div className="sm:col-span-2 p-3 rounded-xl bg-sand-100 border border-sand-200 text-stone-800">
                  <span className="text-stone-500 block text-[10px] font-bold mb-0.5">ملاحظات العميل:</span>
                  <span>{order.customer_notes}</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Status Transition & Internal Notes */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-stone-900 pb-3 border-b border-stone-100">
              تحديث حالة الطلب
            </h2>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">
                اختر الحالة الجديدة:
              </label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
              >
                <option value="pending">معلق (بانتظار العربون)</option>
                <option value="confirmed">مؤكد (تم استلام العربون)</option>
                <option value="processing">قيد الصب والتنفيذ اليدوي</option>
                <option value="ready_for_shipping">جاهز للتسليم والشحن</option>
                <option value="completed">تم التسليم بنجاح</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>

            {/* Customer Facing WhatsApp Message */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-emerald-900">
                  نص الرسالة المرسلة للعميل (واتساب):
                </label>
                <span className="text-[10px] text-emerald-700 font-semibold">تتحدث تلقائياً مع الحالة</span>
              </div>
              <textarea
                value={customerMessage}
                onChange={(e) => setCustomerMessage(e.target.value)}
                rows={3}
                placeholder="اكتب هنا الرسالة التي ستصل للعميل مع رابط الطلب..."
                className="w-full px-3 py-2 rounded-xl border border-emerald-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
              />
            </div>

            {/* Internal Admin Notes */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                ملاحظات الإدارة الداخلية (نحتفظ بها ولا تظهر للعميل):
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
                placeholder="مثال: تم التأكد من تحويل فودافون كاش بتاريخ 8-9..."
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
              />
            </div>

            {/* Action Buttons: Save & Save + Send */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleUpdateOrder(true)}
                disabled={isUpdating}
                className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <MessageCircle className="w-4 h-4" />
                <span>حفظ وتحديث الحالة وإرسال واتساب للعميل</span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateOrder(false)}
                disabled={isUpdating}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-sand-50 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-brass-400" />
                <span>{isUpdating ? 'جاري الحفظ...' : 'حفظ التحديث في النظام فقط'}</span>
              </button>
            </div>
          </div>

          {/* Payment receipt quick thumbnail */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-stone-900">إيصال التحويل المرفوع</h3>
            {order.payment_screenshot_path ? (
              <div>
                <button
                  type="button"
                  onClick={handleViewReceipt}
                  className="w-full py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ZoomIn className="w-4 h-4 text-stone-600" />
                  <span>عرض وتكبير الإيصال</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-stone-400">لم يُرفق العميل إيصال تحويل.</p>
            )}
          </div>

        </div>

      </div>

      {/* Payment Receipt Zoom Modal */}
      {showReceiptModal && receiptUrl && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-white rounded-3xl p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900">
                إيصال تحويل العربون - طلب #{order.order_number}
              </h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-[3/4] max-h-[70vh] w-full rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
              <Image
                src={receiptUrl}
                alt="إيصال التحويل"
                fill
                className="object-contain"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
