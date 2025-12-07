import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Gale-Shapley Stable Matching Algorithm Implementation
 * 
 * This edge function implements the Gale-Shapley algorithm for stable matching
 * in the dating feature. The algorithm ensures that no two users who would
 * prefer each other over their current matches end up unmatched.
 * 
 * Key Concepts:
 * - "Proposers" (users who initiate) propose to their most preferred unproposed-to user
 * - "Responders" tentatively accept or reject based on their preference rankings
 * - The algorithm terminates when all proposers are matched or have exhausted their preferences
 * 
 * @see https://en.wikipedia.org/wiki/Gale%E2%80%93Shapley_algorithm
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Types for the matching algorithm
interface DatingProfile {
  id: string
  full_name: string
  dating_gender: string | null
  dating_looking_for: string | null
  interests: string[] | null
  department: string | null
  year_of_study: number | null
  dating_age_min: number | null
  dating_age_max: number | null
}

interface PreferenceList {
  userId: string
  preferences: string[] // Ordered list of user IDs by preference
}

interface MatchResult {
  user1_id: string
  user2_id: string
  compatibility_score: number
  algorithm_matched: boolean
}

/**
 * Calculate compatibility score between two users
 * Based on shared interests, department, and year of study
 */
function calculateCompatibility(user1: DatingProfile, user2: DatingProfile): number {
  let score = 0

  // Shared interests: 10 points each (max 50)
  const interests1 = user1.interests || []
  const interests2 = user2.interests || []
  const sharedInterests = interests1.filter(i => interests2.includes(i))
  score += Math.min(sharedInterests.length * 10, 50)

  // Same department: 20 points
  if (user1.department && user2.department && user1.department === user2.department) {
    score += 20
  }

  // Similar year of study: 10 points (within 1 year)
  if (user1.year_of_study && user2.year_of_study) {
    const yearDiff = Math.abs(user1.year_of_study - user2.year_of_study)
    if (yearDiff <= 1) score += 10
  }

  // Gender preference matching: 20 points
  const genderMatch1 = checkGenderPreference(user1, user2)
  const genderMatch2 = checkGenderPreference(user2, user1)
  if (genderMatch1 && genderMatch2) score += 20

  return Math.min(score, 100)
}

/**
 * Check if user1's gender matches user2's preference
 */
function checkGenderPreference(user1: DatingProfile, user2: DatingProfile): boolean {
  if (!user2.dating_looking_for || user2.dating_looking_for === 'everyone') return true
  return user1.dating_gender === user2.dating_looking_for
}

/**
 * Build preference lists for all users based on compatibility scores
 * Each user gets a ranked list of potential matches
 */
function buildPreferenceLists(profiles: DatingProfile[]): Map<string, PreferenceList> {
  const preferences = new Map<string, PreferenceList>()

  for (const user of profiles) {
    // Calculate scores for all potential matches
    const scores: { userId: string; score: number }[] = []
    
    for (const other of profiles) {
      if (other.id === user.id) continue
      
      // Check gender compatibility both ways
      const genderMatch1 = checkGenderPreference(user, other)
      const genderMatch2 = checkGenderPreference(other, user)
      
      if (genderMatch1 && genderMatch2) {
        scores.push({
          userId: other.id,
          score: calculateCompatibility(user, other)
        })
      }
    }

    // Sort by score descending to create preference ranking
    scores.sort((a, b) => b.score - a.score)

    preferences.set(user.id, {
      userId: user.id,
      preferences: scores.map(s => s.userId)
    })
  }

  return preferences
}

/**
 * Gale-Shapley Stable Matching Algorithm
 * 
 * Algorithm steps:
 * 1. While there's a free proposer who hasn't proposed to everyone:
 *    a. Get the most preferred responder they haven't proposed to
 *    b. If responder is free, tentatively match
 *    c. If responder prefers this proposer over current match, switch
 *    d. Otherwise, proposer stays free
 * 2. Return all stable matches
 * 
 * Time Complexity: O(n²) where n is the number of users
 * Space Complexity: O(n) for the engagement tracking
 */
function galeShapley(preferences: Map<string, PreferenceList>): Map<string, string> {
  const userIds = Array.from(preferences.keys())
  
  // Track engagements: userId -> engaged partner's userId
  const engagements = new Map<string, string>()
  
  // Track which preference index each proposer is at
  const proposalIndex = new Map<string, number>()
  userIds.forEach(id => proposalIndex.set(id, 0))
  
  // List of free proposers (initially everyone)
  const freeProposers = new Set(userIds)

  // Run until no free proposer can propose
  while (freeProposers.size > 0) {
    let madeProposal = false

    for (const proposerId of freeProposers) {
      const proposerPrefs = preferences.get(proposerId)
      if (!proposerPrefs) continue

      const currentIndex = proposalIndex.get(proposerId) || 0
      
      // Skip if proposer has exhausted their preference list
      if (currentIndex >= proposerPrefs.preferences.length) {
        freeProposers.delete(proposerId)
        continue
      }

      // Get next preferred responder
      const responderId = proposerPrefs.preferences[currentIndex]
      proposalIndex.set(proposerId, currentIndex + 1)
      madeProposal = true

      const responderPrefs = preferences.get(responderId)
      if (!responderPrefs) continue

      // Check if responder is currently engaged
      const currentEngagement = engagements.get(responderId)

      if (!currentEngagement) {
        // Responder is free - accept proposal
        engagements.set(responderId, proposerId)
        engagements.set(proposerId, responderId)
        freeProposers.delete(proposerId)
      } else {
        // Responder is engaged - check preference
        const currentRank = responderPrefs.preferences.indexOf(currentEngagement)
        const proposerRank = responderPrefs.preferences.indexOf(proposerId)

        // Lower index = higher preference
        if (proposerRank !== -1 && (currentRank === -1 || proposerRank < currentRank)) {
          // Responder prefers new proposer - switch
          engagements.set(responderId, proposerId)
          engagements.set(proposerId, responderId)
          freeProposers.delete(proposerId)
          
          // Previous partner becomes free
          engagements.delete(currentEngagement)
          freeProposers.add(currentEngagement)
        }
        // Otherwise, proposer remains free
      }
    }

    // If no proposals were made, we're done
    if (!madeProposal) break
  }

  return engagements
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, userId } = await req.json()

    console.log(`[Gale-Shapley] Action: ${action}, User: ${userId}`)

    switch (action) {
      case 'run_matching': {
        // Fetch all users with dating enabled
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, dating_gender, dating_looking_for, interests, department, year_of_study, dating_age_min, dating_age_max')
          .eq('dating_enabled', true)

        if (profilesError) {
          console.error('[Gale-Shapley] Error fetching profiles:', profilesError)
          throw new Error('Failed to fetch profiles')
        }

        if (!profiles || profiles.length < 2) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Not enough users for matching',
              matches: [] 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log(`[Gale-Shapley] Processing ${profiles.length} profiles`)

        // Build preference lists based on compatibility scores
        const preferences = buildPreferenceLists(profiles as DatingProfile[])
        
        // Run Gale-Shapley algorithm
        const stableMatches = galeShapley(preferences)
        
        // Convert matches to results (deduplicate pairs)
        const processedPairs = new Set<string>()
        const matchResults: MatchResult[] = []

        for (const [user1, user2] of stableMatches.entries()) {
          const pairKey = [user1, user2].sort().join('-')
          if (processedPairs.has(pairKey)) continue
          processedPairs.add(pairKey)

          const profile1 = profiles.find(p => p.id === user1) as DatingProfile
          const profile2 = profiles.find(p => p.id === user2) as DatingProfile
          
          if (profile1 && profile2) {
            matchResults.push({
              user1_id: user1,
              user2_id: user2,
              compatibility_score: calculateCompatibility(profile1, profile2),
              algorithm_matched: true
            })
          }
        }

        console.log(`[Gale-Shapley] Generated ${matchResults.length} stable matches`)

        // Store matches in database (create bidirectional match entries)
        for (const match of matchResults) {
          // Check if match already exists
          const { data: existing } = await supabase
            .from('dating_matches')
            .select('id')
            .or(`and(user_id.eq.${match.user1_id},liked_user_id.eq.${match.user2_id}),and(user_id.eq.${match.user2_id},liked_user_id.eq.${match.user1_id})`)
            .limit(1)

          if (existing && existing.length > 0) {
            console.log(`[Gale-Shapley] Match already exists for ${match.user1_id} <-> ${match.user2_id}`)
            continue
          }

          // Create bidirectional match entries
          await supabase.from('dating_matches').insert([
            {
              user_id: match.user1_id,
              liked_user_id: match.user2_id,
              is_match: true,
              compatibility_score: match.compatibility_score
            },
            {
              user_id: match.user2_id,
              liked_user_id: match.user1_id,
              is_match: true,
              compatibility_score: match.compatibility_score
            }
          ])
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Created ${matchResults.length} stable matches`,
            matches: matchResults 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_user_matches': {
        // Get matches for a specific user
        if (!userId) {
          throw new Error('userId is required for get_user_matches')
        }

        const { data: matches, error } = await supabase
          .from('dating_matches')
          .select(`
            id,
            user_id,
            liked_user_id,
            is_match,
            compatibility_score,
            created_at
          `)
          .eq('user_id', userId)
          .eq('is_match', true)

        if (error) {
          console.error('[Gale-Shapley] Error fetching user matches:', error)
          throw error
        }

        // Fetch profiles for matched users
        const matchedUserIds = matches?.map(m => m.liked_user_id) || []
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, department, interests, dating_bio')
          .in('id', matchedUserIds)

        const enrichedMatches = matches?.map(match => ({
          ...match,
          matched_profile: profiles?.find(p => p.id === match.liked_user_id)
        }))

        return new Response(
          JSON.stringify({ success: true, matches: enrichedMatches }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_compatibility': {
        // Calculate compatibility between current user and another user
        const { otherUserId } = await req.json()
        
        if (!userId || !otherUserId) {
          throw new Error('Both userId and otherUserId are required')
        }

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, dating_gender, dating_looking_for, interests, department, year_of_study')
          .in('id', [userId, otherUserId])

        if (!profiles || profiles.length !== 2) {
          throw new Error('Could not find both profiles')
        }

        const user1 = profiles.find(p => p.id === userId) as DatingProfile
        const user2 = profiles.find(p => p.id === otherUserId) as DatingProfile
        const score = calculateCompatibility(user1, user2)

        return new Response(
          JSON.stringify({ success: true, compatibility_score: score }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error) {
    console.error('[Gale-Shapley] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
