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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_metrics: {
        Row: {
          active_users_7d: number | null
          annual_subscribers: number | null
          arr: number | null
          basic_subscribers: number | null
          churn_rate: number | null
          churned: number | null
          conversion_rate: number | null
          created_at: string
          failed_payments: number | null
          high_risk_scans: number | null
          id: string
          leads_generated: number | null
          metric_date: string
          mrr: number | null
          new_signups: number | null
          premium_subscribers: number | null
          total_paid: number | null
          total_scans: number | null
          total_users: number | null
        }
        Insert: {
          active_users_7d?: number | null
          annual_subscribers?: number | null
          arr?: number | null
          basic_subscribers?: number | null
          churn_rate?: number | null
          churned?: number | null
          conversion_rate?: number | null
          created_at?: string
          failed_payments?: number | null
          high_risk_scans?: number | null
          id?: string
          leads_generated?: number | null
          metric_date?: string
          mrr?: number | null
          new_signups?: number | null
          premium_subscribers?: number | null
          total_paid?: number | null
          total_scans?: number | null
          total_users?: number | null
        }
        Update: {
          active_users_7d?: number | null
          annual_subscribers?: number | null
          arr?: number | null
          basic_subscribers?: number | null
          churn_rate?: number | null
          churned?: number | null
          conversion_rate?: number | null
          created_at?: string
          failed_payments?: number | null
          high_risk_scans?: number | null
          id?: string
          leads_generated?: number | null
          metric_date?: string
          mrr?: number | null
          new_signups?: number | null
          premium_subscribers?: number | null
          total_paid?: number | null
          total_scans?: number | null
          total_users?: number | null
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          session_token: string
          user_agent: string | null
          user_id: string
          verified_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
          verified_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
          verified_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_category: string
          event_data: Json | null
          event_type: string
          id: string
          product_name: string | null
          scan_id: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_category: string
          event_data?: Json | null
          event_type: string
          id?: string
          product_name?: string | null
          scan_id?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_category?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          product_name?: string | null
          scan_id?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "product_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          comment_count: number | null
          content: string
          created_at: string | null
          health_score: number | null
          id: string
          image_url: string | null
          is_pinned: boolean | null
          like_count: number | null
          post_type: string | null
          product_barcode: string | null
          product_name: string | null
          title: string
          updated_at: string | null
          user_id: string
          verdict: string | null
        }
        Insert: {
          comment_count?: number | null
          content: string
          created_at?: string | null
          health_score?: number | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          like_count?: number | null
          post_type?: string | null
          product_barcode?: string | null
          product_name?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          verdict?: string | null
        }
        Update: {
          comment_count?: number | null
          content?: string
          created_at?: string | null
          health_score?: number | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          like_count?: number | null
          post_type?: string | null
          product_barcode?: string | null
          product_name?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          verdict?: string | null
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string
          icon: string | null
          id: string
          is_active: boolean | null
          reward_amount: number
          reward_type: string
          target_count: number
          title: string
        }
        Insert: {
          challenge_type: string
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          reward_amount?: number
          reward_type?: string
          target_count?: number
          title: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          reward_amount?: number
          reward_type?: string
          target_count?: number
          title?: string
        }
        Relationships: []
      }
      daily_scans: {
        Row: {
          created_at: string | null
          id: string
          scan_count: number | null
          scan_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          scan_count?: number | null
          scan_date?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          scan_count?: number | null
          scan_date?: string
          user_id?: string
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string
          device_name: string | null
          id: string
          is_active: boolean
          last_used_at: string | null
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      drug_interactions: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          description: string
          id: string
          interacting_medication: string
          mechanism: string | null
          recommendations: string | null
          scan_id: string | null
          scanned_medication: string
          severity: string
          source: string | null
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          description: string
          id?: string
          interacting_medication: string
          mechanism?: string | null
          recommendations?: string | null
          scan_id?: string | null
          scanned_medication: string
          severity: string
          source?: string | null
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          description?: string
          id?: string
          interacting_medication?: string
          mechanism?: string | null
          recommendations?: string | null
          scan_id?: string | null
          scanned_medication?: string
          severity?: string
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_log: {
        Row: {
          email_type: string
          id: string
          metadata: Json | null
          sent_at: string
          user_id: string
        }
        Insert: {
          email_type: string
          id?: string
          metadata?: Json | null
          sent_at?: string
          user_id: string
        }
        Update: {
          email_type?: string
          id?: string
          metadata?: Json | null
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_subscribers: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          source: string | null
          status: string
          subscribed_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          source?: string | null
          status?: string
          subscribed_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          source?: string | null
          status?: string
          subscribed_at?: string
        }
        Relationships: []
      }
      family_profiles: {
        Row: {
          age_group: string | null
          allergies_detailed: Json | null
          allergy_notes: string | null
          avatar_color: string | null
          created_at: string
          diet_type: string | null
          health_conditions: Json | null
          id: string
          is_dairy_free: boolean | null
          is_default: boolean | null
          is_diabetic: boolean | null
          is_gluten_free: boolean | null
          is_heart_healthy: boolean | null
          is_pregnant: boolean | null
          is_vegan: boolean | null
          name: string
          relationship: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_group?: string | null
          allergies_detailed?: Json | null
          allergy_notes?: string | null
          avatar_color?: string | null
          created_at?: string
          diet_type?: string | null
          health_conditions?: Json | null
          id?: string
          is_dairy_free?: boolean | null
          is_default?: boolean | null
          is_diabetic?: boolean | null
          is_gluten_free?: boolean | null
          is_heart_healthy?: boolean | null
          is_pregnant?: boolean | null
          is_vegan?: boolean | null
          name: string
          relationship?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_group?: string | null
          allergies_detailed?: Json | null
          allergy_notes?: string | null
          avatar_color?: string | null
          created_at?: string
          diet_type?: string | null
          health_conditions?: Json | null
          id?: string
          is_dairy_free?: boolean | null
          is_default?: boolean | null
          is_diabetic?: boolean | null
          is_gluten_free?: boolean | null
          is_heart_healthy?: boolean | null
          is_pregnant?: boolean | null
          is_vegan?: boolean | null
          name?: string
          relationship?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      food_drug_interactions: {
        Row: {
          acknowledged_at: string | null
          alternative_foods: string[] | null
          created_at: string
          effect: string | null
          food_ingredient: string
          id: string
          medication_name: string
          recommendation: string | null
          scan_id: string | null
          severity: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          alternative_foods?: string[] | null
          created_at?: string
          effect?: string | null
          food_ingredient: string
          id?: string
          medication_name: string
          recommendation?: string | null
          scan_id?: string | null
          severity: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          alternative_foods?: string[] | null
          created_at?: string
          effect?: string | null
          food_ingredient?: string
          id?: string
          medication_name?: string
          recommendation?: string | null
          scan_id?: string | null
          severity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_drug_interactions_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scan_history"
            referencedColumns: ["id"]
          },
        ]
      }
      food_recalls: {
        Row: {
          brand_name: string | null
          classification: string | null
          created_at: string
          distribution_pattern: string | null
          fda_recall_id: string | null
          id: string
          product_description: string
          product_type: string | null
          reason_for_recall: string | null
          recall_initiation_date: string | null
          recalling_firm: string | null
          report_date: string | null
          status: string | null
          upc_codes: Json | null
          updated_at: string
        }
        Insert: {
          brand_name?: string | null
          classification?: string | null
          created_at?: string
          distribution_pattern?: string | null
          fda_recall_id?: string | null
          id?: string
          product_description: string
          product_type?: string | null
          reason_for_recall?: string | null
          recall_initiation_date?: string | null
          recalling_firm?: string | null
          report_date?: string | null
          status?: string | null
          upc_codes?: Json | null
          updated_at?: string
        }
        Update: {
          brand_name?: string | null
          classification?: string | null
          created_at?: string
          distribution_pattern?: string | null
          fda_recall_id?: string | null
          id?: string
          product_description?: string
          product_type?: string | null
          reason_for_recall?: string | null
          recall_initiation_date?: string | null
          recalling_firm?: string | null
          report_date?: string | null
          status?: string | null
          upc_codes?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      health_metrics: {
        Row: {
          created_at: string
          id: string
          metric_type: string
          recorded_at: string
          secondary_value: number | null
          source: string
          unit: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metric_type: string
          recorded_at: string
          secondary_value?: number | null
          source: string
          unit: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          metric_type?: string
          recorded_at?: string
          secondary_value?: number | null
          source?: string
          unit?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "health_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_reports: {
        Row: {
          average_score: number | null
          avoid_products: number | null
          caution_products: number | null
          created_at: string
          email_sent: boolean | null
          email_sent_at: string | null
          health_grade: string | null
          id: string
          improvements: Json | null
          pdf_url: string | null
          recommendations: Json | null
          report_date: string
          report_html: string | null
          report_type: string
          safe_products: number | null
          scanned_products: Json | null
          summary: string | null
          title: string
          top_concerns: Json | null
          total_scans: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          average_score?: number | null
          avoid_products?: number | null
          caution_products?: number | null
          created_at?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          health_grade?: string | null
          id?: string
          improvements?: Json | null
          pdf_url?: string | null
          recommendations?: Json | null
          report_date?: string
          report_html?: string | null
          report_type?: string
          safe_products?: number | null
          scanned_products?: Json | null
          summary?: string | null
          title: string
          top_concerns?: Json | null
          total_scans?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          average_score?: number | null
          avoid_products?: number | null
          caution_products?: number | null
          created_at?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          health_grade?: string | null
          id?: string
          improvements?: Json | null
          pdf_url?: string | null
          recommendations?: Json | null
          report_date?: string
          report_html?: string | null
          report_type?: string
          safe_products?: number | null
          scanned_products?: Json | null
          summary?: string | null
          title?: string
          top_concerns?: Json | null
          total_scans?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_distribution_logs: {
        Row: {
          created_at: string
          endpoint_id: string
          error_message: string | null
          id: string
          lead_id: string
          response_body: string | null
          response_code: number | null
          status: string
        }
        Insert: {
          created_at?: string
          endpoint_id: string
          error_message?: string | null
          id?: string
          lead_id: string
          response_body?: string | null
          response_code?: number | null
          status?: string
        }
        Update: {
          created_at?: string
          endpoint_id?: string
          error_message?: string | null
          id?: string
          lead_id?: string
          response_body?: string | null
          response_code?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_distribution_logs_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_distribution_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "legal_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_leads: {
        Row: {
          allergies: Json | null
          baby_food_concerns: Json | null
          consent_given: boolean
          consent_text: string | null
          consent_timestamp: string
          consultation_requested: boolean | null
          consultation_requested_at: string | null
          created_at: string
          email: string | null
          family_affected: Json | null
          feeding_method: string | null
          first_name: string | null
          health_conditions: Json | null
          id: string
          injury_description: string | null
          last_name: string | null
          lead_category: string | null
          lead_quality_score: number | null
          lead_source: string | null
          lead_status: string | null
          notes: string | null
          phone_number: string
          products_scanned: Json | null
          recalled_products_exposure: Json | null
          sold_at: string | null
          sold_to_firm: string | null
          symptom_duration: string | null
          symptom_severity: string | null
          symptoms: Json | null
          toxic_products_exposure: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          allergies?: Json | null
          baby_food_concerns?: Json | null
          consent_given?: boolean
          consent_text?: string | null
          consent_timestamp?: string
          consultation_requested?: boolean | null
          consultation_requested_at?: string | null
          created_at?: string
          email?: string | null
          family_affected?: Json | null
          feeding_method?: string | null
          first_name?: string | null
          health_conditions?: Json | null
          id?: string
          injury_description?: string | null
          last_name?: string | null
          lead_category?: string | null
          lead_quality_score?: number | null
          lead_source?: string | null
          lead_status?: string | null
          notes?: string | null
          phone_number: string
          products_scanned?: Json | null
          recalled_products_exposure?: Json | null
          sold_at?: string | null
          sold_to_firm?: string | null
          symptom_duration?: string | null
          symptom_severity?: string | null
          symptoms?: Json | null
          toxic_products_exposure?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          allergies?: Json | null
          baby_food_concerns?: Json | null
          consent_given?: boolean
          consent_text?: string | null
          consent_timestamp?: string
          consultation_requested?: boolean | null
          consultation_requested_at?: string | null
          created_at?: string
          email?: string | null
          family_affected?: Json | null
          feeding_method?: string | null
          first_name?: string | null
          health_conditions?: Json | null
          id?: string
          injury_description?: string | null
          last_name?: string | null
          lead_category?: string | null
          lead_quality_score?: number | null
          lead_source?: string | null
          lead_status?: string | null
          notes?: string | null
          phone_number?: string
          products_scanned?: Json | null
          recalled_products_exposure?: Json | null
          sold_at?: string | null
          sold_to_firm?: string | null
          symptom_duration?: string | null
          symptom_severity?: string | null
          symptoms?: Json | null
          toxic_products_exposure?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string
          id: string
          meals: Json | null
          notes: string | null
          shopping_list: Json | null
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          meals?: Json | null
          notes?: string | null
          shopping_list?: Json | null
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          meals?: Json | null
          notes?: string | null
          shopping_list?: Json | null
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_logs: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          reminder_id: string
          scheduled_time: string
          status: string
          taken_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          reminder_id: string
          scheduled_time: string
          status?: string
          taken_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          reminder_id?: string
          scheduled_time?: string
          status?: string
          taken_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "medication_reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_reminders: {
        Row: {
          created_at: string
          dosage: string | null
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean
          medication_name: string
          notes: string | null
          pills_remaining: number | null
          refill_reminder_days: number | null
          reminder_times: Json
          scan_id: string | null
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          medication_name: string
          notes?: string | null
          pills_remaining?: number | null
          refill_reminder_days?: number | null
          reminder_times?: Json
          scan_id?: string | null
          start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          medication_name?: string
          notes?: string | null
          pills_remaining?: number | null
          refill_reminder_days?: number | null
          reminder_times?: Json
          scan_id?: string | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_reminders_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scan_history"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_history: {
        Row: {
          body: string
          clicked_at: string | null
          created_at: string
          data: Json | null
          delivered_at: string | null
          error_message: string | null
          id: string
          notification_type: string
          opened_at: string | null
          read_at: string | null
          scan_id: string | null
          sent_at: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          body: string
          clicked_at?: string | null
          created_at?: string
          data?: Json | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          notification_type: string
          opened_at?: string | null
          read_at?: string | null
          scan_id?: string | null
          sent_at?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string
          clicked_at?: string | null
          created_at?: string
          data?: Json | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          notification_type?: string
          opened_at?: string | null
          read_at?: string | null
          scan_id?: string | null
          sent_at?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_history_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scan_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          daily_summary: boolean
          dangerous_product_alerts: boolean
          email_recall_alerts: boolean
          health_tips: boolean
          id: string
          quiet_hours_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          recall_alerts: boolean
          scan_alerts: boolean
          social_notifications: boolean
          updated_at: string
          user_email: string | null
          user_id: string
          weekly_report: boolean
        }
        Insert: {
          created_at?: string
          daily_summary?: boolean
          dangerous_product_alerts?: boolean
          email_recall_alerts?: boolean
          health_tips?: boolean
          id?: string
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          recall_alerts?: boolean
          scan_alerts?: boolean
          social_notifications?: boolean
          updated_at?: string
          user_email?: string | null
          user_id: string
          weekly_report?: boolean
        }
        Update: {
          created_at?: string
          daily_summary?: boolean
          dangerous_product_alerts?: boolean
          email_recall_alerts?: boolean
          health_tips?: boolean
          id?: string
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          recall_alerts?: boolean
          scan_alerts?: boolean
          social_notifications?: boolean
          updated_at?: string
          user_email?: string | null
          user_id?: string
          weekly_report?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_edited: boolean | null
          parent_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_edited?: boolean | null
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_edited?: boolean | null
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      product_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_edited: boolean
          parent_id: string | null
          product_barcode: string
          product_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_edited?: boolean
          parent_id?: string | null
          product_barcode: string
          product_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_edited?: boolean
          parent_id?: string | null
          product_barcode?: string
          product_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      product_heavy_metals: {
        Row: {
          arsenic_level: string | null
          arsenic_ppb: number | null
          barcode: string
          brand: string
          cadmium_level: string | null
          cadmium_ppb: number | null
          confidence: string | null
          created_at: string | null
          id: string
          lab_source: string
          lead_level: string | null
          lead_ppb: number | null
          mercury_level: string | null
          mercury_ppb: number | null
          notes: string | null
          overall_verdict: string | null
          product_name: string
          test_date: string | null
          updated_at: string | null
        }
        Insert: {
          arsenic_level?: string | null
          arsenic_ppb?: number | null
          barcode: string
          brand: string
          cadmium_level?: string | null
          cadmium_ppb?: number | null
          confidence?: string | null
          created_at?: string | null
          id?: string
          lab_source: string
          lead_level?: string | null
          lead_ppb?: number | null
          mercury_level?: string | null
          mercury_ppb?: number | null
          notes?: string | null
          overall_verdict?: string | null
          product_name: string
          test_date?: string | null
          updated_at?: string | null
        }
        Update: {
          arsenic_level?: string | null
          arsenic_ppb?: number | null
          barcode?: string
          brand?: string
          cadmium_level?: string | null
          cadmium_ppb?: number | null
          confidence?: string | null
          created_at?: string | null
          id?: string
          lab_source?: string
          lead_level?: string | null
          lead_ppb?: number | null
          mercury_level?: string | null
          mercury_ppb?: number | null
          notes?: string | null
          overall_verdict?: string | null
          product_name?: string
          test_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          brand: string | null
          category: string | null
          created_at: string
          health_score: number | null
          heavy_metals_data: Json | null
          id: string
          image_url: string | null
          ingredients: Json | null
          last_scanned_at: string | null
          name: string
          nutrition: Json | null
          scan_count: number | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          category?: string | null
          created_at?: string
          health_score?: number | null
          heavy_metals_data?: Json | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          last_scanned_at?: string | null
          name: string
          nutrition?: Json | null
          scan_count?: number | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          category?: string | null
          created_at?: string
          health_score?: number | null
          heavy_metals_data?: Json | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          last_scanned_at?: string | null
          name?: string
          nutrition?: Json | null
          scan_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_group: string | null
          allergies_detailed: Json | null
          allergy_notes: string | null
          avatar_url: string | null
          baby_age_months: number | null
          baby_ages: Json | null
          baby_count: number | null
          baby_dob: string | null
          budget_preference: string | null
          cooking_skill_level: string | null
          created_at: string
          daily_calorie_target: number | null
          daily_protein_target: number | null
          diet_type: string | null
          dietary_goals: string | null
          display_name: string | null
          due_date: string | null
          email: string | null
          feeding_stage: string | null
          first_name: string | null
          has_allergies: boolean | null
          has_autoimmune: boolean | null
          has_celiac_disease: boolean | null
          has_gerd: boolean | null
          has_gout: boolean | null
          has_high_cholesterol: boolean | null
          has_hypertension: boolean | null
          has_ibs: boolean | null
          has_kidney_disease: boolean | null
          has_liver_disease: boolean | null
          has_osteoporosis: boolean | null
          has_thyroid_condition: boolean | null
          has_weight_loss_goal: boolean | null
          health_conditions: Json | null
          health_sync_enabled: boolean | null
          high_intent_user: boolean | null
          high_risk_flag: boolean | null
          id: string
          is_cancer_survivor: boolean | null
          is_dairy_free: boolean | null
          is_diabetic: boolean | null
          is_gluten_free: boolean | null
          is_heart_healthy: boolean | null
          is_new_mom: boolean | null
          is_nursing: boolean | null
          is_pregnant: boolean | null
          is_vegan: boolean | null
          last_health_sync_at: string | null
          last_name: string | null
          last_scan_timestamp: string | null
          lifecycle_stage: string | null
          max_prep_time_mins: number | null
          medications: Json | null
          newsletter_optin: boolean | null
          onboarding_completed: boolean | null
          parenting_concerns: Json | null
          phone_number: string | null
          phone_verified: boolean | null
          pregnancy_stage: string | null
          scan_credits_remaining: number | null
          scan_reset_date: string | null
          signup_ip: string | null
          signup_location: Json | null
          subscription_expires_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
          total_scans_used: number | null
          trial_expired: boolean | null
          trial_status: string | null
          trimester: string | null
          updated_at: string
          wants_recall_sms: boolean | null
        }
        Insert: {
          age_group?: string | null
          allergies_detailed?: Json | null
          allergy_notes?: string | null
          avatar_url?: string | null
          baby_age_months?: number | null
          baby_ages?: Json | null
          baby_count?: number | null
          baby_dob?: string | null
          budget_preference?: string | null
          cooking_skill_level?: string | null
          created_at?: string
          daily_calorie_target?: number | null
          daily_protein_target?: number | null
          diet_type?: string | null
          dietary_goals?: string | null
          display_name?: string | null
          due_date?: string | null
          email?: string | null
          feeding_stage?: string | null
          first_name?: string | null
          has_allergies?: boolean | null
          has_autoimmune?: boolean | null
          has_celiac_disease?: boolean | null
          has_gerd?: boolean | null
          has_gout?: boolean | null
          has_high_cholesterol?: boolean | null
          has_hypertension?: boolean | null
          has_ibs?: boolean | null
          has_kidney_disease?: boolean | null
          has_liver_disease?: boolean | null
          has_osteoporosis?: boolean | null
          has_thyroid_condition?: boolean | null
          has_weight_loss_goal?: boolean | null
          health_conditions?: Json | null
          health_sync_enabled?: boolean | null
          high_intent_user?: boolean | null
          high_risk_flag?: boolean | null
          id: string
          is_cancer_survivor?: boolean | null
          is_dairy_free?: boolean | null
          is_diabetic?: boolean | null
          is_gluten_free?: boolean | null
          is_heart_healthy?: boolean | null
          is_new_mom?: boolean | null
          is_nursing?: boolean | null
          is_pregnant?: boolean | null
          is_vegan?: boolean | null
          last_health_sync_at?: string | null
          last_name?: string | null
          last_scan_timestamp?: string | null
          lifecycle_stage?: string | null
          max_prep_time_mins?: number | null
          medications?: Json | null
          newsletter_optin?: boolean | null
          onboarding_completed?: boolean | null
          parenting_concerns?: Json | null
          phone_number?: string | null
          phone_verified?: boolean | null
          pregnancy_stage?: string | null
          scan_credits_remaining?: number | null
          scan_reset_date?: string | null
          signup_ip?: string | null
          signup_location?: Json | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          total_scans_used?: number | null
          trial_expired?: boolean | null
          trial_status?: string | null
          trimester?: string | null
          updated_at?: string
          wants_recall_sms?: boolean | null
        }
        Update: {
          age_group?: string | null
          allergies_detailed?: Json | null
          allergy_notes?: string | null
          avatar_url?: string | null
          baby_age_months?: number | null
          baby_ages?: Json | null
          baby_count?: number | null
          baby_dob?: string | null
          budget_preference?: string | null
          cooking_skill_level?: string | null
          created_at?: string
          daily_calorie_target?: number | null
          daily_protein_target?: number | null
          diet_type?: string | null
          dietary_goals?: string | null
          display_name?: string | null
          due_date?: string | null
          email?: string | null
          feeding_stage?: string | null
          first_name?: string | null
          has_allergies?: boolean | null
          has_autoimmune?: boolean | null
          has_celiac_disease?: boolean | null
          has_gerd?: boolean | null
          has_gout?: boolean | null
          has_high_cholesterol?: boolean | null
          has_hypertension?: boolean | null
          has_ibs?: boolean | null
          has_kidney_disease?: boolean | null
          has_liver_disease?: boolean | null
          has_osteoporosis?: boolean | null
          has_thyroid_condition?: boolean | null
          has_weight_loss_goal?: boolean | null
          health_conditions?: Json | null
          health_sync_enabled?: boolean | null
          high_intent_user?: boolean | null
          high_risk_flag?: boolean | null
          id?: string
          is_cancer_survivor?: boolean | null
          is_dairy_free?: boolean | null
          is_diabetic?: boolean | null
          is_gluten_free?: boolean | null
          is_heart_healthy?: boolean | null
          is_new_mom?: boolean | null
          is_nursing?: boolean | null
          is_pregnant?: boolean | null
          is_vegan?: boolean | null
          last_health_sync_at?: string | null
          last_name?: string | null
          last_scan_timestamp?: string | null
          lifecycle_stage?: string | null
          max_prep_time_mins?: number | null
          medications?: Json | null
          newsletter_optin?: boolean | null
          onboarding_completed?: boolean | null
          parenting_concerns?: Json | null
          phone_number?: string | null
          phone_verified?: boolean | null
          pregnancy_stage?: string | null
          scan_credits_remaining?: number | null
          scan_reset_date?: string | null
          signup_ip?: string | null
          signup_location?: Json | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          total_scans_used?: number | null
          trial_expired?: boolean | null
          trial_status?: string | null
          trimester?: string | null
          updated_at?: string
          wants_recall_sms?: boolean | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
          uses_count: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
          uses_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          reward_given: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          reward_given?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          reward_given?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_recipes: {
        Row: {
          cook_time: string | null
          created_at: string
          health_benefits: Json | null
          id: string
          ingredients: Json | null
          instructions: Json | null
          is_favorite: boolean | null
          meal_type: string
          name: string
          notes: string | null
          nutrition: Json | null
          prep_time: string | null
          safety_score: number | null
          servings: number | null
          updated_at: string
          user_id: string
          warnings: Json | null
        }
        Insert: {
          cook_time?: string | null
          created_at?: string
          health_benefits?: Json | null
          id?: string
          ingredients?: Json | null
          instructions?: Json | null
          is_favorite?: boolean | null
          meal_type: string
          name: string
          notes?: string | null
          nutrition?: Json | null
          prep_time?: string | null
          safety_score?: number | null
          servings?: number | null
          updated_at?: string
          user_id: string
          warnings?: Json | null
        }
        Update: {
          cook_time?: string | null
          created_at?: string
          health_benefits?: Json | null
          id?: string
          ingredients?: Json | null
          instructions?: Json | null
          is_favorite?: boolean | null
          meal_type?: string
          name?: string
          notes?: string | null
          nutrition?: Json | null
          prep_time?: string | null
          safety_score?: number | null
          servings?: number | null
          updated_at?: string
          user_id?: string
          warnings?: Json | null
        }
        Relationships: []
      }
      scan_credits: {
        Row: {
          created_at: string
          credits_purchased: number
          credits_remaining: number
          id: string
          last_free_credits_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_purchased?: number
          credits_remaining?: number
          id?: string
          last_free_credits_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_purchased?: number
          credits_remaining?: number
          id?: string
          last_free_credits_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_events: {
        Row: {
          barcode: string | null
          created_at: string
          heavy_metals_avoid: boolean | null
          id: string
          product_name: string | null
          risk_level: string | null
          scanned_at: string
          user_id: string
        }
        Insert: {
          barcode?: string | null
          created_at?: string
          heavy_metals_avoid?: boolean | null
          id?: string
          product_name?: string | null
          risk_level?: string | null
          scanned_at?: string
          user_id: string
        }
        Update: {
          barcode?: string | null
          created_at?: string
          heavy_metals_avoid?: boolean | null
          id?: string
          product_name?: string | null
          risk_level?: string | null
          scanned_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scan_history: {
        Row: {
          barcode: string | null
          brand: string | null
          created_at: string
          dietary_flags: Json | null
          health_score: number | null
          id: string
          image_url: string | null
          ingredients: Json | null
          nutrition: Json | null
          product_name: string
          recalls: Json | null
          scan_type: string | null
          user_id: string
          verdict: string | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          created_at?: string
          dietary_flags?: Json | null
          health_score?: number | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          nutrition?: Json | null
          product_name: string
          recalls?: Json | null
          scan_type?: string | null
          user_id: string
          verdict?: string | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          created_at?: string
          dietary_flags?: Json | null
          health_score?: number | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          nutrition?: Json | null
          product_name?: string
          recalls?: Json | null
          scan_type?: string | null
          user_id?: string
          verdict?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_notifications: {
        Row: {
          actor_id: string
          comment_id: string | null
          created_at: string
          id: string
          is_read: boolean
          notification_type: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          actor_id: string
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          notification_type: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          notification_type?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenge_progress: {
        Row: {
          challenge_date: string
          challenge_id: string
          completed_at: string | null
          created_at: string
          current_progress: number
          id: string
          is_completed: boolean
          reward_claimed: boolean
          user_id: string
        }
        Insert: {
          challenge_date?: string
          challenge_id: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          is_completed?: boolean
          reward_claimed?: boolean
          user_id: string
        }
        Update: {
          challenge_date?: string
          challenge_id?: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          is_completed?: boolean
          reward_claimed?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenge_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_recall_matches: {
        Row: {
          created_at: string
          id: string
          notification_type: string | null
          notified_at: string | null
          recall_id: string
          scan_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notification_type?: string | null
          notified_at?: string | null
          recall_id: string
          scan_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notification_type?: string | null
          notified_at?: string | null
          recall_id?: string
          scan_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_recall_matches_recall_id_fkey"
            columns: ["recall_id"]
            isOneToOne: false
            referencedRelation: "food_recalls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_recall_matches_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scan_history"
            referencedColumns: ["id"]
          },
        ]
      }
      user_registrations: {
        Row: {
          admin_notified: boolean | null
          admin_notified_at: string | null
          created_at: string | null
          email: string
          first_name: string | null
          geo_location: Json | null
          id: string
          ip_address: string | null
          last_name: string | null
          phone_number: string | null
          referrer: string | null
          registered_at: string | null
          signup_source: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          admin_notified?: boolean | null
          admin_notified_at?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          geo_location?: Json | null
          id?: string
          ip_address?: string | null
          last_name?: string | null
          phone_number?: string | null
          referrer?: string | null
          registered_at?: string | null
          signup_source?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notified?: boolean | null
          admin_notified_at?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          geo_location?: Json | null
          id?: string
          ip_address?: string | null
          last_name?: string | null
          phone_number?: string | null
          referrer?: string | null
          registered_at?: string | null
          signup_source?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          admin_pin_hash: string | null
          created_at: string
          id: string
          pin_set_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          admin_pin_hash?: string | null
          created_at?: string
          id?: string
          pin_set_at?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          admin_pin_hash?: string | null
          created_at?: string
          id?: string
          pin_set_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          badges: Json | null
          created_at: string | null
          current_streak: number | null
          id: string
          last_scan_date: string | null
          longest_streak: number | null
          total_scans: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          badges?: Json | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_scan_date?: string | null
          longest_streak?: number | null
          total_scans?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          badges?: Json | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_scan_date?: string | null
          longest_streak?: number | null
          total_scans?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_symptoms: {
        Row: {
          category: string | null
          created_at: string | null
          duration: string | null
          id: string
          linked_products: Json | null
          notes: string | null
          reported_at: string | null
          severity: string | null
          symptom: string
          updated_at: string | null
          user_id: string
          who_affected: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          duration?: string | null
          id?: string
          linked_products?: Json | null
          notes?: string | null
          reported_at?: string | null
          severity?: string | null
          symptom: string
          updated_at?: string | null
          user_id: string
          who_affected?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          duration?: string | null
          id?: string
          linked_products?: Json | null
          notes?: string | null
          reported_at?: string | null
          severity?: string | null
          symptom?: string
          updated_at?: string | null
          user_id?: string
          who_affected?: string | null
        }
        Relationships: []
      }
      webhook_endpoints: {
        Row: {
          api_key: string | null
          billing_email: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string
          current_month_count: number | null
          distribution_priority: number | null
          email: string | null
          endpoint_type: string
          exclusive_leads: boolean | null
          failure_count: number | null
          filters: Json | null
          headers: Json | null
          id: string
          is_active: boolean
          last_triggered_at: string | null
          monthly_cap: number | null
          name: string
          price_per_lead: number | null
          success_count: number | null
          total_revenue: number | null
          updated_at: string
          url: string | null
        }
        Insert: {
          api_key?: string | null
          billing_email?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          current_month_count?: number | null
          distribution_priority?: number | null
          email?: string | null
          endpoint_type?: string
          exclusive_leads?: boolean | null
          failure_count?: number | null
          filters?: Json | null
          headers?: Json | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          monthly_cap?: number | null
          name: string
          price_per_lead?: number | null
          success_count?: number | null
          total_revenue?: number | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          api_key?: string | null
          billing_email?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          current_month_count?: number | null
          distribution_priority?: number | null
          email?: string | null
          endpoint_type?: string
          exclusive_leads?: boolean | null
          failure_count?: number | null
          filters?: Json | null
          headers?: Json | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          monthly_cap?: number | null
          name?: string
          price_per_lead?: number | null
          success_count?: number | null
          total_revenue?: number | null
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      weekly_leaderboard: {
        Row: {
          created_at: string
          dangers_avoided: number
          id: string
          points: number
          rank: number | null
          streak_days: number
          total_scans: number
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          dangers_avoided?: number
          id?: string
          points?: number
          rank?: number | null
          streak_days?: number
          total_scans?: number
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          dangers_avoided?: number
          id?: string
          points?: number
          rank?: number | null
          streak_days?: number
          total_scans?: number
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_leaderboard_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_purchased_credits: { Args: { amount: number }; Returns: number }
      admin_has_pin: { Args: never; Returns: boolean }
      can_add_family_profile: { Args: never; Returns: boolean }
      create_admin_session: { Args: never; Returns: string }
      get_admin_analytics: {
        Args: never
        Returns: {
          paid_subscribers: number
          scans_today: number
          sms_subscribers: number
          total_scans: number
          total_users: number
          users_this_week: number
          users_today: number
        }[]
      }
      get_admin_comprehensive_analytics: { Args: never; Returns: Json }
      get_admin_daily_scans: {
        Args: { _days?: number }
        Returns: {
          count: number
          date: string
        }[]
      }
      get_admin_daily_signups: {
        Args: { _days?: number }
        Returns: {
          count: number
          date: string
        }[]
      }
      get_admin_leads: {
        Args: { _limit?: number; _offset?: number }
        Returns: {
          allergies: Json
          consent_given: boolean
          consent_timestamp: string
          created_at: string
          email: string
          first_name: string
          health_conditions: Json
          id: string
          last_name: string
          lead_quality_score: number
          lead_source: string
          lead_status: string
          notes: string
          phone_number: string
          products_scanned: Json
          recalled_products_exposure: Json
          sold_at: string
          sold_to_firm: string
          user_id: string
        }[]
      }
      get_admin_scans: {
        Args: { _limit?: number; _offset?: number }
        Returns: {
          brand: string
          created_at: string
          health_score: number
          id: string
          product_name: string
          scan_type: string
          user_email: string
          user_name: string
          verdict: string
        }[]
      }
      get_admin_subscription_distribution: {
        Args: never
        Returns: {
          count: number
          tier: string
        }[]
      }
      get_admin_users: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone_number: string
          scan_count: number
          subscription_tier: string
        }[]
      }
      get_conversion_funnel_stats: {
        Args: { days_back?: number }
        Returns: {
          cta_click_rate: number
          cta_view_rate: number
          form_completion_rate: number
          form_open_rate: number
          form_opens: number
          form_submits: number
          leads_created: number
          leads_distributed: number
          overall_conversion_rate: number
          total_scans: number
          toxic_cta_clicks: number
          toxic_cta_views: number
        }[]
      }
      get_daily_challenges: {
        Args: never
        Returns: {
          challenge_id: string
          challenge_type: string
          current_progress: number
          description: string
          icon: string
          is_completed: boolean
          reward_amount: number
          reward_claimed: boolean
          target_count: number
          title: string
        }[]
      }
      get_daily_conversion_stats: {
        Args: { days_back?: number }
        Returns: {
          click_rate: number
          conversion_rate: number
          cta_clicks: number
          cta_views: number
          date: string
          form_submits: number
          leads: number
          scans: number
        }[]
      }
      get_daily_distribution_stats: {
        Args: { days_back?: number }
        Returns: {
          date: string
          leads_distributed: number
          revenue: number
        }[]
      }
      get_daily_scan_count: { Args: never; Returns: number }
      get_family_profile_count: { Args: never; Returns: number }
      get_law_firm_analytics: {
        Args: never
        Returns: {
          contract_end_date: string
          current_month_count: number
          endpoint_type: string
          failure_count: number
          id: string
          is_active: boolean
          last_triggered_at: string
          monthly_cap: number
          name: string
          price_per_lead: number
          success_count: number
          total_revenue: number
        }[]
      }
      get_lead_distribution_summary: {
        Args: { days_back?: number }
        Returns: {
          active_law_firms: number
          failed_distributions: number
          successful_distributions: number
          total_leads_distributed: number
          total_revenue: number
        }[]
      }
      get_or_create_referral_code: { Args: never; Returns: string }
      get_product_comment_count: {
        Args: { p_barcode: string }
        Returns: number
      }
      get_total_scan_count: { Args: never; Returns: number }
      get_user_credits: {
        Args: never
        Returns: {
          credits_purchased: number
          credits_remaining: number
          subscription_tier: string
        }[]
      }
      get_user_streak: {
        Args: never
        Returns: {
          badges: Json
          current_streak: number
          last_scan_date: string
          longest_streak: number
          total_scans: number
        }[]
      }
      get_weekly_leaderboard: {
        Args: { p_limit?: number }
        Returns: {
          display_name: string
          is_current_user: boolean
          points: number
          rank: number
          streak_days: number
          total_scans: number
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_daily_scan: { Args: never; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      record_lead_distribution: {
        Args: { p_endpoint_id: string; p_success: boolean }
        Returns: undefined
      }
      reset_monthly_lead_counts: { Args: never; Returns: undefined }
      set_admin_pin: { Args: { new_pin: string }; Returns: boolean }
      toggle_comment_like: { Args: { p_comment_id: string }; Returns: boolean }
      toggle_post_like: { Args: { p_post_id: string }; Returns: boolean }
      update_challenge_progress: {
        Args: { p_challenge_type: string; p_increment?: number }
        Returns: Json
      }
      update_leaderboard_on_scan: {
        Args: { p_health_score: number }
        Returns: undefined
      }
      update_user_streak: { Args: never; Returns: Json }
      use_scan_credit: { Args: never; Returns: boolean }
      validate_admin_session: {
        Args: { session_token: string }
        Returns: boolean
      }
      verify_admin_pin: { Args: { pin_input: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
