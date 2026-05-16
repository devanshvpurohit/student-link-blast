-- ============================================================
-- Migration: College-based isolation
-- Each user sees only content from people at their own college.
-- ============================================================

-- 1. Add `college` column to profiles (required, not nullable after backfill)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS college TEXT;

-- 2. Helper function: returns the current user's college
--    Used inside RLS policies so we don't subquery every time.
CREATE OR REPLACE FUNCTION public.get_my_college()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT college FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- 3. PROFILES — only see profiles from same college
-- ============================================================
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view same-college profiles"
  ON public.profiles FOR SELECT
  USING (
    college = public.get_my_college()
    OR id = auth.uid()   -- always see your own profile
  );

-- INSERT / UPDATE policies stay the same (own row only)

-- ============================================================
-- 4. POSTS (Pulse feed) — only see posts from same-college users
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;

CREATE POLICY "Users can view same-college posts"
  ON public.posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = posts.created_by
        AND p.college = public.get_my_college()
    )
  );

-- Restrict post creation: only if user has a college set
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;

CREATE POLICY "Users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND public.get_my_college() IS NOT NULL
  );

-- ============================================================
-- 5. ANONYMOUS POSTS (AnonySpace) — scope to college
--    We track the poster's college without revealing identity.
-- ============================================================
ALTER TABLE public.anon_posts
  ADD COLUMN IF NOT EXISTS college TEXT;

-- On insert, automatically stamp the poster's college
CREATE OR REPLACE FUNCTION public.stamp_anon_post_college()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.college := public.get_my_college();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stamp_college_on_anon_post ON public.anon_posts;
CREATE TRIGGER stamp_college_on_anon_post
  BEFORE INSERT ON public.anon_posts
  FOR EACH ROW EXECUTE FUNCTION public.stamp_anon_post_college();

DROP POLICY IF EXISTS "Anyone can view anonymous posts" ON public.anon_posts;

CREATE POLICY "Users can view same-college anon posts"
  ON public.anon_posts FOR SELECT
  USING (college = public.get_my_college() OR college IS NULL);

DROP POLICY IF EXISTS "Authenticated users can create anonymous posts" ON public.anon_posts;

CREATE POLICY "Authenticated users can create anonymous posts"
  ON public.anon_posts FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.get_my_college() IS NOT NULL
  );

-- ============================================================
-- 6. CLUBS — scope to college
-- ============================================================
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS college TEXT;

-- Auto-stamp college on club creation
CREATE OR REPLACE FUNCTION public.stamp_club_college()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.college := public.get_my_college();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stamp_college_on_club ON public.clubs;
CREATE TRIGGER stamp_college_on_club
  BEFORE INSERT ON public.clubs
  FOR EACH ROW EXECUTE FUNCTION public.stamp_club_college();

DROP POLICY IF EXISTS "Anyone can view clubs" ON public.clubs;

CREATE POLICY "Users can view same-college clubs"
  ON public.clubs FOR SELECT
  USING (college = public.get_my_college() OR college IS NULL);

DROP POLICY IF EXISTS "Authenticated users can create clubs" ON public.clubs;

CREATE POLICY "Authenticated users can create clubs"
  ON public.clubs FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND public.get_my_college() IS NOT NULL
  );

-- ============================================================
-- 7. CAMPUS EVENTS — scope to college (if table exists)
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campus_events') THEN
    -- Add college column
    ALTER TABLE public.campus_events ADD COLUMN IF NOT EXISTS college TEXT;

    -- Auto-stamp
    EXECUTE $func$
      CREATE OR REPLACE FUNCTION public.stamp_event_college()
      RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $f$
      BEGIN
        NEW.college := public.get_my_college();
        RETURN NEW;
      END;
      $f$;
    $func$;

    DROP TRIGGER IF EXISTS stamp_college_on_event ON public.campus_events;
    EXECUTE 'CREATE TRIGGER stamp_college_on_event
      BEFORE INSERT ON public.campus_events
      FOR EACH ROW EXECUTE FUNCTION public.stamp_event_college()';

    -- Drop broad policy if it exists
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view events" ON public.campus_events';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view events" ON public.campus_events';

    EXECUTE $pol$
      CREATE POLICY "Users can view same-college events"
        ON public.campus_events FOR SELECT
        USING (college = public.get_my_college() OR college IS NULL)
    $pol$;
  END IF;
END $$;

-- ============================================================
-- 8. DATING MATCHES — restrict to same-college users
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dating_matches') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view dating matches" ON public.dating_matches';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view dating_matches" ON public.dating_matches';

    EXECUTE $pol$
      CREATE POLICY "Users can view same-college dating matches"
        ON public.dating_matches FOR SELECT
        USING (
          (auth.uid() = user_id OR auth.uid() = matched_user_id)
          AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (CASE WHEN auth.uid() = user_id THEN matched_user_id ELSE user_id END)
              AND p.college = public.get_my_college()
          )
        )
    $pol$;
  END IF;
END $$;

-- ============================================================
-- 9. CONNECTIONS — only connect with same-college users
-- ============================================================
DROP POLICY IF EXISTS "Users can create connection requests" ON public.connections;

CREATE POLICY "Users can create connection requests"
  ON public.connections FOR INSERT
  WITH CHECK (
    auth.uid() = requester_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = receiver_id
        AND p.college = public.get_my_college()
    )
  );

-- ============================================================
-- 10. INDEX for fast college lookups
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_college ON public.profiles(college);
CREATE INDEX IF NOT EXISTS idx_posts_created_by ON public.posts(created_by);
CREATE INDEX IF NOT EXISTS idx_anon_posts_college ON public.anon_posts(college);
CREATE INDEX IF NOT EXISTS idx_clubs_college ON public.clubs(college);
