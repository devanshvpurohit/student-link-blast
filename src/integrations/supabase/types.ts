export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      alumni_opportunities: {
        Row: {
          id: string
          posted_by: string
          title: string
          company: string
          description: string
          location: string | null
          job_type: 'full-time' | 'part-time' | 'internship' | 'contract' | 'volunteer' | null
          application_url: string | null
          created_at: string
          expires_at: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          posted_by: string
          title: string
          company: string
          description: string
          location?: string | null
          job_type?: 'full-time' | 'part-time' | 'internship' | 'contract' | 'volunteer' | null
          application_url?: string | null
          created_at?: string
          expires_at?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          posted_by?: string
          title?: string
          company?: string
          description?: string
          location?: string | null
          job_type?: 'full-time' | 'part-time' | 'internship' | 'contract' | 'volunteer' | null
          application_url?: string | null
          created_at?: string
          expires_at?: string | null
          is_active?: boolean
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          department: string | null
          interests: string[] | null
          bio: string | null
          year_of_study: number | null
          created_at: string
          updated_at: string
          is_alumni: boolean
          graduation_year: number | null
          current_company: string | null
          current_position: string | null
          linkedin_url: string | null
          open_to_mentoring: boolean
          dating_enabled: boolean
          dating_gender: string | null
          dating_looking_for: string | null
          dating_age_min: number | null
          dating_age_max: number | null
          dating_bio: string | null
          verification_status: 'unverified' | 'pending' | 'verified' | null
          verified_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          department?: string | null
          interests?: string[] | null
          bio?: string | null
          year_of_study?: number | null
          created_at?: string
          updated_at?: string
          is_alumni?: boolean
          graduation_year?: number | null
          current_company?: string | null
          current_position?: string | null
          linkedin_url?: string | null
          open_to_mentoring?: boolean
          dating_enabled?: boolean
          dating_gender?: string | null
          dating_looking_for?: string | null
          dating_age_min?: number | null
          dating_age_max?: number | null
          dating_bio?: string | null
          verification_status?: 'unverified' | 'pending' | 'verified' | null
          verified_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          department?: string | null
          interests?: string[] | null
          bio?: string | null
          year_of_study?: number | null
          created_at?: string
          updated_at?: string
          is_alumni?: boolean
          graduation_year?: number | null
          current_company?: string | null
          current_position?: string | null
          linkedin_url?: string | null
          open_to_mentoring?: boolean
          dating_enabled?: boolean
          dating_gender?: string | null
          dating_looking_for?: string | null
          dating_age_min?: number | null
          dating_age_max?: number | null
          dating_bio?: string | null
          verification_status?: 'unverified' | 'pending' | 'verified' | null
          verified_at?: string | null
        }
      }
      dating_matches: {
        Row: {
          id: string
          user_id: string
          liked_user_id: string
          is_match: boolean
          created_at: string
          compatibility_score: number | null
        }
        Insert: {
          id?: string
          user_id: string
          liked_user_id: string
          is_match?: boolean
          created_at?: string
          compatibility_score?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          liked_user_id?: string
          is_match?: boolean
          created_at?: string
          compatibility_score?: number | null
        }
      }
      connections: {
        Row: {
          id: string
          requester_id: string
          receiver_id: string
          status: 'pending' | 'accepted' | 'declined' | 'blocked'
          connection_type: 'classmate' | 'study_group' | 'project_partner' | 'mentor' | 'mentee' | 'alumni' | 'professional' | 'romantic'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          receiver_id: string
          status?: 'pending' | 'accepted' | 'declined' | 'blocked'
          connection_type?: 'classmate' | 'study_group' | 'project_partner' | 'mentor' | 'mentee' | 'alumni' | 'professional' | 'romantic'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          receiver_id?: string
          status?: 'pending' | 'accepted' | 'declined' | 'blocked'
          connection_type?: 'classmate' | 'study_group' | 'project_partner' | 'mentor' | 'mentee' | 'alumni' | 'professional' | 'romantic'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
