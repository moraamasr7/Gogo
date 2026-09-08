// app/api/admin/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateProfileSchema = z.object({
  currentPassword: z.string().min(6, 'كلمة المرور الحالية مطلوبة للتأكيد'),
  newEmail: z.string().email('صيغة البريد الإلكتروني غير صحيحة').optional().or(z.literal('')),
  newPassword: z.string().min(8, 'كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف').optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    // 1. Ensure user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user || !user.email) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول. يرجى تسجيل الدخول.' }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = updateProfileSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.errors[0].message }, { status: 400 });
    }

    const { currentPassword, newEmail, newPassword } = parseResult.data;

    // Must provide either new email or new password
    if (!newEmail && !newPassword) {
      return NextResponse.json({ error: 'يرجى إدخال بريد إلكتروني جديد أو كلمة مرور جديدة.' }, { status: 400 });
    }

    // 2. Verify current password securely on the server
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة.' }, { status: 403 });
    }

    // 3. Prepare updates
    const updates: { email?: string; password?: string } = {};

    if (newEmail && newEmail.toLowerCase() !== user.email.toLowerCase()) {
      updates.email = newEmail.toLowerCase().trim();
    }

    if (newPassword) {
      updates.password = newPassword;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'البيانات المدخلة مطابقة للبيانات الحالية بالفعل.' }, { status: 400 });
    }

    // 4. Perform secure server-side updateUser
    const { data: updateData, error: updateError } = await supabase.auth.updateUser(updates);

    if (updateError) {
      return NextResponse.json({ error: updateError.message || 'فشل تحديث البيانات في الخادم.' }, { status: 500 });
    }

    // If email was changed, update admin_profiles table as well
    if (updates.email) {
      await supabase
        .from('admin_profiles')
        .update({ email: updates.email, updated_at: new Date().toISOString() })
        .eq('id', user.id);
    }

    return NextResponse.json({
      success: true,
      emailChanged: Boolean(updates.email),
      passwordChanged: Boolean(updates.password),
      newEmail: updates.email || user.email,
      message: 'تم تحديث بيانات المدير بنجاح وأمان.'
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'حدث خطأ غير متوقع في الخادم.' }, { status: 500 });
  }
}
