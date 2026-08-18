-- ============================================================
-- Fix: users without a college set see nothing
-- profiles.college is NULL for every new user (handle_new_user
-- never sets it, onboarding is skippable, and the isolation
-- migration added the column with no backfill). Because every
-- same-college policy called get_my_college() and got NULL,
-- all feeds, Discover, Dating, etc. returned empty.
--
-- New rule:
--   * user HAS a college  -> see only same-college content
--   * user has NO college -> see everything (fallback), and can
--     post / connect freely until they pick a college
-- ============================================================

-- PROFILES
DROP POLICY IF EXISTS "Users can view same-college profiles" ON public.profiles;
CREATE POLICY "Users can view same-college profiles"
  ON public.profiles FOR SELECT
  USING (
    college = public.get_my_college()
    OR public.get_my_college() IS NULL
    OR id = auth.uid()
  );

-- POSTS (Pulse)
DROP POLICY IF EXISTS "Users can view same-college posts" ON public.posts;
CREATE POLICY "Users can view same-college posts"
  ON public.posts FOR SELECT
  USING (
    public.get_my_college() IS NULL
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = posts.created_by
        AND p.college = public.get_my_college()
    )
  );

DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- ANONYMOUS POSTS (AnonySpace)
DROP POLICY IF EXISTS "Users can view same-college anon posts" ON public.anon_posts;
CREATE POLICY "Users can view same-college anon posts"
  ON public.anon_posts FOR SELECT
  USING (college = public.get_my_college() OR college IS NULL OR public.get_my_college() IS NULL);

DROP POLICY IF EXISTS "Authenticated users can create anonymous posts" ON public.anon_posts;
CREATE POLICY "Authenticated users can create anonymous posts"
  ON public.anon_posts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- CLUBS (ClubVerse)
DROP POLICY IF EXISTS "Users can view same-college clubs" ON public.clubs;
CREATE POLICY "Users can view same-college clubs"
  ON public.clubs FOR SELECT
  USING (college = public.get_my_college() OR college IS NULL OR public.get_my_college() IS NULL);

DROP POLICY IF EXISTS "Authenticated users can create clubs" ON public.clubs;
CREATE POLICY "Authenticated users can create clubs"
  ON public.clubs FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- CAMPUS EVENTS
DROP POLICY IF EXISTS "Users can view same-college events" ON public.campus_events;
CREATE POLICY "Users can view same-college events"
  ON public.campus_events FOR SELECT
  USING (college = public.get_my_college() OR college IS NULL OR public.get_my_college() IS NULL);

-- DATING MATCHES
DROP POLICY IF EXISTS "Users can view same-college dating matches" ON public.dating_matches;
CREATE POLICY "Users can view same-college dating matches"
  ON public.dating_matches FOR SELECT
  USING (
    (auth.uid() = user_id OR auth.uid() = liked_user_id)
    AND (
      public.get_my_college() IS NULL
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (CASE WHEN auth.uid() = user_id THEN liked_user_id ELSE user_id END)
          AND p.college = public.get_my_college()
      )
    )
  );

-- CONNECTIONS
DROP POLICY IF EXISTS "Users can create connection requests" ON public.connections;
CREATE POLICY "Users can create connection requests"
  ON public.connections FOR INSERT
  WITH CHECK (
    auth.uid() = requester_id
    AND (
      public.get_my_college() IS NULL
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = receiver_id
          AND p.college = public.get_my_college()
      )
    )
  );