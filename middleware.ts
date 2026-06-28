import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Protect /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Allow /admin/login without session
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    const sessionToken = request.cookies.get('admin_session');
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
