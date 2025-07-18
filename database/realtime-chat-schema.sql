-- =====================================================
-- Real-time Chat System Schema
-- Singapore Legal Help Platform
-- =====================================================

-- Create chat conversations table
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'New Legal Consultation',
    practice_area TEXT,
    status TEXT CHECK (status IN ('active', 'archived', 'closed')) DEFAULT 'active',
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat messages table with enhanced features
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    message_type TEXT CHECK (message_type IN ('user', 'ai', 'system')) DEFAULT 'user',
    status TEXT CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'error')) DEFAULT 'sent',
    reply_to_id UUID REFERENCES public.chat_messages(id),
    metadata JSONB DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create typing indicators table for real-time typing status
CREATE TABLE IF NOT EXISTS public.chat_typing_indicators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_typing BOOLEAN DEFAULT TRUE,
    last_typed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Create user presence table for online status
CREATE TABLE IF NOT EXISTS public.user_presence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    status TEXT CHECK (status IN ('online', 'away', 'offline')) DEFAULT 'offline',
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_conversation_id UUID REFERENCES public.chat_conversations(id),
    metadata JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message reactions table (for future enhancement)
CREATE TABLE IF NOT EXISTS public.chat_message_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL, -- 'like', 'helpful', 'unclear', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, reaction_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON public.chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message ON public.chat_conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON public.chat_messages(message_type);

CREATE INDEX IF NOT EXISTS idx_chat_typing_conversation ON public.chat_typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_typing_user ON public.chat_typing_indicators(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_typing_last_typed ON public.chat_typing_indicators(last_typed_at);

CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON public.user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON public.user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_conversation ON public.user_presence(current_conversation_id);

-- Enable Row Level Security
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_conversations
CREATE POLICY "Users can view their own conversations" ON public.chat_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" ON public.chat_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON public.chat_conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their conversations" ON public.chat_messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in their conversations" ON public.chat_messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own messages" ON public.chat_messages
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for typing indicators
CREATE POLICY "Users can view typing in their conversations" ON public.chat_typing_indicators
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own typing status" ON public.chat_typing_indicators
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for user presence
CREATE POLICY "Users can view presence of users in their conversations" ON public.user_presence
    FOR SELECT USING (
        user_id IN (
            SELECT DISTINCT cm.user_id 
            FROM public.chat_messages cm
            JOIN public.chat_conversations cc ON cm.conversation_id = cc.id
            WHERE cc.user_id = auth.uid()
        ) OR user_id = auth.uid()
    );

CREATE POLICY "Users can manage their own presence" ON public.user_presence
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for message reactions
CREATE POLICY "Users can view reactions in their conversations" ON public.chat_message_reactions
    FOR SELECT USING (
        message_id IN (
            SELECT cm.id FROM public.chat_messages cm
            JOIN public.chat_conversations cc ON cm.conversation_id = cc.id
            WHERE cc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own reactions" ON public.chat_message_reactions
    FOR ALL USING (user_id = auth.uid());

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chat_conversations 
    SET 
        last_message_at = NEW.created_at,
        message_count = message_count + 1,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation when new message is added
CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_conversation_last_message();

-- Function to clean up old typing indicators
CREATE OR REPLACE FUNCTION public.cleanup_typing_indicators()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.chat_typing_indicators 
    WHERE last_typed_at < NOW() - INTERVAL '30 seconds';
END;
$$ LANGUAGE plpgsql;

-- Function to update user presence
CREATE OR REPLACE FUNCTION public.update_user_presence(
    p_user_id UUID,
    p_status TEXT,
    p_conversation_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_presence (user_id, status, current_conversation_id, last_seen, updated_at)
    VALUES (p_user_id, p_status, p_conversation_id, NOW(), NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        status = EXCLUDED.status,
        current_conversation_id = EXCLUDED.current_conversation_id,
        last_seen = EXCLUDED.last_seen,
        updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;

-- Function to get conversation with latest message preview
CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    practice_area TEXT,
    status TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    message_count INTEGER,
    latest_message TEXT,
    latest_message_type TEXT,
    unread_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.id,
        cc.title,
        cc.practice_area,
        cc.status,
        cc.last_message_at,
        cc.message_count,
        cm.content as latest_message,
        cm.message_type as latest_message_type,
        0 as unread_count -- TODO: Implement read status tracking
    FROM public.chat_conversations cc
    LEFT JOIN LATERAL (
        SELECT content, message_type
        FROM public.chat_messages 
        WHERE conversation_id = cc.id 
        ORDER BY created_at DESC 
        LIMIT 1
    ) cm ON true
    WHERE cc.user_id = p_user_id
    ORDER BY cc.last_message_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for all chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- Comments for documentation
COMMENT ON TABLE public.chat_conversations IS 'Stores chat conversation metadata and settings';
COMMENT ON TABLE public.chat_messages IS 'Stores individual chat messages with real-time support';
COMMENT ON TABLE public.chat_typing_indicators IS 'Tracks real-time typing indicators for conversations';
COMMENT ON TABLE public.user_presence IS 'Tracks user online/offline status and current activity';
COMMENT ON TABLE public.chat_message_reactions IS 'Stores user reactions to messages (likes, helpful, etc.)';

COMMENT ON FUNCTION public.update_conversation_last_message IS 'Updates conversation metadata when new messages are added';
COMMENT ON FUNCTION public.cleanup_typing_indicators IS 'Removes stale typing indicators older than 30 seconds';
COMMENT ON FUNCTION public.update_user_presence IS 'Updates or inserts user presence status';
COMMENT ON FUNCTION public.get_user_conversations IS 'Returns user conversations with latest message preview';
