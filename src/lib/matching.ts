/**
 * Gale-Shapley Stable Matching Hook & Utilities
 * 
 * This module provides React hooks and utilities for interacting with the
 * Gale-Shapley matching algorithm edge function.
 * 
 * Usage:
 * ```tsx
 * import { useStableMatching } from '@/lib/matching';
 * 
 * const { runMatching, getMatches, loading } = useStableMatching();
 * 
 * // Run the algorithm
 * const results = await runMatching();
 * 
 * // Get current user's matches
 * const matches = await getMatches(userId);
 * ```
 */

import { supabase } from '@/integrations/supabase/client';

// Types for matching results
export interface MatchResult {
  user1_id: string;
  user2_id: string;
  compatibility_score: number;
  algorithm_matched: boolean;
}

export interface EnrichedMatch {
  id: string;
  user_id: string;
  liked_user_id: string;
  is_match: boolean;
  compatibility_score: number;
  created_at: string;
  matched_profile?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    department: string | null;
    interests: string[] | null;
    dating_bio: string | null;
  };
}

export interface MatchingResponse {
  success: boolean;
  message?: string;
  matches?: MatchResult[] | EnrichedMatch[];
  error?: string;
}

export interface CompatibilityResponse {
  success: boolean;
  compatibility_score?: number;
  error?: string;
}

/**
 * Run the Gale-Shapley stable matching algorithm
 * 
 * This will analyze all users with dating enabled and create
 * optimal stable matches based on compatibility scores.
 * 
 * @returns Promise with matching results
 */
export async function runStableMatching(): Promise<MatchingResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('gale-shapley-matching', {
      body: { action: 'run_matching' }
    });

    if (error) {
      console.error('[Matching] Error running algorithm:', error);
      return { success: false, error: error.message };
    }

    return data as MatchingResponse;
  } catch (err) {
    console.error('[Matching] Unexpected error:', err);
    return { success: false, error: 'Failed to run matching algorithm' };
  }
}

/**
 * Get all stable matches for a specific user
 * 
 * @param userId - The user's ID to get matches for
 * @returns Promise with enriched match data including profiles
 */
export async function getUserMatches(userId: string): Promise<MatchingResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('gale-shapley-matching', {
      body: { action: 'get_user_matches', userId }
    });

    if (error) {
      console.error('[Matching] Error getting matches:', error);
      return { success: false, error: error.message };
    }

    return data as MatchingResponse;
  } catch (err) {
    console.error('[Matching] Unexpected error:', err);
    return { success: false, error: 'Failed to get matches' };
  }
}

/**
 * Calculate compatibility score between two users
 * 
 * @param userId - First user's ID
 * @param otherUserId - Second user's ID
 * @returns Promise with compatibility score (0-100)
 */
export async function getCompatibilityScore(
  userId: string, 
  otherUserId: string
): Promise<CompatibilityResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('gale-shapley-matching', {
      body: { action: 'get_compatibility', userId, otherUserId }
    });

    if (error) {
      console.error('[Matching] Error getting compatibility:', error);
      return { success: false, error: error.message };
    }

    return data as CompatibilityResponse;
  } catch (err) {
    console.error('[Matching] Unexpected error:', err);
    return { success: false, error: 'Failed to calculate compatibility' };
  }
}
