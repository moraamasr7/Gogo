// app/api/receipt-url/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 });
    }

    const { path } = await req.json();
    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'مسار الملف غير صالح' }, { status: 400 });
    }

    // Generate signed URL valid for 5 minutes (300 seconds)
    const { data, error } = await supabase.storage
      .from('payment-screenshots')
      .createSignedUrl(path, 300);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: 'تعذر توليد رابط معاينة الإيصال' }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}
