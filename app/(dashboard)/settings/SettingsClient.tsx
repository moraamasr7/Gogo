'use client';

import React, { useState } from 'react';
import { SettingItem } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { Save, Shield, Smartphone, Coins, Hammer, HelpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SettingsClientProps {
  initialSettings: SettingItem[];
}

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const supabase = createClient();

  // Convert array to key-value map
  const initialMap: Record<string, string> = {};
  initialSettings.forEach(s => { initialMap[s.key] = s.value; });

  const [vodafoneCash, setVodafoneCash] = useState(initialMap['vodafone_cash'] || '01012345678');
  const [instapay, setInstapay] = useState(initialMap['instapay'] || 'gogo.concrete@instapay');
  const [whatsappNumber, setWhatsappNumber] = useState(initialMap['whatsapp_number'] || '201012345678');
  const [depositPercentage, setDepositPercentage] = useState(initialMap['deposit_percentage'] || '50');
  const [storeName, setStoreName] = useState(initialMap['store_name'] || 'Gogo Concrete Store');
  const [currency, setCurrency] = useState(initialMap['currency'] || 'ج.م');
  const [paymentInstructions, setPaymentInstructions] = useState(
    initialMap['payment_instructions'] || 'يرجى تحويل مبلغ العربون (50% من إجمالي الطلب) عبر فودافون كاش أو إنستاباي...'
  );
  const [shippingInstructions, setShippingInstructions] = useState(
    initialMap['shipping_instructions'] || 'مدة التنفيذ اليدوي من 3 إلى 7 أيام عمل...'
  );
  const [maintenanceMode, setMaintenanceMode] = useState(initialMap['maintenance_mode'] === 'true');

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updates = [
      { key: 'vodafone_cash', value: vodafoneCash.trim() },
      { key: 'instapay', value: instapay.trim() },
      { key: 'whatsapp_number', value: whatsappNumber.trim() },
      { key: 'deposit_percentage', value: String(Number(depositPercentage) || 50) },
      { key: 'store_name', value: storeName.trim() },
      { key: 'currency', value: currency.trim() },
      { key: 'payment_instructions', value: paymentInstructions.trim() },
      { key: 'shipping_instructions', value: shippingInstructions.trim() },
      { key: 'maintenance_mode', value: maintenanceMode ? 'true' : 'false' },
    ];

    try {
      for (const item of updates) {
        const { error } = await supabase
          .from('settings')
          .update({ value: item.value, updated_at: new Date().toISOString() })
          .eq('key', item.key);

        if (error) throw error;
      }

      toast.success('تم حفظ وتطبيق كافة الإعدادات بنجاح! ✨');
    } catch (err: any) {
      toast.error(err.message || 'فشل حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
          إعدادات المتجر والدفع
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          تعديل أرقام فودافون كاش وإنستاباي ونسبة العربون الحية التي يراها العميل عند الطلب
        </p>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        
        {/* Payment & Transfer Box */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <Coins className="w-5 h-5 text-brass-500" />
            <h2 className="text-sm font-bold text-stone-900">بيانات تحويل وسداد العربون</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                رقم محفظة فودافون كاش
              </label>
              <input
                type="text"
                dir="ltr"
                required
                value={vodafoneCash}
                onChange={(e) => setVodafoneCash(e.target.value)}
                placeholder="010XXXXXXXX"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-mono font-bold focus:ring-2 focus:ring-stone-900 bg-stone-50/50 text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                معرف إنستاباي (InstaPay)
              </label>
              <input
                type="text"
                dir="ltr"
                required
                value={instapay}
                onChange={(e) => setInstapay(e.target.value)}
                placeholder="gogo.concrete@instapay"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-mono font-bold focus:ring-2 focus:ring-stone-900 bg-stone-50/50 text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                نسبة العربون المطلوبة (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={depositPercentage}
                  onChange={(e) => setDepositPercentage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-mono font-bold focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
                />
                <span className="absolute left-3.5 top-2.5 text-xs text-stone-400 font-bold">%</span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                تُحسب تلقائياً من إجمالي السلة عند الدفع (افتراضياً 50%).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                رقم واتساب المتجر الرسمي
              </label>
              <input
                type="text"
                dir="ltr"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="2010XXXXXXXX"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-mono font-bold focus:ring-2 focus:ring-stone-900 bg-stone-50/50 text-left"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                تصل إليه رسائل تأكيد الطلب برمز الدولة (20).
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              نص تعليمات سداد العربون
            </label>
            <textarea
              rows={2}
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              سياسة ومدة التنفيذ اليدوي والشحن
            </label>
            <textarea
              rows={2}
              value={shippingInstructions}
              onChange={(e) => setShippingInstructions(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
            />
          </div>
        </div>

        {/* General Store Details & Maintenance */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <Smartphone className="w-5 h-5 text-stone-700" />
            <h2 className="text-sm font-bold text-stone-900">الهوية ووضع الصيانة</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                اسم المتجر
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-stone-900 bg-stone-50/50 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                العملة
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-stone-900 bg-stone-50/50 font-bold"
              />
            </div>
          </div>

          {/* Maintenance Mode Toggle */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <div>
              <div className="flex items-center gap-2">
                <Hammer className="w-4 h-4 text-stone-600" />
                <span className="font-bold text-xs text-stone-900">وضع الصيانة المؤقت</span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                عند التفعيل، سيرى زوار المتجر شاشة صيانة هادئة، بينما تظل لوحة الإدارة تعمل بالكامل.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                maintenanceMode ? 'bg-amber-600' : 'bg-stone-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  maintenanceMode ? '-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-sand-50 font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-brass-400" />
            <span>{isSaving ? 'جاري حفظ التغييرات...' : 'حفظ ونشر الإعدادات'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
