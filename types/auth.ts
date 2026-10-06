import { UserRole } from './roles';

export interface UserProfile {
  // Core identity
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department: string;
  avatarUrl?: string | null;
  phone?: string | null;
  isActive: boolean;
  profileCompletion: number;

  // Student-specific fields
  studentId?: string | null;   // roll_number
  year?: number | null;
  semester?: number | null;
  section?: string | null;
  branch?: string | null;
  batch?: string | null;
  admissionYear?: number | null;
  cgpa?: number | null;
  attendancePct?: number | null;
  backlogCount?: number;
  dateOfBirth?: string | null;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say' | null;
  bio?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  resumeUrl?: string | null;
  careerGoalTitle?: string | null;
  careerDomain?: string | null;
  preferredRole?: string | null;
  internshipStatus?: string | null;
  placementStatus?: string | null;
  higherStudies?: boolean;

  // Faculty-specific fields
  facultyId?: string | null;   // employee_id
  designation?: string | null;
  specialization?: string | null;
  qualification?: string | null;
  experienceYears?: number | null;
  teachingSubjects?: string[] | null;
  skills?: string[] | null;
  profileBio?: string | null;
  officeLocation?: string | null;
  officeHours?: string | null;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  user: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface AuthResult {
  success: boolean;
  role?: UserRole;
  error?: string;
}
