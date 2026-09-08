'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Check, 
  X, 
  AlertCircle, 
  Package, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { Product, CategoryKey } from '@/types/database';
import { formatPrice, getCategoryLabel } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';

interface ProductsClientProps {
  initialProducts: Product[];
}

export default function ProductsClient({ initialProducts }: ProductsClientProps) {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<CategoryKey>('trays');
  const [price, setPrice] = useState<number>(300);
  const [stock, setStock] = useState<number>(10);
  const [descriptionAr, setDescriptionAr] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    product: Product | null;
    action: 'toggle' | 'delete';
  }>({ isOpen: false, product: null, action: 'toggle' });

  const openCreateModal = () => {
    setEditingProduct(null);
    setNameAr('');
    setNameEn('');
    setSlug('');
    setCategory('trays');
    setPrice(300);
    setStock(10);
    setDescriptionAr('');
    setDimensions('');
    setImageUrl('');
    setImageFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setNameAr(p.name_ar);
    setNameEn(p.name_en || '');
    setSlug(p.slug);
    setCategory(p.category);
    setPrice(Number(p.price));
    setStock(p.stock);
    setDescriptionAr(p.description_ar || '');
    setDimensions(p.dimensions || '');
    setImageUrl(p.image_url || '');
    setImageFile(null);
    setIsModalOpen(true);
  };

  // Upload image to public product-images bucket
  const handleImageUpload = async (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('صيغة الصورة يجب أن تكون JPG أو PNG أو WEBP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب ألا يتجاوز 5 ميجابايت');
      return;
    }

    setImageUploading(true);
    try {
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `products/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(path, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);

      setImageUrl(publicUrlData.publicUrl);
      toast.success('تم رفع الصورة بنجاح');
    } catch (err: any) {
      toast.error(err.message || 'فشل رفع الصورة');
    } finally {
      setImageUploading(false);
    }
  };

  // Auto-generate slug from name if empty
  const handleNameChange = (val: string) => {
    setNameAr(val);
    if (!editingProduct && !slug) {
      const generated = val.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u0621-\u064A-]+/g, '');
      setSlug(generated || `product-${Date.now().toString().slice(-4)}`);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() || !slug.trim()) {
      toast.error('اسم المنتج والـ Slug مطلوبان');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name_ar: nameAr.trim(),
        name_en: nameEn.trim() || null,
        slug: slug.trim().toLowerCase(),
        category,
        price: Number(price),
        stock: Number(stock),
        description_ar: descriptionAr.trim() || null,
        dimensions: dimensions.trim() || null,
        image_url: imageUrl || null,
        updated_at: new Date().toISOString(),
      };

      if (editingProduct) {
        // Update
        const { data, error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id)
          .select()
          .single();

        if (error) throw error;

        setProducts(prev => prev.map(p => p.id === editingProduct.id ? (data as Product) : p));
        toast.success('تم تحديث بيانات المنتج بنجاح');
      } else {
        // Create
        const { data, error } = await supabase
          .from('products')
          .insert({
            ...payload,
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;

        setProducts(prev => [data as Product, ...prev]);
        toast.success('تمت إضافة المنتج الجديد بنجاح');
      }

      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'فشل حفظ المنتج');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle active / soft delete
  const executeConfirmAction = async () => {
    if (!confirmModal.product) return;
    const p = confirmModal.product;
    const newStatus = !p.is_active;

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq('id', p.id);

      if (error) throw error;

      setProducts(prev => prev.map(item => item.id === p.id ? { ...item, is_active: newStatus } : item));
      toast.success(newStatus ? 'تم تفعيل المنتج وظهوره بالمتجر' : 'تم إيقاف ظهور المنتج في المتجر');
    } catch (err: any) {
      toast.error(err.message || 'فشل تعديل حالة المنتج');
    } finally {
      setConfirmModal({ isOpen: false, product: null, action: 'toggle' });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            إدارة المنتجات والقطع
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            إضافة وتعديل الأسعار والمخزون وصور قطع الكونكريت الديكوري
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-sand-50 text-xs font-bold shadow-sm transition-all active:scale-95 self-start"
        >
          <Plus className="w-4 h-4 text-brass-400" />
          <span>إضافة قطعة كونكريت جديدة</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <div className="text-center py-16 text-stone-400 text-xs">
            لا توجد منتجات مسجلة حتى الآن.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-stone-50/80 text-stone-400 border-b border-stone-100 font-semibold">
                  <th className="py-3.5 pr-6">الصورة</th>
                  <th className="py-3.5 px-4">اسم القطعة</th>
                  <th className="py-3.5 px-4">الفئة</th>
                  <th className="py-3.5 px-4">السعر</th>
                  <th className="py-3.5 px-4">المخزون</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 pl-6 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 pr-6">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-sand-100 border border-stone-200 shrink-0">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name_ar}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                            صورة
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900 text-sm">{product.name_ar}</div>
                      {product.dimensions && (
                        <div className="text-[11px] text-stone-400" dir="ltr">{product.dimensions}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-sand-100 text-stone-800 text-[11px] font-semibold border border-stone-200">
                        {getCategoryLabel(product.category)}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-stone-900">
                      {formatPrice(product.price)}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-block font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ${
                        product.stock <= 3 
                          ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                          : 'bg-stone-100 text-stone-800'
                      }`}>
                        {product.stock} قطعة
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {product.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          نشط ومعروض
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                          معطل (مخفي)
                        </span>
                      )}
                    </td>

                    <td className="py-3 pl-6 text-left whitespace-nowrap space-x-2 space-x-reverse">
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-semibold transition-colors"
                        title="تعديل المنتج"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmModal({ isOpen: true, product, action: 'toggle' })}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                          product.is_active
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                        }`}
                        title={product.is_active ? 'إخفاء المنتج من المتجر' : 'إظهار المنتج في المتجر'}
                      >
                        {product.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{product.is_active ? 'إخفاء' : 'تفعيل'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-xl w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-stone-100">
              <h3 className="font-bold text-base text-stone-900">
                {editingProduct ? 'تعديل قطعة الكونكريت' : 'إضافة قطعة كونكريت جديدة'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    اسم المنتج (بالعربي) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nameAr}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="مثال: صينية بيضاوية ماربل"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    الاسم بالإنجليزية (اختياري)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="Oval Marble Tray"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-stone-900 bg-stone-50/50 text-left"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    الفئة <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryKey)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
                  >
                    <option value="trays">صواني</option>
                    <option value="coasters">قواعد أكواب (Coasters)</option>
                    <option value="planters">أحواض نباتات</option>
                    <option value="candle_holders">شمعدانات ومباخر</option>
                    <option value="decor">تحف وفازات</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    السعر (ج.م) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono font-bold focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    الكمية بالمخزون <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono font-bold focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  رابط المعرّف (Slug) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  dir="ltr"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="oval-marble-tray"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono focus:ring-2 focus:ring-stone-900 bg-stone-50/50 text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  الأبعاد والمواصفات (مثال: 18سم × 9سم)
                </label>
                <input
                  type="text"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  placeholder="18سم × 9.5سم × 1.5سم"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  الوصف والتفاصيل اليدوية
                </label>
                <textarea
                  rows={3}
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  placeholder="صينية ديكورية بيضاوية متعددة الاستخدامات، مصبوبة يدوياً بخلطة كونكريت ناعمة..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
                />
              </div>

              {/* Product Image Section */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2">
                  صورة المنتج
                </label>

                <div className="flex items-center gap-4">
                  {imageUrl && (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shrink-0">
                      <Image
                        src={imageUrl}
                        alt="معاينة الصورة"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="block w-full text-xs text-stone-500 file:mr-0 file:ml-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-stone-800 cursor-pointer"
                    />
                    {imageUploading && (
                      <p className="text-[11px] text-amber-600 mt-1">جاري رفع الصورة إلى التخزين السحابي...</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving || imageUploading}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'جاري الحفظ...' : editingProduct ? 'تحديث القطعة' : 'إضافة القطعة'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Confirmation Modal for Toggle / Soft Delete */}
      {confirmModal.isOpen && confirmModal.product && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-sm w-full bg-white rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-base text-stone-900 mb-2">
              {confirmModal.product.is_active ? 'إخفاء المنتج من المتجر؟' : 'إعادة تفعيل المنتج؟'}
            </h3>

            <p className="text-xs text-stone-500 mb-6 leading-relaxed">
              {confirmModal.product.is_active
                ? `سيتم إخفاء "${confirmModal.product.name_ar}" من واجهة العميل مع الحفاظ على كافة بيانات الطلبات التاريخية المرتبطة به.`
                : `سيتم إظهار "${confirmModal.product.name_ar}" فوراً لعملاء المتجر للشراء.`}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, product: null, action: 'toggle' })}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={executeConfirmAction}
                className="flex-1 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors"
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
