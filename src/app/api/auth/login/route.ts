import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/auth';

// Detecta URL base correta (sem localhost) a partir do host header ou env
function getBaseUrl(req: NextRequest): string {
  return (
    process.env.APP_URL ||
    req.headers.get('origin') ||
    (req.headers.get('x-forwarded-proto') && req.headers.get('host')
      ? `${req.headers.get('x-forwarded-proto')}://${req.headers.get('host')}`
      : null) ||
    new URL(req.url).origin
  );
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = (form.get('email') as string) || '';
  const password = (form.get('password') as string) || '';

  const baseUrl = getBaseUrl(req);

  if (!email || !password) {
    return NextResponse.redirect(new URL('/admin/login?error=missing', baseUrl), { status: 303 });
  }

  const ok = await login(email, password);
  if (!ok) {
    return NextResponse.redirect(new URL('/admin/login?error=invalid', baseUrl), { status: 303 });
  }

  return NextResponse.redirect(new URL('/admin', baseUrl), { status: 303 });
}
