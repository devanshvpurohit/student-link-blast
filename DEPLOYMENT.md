# Deployment & Configuration Guide

## 🔐 Environment Configuration

### Supabase Authentication URLs

The app uses dynamic URL detection for authentication redirects. This means:
- **Local development**: Redirects to `http://localhost:5173` or whichever port Vite uses
- **Preview deploys**: Redirects to `*.lovable.app` URLs  
- **Production**: Redirects to your custom domain

**Important**: Configure these URLs in your Supabase Dashboard:

1. Go to **Authentication → URL Configuration**
2. Set **Site URL** to your production domain (e.g., `https://your-app.com`)
3. Add **Redirect URLs**:
   - `http://localhost:5173/*` (local development)
   - `https://*.lovable.app/*` (Lovable preview URLs)
   - `https://your-custom-domain.com/*` (production)

## 🧠 Gale-Shapley Matching Algorithm

### Overview

The dating feature includes a **Gale-Shapley stable matching algorithm** that creates optimal matches between users based on compatibility scores.

### How It Works

1. **Preference Building**: Each user gets a ranked list of potential matches based on:
   - Shared interests (10 points each, max 50)
   - Same department (20 points)
   - Similar year of study (10 points)
   - Gender preference compatibility (20 points)

2. **Stable Matching**: The algorithm ensures no two users who would prefer each other over their current matches end up unmatched.

3. **Match Storage**: Matches are stored bidirectionally in the `dating_matches` table.

### Using the Algorithm

**From the UI**:
1. Navigate to the Dating page
2. Click "Smart Match" button
3. Click "Run Matchmaking" to execute the algorithm

**From Code**:
```typescript
import { runStableMatching, getUserMatches } from '@/lib/matching';

// Run the algorithm
const result = await runStableMatching();
console.log(result.matches);

// Get a user's matches
const matches = await getUserMatches(userId);
```

### API Endpoints

The edge function `gale-shapley-matching` supports these actions:

| Action | Description |
|--------|-------------|
| `run_matching` | Runs the algorithm for all dating-enabled users |
| `get_user_matches` | Gets matches for a specific user |
| `get_compatibility` | Calculates compatibility between two users |

## 🔑 Authentication Features

### Password Reset Flow

1. User clicks "Forgot password?" on login page
2. User enters email and clicks "Send Reset Link"
3. Email is sent with a secure reset link (expires in 1 hour)
4. User clicks link and is redirected to `/auth?reset=true`
5. User enters and confirms new password

### Security Features

- **Dynamic URLs**: All auth redirects use `window.location.origin` for environment-aware behavior
- **Email validation**: Basic email format validation before sending reset emails
- **Password requirements**: Minimum 6 characters
- **Password confirmation**: Users must confirm new password matches

## 📱 PWA Features

### Installation

The app is installable as a Progressive Web App on:
- **iOS**: Use Safari "Add to Home Screen"
- **Android**: Tap "Install" banner or use Chrome menu
- **Desktop**: Click install icon in address bar

### Offline Support

- Static assets are cached for offline use
- API calls are cached with network-first strategy
- Offline fallback page displayed when network unavailable

## 🧪 Testing Guide

### Testing Authentication

1. **Sign Up**:
   - Navigate to `/auth`
   - Fill in name, email, password
   - Click "Sign Up"
   - Check email for verification link

2. **Password Reset**:
   - Click "Forgot password?"
   - Enter your email
   - Check email for reset link
   - Click link and set new password

### Testing Matchmaking

1. **Prerequisites**:
   - At least 2 users with dating enabled
   - Users should have filled out dating preferences

2. **Run Algorithm**:
   - Log in as any user
   - Go to Dating page
   - Click "Smart Match" → "Run Matchmaking"
   - Check Matches tab for results

### Testing PWA

1. **Install**:
   - Open app in Chrome/Safari
   - Click "Install" button in header (or use browser menu)
   - App should appear on home screen

2. **Offline Mode**:
   - Install the app
   - Disconnect from internet
   - Open the app
   - Should see cached content or offline page

## 📋 Supabase Configuration

### Required Edge Functions

| Function | Purpose |
|----------|---------|
| `gale-shapley-matching` | Stable matching algorithm |

### Required Tables

All tables are already configured. The matching algorithm uses:
- `profiles` - User profiles with dating preferences
- `dating_matches` - Match records between users

### RLS Policies

Ensure these policies exist:
- Users can view their own dating matches
- Users can create matches (likes)
- Profiles are viewable by authenticated users

## 🚀 Deployment Checklist

- [ ] Configure Site URL in Supabase Dashboard
- [ ] Add all redirect URLs (local, preview, production)
- [ ] Deploy edge functions (automatic with Lovable)
- [ ] Test authentication flow on deployed URL
- [ ] Test password reset emails arrive
- [ ] Verify PWA installs correctly
- [ ] Run matchmaking with test users
