import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = req.nextUrl.clone();

  // Protect internal routes
  if (!session) {
    if (url.pathname.startsWith('/rider') || 
        url.pathname.startsWith('/driver') || 
        url.pathname.startsWith('/admin')) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // Redirect based on role if logged in and accessing neutral authenticated space
  // (In a real app, you'd fetch the profile role here if needed, but session check is first step)

  return res;
}

export const config = {
  matcher: ['/rider/:path*', '/driver/:path*', '/admin/:path*'],
};
