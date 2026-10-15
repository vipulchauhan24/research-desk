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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      capex_rows: {
        Row: {
          capacity_added: string | null
          commissioning_fy: number
          commissioning_quarter: number
          company_id: string
          created_at: string
          funding: string | null
          id: string
          outlay_paise: number
          project: string
          source_note: string | null
          source_url: string | null
          status: string
        }
        Insert: {
          capacity_added?: string | null
          commissioning_fy: number
          commissioning_quarter: number
          company_id: string
          created_at?: string
          funding?: string | null
          id?: string
          outlay_paise: number
          project: string
          source_note?: string | null
          source_url?: string | null
          status: string
        }
        Update: {
          capacity_added?: string | null
          commissioning_fy?: number
          commissioning_quarter?: number
          company_id?: string
          created_at?: string
          funding?: string | null
          id?: string
          outlay_paise?: number
          project?: string
          source_note?: string | null
          source_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "capex_rows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          business_type: string
          created_at: string
          exchange: string
          id: string
          idea_source: string
          name: string
          status: string
          symbol: string
        }
        Insert: {
          business_type: string
          created_at?: string
          exchange: string
          id?: string
          idea_source: string
          name: string
          status?: string
          symbol: string
        }
        Update: {
          business_type?: string
          created_at?: string
          exchange?: string
          id?: string
          idea_source?: string
          name?: string
          status?: string
          symbol?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          company_id: string
          created_at: string
          doc_date: string
          doc_type: string
          file_name: string | null
          id: string
          period: string | null
          storage_path: string | null
          summary: string | null
          title: string
          url: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          doc_date: string
          doc_type: string
          file_name?: string | null
          id?: string
          period?: string | null
          storage_path?: string | null
          summary?: string | null
          title: string
          url?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          doc_date?: string
          doc_type?: string
          file_name?: string | null
          id?: string
          period?: string | null
          storage_path?: string | null
          summary?: string | null
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      note_drafts: {
        Row: {
          based_on_version: number | null
          company_id: string
          content: Json
          updated_at: string
        }
        Insert: {
          based_on_version?: number | null
          company_id: string
          content: Json
          updated_at?: string
        }
        Update: {
          based_on_version?: number | null
          company_id?: string
          content?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_drafts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      note_versions: {
        Row: {
          change_note: string
          company_id: string
          content: Json
          created_at: string
          id: string
          version: number
        }
        Insert: {
          change_note: string
          company_id: string
          content: Json
          created_at?: string
          id?: string
          version: number
        }
        Update: {
          change_note?: string
          company_id?: string
          content?: Json
          created_at?: string
          id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "note_versions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      order_book_rows: {
        Row: {
          company_id: string
          created_at: string
          customer: string
          execution_by: string
          id: string
          ordered_on: string
          source_note: string | null
          source_url: string | null
          status: string
          value_paise: number
        }
        Insert: {
          company_id: string
          created_at?: string
          customer: string
          execution_by: string
          id?: string
          ordered_on: string
          source_note?: string | null
          source_url?: string | null
          status: string
          value_paise: number
        }
        Update: {
          company_id?: string
          created_at?: string
          customer?: string
          execution_by?: string
          id?: string
          ordered_on?: string
          source_note?: string | null
          source_url?: string | null
          status?: string
          value_paise?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_book_rows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      price_entries: {
        Row: {
          as_of: string
          company_id: string
          created_at: string
          id: string
          price_paise: number
        }
        Insert: {
          as_of?: string
          company_id: string
          created_at?: string
          id?: string
          price_paise: number
        }
        Update: {
          as_of?: string
          company_id?: string
          created_at?: string
          id?: string
          price_paise?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      research_links: {
        Row: {
          company_id: string
          created_at: string
          id: string
          label: string
          url: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          label: string
          url: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          label?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tracker_rows: {
        Row: {
          actual: number | null
          case_name: string
          company_id: string
          created_at: string
          fiscal_year: number
          id: string
          metric: string
          predicted: number
          quarter: number
          unit: string
        }
        Insert: {
          actual?: number | null
          case_name: string
          company_id: string
          created_at?: string
          fiscal_year: number
          id?: string
          metric: string
          predicted: number
          quarter: number
          unit: string
        }
        Update: {
          actual?: number | null
          case_name?: string
          company_id?: string
          created_at?: string
          fiscal_year?: number
          id?: string
          metric?: string
          predicted?: number
          quarter?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracker_rows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      valuation_inputs: {
        Row: {
          company_id: string
          inputs: Json
          method: string
          updated_at: string
        }
        Insert: {
          company_id: string
          inputs: Json
          method: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          inputs?: Json
          method?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "valuation_inputs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      save_note_version: {
        Args: { p_change_note: string; p_company_id: string }
        Returns: number
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
    Enums: {},
  },
} as const
