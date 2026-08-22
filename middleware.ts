// Middleware: protege /admin/* exceto /admin/login
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/admin/login'];
const COOKIE_NAME = 'admin_session';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Permite API de login/logout e login page
  if (pathname.startsWith('/api/auth/') || PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Protege todo /admin/* exceto login
  if (pathname.startsWith('/admin')) {
    const session = req.cookies.get(COOKIE_NAME);
    if (!session) {
      const loginUrl = new URL('/admin/login', req.url);
      if (pathname !== '/admin') loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl, { status: 303 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
