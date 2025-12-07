export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      alumni_opportunities: {
        Row: {
          application_url: string | null
          company: string
          created_at: string | null
          description: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          job_type: string | null
          location: string | null
          posted_by: string
          title: string
        }
        Insert: {
          application_url?: string | null
          company: string
          created_at?: string | null
          description: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          job_type?: string | null
          location?: string | null
          posted_by: string
          title: string
        }
        Update: {
          application_url?: string | null
          company?: string
          created_at?: string | null
          description?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          job_type?: string | null
          location?: string | null
          posted_by?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alumni_opportunities_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      anon_post_reports: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reason: string
          reporter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reason: string
          reporter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reason?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anon_post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "anon_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      anon_posts: {
        Row: {
          content: string
          created_at: string | null
          deleted_at: string | null
          downvotes: number | null
          id: string
          upvotes: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          deleted_at?: string | null
          downvotes?: number | null
          id?: string
          upvotes?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          downvotes?: number | null
          id?: string
          upvotes?: number | null
        }
        Relationships: []
      }
      anon_votes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "anon_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "anon_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anon_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_events: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          end_time: string | null
          event_type: string
          id: string
          image_url: string | null
          is_public: boolean | null
          location: string | null
          max_attendees: number | null
          start_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          end_time?: string | null
          event_type: string
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          location?: string | null
          max_attendees?: number | null
          start_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_time?: string | null
          event_type?: string
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          location?: string | null
          max_attendees?: number | null
          start_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      club_members: {
        Row: {
          club_id: string
          id: string
          joined_at: string | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string | null
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_messages: {
        Row: {
          club_id: string
          content: string
          created_at: string
          expires_at: string
          id: string
          message_type: string
          sender_id: string
          updated_at: string
          viewed_by: Json | null
        }
        Insert: {
          club_id: string
          content: string
          created_at?: string
          expires_at: string
          id?: string
          message_type?: string
          sender_id: string
          updated_at?: string
          viewed_by?: Json | null
        }
        Update: {
          club_id?: string
          content?: string
          created_at?: string
          expires_at?: string
          id?: string
          message_type?: string
          sender_id?: string
          updated_at?: string
          viewed_by?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "club_messages_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          avatar_url: string | null
          category: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string | null
          visibility: string
        }
        Insert: {
          avatar_url?: string | null
          category?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          avatar_url?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "clubs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          connection_type: string
          created_at: string | null
          id: string
          receiver_id: string
          requester_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          connection_type?: string
          created_at?: string | null
          id?: string
          receiver_id: string
          requester_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          connection_type?: string
          created_at?: string | null
          id?: string
          receiver_id?: string
          requester_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connections_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dating_conversations: {
        Row: {
          created_at: string | null
          id: string
          match_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          match_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dating_conversations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "dating_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      dating_matches: {
        Row: {
          compatibility_score: number | null
          created_at: string | null
          id: string
          is_match: boolean | null
          liked_user_id: string
          user_id: string
        }
        Insert: {
          compatibility_score?: number | null
          created_at?: string | null
          id?: string
          is_match?: boolean | null
          liked_user_id: string
          user_id: string
        }
        Update: {
          compatibility_score?: number | null
          created_at?: string | null
          id?: string
          is_match?: boolean | null
          liked_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      dating_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dating_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "dating_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "campus_events"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          connection_id: string
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          sender_id: string
          voice_note_duration: number | null
          voice_note_url: string | null
        }
        Insert: {
          connection_id: string
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          sender_id: string
          voice_note_duration?: number | null
          voice_note_url?: string | null
        }
        Update: {
          connection_id?: string
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          sender_id?: string
          voice_note_duration?: number | null
          voice_note_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          id: string
          image_url: string | null
          is_admin_post: boolean | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          image_url?: string | null
          is_admin_post?: boolean | null
          title: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          image_url?: string | null
          is_admin_post?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_photos: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_primary: boolean | null
          photo_url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_primary?: boolean | null
          photo_url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_primary?: boolean | null
          photo_url?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          current_company: string | null
          current_position: string | null
          dating_age_max: number | null
          dating_age_min: number | null
          dating_bio: string | null
          dating_enabled: boolean | null
          dating_gender: string | null
          dating_looking_for: string | null
          department: string | null
          email: string
          full_name: string | null
          graduation_year: number | null
          id: string
          interests: string[] | null
          is_alumni: boolean | null
          linkedin_url: string | null
          open_to_mentoring: boolean | null
          updated_at: string | null
          verification_status: string | null
          verified_at: string | null
          year_of_study: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_company?: string | null
          current_position?: string | null
          dating_age_max?: number | null
          dating_age_min?: number | null
          dating_bio?: string | null
          dating_enabled?: boolean | null
          dating_gender?: string | null
          dating_looking_for?: string | null
          department?: string | null
          email: string
          full_name?: string | null
          graduation_year?: number | null
          id: string
          interests?: string[] | null
          is_alumni?: boolean | null
          linkedin_url?: string | null
          open_to_mentoring?: boolean | null
          updated_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
          year_of_study?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_company?: string | null
          current_position?: string | null
          dating_age_max?: number | null
          dating_age_min?: number | null
          dating_bio?: string | null
          dating_enabled?: boolean | null
          dating_gender?: string | null
          dating_looking_for?: string | null
          department?: string | null
          email?: string
          full_name?: string | null
          graduation_year?: number | null
          id?: string
          interests?: string[] | null
          is_alumni?: boolean | null
          linkedin_url?: string | null
          open_to_mentoring?: boolean | null
          updated_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
          year_of_study?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_compatibility_score: {
        Args: { user1_id: string; user2_id: string }
        Returns: number
      }
      delete_expired_club_messages: { Args: never; Returns: undefined }
      mark_club_message_viewed: {
        Args: { message_id: string; user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
