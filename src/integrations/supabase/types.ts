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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          full_day_price: number | null
          half_day_price: number | null
          id: boolean
          owner_name: string | null
          qr_image_path: string | null
          receiver_name: string | null
          timings: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          full_day_price?: number | null
          half_day_price?: number | null
          id?: boolean
          owner_name?: string | null
          qr_image_path?: string | null
          receiver_name?: string | null
          timings?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          full_day_price?: number | null
          half_day_price?: number | null
          id?: boolean
          owner_name?: string | null
          qr_image_path?: string | null
          receiver_name?: string | null
          timings?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: []
      }
      entries: {
        Row: {
          amount: number | null
          created_at: string
          entry_code: string | null
          entry_date: string
          entry_time: string
          entry_type: Database["public"]["Enums"]["entry_type"]
          id: string
          status: Database["public"]["Enums"]["entry_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          entry_code?: string | null
          entry_date: string
          entry_time: string
          entry_type: Database["public"]["Enums"]["entry_type"]
          id?: string
          status?: Database["public"]["Enums"]["entry_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          entry_code?: string | null
          entry_date?: string
          entry_time?: string
          entry_type?: Database["public"]["Enums"]["entry_type"]
          id?: string
          status?: Database["public"]["Enums"]["entry_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          admin_note: string | null
          amount: number | null
          created_at: string
          entry_id: string
          id: string
          method: string
          screenshot_path: string | null
          status: Database["public"]["Enums"]["pay_status"]
          updated_at: string
          utr: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_note?: string | null
          amount?: number | null
          created_at?: string
          entry_id: string
          id?: string
          method?: string
          screenshot_path?: string | null
          status?: Database["public"]["Enums"]["pay_status"]
          updated_at?: string
          utr?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_note?: string | null
          amount?: number | null
          created_at?: string
          entry_id?: string
          id?: string
          method?: string
          screenshot_path?: string | null
          status?: Database["public"]["Enums"]["pay_status"]
          updated_at?: string
          utr?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          full_name: string
          parent_name: string | null
          id: string
          mobile: string
          student_id_code: string | null
          email: string | null
          address: string | null
          exam_goal: string | null
          photo_path: string | null
          signature_path: string | null
          id_proof_path: string | null
          admission_status: "pending" | "approved" | "rejected"
          selected_plan: "morning_half" | "second_half" | "full_time" | null
          assigned_seat_id: string | null
          rejection_reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          parent_name?: string | null
          id?: string
          mobile: string
          student_id_code?: string | null
          email?: string | null
          address?: string | null
          exam_goal?: string | null
          photo_path?: string | null
          signature_path?: string | null
          id_proof_path?: string | null
          admission_status?: "pending" | "approved" | "rejected"
          selected_plan?: "morning_half" | "second_half" | "full_time" | null
          assigned_seat_id?: string | null
          rejection_reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          parent_name?: string | null
          id?: string
          mobile?: string
          student_id_code?: string | null
          email?: string | null
          address?: string | null
          exam_goal?: string | null
          photo_path?: string | null
          signature_path?: string | null
          id_proof_path?: string | null
          admission_status?: "pending" | "approved" | "rejected"
          selected_plan?: "morning_half" | "second_half" | "full_time" | null
          assigned_seat_id?: string | null
          rejection_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      seats: {
        Row: {
          id: string
          seat_number: string
          label: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          seat_number: string
          label: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          seat_number?: string
          label?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      seat_bookings: {
        Row: {
          id: string
          seat_id: string
          student_id: string | null
          booking_date: string
          slot: "morning_half" | "second_half" | "full_time"
          status: string
          reserved_until: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seat_id: string
          student_id?: string | null
          booking_date: string
          slot: "morning_half" | "second_half" | "full_time"
          status?: string
          reserved_until?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          seat_id?: string
          student_id?: string | null
          booking_date?: string
          slot?: "morning_half" | "second_half" | "full_time"
          status?: string
          reserved_until?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          id: string
          student_id: string
          seat_id: string | null
          plan_type: "morning_half" | "second_half" | "full_time"
          start_date: string
          expiry_date: string
          status: "active" | "expired" | "pending" | "cancelled"
          monthly_fee: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          seat_id?: string | null
          plan_type: "morning_half" | "second_half" | "full_time"
          start_date: string
          expiry_date: string
          status?: "active" | "expired" | "pending" | "cancelled"
          monthly_fee: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          seat_id?: string | null
          plan_type?: "morning_half" | "second_half" | "full_time"
          start_date?: string
          expiry_date?: string
          status?: "active" | "expired" | "pending" | "cancelled"
          monthly_fee?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          id: string
          student_id: string
          attendance_date: string
          check_in_at: string
          check_out_at: string | null
          status: "present" | "incomplete" | "absent"
          is_manual_correction: boolean
          correction_reason: string | null
          corrected_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          attendance_date?: string
          check_in_at?: string
          check_out_at?: string | null
          status?: "present" | "incomplete" | "absent"
          is_manual_correction?: boolean
          correction_reason?: string | null
          corrected_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          attendance_date?: string
          check_in_at?: string
          check_out_at?: string | null
          status?: "present" | "incomplete" | "absent"
          is_manual_correction?: boolean
          correction_reason?: string | null
          corrected_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      renewal_requests: {
        Row: {
          id: string
          student_id: string
          membership_id: string
          requested_plan: "morning_half" | "second_half" | "full_time"
          status: string
          utr: string | null
          screenshot_path: string | null
          admin_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          membership_id: string
          requested_plan: "morning_half" | "second_half" | "full_time"
          status?: string
          utr?: string | null
          screenshot_path?: string | null
          admin_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          membership_id?: string
          requested_plan?: "morning_half" | "second_half" | "full_time"
          status?: string
          utr?: string | null
          screenshot_path?: string | null
          admin_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          id: string
          admin_id: string | null
          admin_email: string | null
          action: string
          entity_type: string
          entity_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id?: string | null
          admin_email?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string | null
          admin_email?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin"
      entry_status: "pending" | "confirmed" | "rejected"
      entry_type: "half_day" | "full_day"
      pay_status: "pending" | "verified" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin"],
      entry_status: ["pending", "confirmed", "rejected"],
      entry_type: ["half_day", "full_day"],
      pay_status: ["pending", "verified", "rejected"],
    },
  },
} as const
