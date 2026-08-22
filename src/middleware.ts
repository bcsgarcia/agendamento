import { NextResponse, NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Forçar bypass de cache em rotas admin (e em TUDO por enquanto, até debugar)
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');

  return res;
}

export const config = {
  matcher: '/admin/:path*',
};
