import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

/**
 * Creates an administrative Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * STRICTLY SERVER-SIDE ONLY. Never import or use in client components.
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
 * Server-side institutional provisioning executor.
 * Strictly calls the authorized and audited database function via the service role key.
 */
export async function institutionalProvisionProfile(
  params: InstitutionalProvisionParams
): Promise<InstitutionalProvisionResult> {
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
