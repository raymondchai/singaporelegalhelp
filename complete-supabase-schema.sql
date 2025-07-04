-- =====================================================
-- Singapore Legal Help Platform - Complete Database Schema
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLES
-- =====================================================

-- User profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    user_type TEXT CHECK (user_type IN ('individual', 'law_firm', 'corporate')) DEFAULT 'individual',
    subscription_status TEXT CHECK (subscription_status IN ('free', 'basic', 'premium', 'enterprise')) DEFAULT 'free',
    singapore_nric TEXT,
    law_firm_uen TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal documents table
CREATE TABLE public.legal_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    document_type TEXT NOT NULL,
    file_path TEXT,
    file_size BIGINT,
    file_name TEXT,
    mime_type TEXT,
    upload_status TEXT CHECK (upload_status IN ('uploading', 'processing', 'completed', 'failed')) DEFAULT 'uploading',
    aixplain_document_id TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal Q&A categories
CREATE TABLE public.legal_qa_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal Q&A questions
CREATE TABLE public.legal_qa_questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES public.legal_qa_categories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    ai_response JSONB,
    status TEXT CHECK (status IN ('pending', 'answered', 'reviewed')) DEFAULT 'pending',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    answered_at TIMESTAMP WITH TIME ZONE
);

-- Payment transactions
CREATE TABLE public.payment_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT,
    stripe_subscription_id TEXT,
    nets_transaction_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'SGD',
    payment_method TEXT CHECK (payment_method IN ('stripe', 'nets')) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'cancelled')) DEFAULT 'pending',
    plan_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI chat sessions
CREATE TABLE public.chat_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    aixplain_session_id TEXT,
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages
CREATE TABLE public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions (for tracking subscription history)
CREATE TABLE public.user_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,
    status TEXT CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')) DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX idx_legal_documents_user_id ON public.legal_documents(user_id);
CREATE INDEX idx_legal_documents_status ON public.legal_documents(upload_status);
CREATE INDEX idx_legal_documents_created_at ON public.legal_documents(created_at);
CREATE INDEX idx_legal_qa_questions_user_id ON public.legal_qa_questions(user_id);
CREATE INDEX idx_legal_qa_questions_category ON public.legal_qa_questions(category_id);
CREATE INDEX idx_legal_qa_questions_created_at ON public.legal_qa_questions(created_at);
CREATE INDEX idx_legal_qa_questions_status ON public.legal_qa_questions(status);
CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_payment_transactions_stripe_id ON public.payment_transactions(stripe_payment_intent_id);
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_updated_at ON public.chat_sessions(updated_at);
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_qa_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_qa_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Documents policies   
CREATE POLICY "Users can view own documents" ON public.legal_documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON public.legal_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON public.legal_documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON public.legal_documents
    FOR DELETE USING (auth.uid() = user_id);

-- Legal Q&A categories policies (public read access)
CREATE POLICY "Anyone can view active categories" ON public.legal_qa_categories
    FOR SELECT USING (is_active = true);

-- Q&A policies 
CREATE POLICY "Users can view own questions and public questions" ON public.legal_qa_questions
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own questions" ON public.legal_qa_questions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own questions" ON public.legal_qa_questions
    FOR UPDATE USING (auth.uid() = user_id);

-- Payment policies 
CREATE POLICY "Users can view own transactions" ON public.payment_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.payment_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat policies 
CREATE POLICY "Users can view own chats" ON public.chat_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chats" ON public.chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats" ON public.chat_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats" ON public.chat_sessions
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON public.chat_messages
    FOR SELECT USING (
        auth.uid() = (SELECT user_id FROM public.chat_sessions WHERE id = session_id)
    );

CREATE POLICY "Users can insert own messages" ON public.chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT user_id FROM public.chat_sessions WHERE id = session_id)
    );

-- Subscription policies
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert initial legal categories
INSERT INTO public.legal_qa_categories (name, description, icon_name, order_index) VALUES
('Business Law', 'Company incorporation, contracts, compliance', 'building-2', 1),
('Employment Law', 'Employment contracts, workplace rights, disputes', 'users', 2),
('Property Law', 'Real estate, leases, property transactions', 'home', 3),
('Family Law', 'Divorce, custody, matrimonial matters', 'heart', 4),
('Criminal Law', 'Criminal charges, defense, legal procedures', 'scale', 5),
('Intellectual Property', 'Trademarks, patents, copyright protection', 'lightbulb', 6),
('Immigration Law', 'Work permits, PR applications, citizenship', 'plane', 7),
('Tax Law', 'Tax compliance, GST, corporate taxation', 'calculator', 8)
ON CONFLICT DO NOTHING;
