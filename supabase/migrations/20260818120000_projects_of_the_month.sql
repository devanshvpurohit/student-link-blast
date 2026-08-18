-- ============================================================
-- Projects of the Month
-- Any student can submit their project; classmates vote;
-- the top-voted project each month is crowned the winner.
-- ============================================================

-- 1. Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  github_url TEXT,
  demo_url TEXT,
  image_url TEXT,
  submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  college TEXT,
  month TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  likes INT NOT NULL DEFAULT 0,
  is_winner BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_college ON public.projects(college);
CREATE INDEX IF NOT EXISTS idx_projects_month ON public.projects(month);

-- 2. Votes table
CREATE TABLE IF NOT EXISTS public.project_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, user_id)
);

-- 3. Auto-stamp the submitter's college
CREATE OR REPLACE FUNCTION public.stamp_project_college()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.college := public.get_my_college();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stamp_college_on_project ON public.projects;
CREATE TRIGGER stamp_college_on_project
  BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.stamp_project_college();

-- 4. Keep likes in sync with votes
CREATE OR REPLACE FUNCTION public.recount_project_likes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.projects p
  SET likes = (SELECT COUNT(*) FROM public.project_votes v WHERE v.project_id = p.id)
  WHERE p.id IN (OLD.project_id, NEW.project_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS sync_project_likes ON public.project_votes;
CREATE TRIGGER sync_project_likes
  AFTER INSERT OR UPDATE OR DELETE ON public.project_votes
  FOR EACH ROW EXECUTE FUNCTION public.recount_project_likes();

-- 5. RLS (college-scoped with NULL-college fallback)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view same-college projects" ON public.projects;
CREATE POLICY "Users can view same-college projects"
  ON public.projects FOR SELECT
  USING (college = public.get_my_college() OR college IS NULL OR public.get_my_college() IS NULL);

DROP POLICY IF EXISTS "Users can submit projects" ON public.projects;
CREATE POLICY "Users can submit projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);

DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = submitted_by);

DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = submitted_by);

DROP POLICY IF EXISTS "Anyone can view project votes" ON public.project_votes;
CREATE POLICY "Anyone can view project votes"
  ON public.project_votes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can vote on projects" ON public.project_votes;
CREATE POLICY "Users can vote on projects"
  ON public.project_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own votes" ON public.project_votes;
CREATE POLICY "Users can delete own votes"
  ON public.project_votes FOR DELETE
  USING (auth.uid() = user_id);