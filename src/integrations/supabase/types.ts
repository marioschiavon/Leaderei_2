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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      apollo_api_calls: {
        Row: {
          company_id: string
          created_at: string
          credits_consumed: number | null
          endpoint: string
          error: string | null
          id: string
          latency_ms: number
          request_summary: Json
          status_code: number | null
          triggered_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          credits_consumed?: number | null
          endpoint: string
          error?: string | null
          id?: string
          latency_ms?: number
          request_summary?: Json
          status_code?: number | null
          triggered_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          credits_consumed?: number | null
          endpoint?: string
          error?: string | null
          id?: string
          latency_ms?: number
          request_summary?: Json
          status_code?: number | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apollo_api_calls_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      apollo_search_cache: {
        Row: {
          company_id: string
          created_at: string
          expires_at: string
          filters: Json
          id: string
          page: number
          query_hash: string
          results: Json
          total_entries: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          expires_at: string
          filters?: Json
          id?: string
          page?: number
          query_hash: string
          results?: Json
          total_entries?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          expires_at?: string
          filters?: Json
          id?: string
          page?: number
          query_hash?: string
          results?: Json
          total_entries?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "apollo_search_cache_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      app_user_connections: {
        Row: {
          connection_key_ciphertext: string
          connector_id: string
          created_at: string
          id: string
          reconnect_required: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_key_ciphertext: string
          connector_id: string
          created_at?: string
          id?: string
          reconnect_required?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_key_ciphertext?: string
          connector_id?: string
          created_at?: string
          id?: string
          reconnect_required?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      approval_requests: {
        Row: {
          action: string
          batch_id: string | null
          cadence_id: string | null
          channel: string | null
          company_id: string
          context: Json
          conversation_id: string | null
          created_at: string
          edited_payload: Json | null
          enrollment_id: string | null
          executed_at: string | null
          execution_error: string | null
          id: string
          kind: string
          lead_id: string | null
          payload: Json
          queued_at: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          action?: string
          batch_id?: string | null
          cadence_id?: string | null
          channel?: string | null
          company_id: string
          context?: Json
          conversation_id?: string | null
          created_at?: string
          edited_payload?: Json | null
          enrollment_id?: string | null
          executed_at?: string | null
          execution_error?: string | null
          id?: string
          kind: string
          lead_id?: string | null
          payload?: Json
          queued_at?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          action?: string
          batch_id?: string | null
          cadence_id?: string | null
          channel?: string | null
          company_id?: string
          context?: Json
          conversation_id?: string | null
          created_at?: string
          edited_payload?: Json | null
          enrollment_id?: string | null
          executed_at?: string | null
          execution_error?: string | null
          id?: string
          kind?: string
          lead_id?: string | null
          payload?: Json
          queued_at?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_cadence_id_fkey"
            columns: ["cadence_id"]
            isOneToOne: false
            referencedRelation: "cadences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "cadence_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          company_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          ip: string | null
          message: string | null
          metadata: Json | null
          severity: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          ip?: string | null
          message?: string | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          ip?: string | null
          message?: string | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_catalog: {
        Row: {
          active: boolean
          description: string | null
          included_in_plans: boolean
          key: string
          kind: string
          name: string
          price_cents: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          description?: string | null
          included_in_plans?: boolean
          key: string
          kind?: string
          name: string
          price_cents?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          description?: string | null
          included_in_plans?: boolean
          key?: string
          kind?: string
          name?: string
          price_cents?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      billing_plans: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          price_cents: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price_cents?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price_cents?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      bitrix_deals: {
        Row: {
          bitrix_company_id: number | null
          company_id: string
          contact_id: number | null
          created_at: string
          current_stage: string | null
          deal_id: number
          id: string
          lead_id: string
          stage_rank: number
          updated_at: string
        }
        Insert: {
          bitrix_company_id?: number | null
          company_id: string
          contact_id?: number | null
          created_at?: string
          current_stage?: string | null
          deal_id: number
          id?: string
          lead_id: string
          stage_rank?: number
          updated_at?: string
        }
        Update: {
          bitrix_company_id?: number | null
          company_id?: string
          contact_id?: number | null
          created_at?: string
          current_stage?: string | null
          deal_id?: number
          id?: string
          lead_id?: string
          stage_rank?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bitrix_deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bitrix_deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      bitrix_sync_queue: {
        Row: {
          attempts: number
          company_id: string
          created_at: string
          event: string
          id: string
          last_error: string | null
          lead_id: string
          next_attempt_at: string
          payload: Json
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          company_id: string
          created_at?: string
          event: string
          id?: string
          last_error?: string | null
          lead_id: string
          next_attempt_at?: string
          payload?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          company_id?: string
          created_at?: string
          event?: string
          id?: string
          last_error?: string | null
          lead_id?: string
          next_attempt_at?: string
          payload?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bitrix_sync_queue_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bitrix_sync_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          attendees: Json | null
          calcom_booking_id: number | null
          calcom_booking_uid: string | null
          calcom_event_type_id: number | null
          calcom_reschedule_uid: string | null
          cancel_reason: string | null
          cancellation_requested_at: string | null
          cancellation_source: string | null
          company_id: string
          conversation_id: string | null
          created_at: string
          duration_minutes: number | null
          end_at: string | null
          id: string
          lead_id: string | null
          location: string | null
          meeting_url: string | null
          owner_user_id: string | null
          previous_booking_id: string | null
          raw_payload: Json | null
          reschedule_reason: string | null
          scheduled_at: string | null
          source: string
          status: Database["public"]["Enums"]["booking_status"]
          timezone: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          attendees?: Json | null
          calcom_booking_id?: number | null
          calcom_booking_uid?: string | null
          calcom_event_type_id?: number | null
          calcom_reschedule_uid?: string | null
          cancel_reason?: string | null
          cancellation_requested_at?: string | null
          cancellation_source?: string | null
          company_id: string
          conversation_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          end_at?: string | null
          id?: string
          lead_id?: string | null
          location?: string | null
          meeting_url?: string | null
          owner_user_id?: string | null
          previous_booking_id?: string | null
          raw_payload?: Json | null
          reschedule_reason?: string | null
          scheduled_at?: string | null
          source?: string
          status?: Database["public"]["Enums"]["booking_status"]
          timezone?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          attendees?: Json | null
          calcom_booking_id?: number | null
          calcom_booking_uid?: string | null
          calcom_event_type_id?: number | null
          calcom_reschedule_uid?: string | null
          cancel_reason?: string | null
          cancellation_requested_at?: string | null
          cancellation_source?: string | null
          company_id?: string
          conversation_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          end_at?: string | null
          id?: string
          lead_id?: string | null
          location?: string | null
          meeting_url?: string | null
          owner_user_id?: string | null
          previous_booking_id?: string | null
          raw_payload?: Json | null
          reschedule_reason?: string | null
          scheduled_at?: string | null
          source?: string
          status?: Database["public"]["Enums"]["booking_status"]
          timezone?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_previous_booking_id_fkey"
            columns: ["previous_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      cadence_agent_decisions: {
        Row: {
          action: string
          attempt_number: number
          channel: string | null
          company_id: string
          decided_at: string
          enrollment_id: string
          hook: string | null
          id: string
          message_body: string | null
          message_subject: string | null
          model: string | null
          rationale: string | null
          scheduled_for: string | null
          simulated: boolean
          stop_reason: string | null
          tokens_used: number | null
        }
        Insert: {
          action: string
          attempt_number?: number
          channel?: string | null
          company_id: string
          decided_at?: string
          enrollment_id: string
          hook?: string | null
          id?: string
          message_body?: string | null
          message_subject?: string | null
          model?: string | null
          rationale?: string | null
          scheduled_for?: string | null
          simulated?: boolean
          stop_reason?: string | null
          tokens_used?: number | null
        }
        Update: {
          action?: string
          attempt_number?: number
          channel?: string | null
          company_id?: string
          decided_at?: string
          enrollment_id?: string
          hook?: string | null
          id?: string
          message_body?: string | null
          message_subject?: string | null
          model?: string | null
          rationale?: string | null
          scheduled_for?: string | null
          simulated?: boolean
          stop_reason?: string | null
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cadence_agent_decisions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadence_agent_decisions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "cadence_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      cadence_custom_messages: {
        Row: {
          company_id: string
          created_at: string
          enrollment_id: string
          id: string
          lead_id: string
          message: string
          step_id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          enrollment_id: string
          id?: string
          lead_id: string
          message: string
          step_id: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          enrollment_id?: string
          id?: string
          lead_id?: string
          message?: string
          step_id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadence_custom_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadence_custom_messages_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "cadence_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadence_custom_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadence_custom_messages_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "cadence_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      cadence_enrollments: {
        Row: {
          cadence_id: string
          company_id: string
          completed_at: string | null
          current_step: number
          enrolled_at: string
          first_message_status: string | null
          id: string
          last_executed_at: string | null
          last_reengage_at: string | null
          lead_id: string
          meeting_scheduled: boolean
          next_execution_at: string | null
          paused_reason: string | null
          reengage_attempts: number
          status: Database["public"]["Enums"]["enrollment_status"]
          updated_at: string
        }
        Insert: {
          cadence_id: string
          company_id: string
          completed_at?: string | null
          current_step?: number
          enrolled_at?: string
          first_message_status?: string | null
          id?: string
          last_executed_at?: string | null
          last_reengage_at?: string | null
          lead_id: string
          meeting_scheduled?: boolean
          next_execution_at?: string | null
          paused_reason?: string | null
          reengage_attempts?: number
          status?: Database["public"]["Enums"]["enrollment_status"]
          updated_at?: string
        }
        Update: {
          cadence_id?: string
          company_id?: string
          completed_at?: string | null
          current_step?: number
          enrolled_at?: string
          first_message_status?: string | null
          id?: string
          last_executed_at?: string | null
          last_reengage_at?: string | null
          lead_id?: string
          meeting_scheduled?: boolean
          next_execution_at?: string | null
          paused_reason?: string | null
          reengage_attempts?: number
          status?: Database["public"]["Enums"]["enrollment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadence_enrollments_cadence_id_fkey"
            columns: ["cadence_id"]
            isOneToOne: false
            referencedRelation: "cadences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadence_enrollments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadence_enrollments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      cadence_execution_queue: {
        Row: {
          attempts: number
          cadence_id: string
          company_id: string
          created_at: string
          enrollment_id: string
          finished_at: string | null
          id: string
          last_error: string | null
          lead_id: string
          locked_at: string | null
          locked_by: string | null
          metadata: Json
          scheduled_for: string
          source: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          cadence_id: string
          company_id: string
          created_at?: string
          enrollment_id: string
          finished_at?: string | null
          id?: string
          last_error?: string | null
          lead_id: string
          locked_at?: string | null
          locked_by?: string | null
          metadata?: Json
          scheduled_for?: string
          source?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          cadence_id?: string
          company_id?: string
          created_at?: string
          enrollment_id?: string
          finished_at?: string | null
          id?: string
          last_error?: string | null
          lead_id?: string
          locked_at?: string | null
          locked_by?: string | null
          metadata?: Json
          scheduled_for?: string
          source?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadence_execution_queue_cadence_id_fkey"
            columns: ["cadence_id"]
            isOneToOne: false
            referencedRelation: "cadences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadence_execution_queue_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadence_execution_queue_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "cadence_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadence_execution_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      cadence_policies: {
        Row: {
          allowed_channels: string[]
          business_hours: Json
          cadence_id: string
          company_id: string
          continue_criteria: string | null
          created_at: string
          goal: string
          max_attempts: number
          max_days: number
          min_fit_score: number | null
          primary_channel: string
          stop_criteria_flags: Json
          stop_criteria_text: string | null
          tone_instructions: string
          updated_at: string
        }
        Insert: {
          allowed_channels?: string[]
          business_hours?: Json
          cadence_id: string
          company_id: string
          continue_criteria?: string | null
          created_at?: string
          goal?: string
          max_attempts?: number
          max_days?: number
          min_fit_score?: number | null
          primary_channel?: string
          stop_criteria_flags?: Json
          stop_criteria_text?: string | null
          tone_instructions?: string
          updated_at?: string
        }
        Update: {
          allowed_channels?: string[]
          business_hours?: Json
          cadence_id?: string
          company_id?: string
          continue_criteria?: string | null
          created_at?: string
          goal?: string
          max_attempts?: number
          max_days?: number
          min_fit_score?: number | null
          primary_channel?: string
          stop_criteria_flags?: Json
          stop_criteria_text?: string | null
          tone_instructions?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadence_policies_cadence_id_fkey"
            columns: ["cadence_id"]
            isOneToOne: true
            referencedRelation: "cadences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadence_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cadence_steps: {
        Row: {
          cadence_id: string
          channel: Database["public"]["Enums"]["cadence_type"]
          created_at: string
          delay_days: number
          id: string
          mental_triggers: string[] | null
          smart_customization: boolean
          step_order: number
          subject: string | null
          template: string
          updated_at: string
          use_highlights: boolean
          use_mental_triggers: boolean
        }
        Insert: {
          cadence_id: string
          channel?: Database["public"]["Enums"]["cadence_type"]
          created_at?: string
          delay_days?: number
          id?: string
          mental_triggers?: string[] | null
          smart_customization?: boolean
          step_order?: number
          subject?: string | null
          template?: string
          updated_at?: string
          use_highlights?: boolean
          use_mental_triggers?: boolean
        }
        Update: {
          cadence_id?: string
          channel?: Database["public"]["Enums"]["cadence_type"]
          created_at?: string
          delay_days?: number
          id?: string
          mental_triggers?: string[] | null
          smart_customization?: boolean
          step_order?: number
          subject?: string | null
          template?: string
          updated_at?: string
          use_highlights?: boolean
          use_mental_triggers?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "cadence_steps_cadence_id_fkey"
            columns: ["cadence_id"]
            isOneToOne: false
            referencedRelation: "cadences"
            referencedColumns: ["id"]
          },
        ]
      }
      cadences: {
        Row: {
          auto_approve_first_message: boolean
          auto_approve_max_per_day: number
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          email_channel: Database["public"]["Enums"]["email_channel"]
          email_grant_id: string | null
          id: string
          kind: string
          mode: string
          name: string
          reengage_after_days: number
          reengage_enabled: boolean
          reengage_max_attempts: number
          simulation_mode: boolean
          status: Database["public"]["Enums"]["cadence_status"]
          type: Database["public"]["Enums"]["cadence_type"]
          updated_at: string
        }
        Insert: {
          auto_approve_first_message?: boolean
          auto_approve_max_per_day?: number
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          email_channel?: Database["public"]["Enums"]["email_channel"]
          email_grant_id?: string | null
          id?: string
          kind?: string
          mode?: string
          name: string
          reengage_after_days?: number
          reengage_enabled?: boolean
          reengage_max_attempts?: number
          simulation_mode?: boolean
          status?: Database["public"]["Enums"]["cadence_status"]
          type?: Database["public"]["Enums"]["cadence_type"]
          updated_at?: string
        }
        Update: {
          auto_approve_first_message?: boolean
          auto_approve_max_per_day?: number
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          email_channel?: Database["public"]["Enums"]["email_channel"]
          email_grant_id?: string | null
          id?: string
          kind?: string
          mode?: string
          name?: string
          reengage_after_days?: number
          reengage_enabled?: boolean
          reengage_max_attempts?: number
          simulation_mode?: boolean
          status?: Database["public"]["Enums"]["cadence_status"]
          type?: Database["public"]["Enums"]["cadence_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadences_email_grant_id_fkey"
            columns: ["email_grant_id"]
            isOneToOne: false
            referencedRelation: "user_email_grants"
            referencedColumns: ["id"]
          },
        ]
      }
      calcom_event_types: {
        Row: {
          active: boolean
          calcom_id: number
          company_id: string
          created_at: string
          default_for_intent: string | null
          description: string | null
          id: string
          length_minutes: number | null
          raw: Json | null
          slug: string | null
          synced_at: string
          team_id: number | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          calcom_id: number
          company_id: string
          created_at?: string
          default_for_intent?: string | null
          description?: string | null
          id?: string
          length_minutes?: number | null
          raw?: Json | null
          slug?: string | null
          synced_at?: string
          team_id?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          calcom_id?: number
          company_id?: string
          created_at?: string
          default_for_intent?: string | null
          description?: string | null
          id?: string
          length_minutes?: number | null
          raw?: Json | null
          slug?: string | null
          synced_at?: string
          team_id?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calcom_event_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      calcom_webhook_log: {
        Row: {
          booking_uid: string | null
          company_id: string | null
          created_at: string
          error: string | null
          event_type: string
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
          signature_valid: boolean | null
        }
        Insert: {
          booking_uid?: string | null
          company_id?: string | null
          created_at?: string
          error?: string | null
          event_type: string
          id?: string
          payload: Json
          processed?: boolean
          processed_at?: string | null
          signature_valid?: boolean | null
        }
        Update: {
          booking_uid?: string | null
          company_id?: string | null
          created_at?: string
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          signature_valid?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "calcom_webhook_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_actions: {
        Row: {
          action_type: string
          company_id: string | null
          conversation_id: string | null
          created_at: string
          error_message: string | null
          id: string
          idempotency_key: string
          lead_id: string | null
          provider_booking_uid: string | null
          reconciled_at: string | null
          request_payload: Json
          requested_start: string | null
          response_payload: Json
          status: string
          updated_at: string
        }
        Insert: {
          action_type: string
          company_id?: string | null
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          idempotency_key: string
          lead_id?: string | null
          provider_booking_uid?: string | null
          reconciled_at?: string | null
          request_payload?: Json
          requested_start?: string | null
          response_payload?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          company_id?: string | null
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          idempotency_key?: string
          lead_id?: string | null
          provider_booking_uid?: string | null
          reconciled_at?: string | null
          request_payload?: Json
          requested_start?: string | null
          response_payload?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_actions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_actions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          approved_count: number
          cadence_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          enrolled_count: number
          filters: Json
          id: string
          list_id: string | null
          mode: string
          name: string
          scheduled_for: string | null
          sent_count: number
          status: string
          total_leads: number
          updated_at: string
        }
        Insert: {
          approved_count?: number
          cadence_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          enrolled_count?: number
          filters?: Json
          id?: string
          list_id?: string | null
          mode: string
          name: string
          scheduled_for?: string | null
          sent_count?: number
          status?: string
          total_leads?: number
          updated_at?: string
        }
        Update: {
          approved_count?: number
          cadence_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          enrolled_count?: number
          filters?: Json
          id?: string
          list_id?: string | null
          mode?: string
          name?: string
          scheduled_for?: string | null
          sent_count?: number
          status?: string
          total_leads?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_cadence_id_fkey"
            columns: ["cadence_id"]
            isOneToOne: false
            referencedRelation: "cadences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lead_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          auto_protect_orgs: boolean
          business_hours: Json
          calcom_api_key_encrypted: string | null
          calcom_booking_link: string | null
          calcom_connected_at: string | null
          calcom_default_event_type_id: number | null
          calcom_last_error: string | null
          calcom_round_robin_enabled: boolean
          calcom_team_id: number | null
          calcom_webhook_secret: string | null
          created_at: string
          enrichment_settings: Json
          hitl_enabled: boolean
          hitl_scopes: Json
          id: string
          logo_url: string | null
          max_leads: number
          max_users: number
          name: string
          scoring_exclude: string[]
          scoring_include: string[]
          scoring_prompt: string | null
          slug: string
          social_enrichment: Json
          status: Database["public"]["Enums"]["company_status"]
          timezone: string
          updated_at: string
        }
        Insert: {
          auto_protect_orgs?: boolean
          business_hours?: Json
          calcom_api_key_encrypted?: string | null
          calcom_booking_link?: string | null
          calcom_connected_at?: string | null
          calcom_default_event_type_id?: number | null
          calcom_last_error?: string | null
          calcom_round_robin_enabled?: boolean
          calcom_team_id?: number | null
          calcom_webhook_secret?: string | null
          created_at?: string
          enrichment_settings?: Json
          hitl_enabled?: boolean
          hitl_scopes?: Json
          id?: string
          logo_url?: string | null
          max_leads?: number
          max_users?: number
          name: string
          scoring_exclude?: string[]
          scoring_include?: string[]
          scoring_prompt?: string | null
          slug: string
          social_enrichment?: Json
          status?: Database["public"]["Enums"]["company_status"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          auto_protect_orgs?: boolean
          business_hours?: Json
          calcom_api_key_encrypted?: string | null
          calcom_booking_link?: string | null
          calcom_connected_at?: string | null
          calcom_default_event_type_id?: number | null
          calcom_last_error?: string | null
          calcom_round_robin_enabled?: boolean
          calcom_team_id?: number | null
          calcom_webhook_secret?: string | null
          created_at?: string
          enrichment_settings?: Json
          hitl_enabled?: boolean
          hitl_scopes?: Json
          id?: string
          logo_url?: string | null
          max_leads?: number
          max_users?: number
          name?: string
          scoring_exclude?: string[]
          scoring_include?: string[]
          scoring_prompt?: string | null
          slug?: string
          social_enrichment?: Json
          status?: Database["public"]["Enums"]["company_status"]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_email_domains: {
        Row: {
          company_id: string
          created_at: string
          dns_records: Json | null
          from_email: string | null
          from_name: string | null
          id: string
          inbound_configured_at: string | null
          inbound_dns_records: Json | null
          inbound_domain: string | null
          inbound_status: string | null
          last_error: string | null
          reply_to: string | null
          resend_domain_id: string | null
          sending_domain: string
          status: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          dns_records?: Json | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          inbound_configured_at?: string | null
          inbound_dns_records?: Json | null
          inbound_domain?: string | null
          inbound_status?: string | null
          last_error?: string | null
          reply_to?: string | null
          resend_domain_id?: string | null
          sending_domain: string
          status?: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          dns_records?: Json | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          inbound_configured_at?: string | null
          inbound_dns_records?: Json | null
          inbound_domain?: string | null
          inbound_status?: string | null
          last_error?: string | null
          reply_to?: string | null
          resend_domain_id?: string | null
          sending_domain?: string
          status?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_email_domains_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          cancelled_at: string | null
          company_id: string
          created_at: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          cancelled_at?: string | null
          company_id: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          cancelled_at?: string | null
          company_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_knowledge: {
        Row: {
          company_id: string
          content: string
          created_at: string
          embedded_at: string | null
          file_path: string | null
          id: string
          knowledge_type: string
          locked: boolean
          needs_embedding: boolean
          origin: string
          source_url: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          content?: string
          created_at?: string
          embedded_at?: string | null
          file_path?: string | null
          id?: string
          knowledge_type?: string
          locked?: boolean
          needs_embedding?: boolean
          origin?: string
          source_url?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          embedded_at?: string | null
          file_path?: string | null
          id?: string
          knowledge_type?: string
          locked?: boolean
          needs_embedding?: boolean
          origin?: string
          source_url?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_knowledge_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_subscriptions: {
        Row: {
          company_id: string
          module_keys: string[]
          plan_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          module_keys?: string[]
          plan_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          module_keys?: string[]
          plan_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          cadence_enrollment_id: string | null
          channel: Database["public"]["Enums"]["cadence_type"]
          company_id: string
          created_at: string
          human_taken_at: string | null
          human_taken_by: string | null
          human_takeover: boolean
          human_takeover_reason: string | null
          id: string
          last_inbound_at: string | null
          lead_id: string
          summary: string | null
          summary_message_count: number
          summary_updated_at: string | null
        }
        Insert: {
          cadence_enrollment_id?: string | null
          channel?: Database["public"]["Enums"]["cadence_type"]
          company_id: string
          created_at?: string
          human_taken_at?: string | null
          human_taken_by?: string | null
          human_takeover?: boolean
          human_takeover_reason?: string | null
          id?: string
          last_inbound_at?: string | null
          lead_id: string
          summary?: string | null
          summary_message_count?: number
          summary_updated_at?: string | null
        }
        Update: {
          cadence_enrollment_id?: string | null
          channel?: Database["public"]["Enums"]["cadence_type"]
          company_id?: string
          created_at?: string
          human_taken_at?: string | null
          human_taken_by?: string | null
          human_takeover?: boolean
          human_takeover_reason?: string | null
          id?: string
          last_inbound_at?: string | null
          lead_id?: string
          summary?: string | null
          summary_message_count?: number
          summary_updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_cadence_enrollment_id_fkey"
            columns: ["cadence_enrollment_id"]
            isOneToOne: false
            referencedRelation: "cadence_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_delivery_log: {
        Row: {
          attempt: number
          company_id: string
          conversation_id: string | null
          created_at: string
          error_message: string | null
          from_email: string | null
          id: string
          lead_id: string | null
          metadata: Json
          provider: string
          provider_message_id: string | null
          recipient_email: string
          source: string | null
          status: string
          subject: string | null
        }
        Insert: {
          attempt?: number
          company_id: string
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          from_email?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json
          provider?: string
          provider_message_id?: string | null
          recipient_email: string
          source?: string | null
          status?: string
          subject?: string | null
        }
        Update: {
          attempt?: number
          company_id?: string
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          from_email?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json
          provider?: string
          provider_message_id?: string | null
          recipient_email?: string
          source?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      execution_logs: {
        Row: {
          action: string
          ai_context: Json | null
          channel: string
          company_id: string
          created_at: string
          enrollment_id: string
          id: string
          lead_id: string
          message_content: string
          step_id: string
        }
        Insert: {
          action?: string
          ai_context?: Json | null
          channel?: string
          company_id: string
          created_at?: string
          enrollment_id: string
          id?: string
          lead_id: string
          message_content?: string
          step_id: string
        }
        Update: {
          action?: string
          ai_context?: Json | null
          channel?: string
          company_id?: string
          created_at?: string
          enrollment_id?: string
          id?: string
          lead_id?: string
          message_content?: string
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_logs_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "cadence_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_logs_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "cadence_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      hook7_instances: {
        Row: {
          archived_at: string | null
          auto_restart_attempts: number
          auto_restart_last_at: string | null
          company_id: string
          connected_profile_name: string | null
          created_at: string
          created_by: string | null
          daily_send_cap: number
          disconnect_last_reminder_at: string | null
          disconnect_notified_at: string | null
          disconnect_reminder_count: number
          display_name: string
          engine: string
          external_id: string | null
          external_name: string | null
          hourly_send_cap: number
          id: string
          last_connected_at: string | null
          last_error: string | null
          last_qr_at: string | null
          lead_cooldown_minutes: number
          max_gap_seconds: number
          min_gap_seconds: number
          owner_user_id: string | null
          phone_number: string | null
          refusal_count: number
          status: Database["public"]["Enums"]["hook7_instance_status"]
          token_encrypted: string | null
          updated_at: string
          user_disconnected_at: string | null
          warmup_started_at: string | null
        }
        Insert: {
          archived_at?: string | null
          auto_restart_attempts?: number
          auto_restart_last_at?: string | null
          company_id: string
          connected_profile_name?: string | null
          created_at?: string
          created_by?: string | null
          daily_send_cap?: number
          disconnect_last_reminder_at?: string | null
          disconnect_notified_at?: string | null
          disconnect_reminder_count?: number
          display_name: string
          engine?: string
          external_id?: string | null
          external_name?: string | null
          hourly_send_cap?: number
          id?: string
          last_connected_at?: string | null
          last_error?: string | null
          last_qr_at?: string | null
          lead_cooldown_minutes?: number
          max_gap_seconds?: number
          min_gap_seconds?: number
          owner_user_id?: string | null
          phone_number?: string | null
          refusal_count?: number
          status?: Database["public"]["Enums"]["hook7_instance_status"]
          token_encrypted?: string | null
          updated_at?: string
          user_disconnected_at?: string | null
          warmup_started_at?: string | null
        }
        Update: {
          archived_at?: string | null
          auto_restart_attempts?: number
          auto_restart_last_at?: string | null
          company_id?: string
          connected_profile_name?: string | null
          created_at?: string
          created_by?: string | null
          daily_send_cap?: number
          disconnect_last_reminder_at?: string | null
          disconnect_notified_at?: string | null
          disconnect_reminder_count?: number
          display_name?: string
          engine?: string
          external_id?: string | null
          external_name?: string | null
          hourly_send_cap?: number
          id?: string
          last_connected_at?: string | null
          last_error?: string | null
          last_qr_at?: string | null
          lead_cooldown_minutes?: number
          max_gap_seconds?: number
          min_gap_seconds?: number
          owner_user_id?: string | null
          phone_number?: string | null
          refusal_count?: number
          status?: Database["public"]["Enums"]["hook7_instance_status"]
          token_encrypted?: string | null
          updated_at?: string
          user_disconnected_at?: string | null
          warmup_started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hook7_instances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          api_domain: string | null
          api_token: string | null
          company_id: string
          config: Json
          created_at: string
          id: string
          last_synced_at: string | null
          provider: Database["public"]["Enums"]["integration_provider"]
          status: string
          updated_at: string
        }
        Insert: {
          api_domain?: string | null
          api_token?: string | null
          company_id: string
          config?: Json
          created_at?: string
          id?: string
          last_synced_at?: string | null
          provider?: Database["public"]["Enums"]["integration_provider"]
          status?: string
          updated_at?: string
        }
        Update: {
          api_domain?: string | null
          api_token?: string | null
          company_id?: string
          config?: Json
          created_at?: string
          id?: string
          last_synced_at?: string | null
          provider?: Database["public"]["Enums"]["integration_provider"]
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      intent_action_rules: {
        Row: {
          actions: Json
          auto_execute: boolean
          category: Database["public"]["Enums"]["intent_category"]
          company_id: string
          created_at: string
          enabled: boolean
          id: string
          priority: number
          requires_confidence_above: number
          sub_intent: string | null
          updated_at: string
        }
        Insert: {
          actions?: Json
          auto_execute?: boolean
          category: Database["public"]["Enums"]["intent_category"]
          company_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          priority?: number
          requires_confidence_above?: number
          sub_intent?: string | null
          updated_at?: string
        }
        Update: {
          actions?: Json
          auto_execute?: boolean
          category?: Database["public"]["Enums"]["intent_category"]
          company_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          priority?: number
          requires_confidence_above?: number
          sub_intent?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intent_action_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_chunks: {
        Row: {
          chunk: string
          company_id: string
          created_at: string
          embedding: string | null
          id: string
          knowledge_id: string | null
          metadata: Json
          token_count: number | null
        }
        Insert: {
          chunk: string
          company_id: string
          created_at?: string
          embedding?: string | null
          id?: string
          knowledge_id?: string | null
          metadata?: Json
          token_count?: number | null
        }
        Update: {
          chunk?: string
          company_id?: string
          created_at?: string
          embedding?: string | null
          id?: string
          knowledge_id?: string | null
          metadata?: Json
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_chunks_knowledge_id_fkey"
            columns: ["knowledge_id"]
            isOneToOne: false
            referencedRelation: "company_knowledge"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_action_queue: {
        Row: {
          action_type: Database["public"]["Enums"]["action_type"]
          attempts: number
          company_id: string
          conversation_id: string | null
          created_at: string
          error: string | null
          executed_at: string | null
          id: string
          intent_log_id: string | null
          lead_id: string
          params: Json
          result: Json | null
          scheduled_for: string
          status: Database["public"]["Enums"]["action_status"]
          triggered_by: string | null
          updated_at: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["action_type"]
          attempts?: number
          company_id: string
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          executed_at?: string | null
          id?: string
          intent_log_id?: string | null
          lead_id: string
          params?: Json
          result?: Json | null
          scheduled_for?: string
          status?: Database["public"]["Enums"]["action_status"]
          triggered_by?: string | null
          updated_at?: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["action_type"]
          attempts?: number
          company_id?: string
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          executed_at?: string | null
          id?: string
          intent_log_id?: string | null
          lead_id?: string
          params?: Json
          result?: Json | null
          scheduled_for?: string
          status?: Database["public"]["Enums"]["action_status"]
          triggered_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_action_queue_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_action_queue_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_action_queue_intent_log_id_fkey"
            columns: ["intent_log_id"]
            isOneToOne: false
            referencedRelation: "lead_intents_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_action_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          lead_id: string
          metadata: Json | null
          type: Database["public"]["Enums"]["activity_type"]
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          type: Database["public"]["Enums"]["activity_type"]
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          type?: Database["public"]["Enums"]["activity_type"]
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_enrichment_jobs: {
        Row: {
          attempts: number
          company_id: string
          created_at: string
          error: string | null
          id: string
          lead_id: string
          next_run_at: string
          status: string
          steps_done: Json
          updated_at: string
        }
        Insert: {
          attempts?: number
          company_id: string
          created_at?: string
          error?: string | null
          id?: string
          lead_id: string
          next_run_at?: string
          status?: string
          steps_done?: Json
          updated_at?: string
        }
        Update: {
          attempts?: number
          company_id?: string
          created_at?: string
          error?: string | null
          id?: string
          lead_id?: string
          next_run_at?: string
          status?: string
          steps_done?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_enrichment_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_enrichment_jobs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_insights: {
        Row: {
          analyzed_at: string | null
          company_id: string
          created_at: string | null
          id: string
          insights: Json
          instagram_summary: string | null
          lead_id: string
          linkedin_summary: string | null
          raw_summary: string | null
          score: number | null
          score_breakdown: Json | null
          website_url: string | null
        }
        Insert: {
          analyzed_at?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          insights?: Json
          instagram_summary?: string | null
          lead_id: string
          linkedin_summary?: string | null
          raw_summary?: string | null
          score?: number | null
          score_breakdown?: Json | null
          website_url?: string | null
        }
        Update: {
          analyzed_at?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          insights?: Json
          instagram_summary?: string | null
          lead_id?: string
          linkedin_summary?: string | null
          raw_summary?: string | null
          score?: number | null
          score_breakdown?: Json | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_insights_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_insights_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_intents_log: {
        Row: {
          category: Database["public"]["Enums"]["intent_category"]
          company_id: string
          confidence: number
          conversation_id: string | null
          created_at: string
          entities: Json
          id: string
          latency_ms: number | null
          lead_id: string
          message_excerpt: string | null
          message_id: string | null
          model_used: string | null
          raw_response: Json | null
          sentiment: string | null
          sub_intent: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["intent_category"]
          company_id: string
          confidence?: number
          conversation_id?: string | null
          created_at?: string
          entities?: Json
          id?: string
          latency_ms?: number | null
          lead_id: string
          message_excerpt?: string | null
          message_id?: string | null
          model_used?: string | null
          raw_response?: Json | null
          sentiment?: string | null
          sub_intent?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["intent_category"]
          company_id?: string
          confidence?: number
          conversation_id?: string | null
          created_at?: string
          entities?: Json
          id?: string
          latency_ms?: number | null
          lead_id?: string
          message_excerpt?: string | null
          message_id?: string | null
          model_used?: string | null
          raw_response?: Json | null
          sentiment?: string | null
          sub_intent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_intents_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_intents_log_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_intents_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_intents_log_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_lists: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          default_cadence_id: string | null
          file_name: string | null
          folder: string | null
          id: string
          lead_count: number
          name: string
          notes: string | null
          source: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          default_cadence_id?: string | null
          file_name?: string | null
          folder?: string | null
          id?: string
          lead_count?: number
          name: string
          notes?: string | null
          source?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          default_cadence_id?: string | null
          file_name?: string | null
          folder?: string | null
          id?: string
          lead_count?: number
          name?: string
          notes?: string | null
          source?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_lists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_lists_default_cadence_id_fkey"
            columns: ["default_cadence_id"]
            isOneToOne: false
            referencedRelation: "cadences"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_memory: {
        Row: {
          company_id: string
          created_at: string
          facts: Json
          id: string
          last_message_count: number
          lead_id: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          facts?: Json
          id?: string
          last_message_count?: number
          lead_id: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          facts?: Json
          id?: string
          last_message_count?: number
          lead_id?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_memory_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_memory_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_social_profiles: {
        Row: {
          bio: string | null
          company_id: string
          created_at: string
          followers: number | null
          handle: string | null
          id: string
          lead_id: string
          network: string
          posts_summary: string | null
          raw: Json | null
          recent_posts: Json | null
          scraped_at: string
          updated_at: string
          url: string | null
        }
        Insert: {
          bio?: string | null
          company_id: string
          created_at?: string
          followers?: number | null
          handle?: string | null
          id?: string
          lead_id: string
          network: string
          posts_summary?: string | null
          raw?: Json | null
          recent_posts?: Json | null
          scraped_at?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          bio?: string | null
          company_id?: string
          created_at?: string
          followers?: number | null
          handle?: string | null
          id?: string
          lead_id?: string
          network?: string
          posts_summary?: string | null
          raw?: Json | null
          recent_posts?: Json | null
          scraped_at?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_social_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_social_profiles_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          apollo_person_id: string | null
          call_requested_at: string | null
          city: string | null
          company_id: string
          company_name: string | null
          contact_identified: boolean
          corporate_phone: string | null
          country: string | null
          created_at: string
          department: string | null
          email: string | null
          employee_count: number | null
          enrichment_data: Json
          enrichment_status: string | null
          enrichment_updated_at: string | null
          facebook_url: string | null
          first_name: string | null
          handoff_at: string | null
          handoff_reason: string | null
          handoff_required: boolean
          id: string
          industry: string | null
          instagram_url: string | null
          last_name: string | null
          last_synced_at: string | null
          lead_kind: string
          lead_list_id: string | null
          linkedin_company_url: string | null
          linkedin_url: string | null
          mobile_phone: string | null
          municipia_source_id: string | null
          name: string
          parent_company_lead_id: string | null
          pending_email_slot_hold_id: string | null
          personal_email: string | null
          phone: string | null
          pipedrive_data: Json | null
          pipedrive_id: number | null
          pipeline_mode: string
          preferred_channel: string | null
          referral_context: string | null
          referral_followup_sent_at: string | null
          referral_permission_to_mention: boolean | null
          referral_role: string | null
          referral_source_lead_id: string | null
          referral_stage: string | null
          referrer_company: string | null
          referrer_name: string | null
          score: number | null
          secondary_email: string | null
          seniority: string | null
          source: string | null
          state: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tags: string[]
          title: string | null
          updated_at: string
          website: string | null
          whatsapp: string | null
          whatsapp_check_error: string | null
          whatsapp_checked_at: string | null
          whatsapp_source: string | null
          whatsapp_valid: boolean | null
        }
        Insert: {
          address?: string | null
          apollo_person_id?: string | null
          call_requested_at?: string | null
          city?: string | null
          company_id: string
          company_name?: string | null
          contact_identified?: boolean
          corporate_phone?: string | null
          country?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          employee_count?: number | null
          enrichment_data?: Json
          enrichment_status?: string | null
          enrichment_updated_at?: string | null
          facebook_url?: string | null
          first_name?: string | null
          handoff_at?: string | null
          handoff_reason?: string | null
          handoff_required?: boolean
          id?: string
          industry?: string | null
          instagram_url?: string | null
          last_name?: string | null
          last_synced_at?: string | null
          lead_kind?: string
          lead_list_id?: string | null
          linkedin_company_url?: string | null
          linkedin_url?: string | null
          mobile_phone?: string | null
          municipia_source_id?: string | null
          name: string
          parent_company_lead_id?: string | null
          pending_email_slot_hold_id?: string | null
          personal_email?: string | null
          phone?: string | null
          pipedrive_data?: Json | null
          pipedrive_id?: number | null
          pipeline_mode?: string
          preferred_channel?: string | null
          referral_context?: string | null
          referral_followup_sent_at?: string | null
          referral_permission_to_mention?: boolean | null
          referral_role?: string | null
          referral_source_lead_id?: string | null
          referral_stage?: string | null
          referrer_company?: string | null
          referrer_name?: string | null
          score?: number | null
          secondary_email?: string | null
          seniority?: string | null
          source?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[]
          title?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
          whatsapp_check_error?: string | null
          whatsapp_checked_at?: string | null
          whatsapp_source?: string | null
          whatsapp_valid?: boolean | null
        }
        Update: {
          address?: string | null
          apollo_person_id?: string | null
          call_requested_at?: string | null
          city?: string | null
          company_id?: string
          company_name?: string | null
          contact_identified?: boolean
          corporate_phone?: string | null
          country?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          employee_count?: number | null
          enrichment_data?: Json
          enrichment_status?: string | null
          enrichment_updated_at?: string | null
          facebook_url?: string | null
          first_name?: string | null
          handoff_at?: string | null
          handoff_reason?: string | null
          handoff_required?: boolean
          id?: string
          industry?: string | null
          instagram_url?: string | null
          last_name?: string | null
          last_synced_at?: string | null
          lead_kind?: string
          lead_list_id?: string | null
          linkedin_company_url?: string | null
          linkedin_url?: string | null
          mobile_phone?: string | null
          municipia_source_id?: string | null
          name?: string
          parent_company_lead_id?: string | null
          pending_email_slot_hold_id?: string | null
          personal_email?: string | null
          phone?: string | null
          pipedrive_data?: Json | null
          pipedrive_id?: number | null
          pipeline_mode?: string
          preferred_channel?: string | null
          referral_context?: string | null
          referral_followup_sent_at?: string | null
          referral_permission_to_mention?: boolean | null
          referral_role?: string | null
          referral_source_lead_id?: string | null
          referral_stage?: string | null
          referrer_company?: string | null
          referrer_name?: string | null
          score?: number | null
          secondary_email?: string | null
          seniority?: string | null
          source?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[]
          title?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
          whatsapp_check_error?: string | null
          whatsapp_checked_at?: string | null
          whatsapp_source?: string | null
          whatsapp_valid?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_lead_list_id_fkey"
            columns: ["lead_list_id"]
            isOneToOne: false
            referencedRelation: "lead_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_parent_company_lead_id_fkey"
            columns: ["parent_company_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_referral_source_lead_id_fkey"
            columns: ["referral_source_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      message_annotations: {
        Row: {
          author_user_id: string
          company_id: string
          context_snapshot: Json
          conversation_id: string | null
          created_at: string
          final_content: string | null
          human_action: string | null
          id: string
          lead_id: string | null
          note: string
          source_id: string
          source_kind: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          author_user_id: string
          company_id: string
          context_snapshot?: Json
          conversation_id?: string | null
          created_at?: string
          final_content?: string | null
          human_action?: string | null
          id?: string
          lead_id?: string | null
          note: string
          source_id: string
          source_kind: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          author_user_id?: string
          company_id?: string
          context_snapshot?: Json
          conversation_id?: string | null
          created_at?: string
          final_content?: string | null
          human_action?: string | null
          id?: string
          lead_id?: string | null
          note?: string
          source_id?: string
          source_kind?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_annotations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_annotations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_annotations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          ai_suggested: boolean
          channel: string
          content: string
          conversation_id: string
          direction: string
          email_provider: string | null
          id: string
          metadata: Json | null
          provider: string | null
          provider_message_id: string | null
          provider_thread_id: string | null
          rfc_message_id: string | null
          sent_at: string
        }
        Insert: {
          ai_suggested?: boolean
          channel?: string
          content?: string
          conversation_id: string
          direction?: string
          email_provider?: string | null
          id?: string
          metadata?: Json | null
          provider?: string | null
          provider_message_id?: string | null
          provider_thread_id?: string | null
          rfc_message_id?: string | null
          sent_at?: string
        }
        Update: {
          ai_suggested?: boolean
          channel?: string
          content?: string
          conversation_id?: string
          direction?: string
          email_provider?: string | null
          id?: string
          metadata?: Json | null
          provider?: string | null
          provider_message_id?: string | null
          provider_thread_id?: string | null
          rfc_message_id?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      municipia_integrations: {
        Row: {
          company_id: string
          created_at: string
          enabled: boolean
          id: string
          last_error: string | null
          last_import_at: string | null
          last_import_count: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_import_at?: string | null
          last_import_count?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_import_at?: string | null
          last_import_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "municipia_integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_inbound_runs: {
        Row: {
          attempts: number
          claimed_at: string | null
          company_id: string
          conversation_id: string | null
          created_at: string
          last_error: string | null
          last_inbound_at: string
          lead_id: string
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          claimed_at?: string | null
          company_id: string
          conversation_id?: string | null
          created_at?: string
          last_error?: string | null
          last_inbound_at?: string
          lead_id: string
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          claimed_at?: string | null
          company_id?: string
          conversation_id?: string | null
          created_at?: string
          last_error?: string | null
          last_inbound_at?: string
          lead_id?: string
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      pipedrive_deals: {
        Row: {
          activities_synced_at: string | null
          company_id: string
          created_at: string
          current_stage: string | null
          deal_id: number
          id: string
          lead_id: string
          meeting_activity_id: number | null
          meeting_booking_id: string | null
          org_id: number | null
          person_id: number | null
          stage_rank: number
          summary_note_id: number | null
          updated_at: string
        }
        Insert: {
          activities_synced_at?: string | null
          company_id: string
          created_at?: string
          current_stage?: string | null
          deal_id: number
          id?: string
          lead_id: string
          meeting_activity_id?: number | null
          meeting_booking_id?: string | null
          org_id?: number | null
          person_id?: number | null
          stage_rank?: number
          summary_note_id?: number | null
          updated_at?: string
        }
        Update: {
          activities_synced_at?: string | null
          company_id?: string
          created_at?: string
          current_stage?: string | null
          deal_id?: number
          id?: string
          lead_id?: string
          meeting_activity_id?: number | null
          meeting_booking_id?: string | null
          org_id?: number | null
          person_id?: number | null
          stage_rank?: number
          summary_note_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipedrive_deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipedrive_deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      pipedrive_sync_queue: {
        Row: {
          attempts: number
          company_id: string
          created_at: string
          event: string
          id: string
          last_error: string | null
          lead_id: string
          next_attempt_at: string
          payload: Json
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          company_id: string
          created_at?: string
          event: string
          id?: string
          last_error?: string | null
          lead_id: string
          next_attempt_at?: string
          payload?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          company_id?: string
          created_at?: string
          event?: string
          id?: string
          last_error?: string | null
          lead_id?: string
          next_attempt_at?: string
          payload?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipedrive_sync_queue_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipedrive_sync_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          apify_actors: Json
          apify_enabled: boolean
          created_at: string
          elevenlabs_api_key_encrypted: string | null
          elevenlabs_connected_at: string | null
          elevenlabs_last_error: string | null
          elevenlabs_model: string
          gemini_api_key_encrypted: string | null
          gemini_connected_at: string | null
          gemini_last_error: string | null
          hook7_base_url: string
          hook7_number_check_path: string | null
          id: string
          metadata: Json
          openai_api_key_encrypted: string | null
          openai_connected_at: string | null
          openai_last_error: string | null
          resend_api_key_encrypted: string | null
          resend_connected_at: string | null
          resend_inbound_webhook_id: string | null
          resend_inbound_webhook_secret: string | null
          resend_last_error: string | null
          singleton: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          apify_actors?: Json
          apify_enabled?: boolean
          created_at?: string
          elevenlabs_api_key_encrypted?: string | null
          elevenlabs_connected_at?: string | null
          elevenlabs_last_error?: string | null
          elevenlabs_model?: string
          gemini_api_key_encrypted?: string | null
          gemini_connected_at?: string | null
          gemini_last_error?: string | null
          hook7_base_url?: string
          hook7_number_check_path?: string | null
          id?: string
          metadata?: Json
          openai_api_key_encrypted?: string | null
          openai_connected_at?: string | null
          openai_last_error?: string | null
          resend_api_key_encrypted?: string | null
          resend_connected_at?: string | null
          resend_inbound_webhook_id?: string | null
          resend_inbound_webhook_secret?: string | null
          resend_last_error?: string | null
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          apify_actors?: Json
          apify_enabled?: boolean
          created_at?: string
          elevenlabs_api_key_encrypted?: string | null
          elevenlabs_connected_at?: string | null
          elevenlabs_last_error?: string | null
          elevenlabs_model?: string
          gemini_api_key_encrypted?: string | null
          gemini_connected_at?: string | null
          gemini_last_error?: string | null
          hook7_base_url?: string
          hook7_number_check_path?: string | null
          id?: string
          metadata?: Json
          openai_api_key_encrypted?: string | null
          openai_connected_at?: string | null
          openai_last_error?: string | null
          resend_api_key_encrypted?: string | null
          resend_connected_at?: string | null
          resend_inbound_webhook_id?: string | null
          resend_inbound_webhook_secret?: string | null
          resend_last_error?: string | null
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      processed_inbound_messages: {
        Row: {
          content_bucket: number | null
          content_hash: string | null
          id: string
          lead_id: string
          processed_at: string
          provider: string | null
          provider_message_id: string | null
        }
        Insert: {
          content_bucket?: number | null
          content_hash?: string | null
          id?: string
          lead_id: string
          processed_at?: string
          provider?: string | null
          provider_message_id?: string | null
        }
        Update: {
          content_bucket?: number | null
          content_hash?: string | null
          id?: string
          lead_id?: string
          processed_at?: string
          provider?: string | null
          provider_message_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      protected_organizations: {
        Row: {
          city: string | null
          company_id: string
          created_at: string
          created_by: string | null
          domain: string | null
          id: string
          kind: string
          label: string
          lead_id: string | null
          name_normalized: string | null
          note: string | null
          reason: string
          source: string
          state: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          domain?: string | null
          id?: string
          kind?: string
          label: string
          lead_id?: string | null
          name_normalized?: string | null
          note?: string | null
          reason?: string
          source?: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          domain?: string | null
          id?: string
          kind?: string
          label?: string
          lead_id?: string | null
          name_normalized?: string | null
          note?: string | null
          reason?: string
          source?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "protected_organizations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      script_templates: {
        Row: {
          base_script: string
          channel: Database["public"]["Enums"]["cadence_type"]
          company_id: string
          created_at: string
          created_by: string
          id: string
          is_ai_generated: boolean
          name: string
          segment: string
          slots: Json
          tone: string
          updated_at: string
        }
        Insert: {
          base_script?: string
          channel?: Database["public"]["Enums"]["cadence_type"]
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          is_ai_generated?: boolean
          name: string
          segment?: string
          slots?: Json
          tone?: string
          updated_at?: string
        }
        Update: {
          base_script?: string
          channel?: Database["public"]["Enums"]["cadence_type"]
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          is_ai_generated?: boolean
          name?: string
          segment?: string
          slots?: Json
          tone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      script_variations: {
        Row: {
          created_at: string
          id: string
          template_id: string
          tone: string
          variation_text: string
        }
        Insert: {
          created_at?: string
          id?: string
          template_id: string
          tone?: string
          variation_text?: string
        }
        Update: {
          created_at?: string
          id?: string
          template_id?: string
          tone?: string
          variation_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_variations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "script_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sdr_agent_runs: {
        Row: {
          company_id: string
          completion_tokens: number | null
          conversation_id: string | null
          created_at: string
          error: string | null
          final_output: Json | null
          id: string
          latency_ms: number | null
          lead_id: string | null
          mode: string
          model: string | null
          prompt_tokens: number | null
          status: string
          steps: Json
          total_tokens: number | null
          trigger: string
        }
        Insert: {
          company_id: string
          completion_tokens?: number | null
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          final_output?: Json | null
          id?: string
          latency_ms?: number | null
          lead_id?: string | null
          mode?: string
          model?: string | null
          prompt_tokens?: number | null
          status?: string
          steps?: Json
          total_tokens?: number | null
          trigger: string
        }
        Update: {
          company_id?: string
          completion_tokens?: number | null
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          final_output?: Json | null
          id?: string
          latency_ms?: number | null
          lead_id?: string | null
          mode?: string
          model?: string | null
          prompt_tokens?: number | null
          status?: string
          steps?: Json
          total_tokens?: number | null
          trigger?: string
        }
        Relationships: [
          {
            foreignKeyName: "sdr_agent_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdr_agent_runs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdr_agent_runs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      slot_expiry_followups: {
        Row: {
          attempts: number
          company_id: string
          conversation_id: string | null
          created_at: string
          enrollment_id: string | null
          id: string
          last_action_at: string
          lead_id: string
          metadata: Json
          next_action_at: string | null
          stage: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          company_id: string
          conversation_id?: string | null
          created_at?: string
          enrollment_id?: string | null
          id?: string
          last_action_at?: string
          lead_id: string
          metadata?: Json
          next_action_at?: string | null
          stage: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          company_id?: string
          conversation_id?: string | null
          created_at?: string
          enrollment_id?: string | null
          id?: string
          last_action_at?: string
          lead_id?: string
          metadata?: Json
          next_action_at?: string | null
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "slot_expiry_followups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_expiry_followups_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_expiry_followups_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "cadence_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_expiry_followups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      slot_holds: {
        Row: {
          cal_booking_uid: string | null
          company_id: string
          conversation_id: string | null
          created_at: string
          enrollment_id: string | null
          expires_at: string
          id: string
          lead_id: string
          metadata: Json
          preferred_channel: string | null
          slot_datetime: string
          status: string
        }
        Insert: {
          cal_booking_uid?: string | null
          company_id: string
          conversation_id?: string | null
          created_at?: string
          enrollment_id?: string | null
          expires_at: string
          id?: string
          lead_id: string
          metadata?: Json
          preferred_channel?: string | null
          slot_datetime: string
          status?: string
        }
        Update: {
          cal_booking_uid?: string | null
          company_id?: string
          conversation_id?: string | null
          created_at?: string
          enrollment_id?: string | null
          expires_at?: string
          id?: string
          lead_id?: string
          metadata?: Json
          preferred_channel?: string | null
          slot_datetime?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "slot_holds_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_holds_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_holds_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "cadence_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_holds_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_email_grants: {
        Row: {
          company_id: string
          created_at: string
          daily_sent_count: number
          daily_sent_date: string
          display_name: string | null
          email: string
          grant_id: string
          id: string
          last_error: string | null
          last_synced_at: string | null
          provider: Database["public"]["Enums"]["email_grant_provider"]
          scopes: string[] | null
          status: Database["public"]["Enums"]["email_grant_status"]
          transport: string
          updated_at: string
          user_id: string
          warmup_paused: boolean
          warmup_started_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          daily_sent_count?: number
          daily_sent_date?: string
          display_name?: string | null
          email: string
          grant_id: string
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          provider: Database["public"]["Enums"]["email_grant_provider"]
          scopes?: string[] | null
          status?: Database["public"]["Enums"]["email_grant_status"]
          transport?: string
          updated_at?: string
          user_id: string
          warmup_paused?: boolean
          warmup_started_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          daily_sent_count?: number
          daily_sent_date?: string
          display_name?: string | null
          email?: string
          grant_id?: string
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          provider?: Database["public"]["Enums"]["email_grant_provider"]
          scopes?: string[] | null
          status?: Database["public"]["Enums"]["email_grant_status"]
          transport?: string
          updated_at?: string
          user_id?: string
          warmup_paused?: boolean
          warmup_started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_email_grants_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_send_queue: {
        Row: {
          approval_id: string | null
          attempts: number
          body: string
          company_id: string
          conversation_id: string | null
          created_at: string
          enrollment_id: string | null
          id: string
          instance_id: string | null
          last_error: string | null
          lead_id: string | null
          metadata: Json
          priority: number
          scheduled_for: string
          send_attempts: number
          sent_at: string | null
          sent_message_id: string | null
          source: string
          status: string
          to_phone: string
          updated_at: string
        }
        Insert: {
          approval_id?: string | null
          attempts?: number
          body: string
          company_id: string
          conversation_id?: string | null
          created_at?: string
          enrollment_id?: string | null
          id?: string
          instance_id?: string | null
          last_error?: string | null
          lead_id?: string | null
          metadata?: Json
          priority?: number
          scheduled_for?: string
          send_attempts?: number
          sent_at?: string | null
          sent_message_id?: string | null
          source?: string
          status?: string
          to_phone: string
          updated_at?: string
        }
        Update: {
          approval_id?: string | null
          attempts?: number
          body?: string
          company_id?: string
          conversation_id?: string | null
          created_at?: string
          enrollment_id?: string | null
          id?: string
          instance_id?: string | null
          last_error?: string | null
          lead_id?: string | null
          metadata?: Json
          priority?: number
          scheduled_for?: string
          send_attempts?: number
          sent_at?: string | null
          sent_message_id?: string | null
          source?: string
          status?: string
          to_phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_send_queue_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_send_queue_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_send_queue_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_send_queue_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "cadence_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_send_queue_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "hook7_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_send_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_company_invite: {
        Args: { _token: string; _user_id: string }
        Returns: string
      }
      auto_protect_lead_org: {
        Args: { _lead_id: string; _reason: string }
        Returns: undefined
      }
      cancel_company_invite: {
        Args: { _invite_id: string }
        Returns: undefined
      }
      cleanup_audit_logs: { Args: never; Returns: undefined }
      clear_calcom_api_key: {
        Args: { _company_id: string }
        Returns: undefined
      }
      clear_elevenlabs_master_key: { Args: never; Returns: undefined }
      clear_gemini_master_key: { Args: never; Returns: undefined }
      clear_openai_master_key: { Args: never; Returns: undefined }
      clear_resend_master_key: { Args: never; Returns: undefined }
      create_company_and_join: {
        Args: { p_name: string; p_slug?: string }
        Returns: string
      }
      create_company_invite: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: {
          expires_at: string
          id: string
          token: string
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      delete_lead_cascade: { Args: { p_lead_id: string }; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_calcom_api_key: {
        Args: { _company_id: string; _passphrase: string }
        Returns: string
      }
      get_elevenlabs_master_key: {
        Args: { _passphrase: string }
        Returns: string
      }
      get_gemini_master_key: { Args: { _passphrase: string }; Returns: string }
      get_hook7_instance_token: {
        Args: { _instance_id: string; _passphrase: string }
        Returns: string
      }
      get_invite_by_token: {
        Args: { _token: string }
        Returns: {
          company_id: string
          company_name: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
        }[]
      }
      get_openai_master_key: { Args: { _passphrase: string }; Returns: string }
      get_resend_master_key: { Args: { _passphrase: string }; Returns: string }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_lead_protected: { Args: { _lead_id: string }; Returns: boolean }
      lead_protection: {
        Args: { _lead_id: string }
        Returns: {
          id: string
          label: string
          reason: string
        }[]
      }
      list_company_members: {
        Args: { _company_id: string }
        Returns: {
          email: string
          full_name: string
          joined_at: string
          phone: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      match_knowledge_chunks: {
        Args: {
          p_company_id: string
          p_match_count?: number
          p_query_embedding: string
        }
        Returns: {
          chunk: string
          id: string
          knowledge_id: string
          metadata: Json
          similarity: number
        }[]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      norm_org_text: { Args: { _t: string }; Returns: string }
      normalize_phone_br: { Args: { _raw: string }; Returns: string }
      normalize_phone_br_single: { Args: { _raw: string }; Returns: string }
      org_domain: {
        Args: { _email: string; _website: string }
        Returns: string
      }
      pipedrive_push_enabled: {
        Args: { _company_id: string }
        Returns: boolean
      }
      protected_lead_ids: {
        Args: { _company_id: string }
        Returns: {
          label: string
          lead_id: string
          reason: string
        }[]
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      regenerate_calcom_webhook_secret: {
        Args: { _company_id: string }
        Returns: string
      }
      remove_company_member: { Args: { _user_id: string }; Returns: undefined }
      retry_pipedrive_failed: { Args: never; Returns: number }
      set_calcom_api_key: {
        Args: {
          _api_key: string
          _booking_link: string
          _company_id: string
          _passphrase: string
        }
        Returns: undefined
      }
      set_elevenlabs_master_key: {
        Args: { _api_key: string; _passphrase: string }
        Returns: undefined
      }
      set_elevenlabs_master_model: {
        Args: { _model: string }
        Returns: undefined
      }
      set_gemini_master_key: {
        Args: { _api_key: string; _passphrase: string }
        Returns: undefined
      }
      set_hook7_instance_token: {
        Args: { _instance_id: string; _passphrase: string; _token: string }
        Returns: undefined
      }
      set_openai_master_key: {
        Args: { _api_key: string; _passphrase: string }
        Returns: undefined
      }
      set_resend_master_key: {
        Args: { _api_key: string; _passphrase: string }
        Returns: undefined
      }
      update_company_member_role: {
        Args: {
          _new_role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      action_status: "pending" | "done" | "failed" | "cancelled" | "skipped"
      action_type:
        | "send_reply"
        | "ask_clarifying_question"
        | "suggest_meeting_times"
        | "create_cal_booking"
        | "send_calendar_link"
        | "send_email"
        | "create_new_contact"
        | "mark_current_contact_as_referrer"
        | "schedule_followup"
        | "stop_sequence"
        | "mark_opt_out"
        | "handoff_to_human"
        | "create_call_task"
        | "send_material"
        | "update_lead_score"
        | "disqualify_lead"
        | "recover_no_show"
        | "request_info_from_lead"
        | "fetch_existing_booking"
        | "reschedule_booking"
        | "cancel_booking"
        | "ask_cancel_reason"
        | "offer_reschedule_instead"
        | "send_booking_confirmation"
        | "offer_event_types"
        | "collect_booking_info"
        | "detect_timezone"
        | "send_meeting_recap"
        | "request_feedback"
        | "mark_meeting_attended"
        | "acknowledge_cancellation"
      activity_type:
        | "email"
        | "call"
        | "whatsapp"
        | "linkedin"
        | "note"
        | "meeting"
        | "referral"
      app_role: "master_admin" | "company_admin" | "user"
      booking_status:
        | "pending"
        | "confirmed"
        | "rescheduled"
        | "cancelled"
        | "no_show"
        | "completed"
      cadence_status: "draft" | "active" | "paused" | "archived"
      cadence_type: "email" | "whatsapp" | "linkedin" | "multi_channel"
      company_status: "active" | "inactive" | "trial"
      email_channel: "domain" | "personal"
      email_grant_provider: "google" | "microsoft" | "imap"
      email_grant_status: "active" | "expired" | "revoked" | "error"
      enrollment_status:
        | "active"
        | "completed"
        | "replied"
        | "bounced"
        | "paused"
      hook7_instance_status:
        | "pending_qr"
        | "qr_ready"
        | "pairing"
        | "connected"
        | "disconnected"
        | "banned"
        | "error"
      integration_provider:
        | "pipedrive"
        | "gmail"
        | "twilio_whatsapp"
        | "apify"
        | "zapi_whatsapp"
        | "apollo"
        | "bitrix24"
      intent_category:
        | "interest"
        | "info_request"
        | "pricing"
        | "scheduling"
        | "rejection"
        | "routing"
        | "channel_switch"
        | "compliance"
        | "escalation"
        | "silence"
      lead_status:
        | "new"
        | "enrolled"
        | "contacted"
        | "qualified"
        | "unqualified"
        | "converted"
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
      action_status: ["pending", "done", "failed", "cancelled", "skipped"],
      action_type: [
        "send_reply",
        "ask_clarifying_question",
        "suggest_meeting_times",
        "create_cal_booking",
        "send_calendar_link",
        "send_email",
        "create_new_contact",
        "mark_current_contact_as_referrer",
        "schedule_followup",
        "stop_sequence",
        "mark_opt_out",
        "handoff_to_human",
        "create_call_task",
        "send_material",
        "update_lead_score",
        "disqualify_lead",
        "recover_no_show",
        "request_info_from_lead",
        "fetch_existing_booking",
        "reschedule_booking",
        "cancel_booking",
        "ask_cancel_reason",
        "offer_reschedule_instead",
        "send_booking_confirmation",
        "offer_event_types",
        "collect_booking_info",
        "detect_timezone",
        "send_meeting_recap",
        "request_feedback",
        "mark_meeting_attended",
        "acknowledge_cancellation",
      ],
      activity_type: [
        "email",
        "call",
        "whatsapp",
        "linkedin",
        "note",
        "meeting",
        "referral",
      ],
      app_role: ["master_admin", "company_admin", "user"],
      booking_status: [
        "pending",
        "confirmed",
        "rescheduled",
        "cancelled",
        "no_show",
        "completed",
      ],
      cadence_status: ["draft", "active", "paused", "archived"],
      cadence_type: ["email", "whatsapp", "linkedin", "multi_channel"],
      company_status: ["active", "inactive", "trial"],
      email_channel: ["domain", "personal"],
      email_grant_provider: ["google", "microsoft", "imap"],
      email_grant_status: ["active", "expired", "revoked", "error"],
      enrollment_status: [
        "active",
        "completed",
        "replied",
        "bounced",
        "paused",
      ],
      hook7_instance_status: [
        "pending_qr",
        "qr_ready",
        "pairing",
        "connected",
        "disconnected",
        "banned",
        "error",
      ],
      integration_provider: [
        "pipedrive",
        "gmail",
        "twilio_whatsapp",
        "apify",
        "zapi_whatsapp",
        "apollo",
        "bitrix24",
      ],
      intent_category: [
        "interest",
        "info_request",
        "pricing",
        "scheduling",
        "rejection",
        "routing",
        "channel_switch",
        "compliance",
        "escalation",
        "silence",
      ],
      lead_status: [
        "new",
        "enrolled",
        "contacted",
        "qualified",
        "unqualified",
        "converted",
      ],
    },
  },
} as const
