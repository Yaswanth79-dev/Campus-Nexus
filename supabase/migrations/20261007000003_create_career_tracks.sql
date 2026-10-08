-- Create Career Tracks
CREATE TABLE IF NOT EXISTS public.career_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_name TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Career Track Skills
CREATE TABLE IF NOT EXISTS public.career_track_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    career_track_id UUID REFERENCES public.career_tracks(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    category TEXT NOT NULL,
    target_level TEXT NOT NULL CHECK (target_level IN ('Essential', 'Recommended')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(career_track_id, skill_name)
);

-- Enable RLS
ALTER TABLE public.career_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_track_skills ENABLE ROW LEVEL SECURITY;

-- RLS: career_tracks
CREATE POLICY "career_tracks_select_all"
    ON public.career_tracks
    FOR SELECT
    TO authenticated
    USING (is_active = true OR public.get_auth_role() IN ('faculty', 'hod'));

CREATE POLICY "career_tracks_insert_faculty_hod"
    ON public.career_tracks
    FOR INSERT
    TO authenticated
    WITH CHECK (public.get_auth_role() IN ('faculty', 'hod'));

CREATE POLICY "career_tracks_update_faculty_hod"
    ON public.career_tracks
    FOR UPDATE
    TO authenticated
    USING (public.get_auth_role() IN ('faculty', 'hod'))
    WITH CHECK (public.get_auth_role() IN ('faculty', 'hod'));

CREATE POLICY "career_tracks_delete_faculty_hod"
    ON public.career_tracks
    FOR DELETE
    TO authenticated
    USING (public.get_auth_role() IN ('faculty', 'hod'));


-- RLS: career_track_skills
CREATE POLICY "career_track_skills_select_all"
    ON public.career_track_skills
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "career_track_skills_insert_faculty_hod"
    ON public.career_track_skills
    FOR INSERT
    TO authenticated
    WITH CHECK (public.get_auth_role() IN ('faculty', 'hod'));

CREATE POLICY "career_track_skills_update_faculty_hod"
    ON public.career_track_skills
    FOR UPDATE
    TO authenticated
    USING (public.get_auth_role() IN ('faculty', 'hod'))
    WITH CHECK (public.get_auth_role() IN ('faculty', 'hod'));

CREATE POLICY "career_track_skills_delete_faculty_hod"
    ON public.career_track_skills
    FOR DELETE
    TO authenticated
    USING (public.get_auth_role() IN ('faculty', 'hod'));

-- Seed Initial Data
DO $$
DECLARE
    track_cloud_id UUID;
    track_ml_id UUID;
    track_cyber_id UUID;
    track_data_id UUID;
BEGIN
    -- Full-Stack Cloud Engineer
    INSERT INTO public.career_tracks (name, description, icon_name, category)
    VALUES (
        'Full-Stack Cloud Engineer',
        'Design and deploy modern distributed web applications with Next.js, microservices, and serverless cloud architectures.',
        'Cloud',
        'Software Engineering'
    ) ON CONFLICT (name) DO UPDATE SET icon_name = EXCLUDED.icon_name
    RETURNING id INTO track_cloud_id;

    IF track_cloud_id IS NOT NULL THEN
        INSERT INTO public.career_track_skills (career_track_id, skill_name, category, target_level)
        VALUES 
            (track_cloud_id, 'TypeScript', 'Programming Languages', 'Essential'),
            (track_cloud_id, 'Next.js & React', 'Web Development', 'Essential'),
            (track_cloud_id, 'PostgreSQL', 'Database', 'Essential'),
            (track_cloud_id, 'Cloud Architecture (AWS/GCP)', 'Cloud & DevOps', 'Essential'),
            (track_cloud_id, 'Docker & Containers', 'Cloud & DevOps', 'Essential'),
            (track_cloud_id, 'REST & GraphQL APIs', 'Web Development', 'Recommended'),
            (track_cloud_id, 'CI/CD Pipelines', 'Cloud & DevOps', 'Recommended'),
            (track_cloud_id, 'Redis / Caching', 'Database', 'Recommended')
        ON CONFLICT (career_track_id, skill_name) DO NOTHING;
    END IF;

    -- AI / Machine Learning Engineer
    INSERT INTO public.career_tracks (name, description, icon_name, category)
    VALUES (
        'AI / Machine Learning Engineer',
        'Build predictive models, natural language processing pipelines, and neural networks using modern AI frameworks.',
        'Brain',
        'Artificial Intelligence'
    ) ON CONFLICT (name) DO UPDATE SET icon_name = EXCLUDED.icon_name
    RETURNING id INTO track_ml_id;

    IF track_ml_id IS NOT NULL THEN
        INSERT INTO public.career_track_skills (career_track_id, skill_name, category, target_level)
        VALUES 
            (track_ml_id, 'Python', 'Programming Languages', 'Essential'),
            (track_ml_id, 'Data Structures & Algorithms', 'Computer Science', 'Essential'),
            (track_ml_id, 'PyTorch / TensorFlow', 'AI / ML', 'Essential'),
            (track_ml_id, 'Data Science & Pandas', 'Data Science', 'Essential'),
            (track_ml_id, 'Mathematics & Linear Algebra', 'Data Science', 'Essential'),
            (track_ml_id, 'Model Deployment (FastAPI/Docker)', 'Cloud & DevOps', 'Recommended'),
            (track_ml_id, 'Vector Databases', 'Database', 'Recommended'),
            (track_ml_id, 'LLM Prompt Engineering', 'AI / ML', 'Recommended')
        ON CONFLICT (career_track_id, skill_name) DO NOTHING;
    END IF;

    -- Cybersecurity & Defense Specialist
    INSERT INTO public.career_tracks (name, description, icon_name, category)
    VALUES (
        'Cybersecurity & Defense Specialist',
        'Secure enterprise networks, perform ethical penetration testing, and analyze digital vulnerabilities.',
        'Shield',
        'Security'
    ) ON CONFLICT (name) DO UPDATE SET icon_name = EXCLUDED.icon_name
    RETURNING id INTO track_cyber_id;

    IF track_cyber_id IS NOT NULL THEN
        INSERT INTO public.career_track_skills (career_track_id, skill_name, category, target_level)
        VALUES 
            (track_cyber_id, 'Network Security & TCP/IP', 'Cybersecurity', 'Essential'),
            (track_cyber_id, 'Linux System Administration', 'Operating Systems', 'Essential'),
            (track_cyber_id, 'Python / Bash Scripting', 'Programming Languages', 'Essential'),
            (track_cyber_id, 'Vulnerability Assessment', 'Cybersecurity', 'Essential'),
            (track_cyber_id, 'Cryptography & PKI', 'Cybersecurity', 'Recommended'),
            (track_cyber_id, 'Web Application Security (OWASP)', 'Cybersecurity', 'Recommended')
        ON CONFLICT (career_track_id, skill_name) DO NOTHING;
    END IF;

    -- Data Engineer & Analytics Architect
    INSERT INTO public.career_tracks (name, description, icon_name, category)
    VALUES (
        'Data Engineer & Analytics Architect',
        'Architect big data streaming pipelines, data warehouses, and automated ETL transformation systems.',
        'Database',
        'Data Engineering'
    ) ON CONFLICT (name) DO UPDATE SET icon_name = EXCLUDED.icon_name
    RETURNING id INTO track_data_id;

    IF track_data_id IS NOT NULL THEN
        INSERT INTO public.career_track_skills (career_track_id, skill_name, category, target_level)
        VALUES 
            (track_data_id, 'SQL & Database Optimization', 'Database', 'Essential'),
            (track_data_id, 'Python', 'Programming Languages', 'Essential'),
            (track_data_id, 'Apache Spark / Distributed Data', 'Data Science', 'Essential'),
            (track_data_id, 'Data Warehousing (Snowflake/BigQuery)', 'Database', 'Essential'),
            (track_data_id, 'ETL Pipeline Design', 'Data Science', 'Recommended'),
            (track_data_id, 'Kafka / Realtime Streaming', 'Cloud & DevOps', 'Recommended')
        ON CONFLICT (career_track_id, skill_name) DO NOTHING;
    END IF;
END $$;
