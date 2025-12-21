# ✏️ Bazinga — Dev Notes

---

*scribbled at 2am with coffee ☕*

## what is this thing?

so basically... Bazinga = dating app + social stuff for college kids & alumni
think tinder meets campus life. swipe for love, stay for the vibes ✨

---

## the name

**Bazinga** — yeah like the sheldon thing lol
but also it's catchy & memorable. works.

---

## who's it for?

→ college students (duh)  
→ alumni who wanna stay connected  
→ anyone looking for love OR friends on campus

---

## THE BIG FEATURES

### 💕 Dating (the main thing)

- swipe cards! left = nope, right = yes pls
- we use that fancy Gale-Shapley algorithm for matching (stable matching ftw)
- compatibility scores based on interests, department, year
- verified badges = trust points
- multiple photos per profile
- set your preferences: gender, age range, what you're looking for

### 🎭 Social Stuff

- **Connect** → find & friend classmates
- **Pulse** → the feed, posts, updates, campus tea ☕
- **Events** → parties, meetups, campus happenings
- **ClubVerse** → clubs with disappearing messages (snapchat vibes)
- **AnonySpace** → spill secrets anonymously 👀
- **Alumni** → network with grads, get mentored

### 💬 Messaging

- DMs with connections
- send pics, voice notes, the works
- separate chat for dating matches (keep it organized!)

---

## tech stuff (boring but important)

```
Frontend:  React + TypeScript + Vite + Tailwind
Components: shadcn/ui (so pretty)
Backend:   Supabase (auth, db, storage, edge functions)
State:     TanStack Query
Animations: Framer Motion when needed
```

---

## colors & vibes

| what | color | why |
|------|-------|-----|
| Primary | Teal #00897B | trust, smart, calm |
| Dating | Coral #FF6E6C | passion, excitement! |
| Success | Lime #CDDC39 | growth, positivity |
| Light bg | #FAFAFA | clean |
| Dark bg | #121212 | sleek |

---

## design rules i keep forgetting

- [x] mobile first always
- [x] bottom nav on phones
- [x] safe area for notched phones
- [x] good contrast (accessibility!)
- [x] smooth animations everywhere

---

## user journeys

### new person shows up:
1. sign up (email/password)
2. make profile → name, pics, bio
3. set dating prefs
4. START SWIPING or explore social

### dating flow:
```
see card → swipe → match? → CHAT! 💬
```

### social flow:
```
browse feed → connect → join clubs → message ppl
```

---

## database cheat sheet

| table | what's in it |
|-------|-------------|
| profiles | user info + dating prefs |
| dating_matches | who liked who, scores |
| dating_conversations | match chats |
| dating_messages | actual messages |
| connections | friends/connections |
| messages | DMs |
| clubs | club info |
| club_members | who's in what club |
| club_messages | ephemeral msgs |
| campus_events | events |
| event_rsvps | who's going |
| posts | feed content |
| anon_posts | anonymous stuff |

---

## things to remember!!

- dating = HERO feature. front & center on home
- quick stats: likes, matches, messages (ppl love numbers)
- mobile nav order: Home | Dating | Feed | Chat | Profile
- voice notes work in chats
- push notifs for matches & messages
- PWA = works offline-ish

---

## random notes

- need to add stories feature eventually?
- onboarding could be smoother
- maybe premium tier for "who liked you" reveal?

---

*~ end of notes ~*
