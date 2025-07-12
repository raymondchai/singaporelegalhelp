export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          user_type: 'individual' | 'law_firm' | 'corporate'
          subscription_status: 'free' | 'basic' | 'premium' | 'enterprise'
          singapore_nric: string | null
          law_firm_uen: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          user_type?: 'individual' | 'law_firm' | 'corporate'
          subscription_status?: 'free' | 'basic' | 'premium' | 'enterprise'
          singapore_nric?: string | null
          law_firm_uen?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          user_type?: 'individual' | 'law_firm' | 'corporate'
          subscription_status?: 'free' | 'basic' | 'premium' | 'enterprise'
          singapore_nric?: string | null
          law_firm_uen?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_documents: {
        Row: {
          id: string
          user_id: string
          title: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          practice_area: string | null
          tags: string[] | null
          upload_date: string
          last_accessed: string
          is_shared: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          practice_area?: string | null
          tags?: string[] | null
          upload_date?: string
          last_accessed?: string
          is_shared?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          practice_area?: string | null
          tags?: string[] | null
          upload_date?: string
          last_accessed?: string
          is_shared?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_chat_sessions: {
        Row: {
          id: string
          user_id: string
          title: string
          practice_area: string | null
          message_count: number
          first_message: string | null
          last_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          practice_area?: string | null
          message_count?: number
          first_message?: string | null
          last_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          practice_area?: string | null
          message_count?: number
          first_message?: string | null
          last_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_chat_messages: {
        Row: {
          id: string
          session_id: string
          user_id: string
          message: string
          response: string | null
          message_type: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          message: string
          response?: string | null
          message_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          message?: string
          response?: string | null
          message_type?: string
          created_at?: string
        }
      }
      user_saved_content: {
        Row: {
          id: string
          user_id: string
          content_type: string
          content_id: string
          collection_name: string
          notes: string | null
          saved_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content_type: string
          content_id: string
          collection_name?: string
          notes?: string | null
          saved_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_type?: string
          content_id?: string
          collection_name?: string
          notes?: string | null
          saved_at?: string
        }
      }
      user_activity_logs: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          practice_area: string | null
          content_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          practice_area?: string | null
          content_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: string
          practice_area?: string | null
          content_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      legal_documents: {
        Row: {
          id: string
          user_id: string
          title: string
          document_type: string
          file_path: string | null
          file_size: number | null
          upload_status: 'uploading' | 'processing' | 'completed' | 'failed'
          aixplain_document_id: string | null
          processed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          document_type: string
          file_path?: string | null
          file_size?: number | null
          upload_status?: 'uploading' | 'processing' | 'completed' | 'failed'
          aixplain_document_id?: string | null
          processed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          document_type?: string
          file_path?: string | null
          file_size?: number | null
          upload_status?: 'uploading' | 'processing' | 'completed' | 'failed'
          aixplain_document_id?: string | null
          processed_at?: string | null
          created_at?: string
        }
      }
      legal_qa_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon_name: string | null
          order_index: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon_name?: string | null
          order_index?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon_name?: string | null
          order_index?: number
          is_active?: boolean
          created_at?: string
        }
      }
      legal_qa_questions: {
        Row: {
          id: string
          category_id: string
          user_id: string
          question: string
          answer: string | null
          ai_response: Json | null
          status: 'pending' | 'answered' | 'reviewed'
          is_public: boolean
          created_at: string
          answered_at: string | null
        }
        Insert: {
          id?: string
          category_id: string
          user_id: string
          question: string
          answer?: string | null
          ai_response?: Json | null
          status?: 'pending' | 'answered' | 'reviewed'
          is_public?: boolean
          created_at?: string
          answered_at?: string | null
        }
        Update: {
          id?: string
          category_id?: string
          user_id?: string
          question?: string
          answer?: string | null
          ai_response?: Json | null
          status?: 'pending' | 'answered' | 'reviewed'
          is_public?: boolean
          created_at?: string
          answered_at?: string | null
        }
      }
      payment_transactions: {
        Row: {
          id: string
          user_id: string
          stripe_payment_intent_id: string | null
          nets_transaction_id: string | null
          amount: number
          currency: string
          payment_method: 'stripe' | 'nets'
          status: 'pending' | 'succeeded' | 'failed' | 'refunded'
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_payment_intent_id?: string | null
          nets_transaction_id?: string | null
          amount: number
          currency?: string
          payment_method: 'stripe' | 'nets'
          status?: 'pending' | 'succeeded' | 'failed' | 'refunded'
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_payment_intent_id?: string | null
          nets_transaction_id?: string | null
          amount?: number
          currency?: string
          payment_method?: 'stripe' | 'nets'
          status?: 'pending' | 'succeeded' | 'failed' | 'refunded'
          metadata?: Json | null
          created_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          title: string | null
          aixplain_session_id: string | null
          message_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          aixplain_session_id?: string | null
          message_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          aixplain_session_id?: string | null
          message_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'assistant'
          content: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: 'user' | 'assistant'
          content: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: 'user' | 'assistant'
          content?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      legal_document_templates: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string
          subcategory: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: 'docx' | 'doc'
          subscription_tier: 'free' | 'basic' | 'premium' | 'enterprise'
          price_sgd: number
          difficulty_level: 'basic' | 'intermediate' | 'advanced'
          estimated_time_minutes: number
          singapore_compliant: boolean
          legal_review_required: boolean
          status: 'draft' | 'under_review' | 'approved' | 'published' | 'archived'
          created_by: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category: string
          subcategory?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: 'docx' | 'doc'
          subscription_tier?: 'free' | 'basic' | 'premium' | 'enterprise'
          price_sgd?: number
          difficulty_level?: 'basic' | 'intermediate' | 'advanced'
          estimated_time_minutes?: number
          singapore_compliant?: boolean
          legal_review_required?: boolean
          status?: 'draft' | 'under_review' | 'approved' | 'published' | 'archived'
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: string
          subcategory?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: 'docx' | 'doc'
          subscription_tier?: 'free' | 'basic' | 'premium' | 'enterprise'
          price_sgd?: number
          difficulty_level?: 'basic' | 'intermediate' | 'advanced'
          estimated_time_minutes?: number
          singapore_compliant?: boolean
          legal_review_required?: boolean
          status?: 'draft' | 'under_review' | 'approved' | 'published' | 'archived'
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      template_content: {
        Row: {
          id: string
          template_id: string
          content_text: string | null
          content_json: Json | null
          variables_detected: Json | null
          variables_configured: Json | null
          processing_status: 'pending' | 'processing' | 'completed' | 'failed'
          processing_error: string | null
          processed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_id: string
          content_text?: string | null
          content_json?: Json | null
          variables_detected?: Json | null
          variables_configured?: Json | null
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          processing_error?: string | null
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          content_text?: string | null
          content_json?: Json | null
          variables_detected?: Json | null
          variables_configured?: Json | null
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          processing_error?: string | null
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      template_variables: {
        Row: {
          id: string
          variable_name: string
          display_label: string
          variable_type: 'text' | 'textarea' | 'email' | 'date' | 'select' | 'number' | 'phone'
          is_required: boolean
          validation_pattern: string | null
          validation_message: string | null
          select_options: Json | null
          category: 'personal' | 'company' | 'legal' | 'financial' | 'custom'
          singapore_validation: boolean
          usage_count: number
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          variable_name: string
          display_label: string
          variable_type: 'text' | 'textarea' | 'email' | 'date' | 'select' | 'number' | 'phone'
          is_required?: boolean
          validation_pattern?: string | null
          validation_message?: string | null
          select_options?: Json | null
          category: 'personal' | 'company' | 'legal' | 'financial' | 'custom'
          singapore_validation?: boolean
          usage_count?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          variable_name?: string
          display_label?: string
          variable_type?: 'text' | 'textarea' | 'email' | 'date' | 'select' | 'number' | 'phone'
          is_required?: boolean
          validation_pattern?: string | null
          validation_message?: string | null
          select_options?: Json | null
          category?: 'personal' | 'company' | 'legal' | 'financial' | 'custom'
          singapore_validation?: boolean
          usage_count?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      template_usage: {
        Row: {
          id: string
          template_id: string
          user_id: string
          action_type: 'view' | 'download' | 'generate' | 'purchase'
          generated_format: 'pdf' | 'docx' | null
          variables_used: Json | null
          payment_transaction_id: string | null
          amount_paid: number | null
          session_id: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          template_id: string
          user_id: string
          action_type: 'view' | 'download' | 'generate' | 'purchase'
          generated_format?: 'pdf' | 'docx' | null
          variables_used?: Json | null
          payment_transaction_id?: string | null
          amount_paid?: number | null
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          user_id?: string
          action_type?: 'view' | 'download' | 'generate' | 'purchase'
          generated_format?: 'pdf' | 'docx' | null
          variables_used?: Json | null
          payment_transaction_id?: string | null
          amount_paid?: number | null
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
