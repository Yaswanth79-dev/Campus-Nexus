import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Prevent client-side evaluation or import
if (typeof window !== 'undefined') {
  throw new Error(
    '[Campus Nexus Security] admin.ts cannot be imported or executed in client components. It must remain strictly server-side.'
  );
}

/**
 * Creates an administrative Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * STRICTLY SERVER-SIDE ONLY.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      '[Campus Nexus Security] SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required for administrative provisioning.'
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export interface InstitutionalProvisionParams {
  targetUserId: string;
  newRole?: 'student' | 'faculty' | 'hod';
  newDepartment?: string;
  isActive?: boolean;
  reason?: string;
}

export interface InstitutionalProvisionResult {
  success: boolean;
  audit_log_id: string;
  action: string;
  target_user_id: string;
  role: string;
  department: string;
  is_active: boolean;
}

/**
 * Verifies that the requester has institutional administrator authorization.
 * Checks the active Supabase session or caller metadata for institutional admin claims.
 */
export async function assertInstitutionalAdmin(requesterContext?: {
  isInstitutionalAdmin?: boolean;
}): Promise<boolean> {
  if (requesterContext?.isInstitutionalAdmin === true) {
    return true;
  }

  try {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error('[Campus Nexus Security] Unauthorized: No active authenticated user session.');
    }

    const isAdmin =
      user.app_metadata?.is_institutional_admin === true ||
      user.user_metadata?.is_institutional_admin === true;

    if (!isAdmin) {
      throw new Error(
        '[Campus Nexus Security] Forbidden: Requester lacks institutional administrator authorization.'
      );
    }

    return true;
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('[Campus Nexus Security]')) {
      throw err;
    }
    throw new Error(
      `[Campus Nexus Security] Authorization check failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Server-side institutional provisioning executor.
 * Validates requester authorization before using elevated service-role privileges.
 */
export async function institutionalProvisionProfile(
  params: InstitutionalProvisionParams,
  options?: { skipAuthCheck?: boolean; requesterIsAdmin?: boolean }
): Promise<InstitutionalProvisionResult> {
  // Enforce requester authorization check before utilizing service-role key
  if (!options?.skipAuthCheck) {
    await assertInstitutionalAdmin({ isInstitutionalAdmin: options?.requesterIsAdmin });
  }

  const adminClient = createAdminClient();

  // Call the SECURITY DEFINER RPC function with elevated service role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient.rpc as any)('institutional_provision_profile', {
    p_target_user_id: params.targetUserId,
    p_new_role: params.newRole ?? null,
    p_new_department: params.newDepartment ?? null,
    p_is_active: params.isActive ?? null,
    p_reason: params.reason ?? 'Institutional administrative provisioning',
  });

  if (error) {
    throw new Error(`[Campus Nexus Admin] Institutional provisioning failed: ${error.message}`);
  }

  return data as InstitutionalProvisionResult;
}
