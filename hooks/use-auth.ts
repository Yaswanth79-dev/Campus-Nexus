'use client';

import { useAuthContext } from '@/lib/auth/auth-context';

export function useAuth() {
  const context = useAuthContext();

  return {
    ...context,
    isStudent: context.role === 'student',
    isFaculty: context.role === 'faculty',
    isHod: context.role === 'hod',
  };
}
