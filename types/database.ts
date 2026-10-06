export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'student' | 'faculty' | 'hod';

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: {
          code: string;
          name: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          code: string;
          name: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: UserRole;
          avatar_url: string | null;
          phone: string | null;
          department: string;
          is_active: boolean;
          profile_completion: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role?: UserRole;
          avatar_url?: string | null;
          phone?: string | null;
          department?: string;
          is_active?: boolean;
          profile_completion?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          role?: UserRole;
          avatar_url?: string | null;
          phone?: string | null;
          department?: string;
          is_active?: boolean;
          profile_completion?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedSchema: 'auth';
          },
          {
            foreignKeyName: 'profiles_department_fkey';
            columns: ['department'];
            isOneToOne: false;
            referencedRelation: 'departments';
            referencedSchema: 'public';
          },
        ];
      };
      students: {
        Row: {
          id: string;
          roll_number: string | null;
          year: number | null;
          section: string | null;
          branch: string;
          semester: number | null;
          cgpa: number | null;
          date_of_birth: string | null;
          gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say' | null;
          batch: string | null;
          admission_year: number | null;
          attendance_pct: number | null;
          backlog_count: number;
          career_goal: string | null;
          career_goal_title: string | null;
          career_domain: string | null;
          preferred_role: string | null;
          internship_status: 'Not Started' | 'Searching' | 'Applied' | 'Interview' | 'Secured' | 'Completed';
          placement_status: 'Not Eligible' | 'Eligible' | 'Applied' | 'Offer Received' | 'Placed' | 'Higher Studies';
          higher_studies: boolean;
          resume_url: string | null;
          bio: string | null;
          github_url: string | null;
          linkedin_url: string | null;
          portfolio_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          roll_number?: string | null;
          year?: number | null;
          section?: string | null;
          branch?: string;
          semester?: number | null;
          cgpa?: number | null;
          date_of_birth?: string | null;
          gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say' | null;
          batch?: string | null;
          admission_year?: number | null;
          attendance_pct?: number | null;
          backlog_count?: number;
          career_goal?: string | null;
          career_goal_title?: string | null;
          career_domain?: string | null;
          preferred_role?: string | null;
          internship_status?: 'Not Started' | 'Searching' | 'Applied' | 'Interview' | 'Secured' | 'Completed';
          placement_status?: 'Not Eligible' | 'Eligible' | 'Applied' | 'Offer Received' | 'Placed' | 'Higher Studies';
          higher_studies?: boolean;
          resume_url?: string | null;
          bio?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          portfolio_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          roll_number?: string | null;
          year?: number | null;
          section?: string | null;
          branch?: string;
          semester?: number | null;
          cgpa?: number | null;
          date_of_birth?: string | null;
          gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say' | null;
          batch?: string | null;
          admission_year?: number | null;
          attendance_pct?: number | null;
          backlog_count?: number;
          career_goal?: string | null;
          career_goal_title?: string | null;
          career_domain?: string | null;
          preferred_role?: string | null;
          internship_status?: 'Not Started' | 'Searching' | 'Applied' | 'Interview' | 'Secured' | 'Completed';
          placement_status?: 'Not Eligible' | 'Eligible' | 'Applied' | 'Offer Received' | 'Placed' | 'Higher Studies';
          higher_studies?: boolean;
          resume_url?: string | null;
          bio?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          portfolio_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'students_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedSchema: 'public';
          },
        ];
      };
      faculty: {
        Row: {
          id: string;
          employee_id: string | null;
          designation: string | null;
          specialization: string | null;
          qualification: string | null;
          experience_years: number | null;
          teaching_subjects: string[] | null;
          skills: string[] | null;
          profile_bio: string | null;
          office_location: string | null;
          office_hours: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          employee_id?: string | null;
          designation?: string | null;
          specialization?: string | null;
          qualification?: string | null;
          experience_years?: number | null;
          teaching_subjects?: string[] | null;
          skills?: string[] | null;
          profile_bio?: string | null;
          office_location?: string | null;
          office_hours?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string | null;
          designation?: string | null;
          specialization?: string | null;
          qualification?: string | null;
          experience_years?: number | null;
          teaching_subjects?: string[] | null;
          skills?: string[] | null;
          profile_bio?: string | null;
          office_location?: string | null;
          office_hours?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'faculty_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedSchema: 'public';
          },
        ];
      };
      student_skills: {
        Row: {
          id: string;
          student_id: string;
          skill_name: string;
          category: string;
          proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
          is_endorsed: boolean;
          endorsed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          skill_name: string;
          category: string;
          proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
          is_endorsed?: boolean;
          endorsed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          skill_name?: string;
          category?: string;
          proficiency?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
          is_endorsed?: boolean;
          endorsed_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      student_projects: {
        Row: {
          id: string;
          student_id: string;
          title: string;
          description: string;
          technologies: string[];
          github_url: string | null;
          demo_url: string | null;
          team_members: string | null;
          status: 'Planning' | 'In Progress' | 'Completed';
          faculty_feedback: string | null;
          is_reviewed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          title: string;
          description: string;
          technologies?: string[];
          github_url?: string | null;
          demo_url?: string | null;
          team_members?: string | null;
          status?: 'Planning' | 'In Progress' | 'Completed';
          faculty_feedback?: string | null;
          is_reviewed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          title?: string;
          description?: string;
          technologies?: string[];
          github_url?: string | null;
          demo_url?: string | null;
          team_members?: string | null;
          status?: 'Planning' | 'In Progress' | 'Completed';
          faculty_feedback?: string | null;
          is_reviewed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      student_certifications: {
        Row: {
          id: string;
          student_id: string;
          name: string;
          issuing_organization: string;
          issue_date: string | null;
          expiry_date: string | null;
          credential_id: string | null;
          credential_url: string | null;
          certificate_file_url: string | null;
          is_verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          name: string;
          issuing_organization: string;
          issue_date?: string | null;
          expiry_date?: string | null;
          credential_id?: string | null;
          credential_url?: string | null;
          certificate_file_url?: string | null;
          is_verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          name?: string;
          issuing_organization?: string;
          issue_date?: string | null;
          expiry_date?: string | null;
          credential_id?: string | null;
          credential_url?: string | null;
          certificate_file_url?: string | null;
          is_verified?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      student_achievements: {
        Row: {
          id: string;
          student_id: string;
          title: string;
          category: string;
          achievement_date: string | null;
          description: string | null;
          proof_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          title: string;
          category: string;
          achievement_date?: string | null;
          description?: string | null;
          proof_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          title?: string;
          category?: string;
          achievement_date?: string | null;
          description?: string | null;
          proof_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      student_internships: {
        Row: {
          id: string;
          student_id: string;
          company_name: string;
          role_title: string;
          internship_type: string | null;
          start_date: string | null;
          end_date: string | null;
          status: 'Applied' | 'Interview' | 'Offered' | 'Active' | 'Completed' | 'Rejected';
          stipend: string | null;
          certificate_url: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          company_name: string;
          role_title: string;
          internship_type?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: 'Applied' | 'Interview' | 'Offered' | 'Active' | 'Completed' | 'Rejected';
          stipend?: string | null;
          certificate_url?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          company_name?: string;
          role_title?: string;
          internship_type?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: 'Applied' | 'Interview' | 'Offered' | 'Active' | 'Completed' | 'Rejected';
          stipend?: string | null;
          certificate_url?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      learning_modules: {
        Row: {
          id: string;
          title: string;
          category: 'Programming' | 'Practice' | 'Course' | 'Quiz' | 'Test';
          topic: string;
          difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | null;
          credits_reward: number;
          external_url: string | null;
          description: string | null;
          estimated_time: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          category: 'Programming' | 'Practice' | 'Course' | 'Quiz' | 'Test';
          topic: string;
          difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | null;
          credits_reward?: number;
          external_url?: string | null;
          description?: string | null;
          estimated_time?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          category?: 'Programming' | 'Practice' | 'Course' | 'Quiz' | 'Test';
          topic?: string;
          difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | null;
          credits_reward?: number;
          external_url?: string | null;
          description?: string | null;
          estimated_time?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      student_learning_activities: {
        Row: {
          id: string;
          student_id: string;
          module_id: string | null;
          module_title: string;
          category: 'Programming' | 'Practice' | 'Course' | 'Quiz' | 'Test';
          topic: string;
          score: number | null;
          credits_earned: number;
          status: 'In Progress' | 'Completed';
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          module_id?: string | null;
          module_title: string;
          category: 'Programming' | 'Practice' | 'Course' | 'Quiz' | 'Test';
          topic: string;
          score?: number | null;
          credits_earned?: number;
          status?: 'In Progress' | 'Completed';
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          module_id?: string | null;
          module_title?: string;
          category?: 'Programming' | 'Practice' | 'Course' | 'Quiz' | 'Test';
          topic?: string;
          score?: number | null;
          credits_earned?: number;
          status?: 'In Progress' | 'Completed';
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      feedback_grievances: {
        Row: {
          id: string;
          student_id: string;
          title: string;
          description: string;
          category: string;
          target_role: 'faculty' | 'hod' | 'both';
          target_faculty_id: string | null;
          department: string;
          status: 'Submitted' | 'Under Review' | 'Resolved' | 'Escalated';
          response: string | null;
          responded_by: string | null;
          responded_at: string | null;
          is_private_to_hod: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          title: string;
          description: string;
          category: string;
          target_role: 'faculty' | 'hod' | 'both';
          target_faculty_id?: string | null;
          department: string;
          status?: 'Submitted' | 'Under Review' | 'Resolved' | 'Escalated';
          response?: string | null;
          responded_by?: string | null;
          responded_at?: string | null;
          is_private_to_hod?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          title?: string;
          description?: string;
          category?: string;
          target_role?: 'faculty' | 'hod' | 'both';
          target_faculty_id?: string | null;
          department?: string;
          status?: 'Submitted' | 'Under Review' | 'Resolved' | 'Escalated';
          response?: string | null;
          responded_by?: string | null;
          responded_at?: string | null;
          is_private_to_hod?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      department_announcements: {
        Row: {
          id: string;
          department: string;
          title: string;
          content: string;
          author_id: string | null;
          target_roles: string[];
          is_pinned: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          department: string;
          title: string;
          content: string;
          author_id?: string | null;
          target_roles?: string[];
          is_pinned?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          department?: string;
          title?: string;
          content?: string;
          author_id?: string | null;
          target_roles?: string[];
          is_pinned?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      opportunities: {
        Row: {
          id: string;
          department: string | null;
          title: string;
          type: 'Internship' | 'Hackathon' | 'Research' | 'Scholarship' | 'Workshop' | 'Competition' | 'Job';
          company_or_org: string;
          description: string;
          link_url: string | null;
          deadline: string | null;
          posted_by: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          department?: string | null;
          title: string;
          type: 'Internship' | 'Hackathon' | 'Research' | 'Scholarship' | 'Workshop' | 'Competition' | 'Job';
          company_or_org: string;
          description: string;
          link_url?: string | null;
          deadline?: string | null;
          posted_by?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          department?: string | null;
          title?: string;
          type?: 'Internship' | 'Hackathon' | 'Research' | 'Scholarship' | 'Workshop' | 'Competition' | 'Job';
          company_or_org?: string;
          description?: string;
          link_url?: string | null;
          deadline?: string | null;
          posted_by?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      innovation_ideas: {
        Row: {
          id: string;
          student_id: string;
          title: string;
          domain: string;
          description: string;
          tech_stack: string[];
          status: 'Under Review' | 'Approved' | 'Needs Refinement' | 'Rejected';
          faculty_mentor_id: string | null;
          faculty_feedback: string | null;
          votes_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          title: string;
          domain: string;
          description: string;
          tech_stack?: string[];
          status?: 'Under Review' | 'Approved' | 'Needs Refinement' | 'Rejected';
          faculty_mentor_id?: string | null;
          faculty_feedback?: string | null;
          votes_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          title?: string;
          domain?: string;
          description?: string;
          tech_stack?: string[];
          status?: 'Under Review' | 'Approved' | 'Needs Refinement' | 'Rejected';
          faculty_mentor_id?: string | null;
          faculty_feedback?: string | null;
          votes_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      department_resources: {
        Row: {
          id: string;
          department: string;
          title: string;
          category: string;
          file_url: string;
          description: string | null;
          semester: number | null;
          subject: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          department: string;
          title: string;
          category: string;
          file_url: string;
          description?: string | null;
          semester?: number | null;
          subject?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          department?: string;
          title?: string;
          category?: string;
          file_url?: string;
          description?: string | null;
          semester?: number | null;
          subject?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'academic' | 'mentoring' | 'opportunity' | 'feedback' | 'system' | 'learning';
          link_url: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: 'academic' | 'mentoring' | 'opportunity' | 'feedback' | 'system' | 'learning';
          link_url?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: 'academic' | 'mentoring' | 'opportunity' | 'feedback' | 'system' | 'learning';
          link_url?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      faculty_mentor_assignments: {
        Row: {
          id: string;
          faculty_id: string;
          student_id: string;
          department: string;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          faculty_id: string;
          student_id: string;
          department: string;
          assigned_at?: string;
        };
        Update: {
          id?: string;
          faculty_id?: string;
          student_id?: string;
          department?: string;
          assigned_at?: string;
        };
        Relationships: [];
      };
      mentoring_sessions: {
        Row: {
          id: string;
          faculty_id: string;
          student_id: string;
          session_date: string;
          topic: string;
          meeting_mode: 'In-Person' | 'Online (Google Meet)' | 'Phone / Call';
          status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Action Needed';
          notes: string | null;
          action_items: string | null;
          department: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          faculty_id: string;
          student_id: string;
          session_date?: string;
          topic: string;
          meeting_mode?: 'In-Person' | 'Online (Google Meet)' | 'Phone / Call';
          status?: 'Scheduled' | 'Completed' | 'Cancelled' | 'Action Needed';
          notes?: string | null;
          action_items?: string | null;
          department: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          faculty_id?: string;
          student_id?: string;
          session_date?: string;
          topic?: string;
          meeting_mode?: 'In-Person' | 'Online (Google Meet)' | 'Phone / Call';
          status?: 'Scheduled' | 'Completed' | 'Cancelled' | 'Action Needed';
          notes?: string | null;
          action_items?: string | null;
          department?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      department_reports: {
        Row: {
          id: string;
          department: string;
          title: string;
          report_type: 'NAAC / NBA Accreditation' | 'Semester Academic Audit' | 'Placement & Internship Report' | 'Faculty Workload' | 'Grievance Redressal Audit';
          academic_year: string;
          summary_json: Json;
          generated_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          department: string;
          title: string;
          report_type: 'NAAC / NBA Accreditation' | 'Semester Academic Audit' | 'Placement & Internship Report' | 'Faculty Workload' | 'Grievance Redressal Audit';
          academic_year: string;
          summary_json?: Json;
          generated_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          department?: string;
          title?: string;
          report_type?: 'NAAC / NBA Accreditation' | 'Semester Academic Audit' | 'Placement & Internship Report' | 'Faculty Workload' | 'Grievance Redressal Audit';
          academic_year?: string;
          summary_json?: Json;
          generated_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_auth_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
      is_hod: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      get_user_department: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_same_department: {
        Args: { target_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
