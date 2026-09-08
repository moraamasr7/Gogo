// lib/whatsapp.ts
import { OrderStatus } from "@/types/database";

export const defaultStatusMessages: Record<OrderStatus, string> = {
  pending: "طلبك مسجل ونحن في انتظار مراجعة إيصال تحويل العربون لتأكيد الحجز.",
  confirmed: "تم تأكيد استلام العربون بنجاح! بدأنا في جدولة وتجهيز طلبك.",
  processing: "قطع الكونكريت الخاصة بك قيد الصب والمعالجة اليدوية الآن بعناية لتجف تماماً.",
  ready_for_shipping: "طلبك جاهز تماماً وتم تغليفه وجاري تسليمه لشركة الشحن للتوصيل إلى عنوانك.",
  completed: "تم تسليم طلبك بنجاح! نتمنى أن تنال القطع إعجابك وتسعدنا مشاركتك لصورها ❤️",
  cancelled: "نود إعلامك بأنه تم إلغاء الطلب. يرجى التواصل معنا إن كان هناك أي استفسار.",
};

export function getWhatsAppStatusTemplate(
  customerName: string,
  orderNumber: string,
  status: OrderStatus,
  customBody?: string
): string {
  const bodyText = customBody?.trim() || defaultStatusMessages[status] || `حالته الحالية: ${status}`;

  return `مرحباً ${customerName} 👋
معك إدارة *Gogo Concrete Store* بخصوص طلبك رقم *#${orderNumber}*:

${bodyText}

يسعدنا دائماً خدمتك لأي استفسار 🏺✨`;
}

export function generateAdminCustomerWhatsAppUrl(
  customerPhone: string,
  customerName: string,
  orderNumber: string,
  status: OrderStatus,
  customMessage?: string
): string {
  const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
  const message = customMessage || getWhatsAppStatusTemplate(customerName, orderNumber, status);

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
