-- Seed data for local testing of Bazinga (bazinga_test database).
-- Idempotent: safe to run multiple times.

BEGIN;

-- ============================================================
-- 1. USERS (auth.users) — profiles are auto-created by the
--    handle_new_user() trigger from the migrations
-- ============================================================
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aarav@test.edu', '{"full_name": "Aarav Sharma"}'),
  ('22222222-2222-2222-2222-222222222222', 'bella@test.edu',  '{"full_name": "Bella Chen"}'),
  ('33333333-3333-3333-3333-333333333333', 'carlos@test.edu', '{"full_name": "Carlos Rivera"}'),
  ('44444444-4444-4444-4444-444444444444', 'dana@test.edu',   '{"full_name": "Dana Patel"}'),
  ('55555555-5555-5555-5555-555555555555', 'eric@test.edu',   '{"full_name": "Eric Johnson"}'),
  ('66666666-6666-6666-6666-666666666666', 'fatima@test.edu', '{"full_name": "Fatima Noor"}'),
  ('77777777-7777-7777-7777-777777777777', 'gary@test.edu',   '{"full_name": "Gary Smith"}'),
  ('88888888-8888-8888-8888-888888888888', 'hannah@test.edu', '{"full_name": "Hannah Lee"}')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

-- ============================================================
-- 2. PROFILES
-- ============================================================
UPDATE public.profiles SET
  college          = 'State University',
  avatar_url       = 'https://i.pravatar.cc/300?u=aarav',
  department       = 'Computer Science',
  interests        = ARRAY['coding', 'ai', 'music'],
  bio              = 'Building things with code and coffee.',
  year_of_study    = 3,
  dating_enabled   = true,
  dating_gender    = 'male',
  dating_looking_for = 'female',
  dating_age_min   = 18,
  dating_age_max   = 25,
  dating_bio       = 'Looking for someone to build side projects with.',
  verification_status = 'verified',
  verified_at      = now()
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE public.profiles SET
  college          = 'State University',
  avatar_url       = 'https://i.pravatar.cc/300?u=bella',
  department       = 'Computer Science',
  interests        = ARRAY['coding', 'ai', 'art'],
  bio              = 'Artist by heart, engineer by degree.',
  year_of_study    = 3,
  dating_enabled   = true,
  dating_gender    = 'female',
  dating_looking_for = 'male',
  dating_age_min   = 19,
  dating_age_max   = 27,
  dating_bio       = 'Coffee dates and gallery walks.',
  verification_status = 'verified',
  verified_at      = now()
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE public.profiles SET
  college          = 'State University',
  avatar_url       = 'https://i.pravatar.cc/300?u=carlos',
  department       = 'Industrial Design',
  interests        = ARRAY['art', 'music', 'films'],
  bio              = 'Design student. Film buff. Slightly chaotic.',
  year_of_study    = 2,
  dating_enabled   = true,
  dating_gender    = 'male',
  dating_looking_for = 'anyone',
  dating_age_min   = 18,
  dating_age_max   = 26
WHERE id = '33333333-3333-3333-3333-333333333333';

UPDATE public.profiles SET
  college          = 'State University',
  avatar_url       = 'https://i.pravatar.cc/300?u=dana',
  department       = 'Business Administration',
  interests        = ARRAY['music', 'startups'],
  bio              = 'Future CEO. Current coffee addict.',
  year_of_study    = 4,
  dating_enabled   = true,
  dating_gender    = 'female',
  dating_looking_for = 'male',
  dating_age_min   = 20,
  dating_age_max   = 28
WHERE id = '44444444-4444-4444-4444-444444444444';

UPDATE public.profiles SET
  college          = 'State University',
  avatar_url       = 'https://i.pravatar.cc/300?u=eric',
  department       = 'Computer Science',
  interests        = ARRAY['coding', 'gaming'],
  bio              = 'Freshman. Ranked top 500 in Valorant.',
  year_of_study    = 1,
  dating_enabled   = false
WHERE id = '55555555-5555-5555-5555-555555555555';

UPDATE public.profiles SET
  college          = 'Tech Institute',
  avatar_url       = 'https://i.pravatar.cc/300?u=fatima',
  department       = 'Computer Science',
  interests        = ARRAY['coding', 'ai', 'gaming'],
  bio              = 'ML researcher in training.',
  year_of_study    = 3,
  dating_enabled   = true,
  dating_gender    = 'female',
  dating_looking_for = 'male',
  dating_age_min   = 18,
  dating_age_max   = 26
WHERE id = '66666666-6666-6666-6666-666666666666';

UPDATE public.profiles SET
  college          = 'Tech Institute',
  avatar_url       = 'https://i.pravatar.cc/300?u=gary',
  department       = 'Physics',
  interests        = ARRAY['science', 'chess'],
  bio              = 'I do physics and I know things.',
  year_of_study    = 2
WHERE id = '77777777-7777-7777-7777-777777777777';

UPDATE public.profiles SET
  college          = 'Tech Institute',
  avatar_url       = 'https://i.pravatar.cc/300?u=hannah',
  department       = 'Computer Science',
  interests        = ARRAY['coding', 'mentoring'],
  bio              = 'SWE at BigCorp. Here to help juniors.',
  year_of_study    = 4,
  is_alumni        = true,
  graduation_year  = 2025,
  current_company  = 'BigCorp',
  current_position = 'Software Engineer',
  linkedin_url     = 'https://linkedin.com/in/hannahlee',
  open_to_mentoring = true
WHERE id = '88888888-8888-8888-8888-888888888888';

-- ============================================================
-- 3. CONNECTIONS & MESSAGES (State University users)
-- ============================================================
INSERT INTO public.connections (id, requester_id, receiver_id, status, connection_type) VALUES
  ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'accepted', 'classmate'),
  ('c2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'accepted', 'study_group'),
  ('c3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'pending', 'classmate')
ON CONFLICT DO NOTHING;

INSERT INTO public.messages (connection_id, sender_id, content) VALUES
  ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Hey! Ready for the DB project?'),
  ('c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Almost — want to meet at the library at 4?');

-- ============================================================
-- 4. PULSE POSTS
-- ============================================================
INSERT INTO public.posts (id, title, content, type, created_by, is_admin_post) VALUES
  ('f1111111-1111-1111-1111-111111111111', 'Welcome to Fall Semester!', 'Orientation is next week. Check your emails for the schedule.', 'announcement', '11111111-1111-1111-1111-111111111111', true),
  ('f2222222-2222-2222-2222-222222222222', 'Hackathon registration open', '48-hour hackathon, prizes up to $5k. Sign up now!', 'event', '22222222-2222-2222-2222-222222222222', false),
  ('f3333333-3333-3333-3333-333333333333', 'Library study rooms full?', 'The new 3rd floor rooms just opened, first come first served.', 'general', '33333333-3333-3333-3333-333333333333', false)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. ANONYSPACE (stamped with college via trigger + session)
-- ============================================================
SELECT set_config('app.user_id', '11111111-1111-1111-1111-111111111111', true);

INSERT INTO public.anon_posts (id, content) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Cafeteria pizza is criminally underrated.'),
  ('a2222222-2222-2222-2222-222222222222', 'Who else is running on 3 hours of sleep? 🙃')
ON CONFLICT DO NOTHING;

INSERT INTO public.anon_votes (post_id, user_id, vote_type) VALUES
  ('a1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'up'),
  ('a1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'up'),
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'up')
ON CONFLICT DO NOTHING;

INSERT INTO public.anon_post_reports (post_id, reporter_id, reason) VALUES
  ('a2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Spam')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. CLUBS & CLUB MESSAGES
-- ============================================================
INSERT INTO public.clubs (id, name, description, category, created_by, visibility) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'Coding Club', 'Competitive programming and side projects', 'tech', '11111111-1111-1111-1111-111111111111', 'public'),
  ('b2222222-2222-2222-2222-222222222222', 'Film Society', 'Movie nights every Friday', 'arts', '33333333-3333-3333-3333-333333333333', 'private')
ON CONFLICT DO NOTHING;

INSERT INTO public.club_members (club_id, user_id, role, status) VALUES
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'admin', 'approved'),
  ('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'member', 'approved'),
  ('b1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'member', 'pending'),
  ('b2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'admin', 'approved'),
  ('b2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'member', 'approved')
ON CONFLICT DO NOTHING;

INSERT INTO public.club_messages (club_id, sender_id, content, expires_at) VALUES
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Reminder: mock contest Saturday 10am!', now() + interval '2 days'),
  ('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'I''m in. Who''s pairing up?', now() + interval '2 days');

-- ============================================================
-- 7. EVENTS & RSVPs
-- ============================================================
INSERT INTO public.campus_events (id, created_by, title, description, event_type, location, start_time, end_time) VALUES
  ('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Fall Hackathon', '48 hours of building. Bring your laptop!', 'club', 'Innovation Hall', now() + interval '1 week', now() + interval '9 days'),
  ('e2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Startup Networking Night', 'Meet founders and investors on campus.', 'career', 'Student Center', now() + interval '3 days', now() + interval '3 days' + interval '3 hours')
ON CONFLICT DO NOTHING;

INSERT INTO public.event_rsvps (event_id, user_id, status) VALUES
  ('e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'going'),
  ('e1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'interested'),
  ('e2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'going')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. DATING — likes, a mutual match, and a match conversation
-- ============================================================
INSERT INTO public.dating_matches (id, user_id, liked_user_id) VALUES
  ('d1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
  ('d2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111'),
  ('d3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

-- d1111111 and d2222222 are mutual → the check_dating_match() trigger flips is_match
UPDATE public.dating_matches SET is_match = true, compatibility_score = 90
WHERE id IN ('d1111111-1111-1111-1111-111111111111', 'd2222222-2222-2222-2222-222222222222');

INSERT INTO public.dating_conversations (id, match_id) VALUES
  ('dc111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

INSERT INTO public.dating_messages (conversation_id, sender_id, content) VALUES
  ('dc111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Hi Bella! Loved your AI art project.'),
  ('dc111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Haha thanks! Want to grab coffee this week?');

-- ============================================================
-- 9. PROFILE PHOTOS
-- ============================================================
INSERT INTO public.profile_photos (user_id, photo_url, is_primary, display_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'https://i.pravatar.cc/600?u=aarav', true, 0),
  ('11111111-1111-1111-1111-111111111111', 'https://i.pravatar.cc/600?u=aarav2', false, 1),
  ('22222222-2222-2222-2222-222222222222', 'https://i.pravatar.cc/600?u=bella', true, 0)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 10. ALUMNI OPPORTUNITIES
-- ============================================================
INSERT INTO public.alumni_opportunities (posted_by, title, company, description, location, job_type, application_url, expires_at) VALUES
  ('88888888-8888-8888-8888-888888888888', 'Summer SWE Internship', 'BigCorp', 'Full-stack intern for our platform team.', 'Remote', 'internship', 'https://bigcorp.example.com/careers', now() + interval '60 days');

SELECT set_config('app.user_id', '', true);

COMMIT;