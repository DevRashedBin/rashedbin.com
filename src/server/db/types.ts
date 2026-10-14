export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          actor_role: string;
          id: number;
          new_data: Json | null;
          occurred_at: string;
          old_data: Json | null;
          record_id: string | null;
          table_name: string;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          actor_role?: string;
          id?: never;
          new_data?: Json | null;
          occurred_at?: string;
          old_data?: Json | null;
          record_id?: string | null;
          table_name: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          actor_role?: string;
          id?: never;
          new_data?: Json | null;
          occurred_at?: string;
          old_data?: Json | null;
          record_id?: string | null;
          table_name?: string;
        };
        Relationships: [];
      };
      business_settings: {
        Row: {
          address: string | null;
          business_name: string;
          contact_email: string | null;
          default_currency: string;
          default_payment_terms_days: number;
          default_terms: string | null;
          id: boolean;
          invoice_footer: string | null;
          invoice_prefix: string;
          legal_name: string | null;
          number_padding: number;
          phone: string | null;
          project_prefix: string;
          tax_id: string | null;
          updated_at: string;
          updated_by: string | null;
          website: string | null;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          business_name?: string;
          contact_email?: string | null;
          default_currency?: string;
          default_payment_terms_days?: number;
          default_terms?: string | null;
          id?: boolean;
          invoice_footer?: string | null;
          invoice_prefix?: string;
          legal_name?: string | null;
          number_padding?: number;
          phone?: string | null;
          project_prefix?: string;
          tax_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          business_name?: string;
          contact_email?: string | null;
          default_currency?: string;
          default_payment_terms_days?: number;
          default_terms?: string | null;
          id?: boolean;
          invoice_footer?: string | null;
          invoice_prefix?: string;
          legal_name?: string | null;
          number_padding?: number;
          phone?: string | null;
          project_prefix?: string;
          tax_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      client_members: {
        Row: {
          client_id: string;
          created_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          client_id: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_members_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          archived_at: string | null;
          billing_address: string | null;
          billing_email: string;
          company_name: string | null;
          contact_name: string | null;
          country_code: string | null;
          created_at: string;
          created_by: string | null;
          default_currency: string;
          display_name: string;
          id: string;
          phone: string | null;
          tax_id: string | null;
          updated_at: string;
          website_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          billing_address?: string | null;
          billing_email: string;
          company_name?: string | null;
          contact_name?: string | null;
          country_code?: string | null;
          created_at?: string;
          created_by?: string | null;
          default_currency?: string;
          display_name: string;
          id?: string;
          phone?: string | null;
          tax_id?: string | null;
          updated_at?: string;
          website_url?: string | null;
        };
        Update: {
          archived_at?: string | null;
          billing_address?: string | null;
          billing_email?: string;
          company_name?: string | null;
          contact_name?: string | null;
          country_code?: string | null;
          created_at?: string;
          created_by?: string | null;
          default_currency?: string;
          display_name?: string;
          id?: string;
          phone?: string | null;
          tax_id?: string | null;
          updated_at?: string;
          website_url?: string | null;
        };
        Relationships: [];
      };
      faqs: {
        Row: {
          answer: string;
          created_at: string;
          id: string;
          position: number;
          published: boolean;
          question: string;
          scope: string;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          answer: string;
          created_at?: string;
          id?: string;
          position?: number;
          published?: boolean;
          question: string;
          scope?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          answer?: string;
          created_at?: string;
          id?: string;
          position?: number;
          published?: boolean;
          question?: string;
          scope?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      internal_notes: {
        Row: {
          author_id: string | null;
          body: string;
          created_at: string;
          id: string;
          subject_id: string;
          subject_type: string;
        };
        ComputedFields: never;
        Insert: {
          author_id?: string | null;
          body: string;
          created_at?: string;
          id?: string;
          subject_id: string;
          subject_type: string;
        };
        Update: {
          author_id?: string | null;
          body?: string;
          created_at?: string;
          id?: string;
          subject_id?: string;
          subject_type?: string;
        };
        Relationships: [];
      };
      number_sequences: {
        Row: {
          last_value: number;
          scope: string;
          year: number;
        };
        ComputedFields: never;
        Insert: {
          last_value?: number;
          scope: string;
          year: number;
        };
        Update: {
          last_value?: number;
          scope?: string;
          year?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          role: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          role?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          approach: NonNullable<Json>;
          created_at: string;
          cta: NonNullable<Json>;
          deliverables: NonNullable<Json>;
          demo: string;
          eyebrow: string;
          faqs: NonNullable<Json>;
          headline: string;
          id: string;
          ideal_for: NonNullable<Json>;
          intro: string;
          meta_description: string;
          meta_title: string;
          name: string;
          position: number;
          problems: NonNullable<Json>;
          published: boolean;
          related: NonNullable<Json>;
          short_name: string;
          slug: string;
          summary: string;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          approach?: NonNullable<Json>;
          created_at?: string;
          cta: NonNullable<Json>;
          deliverables?: NonNullable<Json>;
          demo: string;
          eyebrow: string;
          faqs?: NonNullable<Json>;
          headline: string;
          id?: string;
          ideal_for?: NonNullable<Json>;
          intro: string;
          meta_description: string;
          meta_title: string;
          name: string;
          position?: number;
          problems?: NonNullable<Json>;
          published?: boolean;
          related?: NonNullable<Json>;
          short_name: string;
          slug: string;
          summary: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          approach?: NonNullable<Json>;
          created_at?: string;
          cta?: NonNullable<Json>;
          deliverables?: NonNullable<Json>;
          demo?: string;
          eyebrow?: string;
          faqs?: NonNullable<Json>;
          headline?: string;
          id?: string;
          ideal_for?: NonNullable<Json>;
          intro?: string;
          meta_description?: string;
          meta_title?: string;
          name?: string;
          position?: number;
          problems?: NonNullable<Json>;
          published?: boolean;
          related?: NonNullable<Json>;
          short_name?: string;
          slug?: string;
          summary?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_client_member: { Args: { target_client_id: string }; Returns: boolean };
      next_sequence_value: { Args: { p_scope: string; p_year: number }; Returns: number };
      replace_general_faqs: { Args: { items: Json }; Returns: undefined };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
