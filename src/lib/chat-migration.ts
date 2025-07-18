// Chat System Migration Utility
// Helps transition from old chat system to new real-time system
// Singapore Legal Help Platform

import { supabase } from '@/lib/supabase'

export interface LegacyChatSession {
  id: string
  user_id: string
  title: string
  practice_area?: string
  message_count: number
  first_message?: string
  last_message?: string
  created_at: string
  updated_at: string
}

export interface LegacyChatMessage {
  id: string
  session_id: string
  user_id: string
  message: string
  response?: string
  message_type: string
  created_at: string
}

export interface NewChatConversation {
  id: string
  user_id: string
  title: string
  practice_area?: string
  status: 'active' | 'archived' | 'closed'
  last_message_at: string
  message_count: number
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface NewChatMessage {
  id: string
  conversation_id: string
  user_id?: string
  content: string
  message_type: 'user' | 'ai' | 'system'
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error'
  metadata: Record<string, any>
  attachments: any[]
  is_edited: boolean
  created_at: string
}

class ChatMigrationService {
  
  // Check if user has legacy chat data
  async hasLegacyData(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_chat_sessions')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

      if (error) {
        console.error('Error checking legacy data:', error)
        return false
      }

      return (data?.length || 0) > 0
    } catch (error) {
      console.error('Error in hasLegacyData:', error)
      return false
    }
  }

  // Get legacy chat sessions for a user
  async getLegacySessions(userId: string): Promise<LegacyChatSession[]> {
    try {
      const { data, error } = await supabase
        .from('user_chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching legacy sessions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getLegacySessions:', error)
      return []
    }
  }

  // Get legacy messages for a session
  async getLegacyMessages(sessionId: string): Promise<LegacyChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('user_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching legacy messages:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getLegacyMessages:', error)
      return []
    }
  }

  // Migrate a single session to new format
  async migrateSession(legacySession: LegacyChatSession): Promise<string | null> {
    try {
      // Create new conversation
      const newConversation: Partial<NewChatConversation> = {
        user_id: legacySession.user_id,
        title: legacySession.title,
        practice_area: legacySession.practice_area,
        status: 'active',
        last_message_at: legacySession.updated_at,
        message_count: legacySession.message_count,
        metadata: {
          migrated_from: legacySession.id,
          migration_date: new Date().toISOString(),
          legacy_first_message: legacySession.first_message,
          legacy_last_message: legacySession.last_message
        },
        created_at: legacySession.created_at,
        updated_at: legacySession.updated_at
      }

      const { data: conversation, error: convError } = await supabase
        .from('chat_conversations')
        .insert(newConversation)
        .select()
        .single()

      if (convError) {
        console.error('Error creating new conversation:', convError)
        return null
      }

      // Migrate messages
      const legacyMessages = await this.getLegacyMessages(legacySession.id)
      
      for (const legacyMessage of legacyMessages) {
        await this.migrateMessage(legacyMessage, conversation.id)
      }

      return conversation.id
    } catch (error) {
      console.error('Error in migrateSession:', error)
      return null
    }
  }

  // Migrate a single message to new format
  async migrateMessage(legacyMessage: LegacyChatMessage, newConversationId: string): Promise<boolean> {
    try {
      // Create user message
      const userMessage: Partial<NewChatMessage> = {
        conversation_id: newConversationId,
        user_id: legacyMessage.user_id,
        content: legacyMessage.message,
        message_type: 'user',
        status: 'delivered',
        metadata: {
          migrated_from: legacyMessage.id,
          migration_date: new Date().toISOString()
        },
        attachments: [],
        is_edited: false,
        created_at: legacyMessage.created_at
      }

      const { error: userError } = await supabase
        .from('chat_messages')
        .insert(userMessage)

      if (userError) {
        console.error('Error creating user message:', userError)
        return false
      }

      // Create AI response if exists
      if (legacyMessage.response) {
        const aiMessage: Partial<NewChatMessage> = {
          conversation_id: newConversationId,
          // AI messages don't have user_id
          content: legacyMessage.response,
          message_type: 'ai',
          status: 'delivered',
          metadata: {
            migrated_from: legacyMessage.id,
            migration_date: new Date().toISOString(),
            legacy_response: true
          },
          attachments: [],
          is_edited: false,
          created_at: new Date(new Date(legacyMessage.created_at).getTime() + 1000).toISOString() // 1 second after user message
        }

        const { error: aiError } = await supabase
          .from('chat_messages')
          .insert(aiMessage)

        if (aiError) {
          console.error('Error creating AI message:', aiError)
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Error in migrateMessage:', error)
      return false
    }
  }

  // Migrate all data for a user
  async migrateUserData(userId: string): Promise<{ success: boolean; migratedSessions: number; errors: string[] }> {
    const result = {
      success: false,
      migratedSessions: 0,
      errors: [] as string[]
    }

    try {
      const legacySessions = await this.getLegacySessions(userId)
      
      if (legacySessions.length === 0) {
        result.success = true
        return result
      }

      for (const session of legacySessions) {
        const newConversationId = await this.migrateSession(session)
        
        if (newConversationId) {
          result.migratedSessions++
        } else {
          result.errors.push(`Failed to migrate session: ${session.title}`)
        }
      }

      result.success = result.errors.length === 0
      return result
    } catch (error) {
      result.errors.push(`Migration failed: ${error}`)
      return result
    }
  }

  // Check if user needs migration
  async needsMigration(userId: string): Promise<boolean> {
    try {
      const hasLegacy = await this.hasLegacyData(userId)
      
      if (!hasLegacy) {
        return false
      }

      // Check if already migrated
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('user_id', userId)
        .not('metadata->migrated_from', 'is', null)
        .limit(1)

      if (error) {
        console.error('Error checking migration status:', error)
        return true // Assume needs migration if we can't check
      }

      return (data?.length || 0) === 0
    } catch (error) {
      console.error('Error in needsMigration:', error)
      return true
    }
  }

  // Get migration status for user
  async getMigrationStatus(userId: string): Promise<{
    needsMigration: boolean
    legacySessionCount: number
    migratedSessionCount: number
  }> {
    try {
      const [legacySessions, migratedConversations] = await Promise.all([
        this.getLegacySessions(userId),
        supabase
          .from('chat_conversations')
          .select('id')
          .eq('user_id', userId)
          .not('metadata->migrated_from', 'is', null)
      ])

      return {
        needsMigration: legacySessions.length > 0 && (migratedConversations.data?.length || 0) === 0,
        legacySessionCount: legacySessions.length,
        migratedSessionCount: migratedConversations.data?.length || 0
      }
    } catch (error) {
      console.error('Error getting migration status:', error)
      return {
        needsMigration: false,
        legacySessionCount: 0,
        migratedSessionCount: 0
      }
    }
  }
}

// Export singleton instance
export const chatMigrationService = new ChatMigrationService()

// Export types and service
export default ChatMigrationService
