-- Function to check user subscription level
CREATE OR REPLACE FUNCTION public.check_user_subscription(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    subscription_level TEXT;
BEGIN
    SELECT subscription_status INTO subscription_level
    FROM public.profiles
    WHERE id = user_id;
    
    RETURN COALESCE(subscription_level, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's document count
CREATE OR REPLACE FUNCTION public.get_user_document_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    doc_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO doc_count
    FROM public.legal_documents
    WHERE user_id = user_id AND upload_status = 'completed';
    
    RETURN COALESCE(doc_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's monthly question count
CREATE OR REPLACE FUNCTION public.get_user_monthly_questions(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    question_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO question_count
    FROM public.legal_qa_questions
    WHERE user_id = user_id 
    AND created_at >= date_trunc('month', CURRENT_DATE);
    
    RETURN COALESCE(question_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can upload more documents
CREATE OR REPLACE FUNCTION public.can_upload_document(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    subscription_level TEXT;
    current_count INTEGER;
    max_documents INTEGER;
BEGIN
    -- Get user subscription level
    subscription_level := public.check_user_subscription(user_id);
    
    -- Get current document count
    current_count := public.get_user_document_count(user_id);
    
    -- Set limits based on subscription
    CASE subscription_level
        WHEN 'free' THEN max_documents := 2;
        WHEN 'basic' THEN max_documents := 5;
        WHEN 'premium' THEN max_documents := 50;
        WHEN 'enterprise' THEN max_documents := 999999; -- Unlimited
        ELSE max_documents := 2; -- Default to free
    END CASE;
    
    RETURN current_count < max_documents;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can ask more questions this month
CREATE OR REPLACE FUNCTION public.can_ask_question(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    subscription_level TEXT;
    current_count INTEGER;
    max_questions INTEGER;
BEGIN
    -- Get user subscription level
    subscription_level := public.check_user_subscription(user_id);
    
    -- Get current monthly question count
    current_count := public.get_user_monthly_questions(user_id);
    
    -- Set limits based on subscription
    CASE subscription_level
        WHEN 'free' THEN max_questions := 5;
        WHEN 'basic' THEN max_questions := 50;
        WHEN 'premium' THEN max_questions := 999999; -- Unlimited
        WHEN 'enterprise' THEN max_questions := 999999; -- Unlimited
        ELSE max_questions := 5; -- Default to free
    END CASE;
    
    RETURN current_count < max_questions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user subscription after payment
CREATE OR REPLACE FUNCTION public.update_user_subscription(
    user_id UUID,
    new_subscription TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.profiles
    SET subscription_status = new_subscription,
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_legal_documents_user_id ON public.legal_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_status ON public.legal_documents(upload_status);
CREATE INDEX IF NOT EXISTS idx_legal_qa_questions_user_id ON public.legal_qa_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_qa_questions_category ON public.legal_qa_questions(category_id);
CREATE INDEX IF NOT EXISTS idx_legal_qa_questions_created_at ON public.legal_qa_questions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
