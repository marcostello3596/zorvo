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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_profile_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          ip: unknown
        }
        Insert: {
          action: string
          actor_profile_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          ip?: unknown
        }
        Update: {
          action?: string
          actor_profile_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          ip?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_progress: {
        Row: {
          challenge_id: string
          completed_at: string | null
          cycle_key: string
          id: string
          member_id: string
          progress_den: number
          progress_num: number
          state: Json
          updated_at: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          cycle_key?: string
          id?: string
          member_id: string
          progress_den?: number
          progress_num?: number
          state?: Json
          updated_at?: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          cycle_key?: string
          id?: string
          member_id?: string
          progress_den?: number
          progress_num?: number
          state?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "v_challenge_sizes"
            referencedColumns: ["challenge_id"]
          },
          {
            foreignKeyName: "challenge_progress_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          active: boolean
          config: Json
          created_at: string
          cycle: Database["public"]["Enums"]["challenge_cycle"]
          description: string | null
          ends_at: string | null
          id: string
          kind: Database["public"]["Enums"]["challenge_kind"]
          location_id: string | null
          name: string
          points_award: number
          repeatable: boolean
          reward_id: string | null
          slug: string
          sort_order: number
          starts_at: string | null
        }
        Insert: {
          active?: boolean
          config?: Json
          created_at?: string
          cycle?: Database["public"]["Enums"]["challenge_cycle"]
          description?: string | null
          ends_at?: string | null
          id?: string
          kind: Database["public"]["Enums"]["challenge_kind"]
          location_id?: string | null
          name: string
          points_award?: number
          repeatable?: boolean
          reward_id?: string | null
          slug: string
          sort_order?: number
          starts_at?: string | null
        }
        Update: {
          active?: boolean
          config?: Json
          created_at?: string
          cycle?: Database["public"]["Enums"]["challenge_cycle"]
          description?: string | null
          ends_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["challenge_kind"]
          location_id?: string | null
          name?: string
          points_award?: number
          repeatable?: boolean
          reward_id?: string | null
          slug?: string
          sort_order?: number
          starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      consumptions: {
        Row: {
          created_at: string
          id: string
          idempotency_key: string
          location_id: string
          member_id: string
          occurred_at: string
          product_id: string
          product_variant_id: string | null
          quantity: number
          scan_event_id: string | null
          source: Database["public"]["Enums"]["consumption_src"]
          staff_id: string | null
          unit_price_cents: number | null
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          idempotency_key?: string
          location_id: string
          member_id: string
          occurred_at?: string
          product_id: string
          product_variant_id?: string | null
          quantity?: number
          scan_event_id?: string | null
          source?: Database["public"]["Enums"]["consumption_src"]
          staff_id?: string | null
          unit_price_cents?: number | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          idempotency_key?: string
          location_id?: string
          member_id?: string
          occurred_at?: string
          product_id?: string
          product_variant_id?: string | null
          quantity?: number
          scan_event_id?: string | null
          source?: Database["public"]["Enums"]["consumption_src"]
          staff_id?: string | null
          unit_price_cents?: number | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consumptions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumptions_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumptions_scan_event_id_fkey"
            columns: ["scan_event_id"]
            isOneToOne: false
            referencedRelation: "scan_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumptions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumptions_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      credentials: {
        Row: {
          id: string
          issued_at: string
          kind: Database["public"]["Enums"]["credential_kind"]
          member_id: string
          revoked_at: string | null
          secret_enc: string
          version: number
        }
        Insert: {
          id?: string
          issued_at?: string
          kind?: Database["public"]["Enums"]["credential_kind"]
          member_id: string
          revoked_at?: string | null
          secret_enc: string
          version?: number
        }
        Update: {
          id?: string
          issued_at?: string
          kind?: Database["public"]["Enums"]["credential_kind"]
          member_id?: string
          revoked_at?: string | null
          secret_enc?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "credentials_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          id: string
          name: string
          slug: string
          timezone: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
          timezone?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          timezone?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          home_location_id: string | null
          id: string
          joined_at: string
          lifetime_points: number
          member_code: string
          profile_id: string
          status: Database["public"]["Enums"]["member_status"]
        }
        Insert: {
          home_location_id?: string | null
          id?: string
          joined_at?: string
          lifetime_points?: number
          member_code: string
          profile_id: string
          status?: Database["public"]["Enums"]["member_status"]
        }
        Update: {
          home_location_id?: string | null
          id?: string
          joined_at?: string
          lifetime_points?: number
          member_code?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["member_status"]
        }
        Relationships: [
          {
            foreignKeyName: "members_home_location_id_fkey"
            columns: ["home_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      points_ledger: {
        Row: {
          balance_after: number
          created_at: string
          delta: number
          id: string
          member_id: string
          reason: string
          ref_id: string | null
          ref_type: string | null
        }
        Insert: {
          balance_after: number
          created_at?: string
          delta: number
          id?: string
          member_id: string
          reason: string
          ref_id?: string | null
          ref_type?: string | null
        }
        Update: {
          balance_after?: number
          created_at?: string
          delta?: number
          id?: string
          member_id?: string
          reason?: string
          ref_id?: string | null
          ref_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "points_ledger_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          active: boolean
          id: string
          is_default: boolean
          name: string
          price_cents: number | null
          product_id: string
        }
        Insert: {
          active?: boolean
          id?: string
          is_default?: boolean
          name: string
          price_cents?: number | null
          product_id: string
        }
        Update: {
          active?: boolean
          id?: string
          is_default?: boolean
          name?: string
          price_cents?: number | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category_id: string | null
          counts_for_collection: boolean
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          sku: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          counts_for_collection?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          sku: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          category_id?: string | null
          counts_for_collection?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          sku?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birthdate: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          locale: string
          marketing_opt_in: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birthdate?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          locale?: string
          marketing_opt_in?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birthdate?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          locale?: string
          marketing_opt_in?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reward_grants: {
        Row: {
          challenge_id: string | null
          delivered_at: string | null
          delivered_by: string | null
          delivery_note: string | null
          expires_at: string | null
          granted_at: string
          id: string
          idempotency_key: string
          member_id: string
          reward_id: string
          status: Database["public"]["Enums"]["grant_status"]
        }
        Insert: {
          challenge_id?: string | null
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_note?: string | null
          expires_at?: string | null
          granted_at?: string
          id?: string
          idempotency_key: string
          member_id: string
          reward_id: string
          status?: Database["public"]["Enums"]["grant_status"]
        }
        Update: {
          challenge_id?: string | null
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_note?: string | null
          expires_at?: string | null
          granted_at?: string
          id?: string
          idempotency_key?: string
          member_id?: string
          reward_id?: string
          status?: Database["public"]["Enums"]["grant_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reward_grants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_grants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "v_challenge_sizes"
            referencedColumns: ["challenge_id"]
          },
          {
            foreignKeyName: "reward_grants_delivered_by_fkey"
            columns: ["delivered_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_grants_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_grants_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          active: boolean
          config: Json
          description: string | null
          id: string
          image_url: string | null
          kind: string
          name: string
          requires_fulfilment: boolean
          slug: string
          stock: number | null
        }
        Insert: {
          active?: boolean
          config?: Json
          description?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          name: string
          requires_fulfilment?: boolean
          slug: string
          stock?: number | null
        }
        Update: {
          active?: boolean
          config?: Json
          description?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          name?: string
          requires_fulfilment?: boolean
          slug?: string
          stock?: number | null
        }
        Relationships: []
      }
      scan_events: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          kind: Database["public"]["Enums"]["credential_kind"]
          location_id: string
          member_id: string | null
          result: Database["public"]["Enums"]["scan_result"]
          staff_id: string | null
          token_step: number | null
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["credential_kind"]
          location_id: string
          member_id?: string | null
          result: Database["public"]["Enums"]["scan_result"]
          staff_id?: string | null
          token_step?: number | null
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["credential_kind"]
          location_id?: string
          member_id?: string | null
          result?: Database["public"]["Enums"]["scan_result"]
          staff_id?: string | null
          token_step?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_events_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_events_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          active: boolean
          hired_at: string
          id: string
          location_id: string | null
          pin_hash: string | null
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          active?: boolean
          hired_at?: string
          id?: string
          location_id?: string | null
          pin_hash?: string | null
          profile_id: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          active?: boolean
          hired_at?: string
          id?: string
          location_id?: string | null
          pin_hash?: string | null
          profile_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "staff_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_challenge_sizes: {
        Row: {
          challenge_id: string | null
          challenge_slug: string | null
          total: number | null
        }
        Insert: {
          challenge_id?: string | null
          challenge_slug?: string | null
          total?: never
        }
        Update: {
          challenge_id?: string | null
          challenge_slug?: string | null
          total?: never
        }
        Relationships: []
      }
    }
    Functions: {
      zorvo_redeem_grant: {
        Args: { p_grant_id: string; p_staff_id: string }
        Returns: Json
      }
      zorvo_register_visit: {
        Args: {
          p_member_id: string
          p_staff_id: string
          p_location_id: string
          p_kind: Database["public"]["Enums"]["credential_kind"] | null
          p_token_step: number | null
          p_items: Json
        }
        Returns: Json
      }
      zorvo_verificar: {
        Args: never
        Returns: {
          chequeo: string
          esperado: string
          estado: string
          grupo: string
          obtenido: string
        }[]
      }
    }
    Enums: {
      app_role: "customer" | "barista" | "manager" | "owner"
      challenge_cycle: "none" | "weekly" | "monthly"
      challenge_kind: "COLLECTION" | "COUNT" | "STREAK" | "VISIT" | "MANUAL" | "PUNCH"
      consumption_src: "scan" | "manual" | "import" | "order"
      credential_kind: "rotating" | "wallet_static"
      grant_status:
        | "unlocked"
        | "reserved"
        | "delivered"
        | "expired"
        | "revoked"
      member_status: "active" | "paused" | "blocked"
      scan_result:
        | "ok"
        | "expired"
        | "replay"
        | "invalid"
        | "revoked"
        | "unknown"
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
    Enums: {
      app_role: ["customer", "barista", "manager", "owner"],
      challenge_cycle: ["none", "weekly", "monthly"],
      challenge_kind: ["COLLECTION", "COUNT", "STREAK", "VISIT", "MANUAL", "PUNCH"],
      consumption_src: ["scan", "manual", "import", "order"],
      credential_kind: ["rotating", "wallet_static"],
      grant_status: ["unlocked", "reserved", "delivered", "expired", "revoked"],
      member_status: ["active", "paused", "blocked"],
      scan_result: ["ok", "expired", "replay", "invalid", "revoked", "unknown"],
    },
  },
} as const
