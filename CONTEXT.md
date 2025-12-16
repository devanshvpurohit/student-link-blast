# Bazinga - App Context Prompt

## Overview
Bazinga is a modern dating and social media platform designed for college students and alumni. It combines swipe-based dating with campus social networking features.

## Core Identity
- **Name**: Bazinga
- **Platform**: Progressive Web App (PWA) - installable on iOS, Android, and desktop
- **Target Audience**: College students and alumni
- **Primary Focus**: Dating with integrated social features

## Key Features

### Dating (Primary Feature)
- **Swipe Interface**: Tinder-style swipe left (pass) / right (like) cards
- **Smart Matching**: Gale-Shapley stable matching algorithm for intelligent pairing
- **Compatibility Scoring**: Algorithm considers interests, department, study year
- **Dating Chat**: Private messaging for matched users
- **Profile Verification**: Trust badges for verified users
- **Multi-Photo Profiles**: Users can upload multiple photos
- **Dating Preferences**: Gender preference, age range, relationship goals

### Social Features
- **Campus Connect**: Network with classmates and peers
- **Feed/Pulse**: Share updates, posts, and content
- **Campus Events**: Discover and RSVP to campus events
- **ClubVerse**: Join clubs with ephemeral/vanishing messages (Snapchat-style)
- **AnonySpace**: Anonymous posting board
- **Alumni Network**: Connect with graduates, mentorship opportunities

### Messaging
- **Direct Messages**: Chat with connections
- **Media Sharing**: Send photos and voice notes
- **Dating Chat**: Separate chat for romantic matches

## Technical Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **UI Components**: Shadcn/ui component library
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **State Management**: TanStack React Query
- **Animations**: Framer Motion (where applicable)

## Design System

### Color Tokens
- **Primary (Teal #00897B)**: Trust, intelligence - headers, primary buttons, navigation
- **Dating Accent (Coral #FF6E6C)**: Passion, excitement - like actions, match highlights
- **Success (Lime #CDDC39)**: Growth, positivity - success states
- **Background**: Light (#FAFAFA) / Dark (#121212)

### Design Principles
- Mobile-first responsive design
- App-like bottom navigation on mobile
- Safe-area support for notched devices
- WCAG AA+ contrast compliance
- Smooth transitions and micro-interactions

## User Flows

### New User
1. Sign up with email/password
2. Create profile (name, photos, bio)
3. Set dating preferences
4. Start swiping or explore social features

### Dating Flow
1. View potential matches via swipe cards
2. Swipe right to like, left to pass
3. Mutual likes create a match
4. Chat opens for matched users

### Social Flow
1. Browse feed for campus updates
2. Connect with classmates
3. Join clubs and events
4. Message connections

## Database Tables
- `profiles` - User profiles with dating preferences
- `dating_matches` - Match records with compatibility scores
- `dating_conversations` / `dating_messages` - Dating chat
- `connections` - Friend/professional connections
- `messages` - Direct messages
- `clubs` / `club_members` / `club_messages` - Club system
- `campus_events` / `event_rsvps` - Events
- `posts` - Feed content
- `anon_posts` - Anonymous posts

## Key Behaviors
- Dating is the hero feature prominently displayed on home
- Quick stats show likes, matches, messages at a glance
- Mobile navigation prioritizes: Home, Dating, Feed, Chat, Profile
- Voice notes and image sharing in chats
- Push notification support for matches and messages
- Offline-capable PWA with service worker caching
