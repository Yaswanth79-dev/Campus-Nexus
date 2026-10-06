'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, AuthState, AuthResult } from '@/types/auth';
import { UserRole, normalizeRole } from '@/types/roles';
import { Tables } from '@/types/database';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<AuthResult>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_COOKIE_KEY = 'campusnexus_active_role';
const AUTH_COOKIE_KEY = 'campusnexus_authenticated';

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async (userId: string, userEmail: string): Promise<UserProfile | null> => {
    try {
      const supabase = getSupabaseBrowserClient();

      const { data, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileErr) {
        console.error('Error querying profiles table:', profileErr);
        return null;
      }

      if (!data) {
        return null;
      }

      const profileData = data as Tables<'profiles'>;
      const userRole = normalizeRole(profileData.role) || 'student';

      let studentRecord: Tables<'students'> | null = null;
      let facultyRecord: Tables<'faculty'> | null = null;

      if (userRole === 'student') {
        const { data: sData } = await supabase
          .from('students')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        studentRecord = sData ? (sData as Tables<'students'>) : null;
      } else if (userRole === 'faculty' || userRole === 'hod') {
        const { data: fData } = await supabase
          .from('faculty')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        facultyRecord = fData ? (fData as Tables<'faculty'>) : null;
      }

      return {
        id: profileData.id,
        email: profileData.email || userEmail,
        fullName: profileData.full_name,
        role: userRole,
        department: profileData.department || 'IT',
        avatarUrl: profileData.avatar_url,
        phone: profileData.phone,
        isActive: profileData.is_active,
        profileCompletion: profileData.profile_completion ?? 0,
        createdAt: profileData.created_at,
        updatedAt: profileData.updated_at,

        ...(studentRecord ? {
          studentId: studentRecord.roll_number,
          year: studentRecord.year,
          semester: studentRecord.semester,
          section: studentRecord.section,
          branch: studentRecord.branch,
          batch: studentRecord.batch,
          admissionYear: studentRecord.admission_year,
          cgpa: studentRecord.cgpa,
          attendancePct: studentRecord.attendance_pct,
          backlogCount: studentRecord.backlog_count,
          dateOfBirth: studentRecord.date_of_birth,
          gender: studentRecord.gender,
          bio: studentRecord.bio,
          githubUrl: studentRecord.github_url,
          linkedinUrl: studentRecord.linkedin_url,
          portfolioUrl: studentRecord.portfolio_url,
          resumeUrl: studentRecord.resume_url,
          careerGoalTitle: studentRecord.career_goal_title,
          careerDomain: studentRecord.career_domain,
          preferredRole: studentRecord.preferred_role,
          internshipStatus: studentRecord.internship_status,
          placementStatus: studentRecord.placement_status,
          higherStudies: studentRecord.higher_studies,
        } : {}),

        ...(facultyRecord ? {
          facultyId: facultyRecord.employee_id,
          designation: facultyRecord.designation,
          specialization: facultyRecord.specialization,
          qualification: facultyRecord.qualification,
          experienceYears: facultyRecord.experience_years,
          teachingSubjects: facultyRecord.teaching_subjects,
          skills: facultyRecord.skills,
          profileBio: facultyRecord.profile_bio,
          officeLocation: facultyRecord.office_location,
          officeHours: facultyRecord.office_hours,
        } : {}),
      };
    } catch (err) {
      console.error('Exception fetching user profile:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseBrowserClient();

    async function initSession() {
      try {
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();

        if (sessionErr) {
          console.warn('Supabase getSession error:', sessionErr.message);
        }

        if (session?.user && isMounted) {
          const profile = await fetchUserProfile(session.user.id, session.user.email || '');

          if (profile) {
            if (profile.isActive === false) {
              await supabase.auth.signOut();
              deleteCookie(ROLE_COOKIE_KEY);
              deleteCookie(AUTH_COOKIE_KEY);
              setUser(null);
              setRole(null);
              setError('This account has not yet been provisioned by the institution.');
            } else {
              setUser(profile);
              setRole(profile.role);
              setCookie(ROLE_COOKIE_KEY, profile.role);
              setCookie(AUTH_COOKIE_KEY, 'true');
            }
          }
        } else if (isMounted) {
          deleteCookie(ROLE_COOKIE_KEY);
          deleteCookie(AUTH_COOKIE_KEY);
          setUser(null);
          setRole(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchUserProfile(session.user.id, session.user.email || '');
        if (profile && profile.isActive !== false) {
          setUser(profile);
          setRole(profile.role);
          setCookie(ROLE_COOKIE_KEY, profile.role);
          setCookie(AUTH_COOKIE_KEY, 'true');
        } else if (profile && profile.isActive === false) {
          await supabase.auth.signOut();
          deleteCookie(ROLE_COOKIE_KEY);
          deleteCookie(AUTH_COOKIE_KEY);
          setUser(null);
          setRole(null);
          setError('This account has not yet been provisioned by the institution.');
        }
      } else if (event === 'SIGNED_OUT') {
        deleteCookie(ROLE_COOKIE_KEY);
        deleteCookie(AUTH_COOKIE_KEY);
        setUser(null);
        setRole(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const refreshProfile = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      let targetUserId = user?.id;
      let targetUserEmail = user?.email || '';

      if (!targetUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          targetUserId = session.user.id;
          targetUserEmail = session.user.email || '';
        }
      }

      if (!targetUserId) return;

      const refreshed = await fetchUserProfile(targetUserId, targetUserEmail);
      if (refreshed) {
        setUser(refreshed);
        setRole(refreshed.role);
        setCookie(ROLE_COOKIE_KEY, refreshed.role);
      }
    } catch (e) {
      console.error('Error refreshing profile:', e);
    }
  }, [user, fetchUserProfile]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message || 'Unable to continue with Google. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Google sign in error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage === 'Failed to fetch') {
        setError('Network error: Unable to reach the authentication server. Please check your internet connection or verify the Supabase Project URL.');
      } else {
        setError(errorMessage || 'Unable to continue with Google. Please try again.');
      }
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInErr) {
        setIsLoading(false);
        setError(signInErr.message);
        return { success: false, error: signInErr.message };
      }

      if (data.session && data.user) {
        const profile = await fetchUserProfile(data.user.id, data.user.email || '');
        if (profile) {
          if (profile.isActive === false) {
            await supabase.auth.signOut();
            deleteCookie(ROLE_COOKIE_KEY);
            deleteCookie(AUTH_COOKIE_KEY);
            setUser(null);
            setRole(null);
            setIsLoading(false);
            const errMsg = 'This account has not yet been provisioned by the institution.';
            setError(errMsg);
            return { success: false, error: errMsg };
          }
          setUser(profile);
          setRole(profile.role);
          setCookie(ROLE_COOKIE_KEY, profile.role);
          setCookie(AUTH_COOKIE_KEY, 'true');
          setIsLoading(false);
          return { success: true, role: profile.role };
        }
      }
      
      setIsLoading(false);
      return { success: false, error: 'Login failed.' };
    } catch (err: unknown) {
      console.error('Sign in error:', err);
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errMsg = errorMessage || 'An error occurred during sign in.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  }, [fetchUserProfile]);

  const signUpWithEmail = useCallback(async (email: string, password: string, fullName: string): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${origin}/auth/callback`,
        }
      });

      if (signUpErr) {
        setIsLoading(false);
        setError(signUpErr.message);
        return { success: false, error: signUpErr.message };
      }

      // If email confirmation is not required, user might be signed in immediately
      if (data.session && data.user) {
         // Profile will be created by trigger, but it might take a moment
         const profile = await fetchUserProfile(data.user.id, data.user.email || '');
         if (profile && profile.isActive === false) {
             await supabase.auth.signOut();
             deleteCookie(ROLE_COOKIE_KEY);
             deleteCookie(AUTH_COOKIE_KEY);
             setUser(null);
             setRole(null);
             setIsLoading(false);
             return { success: true, error: 'Registration successful. Account awaiting institution approval.' };
         } else if (profile) {
             setIsLoading(false);
             return { success: true, role: profile.role };
         }
      }
      
      setIsLoading(false);
      return { success: true };
    } catch (err: unknown) {
      console.error('Sign up error:', err);
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errMsg = errorMessage || 'An error occurred during registration.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  }, [fetchUserProfile]);

  const resetPasswordForEmail = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      });
      
      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: unknown) {
      console.error('Reset password error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errMsg = errorMessage || 'An error occurred while sending reset instructions.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out exception:', err);
    } finally {
      deleteCookie(ROLE_COOKIE_KEY);
      deleteCookie(AUTH_COOKIE_KEY);
      setUser(null);
      setRole(null);
      setIsLoading(false);
      router.push('/login');
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        isAuthenticated: Boolean(user && role),
        error,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPasswordForEmail,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

