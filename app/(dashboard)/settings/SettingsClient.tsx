'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { SettingItem } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { Save, Shield, Smartphone, Coins, Hammer, HelpCircle, ImageIcon, Upload, Trash2 } from 'lucide-react';
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

  const [headerLogoUrl, setHeaderLogoUrl] = useState(initialMap['header_logo_url'] || '');
  const [heroBannerUrl, setHeroBannerUrl] = useState(initialMap['hero_banner_url'] || '');
  const [promoBannerActive, setPromoBannerActive] = useState(initialMap['promo_banner_active'] !== 'false');
  const [promoBannerTitle, setPromoBannerTitle] = useState(
    initialMap['promo_banner_title'] || 'عرض الموسم ✨ خصم خاص لفترة محدودة على تشكيلة الصواني والمباخر'
  );
  const [promoBannerBadge, setPromoBannerBadge] = useState(initialMap['promo_banner_badge'] || 'عرض خاص 🔥');
  const [promoBannerImageUrl, setPromoBannerImageUrl] = useState(
    initialMap['promo_banner_image_url'] || 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=80'
  );
  const [promoBannerLink, setPromoBannerLink] = useState(initialMap['promo_banner_link'] || '/products');

  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingPromo, setIsUploadingPromo] = useState(false);

  const handleToggleMaintenance = async () => {
    if (isTogglingMaintenance) return;
    const nextState = !maintenanceMode;
    setMaintenanceMode(nextState);
    setIsTogglingMaintenance(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert(
          {
            key: 'maintenance_mode',
            value: nextState ? 'true' : 'false',
            is_public: true,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'key' }
        );
      if (error) throw error;
      if (nextState) {
        toast.success('تم تفعيل وضع الصيانة ⚠️ (المتجر مغلق ومحمي أمام العملاء)');
      } else {
        toast.success('تم إلغاء وضع الصيانة بنجاح! 🟢 (المتجر مفتوح ومتاح للعملاء الآن)');
      }
    } catch (err: any) {
      setMaintenanceMode(!nextState); // rollback
      toast.error('فشل تحديث وضع الصيانة: ' + (err.message || 'حدث خطأ'));
    } finally {
      setIsTogglingMaintenance(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'banner' | 'promo') => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('صيغة الصورة يجب أن تكون JPG أو PNG أو WEBP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب ألا يتجاوز 5 ميجابايت');
      return;
    }

    if (type === 'logo') setIsUploadingLogo(true);
    else if (type === 'banner') setIsUploadingBanner(true);
    else setIsUploadingPromo(true);

    try {
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `branding/${type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(path, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);

      if (type === 'logo') {
        setHeaderLogoUrl(publicUrlData.publicUrl);
        toast.success('تم رفع لوجو الهيدر بنجاح! ✨');
      } else if (type === 'banner') {
        setHeroBannerUrl(publicUrlData.publicUrl);
        toast.success('تم رفع بانر المتجر بنجاح! ✨');
      } else {
        setPromoBannerImageUrl(publicUrlData.publicUrl);
        toast.success('تم رفع صورة البنر الترويجي بنجاح! ✨');
      }
    } catch (err: any) {
      toast.error(err.message || 'فشل رفع الصورة');
    } finally {
      if (type === 'logo') setIsUploadingLogo(false);
      else if (type === 'banner') setIsUploadingBanner(false);
      else setIsUploadingPromo(false);
    }
  };

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
      { key: 'header_logo_url', value: headerLogoUrl.trim() },
      { key: 'hero_banner_url', value: heroBannerUrl.trim() },
      { key: 'promo_banner_active', value: promoBannerActive ? 'true' : 'false' },
      { key: 'promo_banner_title', value: promoBannerTitle.trim() },
      { key: 'promo_banner_badge', value: promoBannerBadge.trim() },
      { key: 'promo_banner_image_url', value: promoBannerImageUrl.trim() },
      { key: 'promo_banner_link', value: promoBannerLink.trim() },
    ];

    try {
      for (const item of updates) {
        const { error } = await supabase
          .from('settings')
          .upsert(
            { key: item.key, value: item.value, is_public: true, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          );

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

        {/* Branding Images Box (Header Logo & Hero Banner) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <ImageIcon className="w-5 h-5 text-brass-500" />
            <div>
              <h2 className="text-sm font-bold text-stone-900">صور الهوية والبانرات (Header & Hero)</h2>
              <p className="text-[11px] text-stone-400">يمكنك تغيير وتحديث الشعار والبانر الرئيسي أسبوعياً أو عند إطلاق تشكيلات ومواسم جديدة</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Header Logo */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800">
                  لوجو وشعار الهيدر (Header Logo)
                </label>
                {headerLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setHeaderLogoUrl('')}
                    className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>إزالة الشعار</span>
                  </button>
                )}
              </div>

              {headerLogoUrl ? (
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-stone-300 bg-white shadow-xs mx-auto my-2">
                  <Image
                    src={headerLogoUrl}
                    alt="Header Logo Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-stone-300 bg-white/60 flex flex-col items-center justify-center text-stone-400 mx-auto my-2">
                  <span className="text-lg font-black text-brass-500">G</span>
                  <span className="text-[9px]">افتراضي (SVG)</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-stone-200 hover:border-stone-400 text-xs font-bold text-stone-800 transition-colors shadow-xs">
                  <Upload className="w-3.5 h-3.5 text-stone-600" />
                  <span>{isUploadingLogo ? 'جاري الرفع...' : 'رفع لوجو جديد'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={isUploadingLogo}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'logo');
                    }}
                  />
                </label>
              </div>

              <input
                type="url"
                dir="ltr"
                placeholder="أو أدخل رابط اللوجو مباشرة: https://..."
                value={headerLogoUrl}
                onChange={(e) => setHeaderLogoUrl(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-[11px] font-mono text-left bg-white"
              />
            </div>

            {/* 2. Hero Banner */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800">
                  صورة البانر الرئيسي (Hero Banner)
                </label>
                {heroBannerUrl && (
                  <button
                    type="button"
                    onClick={() => setHeroBannerUrl('')}
                    className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>إزالة واستعادة الافتراضي</span>
                  </button>
                )}
              </div>

              <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-stone-300 bg-stone-100 shadow-xs my-2">
                <Image
                  src={heroBannerUrl || "https://images.unsplash.com/photo-1594913785162-e678a0c23ee9?auto=format&fit=crop&w=800&q=80"}
                  alt="Hero Banner Preview"
                  fill
                  className="object-cover"
                />
                {!heroBannerUrl && (
                  <div className="absolute inset-0 bg-stone-950/30 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-white bg-stone-900/80 px-2 py-1 rounded-md">
                      الصورة الافتراضية
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-stone-200 hover:border-stone-400 text-xs font-bold text-stone-800 transition-colors shadow-xs">
                  <Upload className="w-3.5 h-3.5 text-stone-600" />
                  <span>{isUploadingBanner ? 'جاري الرفع...' : 'رفع بانر جديد'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={isUploadingBanner}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'banner');
                    }}
                  />
                </label>
              </div>

              <input
                type="url"
                dir="ltr"
                placeholder="أو أدخل رابط البانر مباشرة: https://..."
                value={heroBannerUrl}
                onChange={(e) => setHeroBannerUrl(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-[11px] font-mono text-left bg-white"
              />
            </div>

            {/* 3. Promo Banner */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-stone-800 block">
                    بنر العرض الترويجي (Promo Banner)
                  </label>
                  <span className="text-[11px] text-stone-500">
                    بنر عرض عريض بمقاس متناسق (21:9 أو 16:9) يظهر مباشرة في الصفحة الرئيسية
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
                    <input
                      type="checkbox"
                      checked={promoBannerActive}
                      onChange={(e) => setPromoBannerActive(e.target.checked)}
                      className="rounded text-brass-600 focus:ring-brass-500 w-4 h-4"
                    />
                    <span>تفعيل ظهور البنر</span>
                  </label>
                  {promoBannerImageUrl && (
                    <button
                      type="button"
                      onClick={() => setPromoBannerImageUrl('')}
                      className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف الصورة</span>
                    </button>
                  )}
                </div>
              </div>

              {promoBannerImageUrl && (
                <div className="relative w-full aspect-[21/9] sm:aspect-[24/8] rounded-2xl overflow-hidden border border-stone-300 bg-stone-100 shadow-xs my-2">
                  <Image
                    src={promoBannerImageUrl}
                    alt="Promo Banner Preview"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-brass-500 text-stone-950 text-[10px] font-bold self-start mb-1">
                      {promoBannerBadge}
                    </span>
                    <p className="text-xs sm:text-sm font-black">{promoBannerTitle}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">عنوان العرض</label>
                  <input
                    type="text"
                    value={promoBannerTitle}
                    onChange={(e) => setPromoBannerTitle(e.target.value)}
                    placeholder="عنوان العرض الترويجي..."
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">شارة البنر</label>
                  <input
                    type="text"
                    value={promoBannerBadge}
                    onChange={(e) => setPromoBannerBadge(e.target.value)}
                    placeholder="عرض خاص 🔥"
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:border-stone-400 text-xs font-bold text-stone-800 transition-colors shadow-xs">
                  <Upload className="w-3.5 h-3.5 text-stone-600" />
                  <span>{isUploadingPromo ? 'جاري الرفع...' : 'رفع صورة للبنر الترويجي'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={isUploadingPromo}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'promo');
                    }}
                  />
                </label>

                <input
                  type="url"
                  dir="ltr"
                  placeholder="أو رابط الصورة مباشرة: https://..."
                  value={promoBannerImageUrl}
                  onChange={(e) => setPromoBannerImageUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-stone-200 text-[11px] font-mono text-left bg-white"
                />
              </div>
            </div>
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
          <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Hammer className="w-4 h-4 text-stone-600" />
                <span className="font-bold text-xs text-stone-900">وضع الصيانة المؤقت</span>
                {maintenanceMode ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                    <span>المتجر مغلق ومحمي</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>المتجر مفتوح ومتاح للزوار</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500">
                الضغط على الزر يقوم بالتفعيل أو الإلغاء الفوري، وسينعكس فوراً على زوار المتجر وسلة المشتريات.
              </p>
            </div>

            <button
              type="button"
              disabled={isTogglingMaintenance}
              onClick={handleToggleMaintenance}
              aria-label="تبديل وضع الصيانة"
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
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
