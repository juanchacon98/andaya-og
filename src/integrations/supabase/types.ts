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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      access_controls: {
        Row: {
          country_code: string | null
          created_at: string | null
          id: number
          ip: string | null
          note: string | null
          rule: Database["public"]["Enums"]["access_rule"]
          scope: Database["public"]["Enums"]["access_scope"]
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          id?: number
          ip?: string | null
          note?: string | null
          rule: Database["public"]["Enums"]["access_rule"]
          scope: Database["public"]["Enums"]["access_scope"]
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          id?: number
          ip?: string | null
          note?: string | null
          rule?: Database["public"]["Enums"]["access_rule"]
          scope?: Database["public"]["Enums"]["access_scope"]
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      backup_jobs: {
        Row: {
          details: string | null
          finished_at: string | null
          id: number
          location: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["backup_status"]
        }
        Insert: {
          details?: string | null
          finished_at?: string | null
          id?: number
          location?: string | null
          started_at?: string | null
          status: Database["public"]["Enums"]["backup_status"]
        }
        Update: {
          details?: string | null
          finished_at?: string | null
          id?: number
          location?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["backup_status"]
        }
        Relationships: []
      }
      incidents: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          description: string
          id: string
          reporter_id: string
          reservation_id: string
          status: Database["public"]["Enums"]["incident_status"] | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          description: string
          id?: string
          reporter_id: string
          reservation_id: string
          status?: Database["public"]["Enums"]["incident_status"] | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          description?: string
          id?: string
          reporter_id?: string
          reservation_id?: string
          status?: Database["public"]["Enums"]["incident_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_verifications: {
        Row: {
          created_at: string | null
          driver_license_number: string | null
          id_back_url: string | null
          id_front_url: string | null
          id_number: string | null
          license_back_url: string | null
          license_front_url: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["kyc_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          driver_license_number?: string | null
          id_back_url?: string | null
          id_front_url?: string | null
          id_number?: string | null
          license_back_url?: string | null
          license_front_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["kyc_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          driver_license_number?: string | null
          id_back_url?: string | null
          id_front_url?: string | null
          id_number?: string | null
          license_back_url?: string | null
          license_front_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["kyc_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string | null
          id: number
          ip: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          ip?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          ip?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_total: number
          created_at: string | null
          currency: string | null
          id: string
          installments: number | null
          method: Database["public"]["Enums"]["payment_method"]
          provider_ref: string | null
          reservation_id: string
          status: Database["public"]["Enums"]["payment_status"] | null
          updated_at: string | null
          upfront: number | null
        }
        Insert: {
          amount_total: number
          created_at?: string | null
          currency?: string | null
          id?: string
          installments?: number | null
          method: Database["public"]["Enums"]["payment_method"]
          provider_ref?: string | null
          reservation_id: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
          upfront?: number | null
        }
        Update: {
          amount_total?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          installments?: number | null
          method?: Database["public"]["Enums"]["payment_method"]
          provider_ref?: string | null
          reservation_id?: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
          upfront?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string | null
          daily_price: number
          end_date: string
          id: string
          owner_id: string
          renter_id: string
          service_fee: number
          start_date: string
          status: Database["public"]["Enums"]["reservation_status"] | null
          subtotal: number
          total: number
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          daily_price: number
          end_date: string
          id?: string
          owner_id: string
          renter_id: string
          service_fee: number
          start_date: string
          status?: Database["public"]["Enums"]["reservation_status"] | null
          subtotal: number
          total: number
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          daily_price?: number
          end_date?: string
          id?: string
          owner_id?: string
          renter_id?: string
          service_fee?: number
          start_date?: string
          status?: Database["public"]["Enums"]["reservation_status"] | null
          subtotal?: number
          total?: number
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          rating: number
          reservation_id: string
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          rating: number
          reservation_id: string
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          rating?: number
          reservation_id?: string
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_availability: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          kind: Database["public"]["Enums"]["availability_kind"]
          note: string | null
          start_date: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          kind: Database["public"]["Enums"]["availability_kind"]
          note?: string | null
          start_date: string
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          kind?: Database["public"]["Enums"]["availability_kind"]
          note?: string | null
          start_date?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_availability_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_photos: {
        Row: {
          created_at: string | null
          id: string
          sort_order: number | null
          url: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          sort_order?: number | null
          url: string
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          sort_order?: number | null
          url?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_photos_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string
          city: string | null
          created_at: string | null
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          model: string
          owner_id: string
          plate: string | null
          price_per_day: number
          rating_avg: number | null
          status: Database["public"]["Enums"]["vehicle_status"] | null
          title: string
          type: Database["public"]["Enums"]["vehicle_type"]
          updated_at: string | null
          year: number
        }
        Insert: {
          brand: string
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          model: string
          owner_id: string
          plate?: string | null
          price_per_day: number
          rating_avg?: number | null
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          title: string
          type: Database["public"]["Enums"]["vehicle_type"]
          updated_at?: string | null
          year: number
        }
        Update: {
          brand?: string
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          model?: string
          owner_id?: string
          plate?: string | null
          price_per_day?: number
          rating_avg?: number | null
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          title?: string
          type?: Database["public"]["Enums"]["vehicle_type"]
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_initial_role: {
        Args: { role: Database["public"]["Enums"]["app_role"]; user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      access_rule: "allow" | "deny"
      access_scope: "admin_panel" | "admin_sec_panel"
      app_role: "renter" | "owner" | "admin_primary" | "admin_security"
      availability_kind: "available" | "blocked"
      backup_status: "ok" | "failed"
      incident_status: "open" | "in_review" | "resolved"
      kyc_status: "pending" | "verified" | "rejected"
      payment_method: "full" | "cashea_sim"
      payment_status: "pending" | "authorized" | "paid" | "failed" | "refunded"
      reservation_status:
        | "pending"
        | "approved"
        | "rejected"
        | "cancelled"
        | "finished"
      vehicle_status: "pending_review" | "active" | "paused" | "rejected"
      vehicle_type:
        | "sedan"
        | "suv"
        | "hatchback"
        | "pickup"
        | "moto"
        | "van"
        | "coupe"
        | "otro"
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
      access_rule: ["allow", "deny"],
      access_scope: ["admin_panel", "admin_sec_panel"],
      app_role: ["renter", "owner", "admin_primary", "admin_security"],
      availability_kind: ["available", "blocked"],
      backup_status: ["ok", "failed"],
      incident_status: ["open", "in_review", "resolved"],
      kyc_status: ["pending", "verified", "rejected"],
      payment_method: ["full", "cashea_sim"],
      payment_status: ["pending", "authorized", "paid", "failed", "refunded"],
      reservation_status: [
        "pending",
        "approved",
        "rejected",
        "cancelled",
        "finished",
      ],
      vehicle_status: ["pending_review", "active", "paused", "rejected"],
      vehicle_type: [
        "sedan",
        "suv",
        "hatchback",
        "pickup",
        "moto",
        "van",
        "coupe",
        "otro",
      ],
    },
  },
} as const
