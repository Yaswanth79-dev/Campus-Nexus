import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { normalizeRole } from '@/types/roles';
import { Tables, TablesInsert, UserRole } from '@/types/database';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const next = searchParams.get('next') || '/';

  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data?.session?.user) {
        // Password recovery flow → send to reset-password page (kept for compatibility)
        if (type === 'recovery') {
          return NextResponse.redirect(`${origin}/reset-password`);
        }

        const user = data.session.user;

        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          const profileData = profile as Tables<'profiles'>;
          if (profileData.is_active === false) {
            await supabase.auth.signOut();
            return NextResponse.redirect(`${origin}/login?error=This_account_has_not_yet_been_provisioned_by_the_institution.`);
          }
          const dbRole = normalizeRole(profileData.role);
          return NextResponse.redirect(`${origin}/${dbRole}/dashboard`);
        } else {
          // First-time authentication: Provision a controlled pending profile.
          // Do not grant an active role. Set is_active = false.
          const insertPayload: TablesInsert<'profiles'> = {
            id: user.id,
            email: user.email || '',
            full_name: String(user.user_metadata?.full_name || user.email?.split('@')[0] || 'New User'),
            role: 'student' as UserRole,
            is_active: false,
            department: 'IT',
          };
          const { error: insertErr } = await supabase.from('profiles').insert(insertPayload as never);

          if (insertErr) {
            console.error('Failed to create provisioned profile:', insertErr);
          }

          // Sign out since they are unprovisioned
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/login?error=This_account_has_not_yet_been_provisioned_by_the_institution.`);
        }
      }
    } catch (err) {
      console.error('Supabase auth callback error:', err);
    }
  }

  // Return user to login if code exchange failed
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
