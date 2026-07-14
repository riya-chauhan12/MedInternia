import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/', '/about', '/contact', '/faq', '/privacy', '/terms'];
const AUTH_ROUTES = ['/auth/login', '/auth/register'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value || '';
  const { pathname, searchParams } = request.nextUrl;

  if (searchParams.get('clear') === '1') {
    const response = NextResponse.next();
    response.cookies.delete('token');
    return response;
  }

  if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // All other routes are protected
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - all files with an extension (e.g. .ico, .png, .svg)
     */
    '/((?!api|_next/static|_next/image|.*\\.[\\w]+$).*)',
  ],
};
