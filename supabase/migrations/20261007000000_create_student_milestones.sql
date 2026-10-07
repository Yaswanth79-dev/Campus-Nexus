-- Migration to support Career Milestones

-- Create Global Career Milestones Table
CREATE TABLE IF NOT EXISTS public.career_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    milestone_key VARCHAR NOT NULL UNIQUE,
    title VARCHAR NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Student Career Milestones State Table
CREATE TABLE IF NOT EXISTS public.student_career_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES public.career_milestones(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, milestone_id)
);

-- Add Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_student_milestones_student_id ON public.student_career_milestones(student_id);

-- Seed global milestones
INSERT INTO public.career_milestones (milestone_key, title, display_order) VALUES
('m1', 'Core Data Structures & Algorithms Foundations', 1),
('m2', 'Database Design & Relational PostgreSQL Optimization', 2),
('m3', 'Full-Stack Web Architecture (Next.js / FastAPI)', 3),
('m4', 'Industry Cloud Certification (AWS Solutions Architect)', 4),
('m5', 'Summer Production Internship in Software Engineering', 5),
('m6', 'Capstone Distributed Systems Project', 6)
ON CONFLICT (milestone_key) DO NOTHING;

-- RLS setup
ALTER TABLE public.career_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_career_milestones ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read global milestones
CREATE POLICY "Enable read access for all authenticated users on career_milestones"
    ON public.career_milestones
    FOR SELECT
    TO authenticated
    USING (true);

-- Student milestones RLS
CREATE POLICY "Students can view their own milestones"
    ON public.student_career_milestones
    FOR SELECT
    TO authenticated
    USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own milestones"
    ON public.student_career_milestones
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own milestones"
    ON public.student_career_milestones
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = student_id);
    
-- updated_at trigger
CREATE OR REPLACE FUNCTION update_milestone_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_career_milestones_modtime
BEFORE UPDATE ON public.student_career_milestones
FOR EACH ROW
EXECUTE FUNCTION update_milestone_updated_at_column();
