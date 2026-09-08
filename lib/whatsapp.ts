// lib/whatsapp.ts
import { OrderStatus } from "@/types/database";

export function generateAdminCustomerWhatsAppUrl(
  customerPhone: string,
  customerName: string,
  orderNumber: string,
  status: OrderStatus
): string {
  const cleanPhone = customerPhone.replace(/[^0-9]/g, '');

  const statusDescriptions: Record<OrderStatus, string> = {
    pending: "طلبك مسجل ونحن في انتظار مراجعة إيصال تحويل العربون لتأكيد الحجز.",
    confirmed: "تم تأكيد استلام العربون بنجاح! بدأنا في جدولة وتجهيز طلبك.",
    processing: "قطع الكونكريت الخاصة بك قيد الصب والمعالجة اليدوية الآن بعناية.",
    ready_for_shipping: "طلبك جاهز تماماً وتم تغليفه وجاري تسليمه لشركة الشحن.",
    completed: "تم تسليم طلبك بنجاح! نتمنى أن تنال القطع إعجابك وتسعدنا مشاركتك لصورها ❤️",
    cancelled: "نود إعلامك بأنه تم إلغاء الطلب. يرجى التواصل معنا إن كان هناك أي استفسار.",
  };

  const statusText = statusDescriptions[status] || `حالته الحالية: ${status}`;

  const message = `مرحباً ${customerName} 👋
معك إدارة *Gogo Concrete Store* بخصوص طلبك رقم *#${orderNumber}*:

${statusText}

يسعدنا دائماً خدمتك لأي استفسار 🏺✨`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
