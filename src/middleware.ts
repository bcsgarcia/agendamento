// Middleware: protege /admin/* e /api/admin/* exceto /admin/login e /api/auth/*
// Seta x-pathname nos request headers pra que Server Components (ex: AdminLayout)
// possam detectar a rota atual sem precisar de hooks client-side.
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'admin_session';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Propaga pathname pros Server Components poderem ler via headers().
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);

  // Rotas públicas: login e logout
  if (pathname.startsWith('/api/auth/') || pathname.startsWith('/admin/login')) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const session = req.cookies.get(COOKIE_NAME);

  // Páginas admin: redireciona pra login se não autenticado
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!session) {
      const loginUrl = new URL('/admin/login', req.url);
      if (pathname !== '/admin') loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl, { status: 303 });
    }
  }

  // /api/admin/* (forms POST): exige sessão, retorna 401 sem cookie
  if (pathname.startsWith('/api/admin/')) {
    if (!session) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
