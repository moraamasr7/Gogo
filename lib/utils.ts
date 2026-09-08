// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CategoryKey, OrderStatus } from "@/types/database";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency: string = "ج.م"): string {
  return `${Number(amount).toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

export function getCategoryLabel(category: CategoryKey): string {
  const map: Record<CategoryKey, string> = {
    trays: "صواني ديكورية",
    coasters: "قواعد أكواب (Coasters)",
    planters: "أحواض نباتات",
    candle_holders: "حوامل شموع ومباخر",
    decor: "تحف وفازات",
  };
  return map[category] || category;
}

export function getStatusLabel(status: OrderStatus): { label: string; bg: string; text: string; border: string } {
  const map: Record<OrderStatus, { label: string; bg: string; text: string; border: string }> = {
    pending: { label: "معلق (في انتظار التحويل)", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
    confirmed: { label: "مؤكد (تم استلام العربون)", bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
    processing: { label: "قيد الصب والتنفيذ", bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
    ready_for_shipping: { label: "جاهز للتسليم والشحن", bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-200" },
    completed: { label: "تم التسليم بنجاح", bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
    cancelled: { label: "ملغي", bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200" },
  };
  return map[status] || { label: status, bg: "bg-gray-50", text: "text-gray-800", border: "border-gray-200" };
}
