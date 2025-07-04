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
