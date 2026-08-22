import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = (form.get('email') as string) || '';
  const password = (form.get('password') as string) || '';

  if (!email || !password) {
    return NextResponse.redirect(new URL('/admin/login?error=missing', req.url), { status: 303 });
  }

  const ok = await login(email, password);
  if (!ok) {
    return NextResponse.redirect(new URL('/admin/login?error=invalid', req.url), { status: 303 });
  }

  return NextResponse.redirect(new URL('/admin', req.url), { status: 303 });
}
