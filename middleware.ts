import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';
import { UserRole, normalizeRole } from './types/roles';

interface ProfileRow {
  role: string | null;
  is_active: boolean | null;
}

// ---------------------------------------------------------------------------
// SECURITY NOTE — Campus Nexus Auth Hardening
// ---------------------------------------------------------------------------
// Authorization in this proxy relies EXCLUSIVELY on:
//   1. The verified Supabase Auth user returned by updateSession() → getUser()
//      (JWT is verified server-side; cannot be forged by a browser cookie)
//   2. The `role` column from the `public.profiles` database table
//      (fetched using the verified authenticated user's ID)
//
// The legacy convenience cookies written by the client (campusnexus_active_role,
// campusnexus_authenticated) are intentionally IGNORED here. They exist only
// as a UI-state cache for AuthContext and have NO security meaning in this file.
// ---------------------------------------------------------------------------

// Protected route prefixes mapped to the database role required
const ROLE_ROUTES: Record<string, UserRole> = {
  '/student': 'student',
  '/faculty': 'faculty',
  '/hod': 'hod',
};



export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Static assets and internal Next.js routes — skip entirely ─────────────
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // ── Check if this path requires role-based authorization ──────────────────
  const matchedPrefix = Object.keys(ROLE_ROUTES).find((prefix) =>
    pathname.startsWith(prefix)
  );

  // ── Non-protected paths (/, /login, /unauthorized, /reset-password, /auth/*) ─
  if (!matchedPrefix) {
    // Refresh the Supabase session so httpOnly auth cookies stay valid
    const { response } = await updateSession(request);
    return response;
  }

  const requiredRole = ROLE_ROUTES[matchedPrefix];

  // ── Verify the Supabase session cryptographically ─────────────────────────
  // updateSession calls supabase.auth.getUser(), which validates the JWT
  // with the Supabase auth server — this cannot be spoofed by a browser cookie.
  const { response, user, supabase } = await updateSession(request);


  // ── No verified Supabase user → redirect to /login ────────────────────────
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Fetch authoritative role from the database ────────────────────────────
  // We use the supabase client that was already initialised with the verified
  // session by updateSession(), so this query runs as the authenticated user
  // and is subject to Supabase RLS (users can only read their own profile).
  if (!supabase) {
    // This can only happen if NEXT_PUBLIC_SUPABASE_URL/ANON_KEY are missing
    // in a non-demo environment. updateSession() already logged the error.
    // Treat as unauthenticated and redirect to login.
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'configuration_error');
    return NextResponse.redirect(loginUrl);
  }

  let dbRole: UserRole | null = null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .maybeSingle();

    const profileRow = data as ProfileRow | null;

    if (error) {
      console.error('[proxy] profiles DB query error:', error.message);
    } else if (profileRow) {
      // Reject deactivated accounts at the proxy level
      if (profileRow.is_active === false) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', 'account_deactivated');
        return NextResponse.redirect(loginUrl);
      }
      dbRole = normalizeRole(profileRow.role);
    }
  } catch (err) {
    console.error('[proxy] Exception querying profiles:', err);
  }

  // ── No valid role found in DB → redirect to /unauthorized ─────────────────
  if (!dbRole) {
    const unauthorizedUrl = new URL('/unauthorized', request.url);
    unauthorizedUrl.searchParams.set('attempted', pathname);
    unauthorizedUrl.searchParams.set('requiredRole', requiredRole.toUpperCase());
    unauthorizedUrl.searchParams.set('currentRole', 'UNKNOWN');
    return NextResponse.redirect(unauthorizedUrl);
  }

  // ── Role mismatch → redirect to /unauthorized ─────────────────────────────
  if (dbRole !== requiredRole) {
    const unauthorizedUrl = new URL('/unauthorized', request.url);
    unauthorizedUrl.searchParams.set('attempted', pathname);
    unauthorizedUrl.searchParams.set('requiredRole', requiredRole.toUpperCase());
    unauthorizedUrl.searchParams.set('currentRole', dbRole.toUpperCase());
    return NextResponse.redirect(unauthorizedUrl);
  }

  // ── Authorized — allow the request through ────────────────────────────────
  return response;
}

export const config = {
  matcher: [
    '/student/:path*',
    '/faculty/:path*',
    '/hod/:path*',
    '/login',
    '/reset-password',
    '/unauthorized',
  ],
};
