import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/auth';

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
  await logout();
  const baseUrl = getBaseUrl(req);
  return NextResponse.redirect(new URL('/admin/login', baseUrl), { status: 303 });
}
