export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      aportes: {
        Row: {
          bitcoin: number
          cotacao: number
          cotacao_moeda: string
          cotacao_usd_brl: number | null
          created_at: string
          data_aporte: string
          id: string
          moeda: string
          origem_aporte: string
          origem_registro: string
          user_id: string | null
          valor_investido: number
          valor_usd: number | null
        }
        Insert: {
          bitcoin: number
          cotacao: number
          cotacao_moeda?: string
          cotacao_usd_brl?: number | null
          created_at?: string
          data_aporte: string
          id?: string
          moeda: string
          origem_aporte?: string
          origem_registro?: string
          user_id?: string | null
          valor_investido: number
          valor_usd?: number | null
        }
        Update: {
          bitcoin?: number
          cotacao?: number
          cotacao_moeda?: string
          cotacao_usd_brl?: number | null
          created_at?: string
          data_aporte?: string
          id?: string
          moeda?: string
          origem_aporte?: string
          origem_registro?: string
          user_id?: string | null
          valor_investido?: number
          valor_usd?: number | null
        }
        Relationships: []
      }
      btc_intraday_prices: {
        Row: {
          created_at: string | null
          id: string
          market_cap: number | null
          price: number
          price_brl: number | null
          price_high: number | null
          price_low: number | null
          range_origem: string | null
          source: string | null
          timestamp: string
          usd_brl: number | null
          volume: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          market_cap?: number | null
          price: number
          price_brl?: number | null
          price_high?: number | null
          price_low?: number | null
          range_origem?: string | null
          source?: string | null
          timestamp: string
          usd_brl?: number | null
          volume?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          market_cap?: number | null
          price?: number
          price_brl?: number | null
          price_high?: number | null
          price_low?: number | null
          range_origem?: string | null
          source?: string | null
          timestamp?: string
          usd_brl?: number | null
          volume?: number | null
        }
        Relationships: []
      }
      btc_prices: {
        Row: {
          created_at: string | null
          id: string
          market_cap: number | null
          price: number | null
          price_brl: number | null
          price_high: number | null
          price_low: number | null
          range_origem: string | null
          source: string
          timestamp: string
          usd_brl: number | null
          volume: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          market_cap?: number | null
          price?: number | null
          price_brl?: number | null
          price_high?: number | null
          price_low?: number | null
          range_origem?: string | null
          source: string
          timestamp: string
          usd_brl?: number | null
          volume?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          market_cap?: number | null
          price?: number | null
          price_brl?: number | null
          price_high?: number | null
          price_low?: number | null
          range_origem?: string | null
          source?: string
          timestamp?: string
          usd_brl?: number | null
          volume?: number | null
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_chat_ids: {
        Row: {
          chat_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          chat_id?: string
          created_at?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      Usuários: {
        Row: {
          contato: string | null
          created_at: string
          email: string | null
          id: number
          Nome: string | null
        }
        Insert: {
          contato?: string | null
          created_at?: string
          email?: string | null
          id?: number
          Nome?: string | null
        }
        Update: {
          contato?: string | null
          created_at?: string
          email?: string | null
          id?: number
          Nome?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_if_user_is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      get_admin_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          totalusers: number
          admincount: number
          totalentries: number
        }[]
      }
      get_all_users_with_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          role: string
          createdat: string
          lastsignin: string
          entriescount: number
        }[]
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
