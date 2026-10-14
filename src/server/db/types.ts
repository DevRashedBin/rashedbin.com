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
      activities: {
        Row: {
          actor_id: string | null;
          created_at: string;
          data: NonNullable<Json>;
          id: string;
          kind: string;
          subject_id: string;
          subject_type: string;
          summary: string;
        };
        ComputedFields: never;
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          data?: NonNullable<Json>;
          id?: string;
          kind: string;
          subject_id: string;
          subject_type: string;
          summary: string;
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          data?: NonNullable<Json>;
          id?: string;
          kind?: string;
          subject_id?: string;
          subject_type?: string;
          summary?: string;
        };
        Relationships: [];
      };
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
          consultation_url: string | null;
          contact_email: string | null;
          default_currency: string;
          default_payment_terms_days: number;
          default_terms: string | null;
          id: boolean;
          invoice_footer: string | null;
          invoice_prefix: string;
          legal_name: string | null;
          notification_email: string | null;
          notify_client_milestones: boolean;
          notify_client_updates: boolean;
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
          consultation_url?: string | null;
          contact_email?: string | null;
          default_currency?: string;
          default_payment_terms_days?: number;
          default_terms?: string | null;
          id?: boolean;
          invoice_footer?: string | null;
          invoice_prefix?: string;
          legal_name?: string | null;
          notification_email?: string | null;
          notify_client_milestones?: boolean;
          notify_client_updates?: boolean;
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
          consultation_url?: string | null;
          contact_email?: string | null;
          default_currency?: string;
          default_payment_terms_days?: number;
          default_terms?: string | null;
          id?: boolean;
          invoice_footer?: string | null;
          invoice_prefix?: string;
          legal_name?: string | null;
          notification_email?: string | null;
          notify_client_milestones?: boolean;
          notify_client_updates?: boolean;
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
      consent_records: {
        Row: {
          granted_at: string;
          id: string;
          ip_hash: string | null;
          lead_id: string;
          notice_version: string;
          purpose: string;
          user_agent: string | null;
          withdrawn_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          granted_at?: string;
          id?: string;
          ip_hash?: string | null;
          lead_id: string;
          notice_version: string;
          purpose: string;
          user_agent?: string | null;
          withdrawn_at?: string | null;
        };
        Update: {
          granted_at?: string;
          id?: string;
          ip_hash?: string | null;
          lead_id?: string;
          notice_version?: string;
          purpose?: string;
          user_agent?: string | null;
          withdrawn_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "consent_records_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      email_events: {
        Row: {
          email_message_id: string | null;
          id: string;
          payload: NonNullable<Json>;
          provider_event_id: string;
          received_at: string;
          type: string;
        };
        ComputedFields: never;
        Insert: {
          email_message_id?: string | null;
          id?: string;
          payload: NonNullable<Json>;
          provider_event_id: string;
          received_at?: string;
          type: string;
        };
        Update: {
          email_message_id?: string | null;
          id?: string;
          payload?: NonNullable<Json>;
          provider_event_id?: string;
          received_at?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "email_events_email_message_id_fkey";
            columns: ["email_message_id"];
            isOneToOne: false;
            referencedRelation: "email_messages";
            referencedColumns: ["id"];
          },
        ];
      };
      email_messages: {
        Row: {
          attempts: number;
          body_text: string;
          created_at: string;
          created_by: string | null;
          delivery_status: string;
          from_email: string;
          id: string;
          idempotency_key: string;
          next_attempt_at: string | null;
          provider: string | null;
          provider_message_id: string | null;
          related_id: string | null;
          related_type: string | null;
          reply_to: string | null;
          sent_at: string | null;
          status: string;
          status_reason: string | null;
          subject: string;
          template_key: string | null;
          to_email: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          attempts?: number;
          body_text: string;
          created_at?: string;
          created_by?: string | null;
          delivery_status?: string;
          from_email: string;
          id?: string;
          idempotency_key: string;
          next_attempt_at?: string | null;
          provider?: string | null;
          provider_message_id?: string | null;
          related_id?: string | null;
          related_type?: string | null;
          reply_to?: string | null;
          sent_at?: string | null;
          status?: string;
          status_reason?: string | null;
          subject: string;
          template_key?: string | null;
          to_email: string;
          updated_at?: string;
        };
        Update: {
          attempts?: number;
          body_text?: string;
          created_at?: string;
          created_by?: string | null;
          delivery_status?: string;
          from_email?: string;
          id?: string;
          idempotency_key?: string;
          next_attempt_at?: string | null;
          provider?: string | null;
          provider_message_id?: string | null;
          related_id?: string | null;
          related_type?: string | null;
          reply_to?: string | null;
          sent_at?: string | null;
          status?: string;
          status_reason?: string | null;
          subject?: string;
          template_key?: string | null;
          to_email?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_templates: {
        Row: {
          body: string;
          category: string;
          description: string | null;
          is_system: boolean;
          key: string;
          name: string;
          subject: string;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          body: string;
          category: string;
          description?: string | null;
          is_system?: boolean;
          key: string;
          name: string;
          subject: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          body?: string;
          category?: string;
          description?: string | null;
          is_system?: boolean;
          key?: string;
          name?: string;
          subject?: string;
          updated_at?: string;
          updated_by?: string | null;
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
      inquiry_resume_tokens: {
        Row: {
          created_at: string;
          expires_at: string;
          id: string;
          lead_id: string;
          token_hash: string;
          used_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          expires_at: string;
          id?: string;
          lead_id: string;
          token_hash: string;
          used_at?: string | null;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          lead_id?: string;
          token_hash?: string;
          used_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inquiry_resume_tokens_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
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
      leads: {
        Row: {
          anonymised_at: string | null;
          client_id: string | null;
          company: string | null;
          created_at: string;
          description: string;
          details: NonNullable<Json>;
          email: string;
          id: string;
          idempotency_key: string | null;
          ip_hash: string | null;
          last_activity_at: string;
          name: string;
          priority: string;
          ref: string;
          service_label: string | null;
          service_slug: string | null;
          source: string;
          stage_key: string;
          submitted_at: string | null;
          updated_at: string;
          user_agent: string | null;
          website_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          anonymised_at?: string | null;
          client_id?: string | null;
          company?: string | null;
          created_at?: string;
          description?: string;
          details?: NonNullable<Json>;
          email: string;
          id?: string;
          idempotency_key?: string | null;
          ip_hash?: string | null;
          last_activity_at?: string;
          name: string;
          priority?: string;
          ref: string;
          service_label?: string | null;
          service_slug?: string | null;
          source?: string;
          stage_key?: string;
          submitted_at?: string | null;
          updated_at?: string;
          user_agent?: string | null;
          website_url?: string | null;
        };
        Update: {
          anonymised_at?: string | null;
          client_id?: string | null;
          company?: string | null;
          created_at?: string;
          description?: string;
          details?: NonNullable<Json>;
          email?: string;
          id?: string;
          idempotency_key?: string | null;
          ip_hash?: string | null;
          last_activity_at?: string;
          name?: string;
          priority?: string;
          ref?: string;
          service_label?: string | null;
          service_slug?: string | null;
          source?: string;
          stage_key?: string;
          submitted_at?: string | null;
          updated_at?: string;
          user_agent?: string | null;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "leads_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_stage_key_fkey";
            columns: ["stage_key"];
            isOneToOne: false;
            referencedRelation: "pipeline_stages";
            referencedColumns: ["key"];
          },
        ];
      };
      milestones: {
        Row: {
          client_visible: boolean;
          completed_at: string | null;
          created_at: string;
          description: string | null;
          due_date: string | null;
          id: string;
          position: number;
          project_id: string;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          client_visible?: boolean;
          completed_at?: string | null;
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          position?: number;
          project_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          client_visible?: boolean;
          completed_at?: string | null;
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          position?: number;
          project_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
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
      pipeline_stages: {
        Row: {
          is_system: boolean;
          key: string;
          kind: string;
          label: string;
          position: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          is_system?: boolean;
          key: string;
          kind?: string;
          label: string;
          position?: number;
          updated_at?: string;
        };
        Update: {
          is_system?: boolean;
          key?: string;
          kind?: string;
          label?: string;
          position?: number;
          updated_at?: string;
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
      project_statuses: {
        Row: {
          client_label: string;
          is_terminal: boolean;
          key: string;
          label: string;
          notify_client_by_default: boolean;
          position: number;
        };
        ComputedFields: never;
        Insert: {
          client_label: string;
          is_terminal?: boolean;
          key: string;
          label: string;
          notify_client_by_default?: boolean;
          position?: number;
        };
        Update: {
          client_label?: string;
          is_terminal?: boolean;
          key?: string;
          label?: string;
          notify_client_by_default?: boolean;
          position?: number;
        };
        Relationships: [];
      };
      project_updates: {
        Row: {
          author_id: string | null;
          body: string;
          created_at: string;
          id: string;
          notified_at: string | null;
          project_id: string;
          published_at: string | null;
          title: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          author_id?: string | null;
          body: string;
          created_at?: string;
          id?: string;
          notified_at?: string | null;
          project_id: string;
          published_at?: string | null;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          author_id?: string | null;
          body?: string;
          created_at?: string;
          id?: string;
          notified_at?: string | null;
          project_id?: string;
          published_at?: string | null;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          client_id: string;
          created_at: string;
          created_by: string | null;
          currency: string;
          description: string | null;
          id: string;
          lead_id: string | null;
          ref: string;
          service_slug: string | null;
          start_date: string | null;
          status_key: string;
          target_date: string | null;
          title: string;
          updated_at: string;
          value_minor: number | null;
        };
        ComputedFields: never;
        Insert: {
          client_id: string;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          description?: string | null;
          id?: string;
          lead_id?: string | null;
          ref: string;
          service_slug?: string | null;
          start_date?: string | null;
          status_key?: string;
          target_date?: string | null;
          title: string;
          updated_at?: string;
          value_minor?: number | null;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          description?: string | null;
          id?: string;
          lead_id?: string | null;
          ref?: string;
          service_slug?: string | null;
          start_date?: string | null;
          status_key?: string;
          target_date?: string | null;
          title?: string;
          updated_at?: string;
          value_minor?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: true;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_status_key_fkey";
            columns: ["status_key"];
            isOneToOne: false;
            referencedRelation: "project_statuses";
            referencedColumns: ["key"];
          },
        ];
      };
      rate_limits: {
        Row: {
          bucket: string;
          count: number;
          window_start: string;
        };
        ComputedFields: never;
        Insert: {
          bucket: string;
          count?: number;
          window_start: string;
        };
        Update: {
          bucket?: string;
          count?: number;
          window_start?: string;
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
      check_rate_limit: {
        Args: { p_bucket: string; p_limit: number; p_window_seconds: number };
        Returns: boolean;
      };
      convert_lead_to_project: {
        Args: { p_client_id?: string; p_lead_id: string; p_status_key?: string; p_title: string };
        Returns: {
          client_id: string;
          created: boolean;
          project_id: string;
          project_ref: string;
        }[];
      };
      create_project: {
        Args: {
          p_client_id: string;
          p_currency: string;
          p_description?: string;
          p_service_slug?: string;
          p_start_date?: string;
          p_status_key: string;
          p_target_date?: string;
          p_title: string;
          p_value_minor?: number;
        };
        Returns: {
          project_id: string;
          project_ref: string;
        }[];
      };
      find_user_id_by_email: { Args: { p_email: string }; Returns: string };
      format_business_number: { Args: { p_prefix: string; p_scope: string }; Returns: string };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_client_member: { Args: { target_client_id: string }; Returns: boolean };
      is_project_member: { Args: { target_project_id: string }; Returns: boolean };
      next_sequence_value: { Args: { p_scope: string; p_year: number }; Returns: number };
      purge_expired_data: { Args: Record<PropertyKey, never>; Returns: Json };
      replace_general_faqs: { Args: { items: Json }; Returns: undefined };
      save_inquiry_draft: {
        Args: {
          p_company?: string;
          p_description?: string;
          p_details?: Json;
          p_email: string;
          p_idempotency_key: string;
          p_ip_hash?: string;
          p_name: string;
          p_notice_version: string;
          p_service_label?: string;
          p_service_slug?: string;
          p_token_expires_at: string;
          p_token_hash: string;
          p_user_agent?: string;
          p_website_url?: string;
        };
        Returns: {
          lead_id: string;
          lead_ref: string;
          outcome: string;
        }[];
      };
      submit_inquiry: {
        Args: {
          p_company?: string;
          p_description: string;
          p_details?: Json;
          p_email: string;
          p_idempotency_key: string;
          p_ip_hash?: string;
          p_name: string;
          p_notice_version: string;
          p_resume_token_hash?: string;
          p_service_label?: string;
          p_service_slug?: string;
          p_user_agent?: string;
          p_website_url?: string;
        };
        Returns: {
          lead_id: string;
          lead_ref: string;
          outcome: string;
        }[];
      };
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
