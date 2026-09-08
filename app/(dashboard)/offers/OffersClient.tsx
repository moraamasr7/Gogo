'use client';

import React, { useState } from 'react';
import { Plus, Edit, Eye, EyeOff, Tag, X } from 'lucide-react';
import { Offer } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';

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
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            العروض والبنرات الترويجية
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            إدارة البنرات الإعلانية والخصومات المعروضة في الصفحة الرئيسية لمتجر العميل
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-sand-50 text-xs font-bold shadow-sm transition-all active:scale-95 self-start"
        >
          <Plus className="w-4 h-4 text-brass-400" />
          <span>إضافة بنر عرض جديد</span>
        </button>
      </div>

      <div className="space-y-4">
        {offers.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 text-xs text-stone-400">
            لا توجد عروض أو بنرات حالياً.
          </div>
        ) : (
          offers.map((offer) => (
            <div
              key={offer.id}
              className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {offer.badge_text && (
                    <span className="px-2.5 py-0.5 rounded-full bg-sand-100 text-stone-800 text-[11px] font-bold border border-stone-200">
                      {offer.badge_text}
                    </span>
                  )}
                  <h3 className="font-bold text-stone-900 text-sm">{offer.title}</h3>
                  {offer.is_active ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                      نشط حالياً
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-500 text-[10px] font-bold">
                      غير مفعّل
                    </span>
                  )}
                </div>

                {offer.description && (
                  <p className="text-xs text-stone-500 max-w-xl leading-relaxed">
                    {offer.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => openEditModal(offer)}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>تعديل</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleActive(offer)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${
                    offer.is_active
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-800'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {offer.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{offer.is_active ? 'إخفاء' : 'تفعيل'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
              <h3 className="font-bold text-base text-stone-900">
                {editingOffer ? 'تعديل بيانات العرض' : 'إضافة بنر عرض جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  عنوان العرض <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: خصم 10% على كافة الصواني"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  شارة العرض (Badge)
                </label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="عرض الموسم ✨"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  نص تفاصيل العرض
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="خصم فوري متاح لجميع الطلبات..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 disabled:opacity-50"
                >
                  {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
