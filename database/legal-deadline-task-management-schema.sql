-- Legal Deadline & Task Management Schema
-- Singapore Legal Help Platform - Phase 4
-- Enhanced User Dashboard: Legal Deadline & Task Management

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums for legal deadline and task management
CREATE TYPE deadline_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE deadline_status AS ENUM ('upcoming', 'due_today', 'overdue', 'completed', 'cancelled');
CREATE TYPE deadline_category AS ENUM ('court_filing', 'client_meeting', 'document_submission', 'hearing', 'appeal', 'compliance', 'other');
CREATE TYPE court_type AS ENUM ('supreme_court', 'high_court', 'district_court', 'magistrate_court', 'family_court', 'syariah_court', 'other');
CREATE TYPE task_status AS ENUM ('not_started', 'in_progress', 'review', 'completed', 'cancelled', 'blocked');
CREATE TYPE task_category AS ENUM ('research', 'drafting', 'review', 'filing', 'client_communication', 'court_appearance', 'compliance', 'administrative');
CREATE TYPE milestone_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE milestone_category AS ENUM ('case_milestone', 'project_milestone', 'compliance_milestone', 'business_milestone');
CREATE TYPE notification_type AS ENUM ('email', 'push', 'sms');
CREATE TYPE escalation_action AS ENUM ('email_supervisor', 'sms_alert', 'system_alert');

-- Legal Deadlines Table
CREATE TABLE IF NOT EXISTS public.legal_deadlines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deadline_date DATE NOT NULL,
    deadline_time TIME,
    practice_area VARCHAR(100) NOT NULL,
    priority deadline_priority DEFAULT 'medium',
    status deadline_status DEFAULT 'upcoming',
    category deadline_category DEFAULT 'other',
    
    -- Singapore-specific fields
    court_type court_type,
    case_number VARCHAR(100),
    court_location VARCHAR(255),
    
    -- Related entities
    related_documents UUID[] DEFAULT '{}',
    related_tasks UUID[] DEFAULT '{}',
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Recurring settings
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency VARCHAR(20), -- 'daily', 'weekly', 'monthly', 'yearly'
    recurring_interval INTEGER DEFAULT 1,
    recurring_end_date DATE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Legal Tasks Table
CREATE TABLE IF NOT EXISTS public.legal_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'not_started',
    priority deadline_priority DEFAULT 'medium',
    category task_category DEFAULT 'administrative',
    
    -- Task scheduling
    start_date DATE,
    due_date DATE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    
    -- Dependencies and workflow
    dependencies UUID[] DEFAULT '{}', -- task IDs
    blocked_by UUID REFERENCES public.legal_tasks(id) ON DELETE SET NULL,
    parent_task_id UUID REFERENCES public.legal_tasks(id) ON DELETE CASCADE,
    milestone_id UUID, -- Will reference legal_milestones
    
    -- Assignment and collaboration
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    collaborators UUID[] DEFAULT '{}',
    
    -- Progress tracking
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- Related entities
    related_deadlines UUID[] DEFAULT '{}',
    related_documents UUID[] DEFAULT '{}',
    practice_area VARCHAR(100) NOT NULL,
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Legal Milestones Table
CREATE TABLE IF NOT EXISTS public.legal_milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category milestone_category DEFAULT 'project_milestone',
    status milestone_status DEFAULT 'planned',
    
    -- Timeline
    start_date DATE NOT NULL,
    target_date DATE NOT NULL,
    completed_date DATE,
    
    -- Associated entities
    tasks UUID[] DEFAULT '{}',
    deadlines UUID[] DEFAULT '{}',
    practice_area VARCHAR(100) NOT NULL,
    
    -- Progress tracking
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    critical_path BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for milestone_id in legal_tasks
ALTER TABLE public.legal_tasks 
ADD CONSTRAINT fk_legal_tasks_milestone 
FOREIGN KEY (milestone_id) REFERENCES public.legal_milestones(id) ON DELETE SET NULL;

-- Task Checklist Items Table
CREATE TABLE IF NOT EXISTS public.task_checklist_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES public.legal_tasks(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deadline Reminders Table
CREATE TABLE IF NOT EXISTS public.deadline_reminders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    deadline_id UUID REFERENCES public.legal_deadlines(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    timing_minutes INTEGER NOT NULL, -- minutes before deadline
    sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    
    -- Notification channels
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    
    -- Timing preferences
    default_reminder_times INTEGER[] DEFAULT '{60, 1440}', -- 1 hour, 1 day in minutes
    business_hours_only BOOLEAN DEFAULT false,
    weekends_enabled BOOLEAN DEFAULT true,
    
    -- Content preferences
    deadline_reminders BOOLEAN DEFAULT true,
    task_reminders BOOLEAN DEFAULT true,
    milestone_updates BOOLEAN DEFAULT true,
    collaboration_notifications BOOLEAN DEFAULT true,
    system_updates BOOLEAN DEFAULT true,
    
    -- Escalation settings
    escalation_enabled BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Escalation Rules Table
CREATE TABLE IF NOT EXISTS public.escalation_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    condition VARCHAR(50) NOT NULL, -- 'overdue', 'high_priority', 'critical'
    action escalation_action NOT NULL,
    delay_minutes INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar Events View (for unified calendar display)
CREATE OR REPLACE VIEW public.calendar_events AS
SELECT 
    'deadline_' || ld.id as id,
    ld.title,
    ld.description,
    ld.deadline_date::timestamp + COALESCE(ld.deadline_time, '09:00:00'::time) as start_date,
    ld.deadline_date::timestamp + COALESCE(ld.deadline_time, '09:00:00'::time) + interval '1 hour' as end_date,
    false as all_day,
    'deadline' as type,
    ld.id as related_id,
    ld.practice_area,
    CASE 
        WHEN ld.priority = 'critical' THEN '#DC2626'
        WHEN ld.priority = 'high' THEN '#EA580C'
        WHEN ld.priority = 'medium' THEN '#D97706'
        ELSE '#059669'
    END as color,
    ld.priority::text as priority,
    ld.user_id,
    ld.created_at,
    ld.updated_at
FROM public.legal_deadlines ld
WHERE ld.status != 'cancelled'

UNION ALL

SELECT 
    'task_' || lt.id as id,
    lt.title,
    lt.description,
    COALESCE(lt.due_date, lt.start_date)::timestamp + '09:00:00'::time as start_date,
    COALESCE(lt.due_date, lt.start_date)::timestamp + '10:00:00'::time as end_date,
    true as all_day,
    'task' as type,
    lt.id as related_id,
    lt.practice_area,
    CASE 
        WHEN lt.priority = 'critical' THEN '#7C2D12'
        WHEN lt.priority = 'high' THEN '#92400E'
        WHEN lt.priority = 'medium' THEN '#A16207'
        ELSE '#047857'
    END as color,
    lt.priority::text as priority,
    lt.user_id,
    lt.created_at,
    lt.updated_at
FROM public.legal_tasks lt
WHERE lt.status NOT IN ('cancelled', 'completed') 
AND (lt.due_date IS NOT NULL OR lt.start_date IS NOT NULL)

UNION ALL

SELECT 
    'milestone_' || lm.id as id,
    lm.title,
    lm.description,
    lm.target_date::timestamp + '09:00:00'::time as start_date,
    lm.target_date::timestamp + '17:00:00'::time as end_date,
    true as all_day,
    'milestone' as type,
    lm.id as related_id,
    lm.practice_area,
    '#6366F1' as color,
    'medium' as priority,
    lm.user_id,
    lm.created_at,
    lm.updated_at
FROM public.legal_milestones lm
WHERE lm.status != 'cancelled';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_legal_deadlines_user_id ON public.legal_deadlines(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_deadlines_deadline_date ON public.legal_deadlines(deadline_date);
CREATE INDEX IF NOT EXISTS idx_legal_deadlines_status ON public.legal_deadlines(status);
CREATE INDEX IF NOT EXISTS idx_legal_deadlines_priority ON public.legal_deadlines(priority);
CREATE INDEX IF NOT EXISTS idx_legal_deadlines_practice_area ON public.legal_deadlines(practice_area);
CREATE INDEX IF NOT EXISTS idx_legal_deadlines_assigned_to ON public.legal_deadlines(assigned_to);

CREATE INDEX IF NOT EXISTS idx_legal_tasks_user_id ON public.legal_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_tasks_status ON public.legal_tasks(status);
CREATE INDEX IF NOT EXISTS idx_legal_tasks_priority ON public.legal_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_legal_tasks_due_date ON public.legal_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_legal_tasks_assigned_to ON public.legal_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_legal_tasks_parent_task_id ON public.legal_tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_legal_tasks_milestone_id ON public.legal_tasks(milestone_id);
CREATE INDEX IF NOT EXISTS idx_legal_tasks_practice_area ON public.legal_tasks(practice_area);

CREATE INDEX IF NOT EXISTS idx_legal_milestones_user_id ON public.legal_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_milestones_status ON public.legal_milestones(status);
CREATE INDEX IF NOT EXISTS idx_legal_milestones_target_date ON public.legal_milestones(target_date);
CREATE INDEX IF NOT EXISTS idx_legal_milestones_practice_area ON public.legal_milestones(practice_area);

CREATE INDEX IF NOT EXISTS idx_task_checklist_items_task_id ON public.task_checklist_items(task_id);
CREATE INDEX IF NOT EXISTS idx_deadline_reminders_deadline_id ON public.deadline_reminders(deadline_id);
CREATE INDEX IF NOT EXISTS idx_deadline_reminders_sent ON public.deadline_reminders(sent, timing_minutes);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_escalation_rules_user_id ON public.escalation_rules(user_id);

-- Enable Row Level Security
ALTER TABLE public.legal_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadline_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for legal_deadlines
CREATE POLICY "Users can manage their own deadlines" ON public.legal_deadlines
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view deadlines assigned to them" ON public.legal_deadlines
    FOR SELECT USING (auth.uid() = assigned_to);

-- RLS Policies for legal_tasks
CREATE POLICY "Users can manage their own tasks" ON public.legal_tasks
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view tasks assigned to them" ON public.legal_tasks
    FOR SELECT USING (auth.uid() = assigned_to);

CREATE POLICY "Collaborators can view and update tasks" ON public.legal_tasks
    FOR SELECT USING (auth.uid() = ANY(collaborators));

CREATE POLICY "Collaborators can update task progress" ON public.legal_tasks
    FOR UPDATE USING (auth.uid() = ANY(collaborators))
    WITH CHECK (auth.uid() = ANY(collaborators));

-- RLS Policies for legal_milestones
CREATE POLICY "Users can manage their own milestones" ON public.legal_milestones
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for task_checklist_items
CREATE POLICY "Users can manage checklist items for their tasks" ON public.task_checklist_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.legal_tasks
            WHERE id = task_checklist_items.task_id
            AND (user_id = auth.uid() OR assigned_to = auth.uid() OR auth.uid() = ANY(collaborators))
        )
    );

-- RLS Policies for deadline_reminders
CREATE POLICY "Users can manage reminders for their deadlines" ON public.deadline_reminders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.legal_deadlines
            WHERE id = deadline_reminders.deadline_id
            AND (user_id = auth.uid() OR assigned_to = auth.uid())
        )
    );

-- RLS Policies for notification_preferences
CREATE POLICY "Users can manage their own notification preferences" ON public.notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for escalation_rules
CREATE POLICY "Users can manage their own escalation rules" ON public.escalation_rules
    FOR ALL USING (auth.uid() = user_id);

-- Functions for legal deadline and task management

-- Function to update task progress when checklist items change
CREATE OR REPLACE FUNCTION update_task_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_items INTEGER;
    completed_items INTEGER;
    new_progress INTEGER;
BEGIN
    -- Get total and completed checklist items for the task
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE completed = true)
    INTO total_items, completed_items
    FROM public.task_checklist_items
    WHERE task_id = COALESCE(NEW.task_id, OLD.task_id);

    -- Calculate new progress percentage
    IF total_items > 0 THEN
        new_progress := ROUND((completed_items::DECIMAL / total_items::DECIMAL) * 100);
    ELSE
        new_progress := 0;
    END IF;

    -- Update the task progress
    UPDATE public.legal_tasks
    SET
        progress_percentage = new_progress,
        updated_at = NOW(),
        completed_at = CASE
            WHEN new_progress = 100 AND status != 'completed' THEN NOW()
            WHEN new_progress < 100 AND status = 'completed' THEN NULL
            ELSE completed_at
        END,
        status = CASE
            WHEN new_progress = 100 AND status != 'completed' THEN 'completed'::task_status
            WHEN new_progress < 100 AND status = 'completed' THEN 'in_progress'::task_status
            ELSE status
        END
    WHERE id = COALESCE(NEW.task_id, OLD.task_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for task progress updates
DROP TRIGGER IF EXISTS trigger_update_task_progress ON public.task_checklist_items;
CREATE TRIGGER trigger_update_task_progress
    AFTER INSERT OR UPDATE OR DELETE ON public.task_checklist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_task_progress();

-- Function to update milestone progress based on associated tasks
CREATE OR REPLACE FUNCTION update_milestone_progress()
RETURNS TRIGGER AS $$
DECLARE
    milestone_uuid UUID;
    total_tasks INTEGER;
    completed_tasks INTEGER;
    new_progress INTEGER;
BEGIN
    -- Get the milestone ID from the task
    milestone_uuid := COALESCE(NEW.milestone_id, OLD.milestone_id);

    IF milestone_uuid IS NOT NULL THEN
        -- Get total and completed tasks for the milestone
        SELECT
            COUNT(*),
            COUNT(*) FILTER (WHERE status = 'completed')
        INTO total_tasks, completed_tasks
        FROM public.legal_tasks
        WHERE milestone_id = milestone_uuid;

        -- Calculate new progress percentage
        IF total_tasks > 0 THEN
            new_progress := ROUND((completed_tasks::DECIMAL / total_tasks::DECIMAL) * 100);
        ELSE
            new_progress := 0;
        END IF;

        -- Update the milestone progress
        UPDATE public.legal_milestones
        SET
            progress_percentage = new_progress,
            updated_at = NOW(),
            completed_date = CASE
                WHEN new_progress = 100 AND status != 'completed' THEN NOW()::DATE
                WHEN new_progress < 100 AND status = 'completed' THEN NULL
                ELSE completed_date
            END,
            status = CASE
                WHEN new_progress = 100 AND status != 'completed' THEN 'completed'::milestone_status
                WHEN new_progress < 100 AND status = 'completed' THEN 'in_progress'::milestone_status
                ELSE status
            END
        WHERE id = milestone_uuid;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for milestone progress updates
DROP TRIGGER IF EXISTS trigger_update_milestone_progress ON public.legal_tasks;
CREATE TRIGGER trigger_update_milestone_progress
    AFTER INSERT OR UPDATE OR DELETE ON public.legal_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_milestone_progress();

-- Function to get upcoming deadlines for a user
CREATE OR REPLACE FUNCTION get_upcoming_deadlines(
    p_user_id UUID,
    p_days_ahead INTEGER DEFAULT 30
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    description TEXT,
    deadline_date DATE,
    deadline_time TIME,
    priority deadline_priority,
    status deadline_status,
    category deadline_category,
    practice_area VARCHAR,
    days_until INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ld.id,
        ld.title,
        ld.description,
        ld.deadline_date,
        ld.deadline_time,
        ld.priority,
        ld.status,
        ld.category,
        ld.practice_area,
        (ld.deadline_date - CURRENT_DATE)::INTEGER as days_until
    FROM public.legal_deadlines ld
    WHERE (ld.user_id = p_user_id OR ld.assigned_to = p_user_id)
    AND ld.status IN ('upcoming', 'due_today')
    AND ld.deadline_date <= CURRENT_DATE + INTERVAL '1 day' * p_days_ahead
    ORDER BY ld.deadline_date ASC, ld.deadline_time ASC NULLS LAST, ld.priority DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get task statistics for dashboard
CREATE OR REPLACE FUNCTION get_task_statistics(p_user_id UUID)
RETURNS TABLE (
    total_tasks BIGINT,
    completed_tasks BIGINT,
    overdue_tasks BIGINT,
    high_priority_tasks BIGINT,
    tasks_due_today BIGINT,
    tasks_due_this_week BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('completed', 'cancelled')) as overdue_tasks,
        COUNT(*) FILTER (WHERE priority IN ('high', 'critical') AND status NOT IN ('completed', 'cancelled')) as high_priority_tasks,
        COUNT(*) FILTER (WHERE due_date = CURRENT_DATE AND status NOT IN ('completed', 'cancelled')) as tasks_due_today,
        COUNT(*) FILTER (WHERE due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND status NOT IN ('completed', 'cancelled')) as tasks_due_this_week
    FROM public.legal_tasks
    WHERE user_id = p_user_id OR assigned_to = p_user_id OR p_user_id = ANY(collaborators);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get deadline statistics for dashboard
CREATE OR REPLACE FUNCTION get_deadline_statistics(p_user_id UUID)
RETURNS TABLE (
    total_deadlines BIGINT,
    completed_deadlines BIGINT,
    overdue_deadlines BIGINT,
    critical_deadlines BIGINT,
    deadlines_due_today BIGINT,
    deadlines_due_this_week BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_deadlines,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_deadlines,
        COUNT(*) FILTER (WHERE deadline_date < CURRENT_DATE AND status NOT IN ('completed', 'cancelled')) as overdue_deadlines,
        COUNT(*) FILTER (WHERE priority = 'critical' AND status NOT IN ('completed', 'cancelled')) as critical_deadlines,
        COUNT(*) FILTER (WHERE deadline_date = CURRENT_DATE AND status NOT IN ('completed', 'cancelled')) as deadlines_due_today,
        COUNT(*) FILTER (WHERE deadline_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND status NOT IN ('completed', 'cancelled')) as deadlines_due_this_week
    FROM public.legal_deadlines
    WHERE user_id = p_user_id OR assigned_to = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.notification_preferences (
        user_id,
        email_enabled,
        push_enabled,
        sms_enabled,
        default_reminder_times,
        business_hours_only,
        weekends_enabled,
        deadline_reminders,
        task_reminders,
        milestone_updates,
        collaboration_notifications,
        system_updates,
        escalation_enabled
    ) VALUES (
        p_user_id,
        true,
        true,
        false,
        '{60, 1440}', -- 1 hour, 1 day
        false,
        true,
        true,
        true,
        true,
        true,
        true,
        false
    )
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule deadline reminders
CREATE OR REPLACE FUNCTION schedule_deadline_reminders(p_deadline_id UUID)
RETURNS VOID AS $$
DECLARE
    deadline_record RECORD;
    reminder_time INTEGER;
    user_preferences RECORD;
BEGIN
    -- Get deadline details
    SELECT * INTO deadline_record
    FROM public.legal_deadlines
    WHERE id = p_deadline_id;

    -- Get user notification preferences
    SELECT * INTO user_preferences
    FROM public.notification_preferences
    WHERE user_id = deadline_record.user_id;

    -- Create reminders based on user preferences
    IF user_preferences.deadline_reminders THEN
        FOREACH reminder_time IN ARRAY user_preferences.default_reminder_times
        LOOP
            -- Email reminder
            IF user_preferences.email_enabled THEN
                INSERT INTO public.deadline_reminders (deadline_id, type, timing_minutes)
                VALUES (p_deadline_id, 'email', reminder_time);
            END IF;

            -- Push notification reminder
            IF user_preferences.push_enabled THEN
                INSERT INTO public.deadline_reminders (deadline_id, type, timing_minutes)
                VALUES (p_deadline_id, 'push', reminder_time);
            END IF;

            -- SMS reminder (if enabled)
            IF user_preferences.sms_enabled THEN
                INSERT INTO public.deadline_reminders (deadline_id, type, timing_minutes)
                VALUES (p_deadline_id, 'sms', reminder_time);
            END IF;
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create reminders when a deadline is created
CREATE OR REPLACE FUNCTION trigger_schedule_deadline_reminders()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM schedule_deadline_reminders(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_schedule_reminders ON public.legal_deadlines;
CREATE TRIGGER trigger_auto_schedule_reminders
    AFTER INSERT ON public.legal_deadlines
    FOR EACH ROW
    EXECUTE FUNCTION trigger_schedule_deadline_reminders();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.legal_deadlines TO authenticated;
GRANT ALL ON public.legal_tasks TO authenticated;
GRANT ALL ON public.legal_milestones TO authenticated;
GRANT ALL ON public.task_checklist_items TO authenticated;
GRANT ALL ON public.deadline_reminders TO authenticated;
GRANT ALL ON public.notification_preferences TO authenticated;
GRANT ALL ON public.escalation_rules TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_upcoming_deadlines TO authenticated;
GRANT EXECUTE ON FUNCTION get_task_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_deadline_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_notification_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION schedule_deadline_reminders TO authenticated;

-- Grant select on calendar_events view
GRANT SELECT ON public.calendar_events TO authenticated;
