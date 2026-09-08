'use client';

import React, { useState } from 'react';
import { Plus, Edit, Eye, EyeOff, Tag, X, Sparkles, Gift } from 'lucide-react';
import { Offer } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';

interface OffersClientProps {
  initialOffers: Offer[];
}

export default function OffersClient({ initialOffers }: OffersClientProps) {
  const supabase = createClient();
  const [offers, setOffers] = useState<Offer[]>(initialOffers);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [badgeText, setBadgeText] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState<number>(10);
  const [imageUrl, setImageUrl] = useState('');

  const openCreateModal = () => {
    setEditingOffer(null);
    setTitle('');
    setDescription('');
    setBadgeText('عرض الموسم ✨');
    setDiscountPercentage(10);
    setImageUrl('');
    setIsModalOpen(true);
  };

  const applyTemplate = (type: 'discount' | 'gift' | 'shipping') => {
    if (type === 'discount') {
      setTitle('خصم 10% على كافة التشكيلة');
      setBadgeText('عرض محدود ✨');
      setDescription('استمتعي بخصم 10% على كل قطع وديكورات الكونكريت اليدوية.');
      setDiscountPercentage(10);
    } else if (type === 'gift') {
      setTitle('هديتك علينا 🤍 (3 قطع مميزة)');
      setBadgeText('عرض حصري 🎁');
      setDescription('اطلبي بقيمة 2,500 ج.م أو أكثر واحصلي على 3 قطع إضافية هدية مختارة بعناية.');
      setDiscountPercentage(0);
    } else if (type === 'shipping') {
      setTitle('توصيل مجاني للطلبات المميزة');
      setBadgeText('شحن مجاني 🚚');
      setDescription('شحن وتوصيل مجاني لجميع المحافظات للطلبات التي تتجاوز 1,800 ج.م.');
      setDiscountPercentage(0);
    }
  };

  const openEditModal = (offer: Offer) => {
    setEditingOffer(offer);
    setTitle(offer.title);
    setDescription(offer.description || '');
    setBadgeText(offer.badge_text || '');
    setDiscountPercentage(offer.discount_percentage || 0);
    setImageUrl(offer.image_url || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('عنوان العرض مطلوب');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        badge_text: badgeText.trim() || null,
        discount_percentage: Number(discountPercentage) || null,
        image_url: imageUrl.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (editingOffer) {
        const { data, error } = await supabase
          .from('offers')
          .update(payload)
          .eq('id', editingOffer.id)
          .select()
          .single();

        if (error) throw error;
        setOffers(prev => prev.map(o => o.id === editingOffer.id ? (data as Offer) : o));
        toast.success('تم تحديث العرض بنجاح');
      } else {
        const { data, error } = await supabase
          .from('offers')
          .insert({
            ...payload,
            is_active: true,
            sort_order: offers.length + 1,
          })
          .select()
          .single();

        if (error) throw error;
        setOffers(prev => [data as Offer, ...prev]);
        toast.success('تمت إضافة العرض الجديد بنجاح');
      }

      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'فشل حفظ العرض');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (offer: Offer) => {
    const newStatus = !offer.is_active;
    try {
      const { error } = await supabase
        .from('offers')
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq('id', offer.id);

      if (error) throw error;
      setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, is_active: newStatus } : o));
      toast.success(newStatus ? 'تم تفعيل ظهور البنر في المتجر' : 'تم إيقاف ظهور البنر');
    } catch (err: any) {
      toast.error(err.message || 'فشل تحديث حالة العرض');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
            العروض والبنرات الترويجية
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            إدارة البنرات الإعلانية، الخصومات، وميكانيزم الهدايا المعروضة في متجر العميل
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4 text-brass-400 dark:text-stone-950" />}
          className="self-start sm:self-auto"
        >
          إضافة بنر عرض جديد
        </Button>
      </div>

      <div className="space-y-4">
        {offers.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 text-xs text-stone-400 dark:text-stone-500">
            لا توجد عروض أو بنرات حالياً. اضغطي على زر إضافة بنر أعلاه للبدء.
          </div>
        ) : (
          offers.map((offer) => (
            <div
              key={offer.id}
              className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {offer.badge_text && (
                    <span className="px-2.5 py-0.5 rounded-full bg-sand-100 dark:bg-stone-800 text-stone-800 dark:text-brass-400 text-[11px] font-bold border border-sand-200 dark:border-stone-700">
                      {offer.badge_text}
                    </span>
                  )}
                  <h3 className="font-bold text-stone-900 dark:text-white text-sm">{offer.title}</h3>
                  {offer.is_active ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                      نشط بالمتجر
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 text-[10px] font-bold">
                      غير مفعّل
                    </span>
                  )}
                </div>

                {offer.description && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xl leading-relaxed">
                    {offer.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button
                  onClick={() => openEditModal(offer)}
                  variant="secondary"
                  size="sm"
                  leftIcon={<Edit className="w-3.5 h-3.5" />}
                >
                  تعديل
                </Button>

                <Button
                  onClick={() => toggleActive(offer)}
                  variant={offer.is_active ? 'secondary' : 'outline'}
                  size="sm"
                  leftIcon={offer.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                >
                  {offer.is_active ? 'إخفاء' : 'تفعيل'}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-bold text-base text-stone-900 dark:text-white">
                {editingOffer ? 'تعديل بيانات العرض' : 'إضافة بنر عرض جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Templates Selector */}
            <div className="mb-4 p-3 rounded-2xl bg-sand-50 dark:bg-stone-800/60 border border-sand-200/80 dark:border-stone-700/60">
              <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 block mb-2">
                نماذج سريعة جاهزة للاستخدام:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyTemplate('discount')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-200 text-[11px] font-semibold hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors"
                >
                  ✨ خصم 10%
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('gift')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-200 text-[11px] font-semibold hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors"
                >
                  🎁 هديتك علينا (2500 ج.م)
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('shipping')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-200 text-[11px] font-semibold hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors"
                >
                  🚚 شحن مجاني
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  عنوان العرض <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: خصم 10% على كافة الصواني"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-stone-900 dark:focus:ring-brass-400 bg-stone-50/50 dark:bg-stone-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    شارة العرض (Badge)
                  </label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="عرض الموسم ✨"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-stone-900 dark:focus:ring-brass-400 bg-stone-50/50 dark:bg-stone-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    نسبة الخصم (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                    placeholder="10"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-stone-900 dark:focus:ring-brass-400 bg-stone-50/50 dark:bg-stone-800 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  نص تفاصيل العرض
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="خصم فوري متاح لجميع الطلبات..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-stone-900 dark:focus:ring-brass-400 bg-stone-50/50 dark:bg-stone-800 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSaving}
                >
                  حفظ التعديلات
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
